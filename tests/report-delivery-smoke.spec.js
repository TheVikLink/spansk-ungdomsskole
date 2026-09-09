import {test,expect} from '@playwright/test';
import path from 'node:path';
import {startStaticAppServer} from './helpers/static-app-server.js';
let server;
test.beforeAll(async()=>{server=await startStaticAppServer();});
test.afterAll(async()=>{await server.close();});
test('real download and file import in a clean profile preserve activity and verb evidence without sending pupil data',async({page,browser})=>{
  const requests=[];page.on('request',req=>requests.push({url:req.url(),method:req.method()}));
  await page.goto(server.url);
  await page.locator('#studentNameInput').fill('Test «lokal»');await page.locator('.login-btn-primary').click();
  await page.evaluate(()=>{showPage('verbs');selectedVerbs=new Set(['hablar']);selectedTense='presente';startVerbSession();});
  const form=await page.locator('#verbInput').getAttribute('data-expected');
  await page.locator('#verbInput').fill(form);await page.getByRole('button',{name:'✓ Sjekk svar',exact:true}).click();
  await page.evaluate(()=>endVerbSession());await page.locator('#navHomework').click();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'📥 Last ned fremgang',exact:true}).click();
  const download=await downloaded;const file=await download.path();
  expect(download.suggestedFilename()).not.toContain('lokal');
  const expected=await page.evaluate(()=>({history:practiceHistory,progress:loadLearningProgress()}));
  const clean=await browser.newContext();const recovered=await clean.newPage();
  try {
    await recovered.goto(server.url);
    expect(await recovered.evaluate(()=>localStorage.getItem('spansk123_studentName'))).toBeNull();
    const choosing=recovered.waitForEvent('filechooser');await recovered.getByRole('button',{name:'📂 Importer fremgang fra fil',exact:true}).click();
    await (await choosing).setFiles(file);
    await expect(recovered.locator('#mainApp')).toBeVisible();
    expect(await recovered.evaluate(()=>practiceHistory)).toEqual(expected.history);
    expect(await recovered.evaluate(()=>loadLearningProgress().skillProgress)).toEqual(expected.progress.skillProgress);
    await recovered.locator('#navHome').click();await expect(recovered.locator('#homeQuizStreak')).toContainText('1 besvarte oppgaver');
    await recovered.screenshot({path:'output/brukertest-rettelser/final-home-desktop.png',fullPage:true});
    await recovered.setViewportSize({width:390,height:844});
    await recovered.locator('#homePrimaryContent').getByText('For læreren: første 20 minutter',{exact:true}).click();
    expect(await recovered.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await recovered.screenshot({path:'output/brukertest-rettelser/final-teacher-mobile.png',fullPage:true});
  } finally {await clean.close();}
  expect(requests.filter(req=>req.method!=='GET')).toEqual([]);
  expect(requests.filter(req=>!req.url.startsWith(new URL(server.url).origin))).toEqual([]);
});

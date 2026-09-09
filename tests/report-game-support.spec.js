import {test,expect} from '@playwright/test';
import path from 'node:path';import {pathToFileURL} from 'node:url';
const appUrl=pathToFileURL(path.resolve('index.html')).toString();
test.beforeEach(async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto(appUrl);await page.evaluate(()=>{localStorage.clear();showMainApp();showPage('games');showGameSetup('lingo-links');});});
test('F19: teacher chooses four themes; meanings appear only after an attempt and two words require recall',async({page})=>{
  await page.locator('#lingoLinksPool').selectOption('themes');
  const boxes=page.locator('[data-ll-theme]'); await expect(boxes).not.toHaveCount(0);
  await boxes.evaluateAll(nodes=>nodes.forEach(node=>node.checked=false));
  const chosen=[];for(let i=0;i<4;i++){chosen.push(await boxes.nth(i).inputValue());await boxes.nth(i).check();}
  await page.getByRole('button',{name:'Start Lingo Links',exact:true}).click();
  expect(await page.evaluate(()=>lingoLinksState.groups.map(g=>g.category).sort())).toEqual(chosen.sort());
  await expect(page.locator('#lingoLinksMeaningButton')).toBeHidden();
  const ids=await page.evaluate(()=>[...lingoLinksState.groups[0].cards.slice(0,3),lingoLinksState.groups[1].cards[0]]);
  for(const id of ids) await page.locator(`[data-ll-card-id="${id}"]`).click();
  await page.locator('#lingoLinksCheckButton').click();
  await page.getByRole('button',{name:'Vis betydningen av valgte ord',exact:true}).click();
  await expect(page.locator('#lingoLinksMeaning')).toContainText('→');
  const groups=await page.evaluate(()=>lingoLinksState.groups.map(g=>g.cards));
  for(const group of groups){for(const id of group)await page.locator(`[data-ll-card-id="${id}"]`).click();await page.locator('#lingoLinksCheckButton').click();}
  await page.getByRole('button',{name:'Se resultat',exact:true}).click();
  await expect(page.locator('#lingoLinksRecall input')).toHaveCount(2);
  const answers=await page.evaluate(()=>lingoLinksState.recallCards.map(c=>c.es));
  await expect(page.locator('#lingoLinksRecallFeedback')).toBeEmpty();
  for(let i=0;i<2;i++) await page.locator('#lingoLinksRecall input').nth(i).fill(answers[i]);
  await page.getByRole('button',{name:'Sjekk de to ordene',exact:true}).click();
  await expect(page.locator('#lingoLinksRecallFeedback')).toContainText('2 av 2');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('F19: practiced-word pool never silently includes unseen vocabulary',async({page})=>{
  await page.locator('#lingoLinksPool').selectOption('practiced');
  await page.getByRole('button',{name:'Start Lingo Links',exact:true}).click();
  await expect(page.locator('#lingoLinksPoolStatus')).toContainText('fire temaer');
  await expect(page.locator('#lingoLinksSetup')).toBeVisible();
});
test('F19: sentence hint explains one placement after effort and clears for the next item',async({page})=>{
  await page.evaluate(()=>{showGameSetup('sentence-puzzle');startSentencePuzzle();spQuestionPool=[{no:'Jeg liker fotball.',words:['Me','gusta','el','fútbol.']},{no:'Jeg heter Ana.',words:['Me','llamo','Ana.']}];spRoundIndex=0;renderSentencePuzzleRound();});
  await expect(page.getByRole('button',{name:'Forklar en plassering',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'gusta',exact:true}).click();
  await page.locator('#spCheckButton').click();
  await page.getByRole('button',{name:'Forklar en plassering',exact:true}).click();
  await expect(page.locator('#spFeedback')).toContainText('Me gusta');
  await expect(page.locator('#spFeedback')).toContainText('liker');
  await page.evaluate(()=>{spRoundIndex=1;renderSentencePuzzleRound();});
  await expect(page.locator('#spFeedback')).toBeEmpty();
});

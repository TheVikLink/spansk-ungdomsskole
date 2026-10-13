import { test, expect } from '@playwright/test';
import { createLocalSchoolFixture } from './server/helpers/local-school-fixture.mjs';
let fixture;
test.beforeAll(async()=>{fixture=await createLocalSchoolFixture();});
test.afterAll(async()=>{await fixture?.close();});
async function login(page,account){
 await page.goto(fixture.origin+'/school');await page.getByRole('link',{name:'Åpne lokal testinnlogging',exact:true}).click();
 await expect(page.locator('h1')).toHaveText(/Kun lokal OIDC-test|Mine lekser|Læreroversikt/);
 if(await page.locator(`button[name=account][value="${account}"]`).count()) await page.locator(`button[name=account][value="${account}"]`).click();
}
async function logout(page){
 const cookie=(await page.context().cookies()).find(c=>c.name==='spansk_csrf_dev');
 const response=page.waitForResponse(r=>r.url()===fixture.origin+'/auth/logout'&&r.request().method()==='POST');
 await page.getByRole('button',{name:'Logg ut',exact:true}).click();const actual=await response;
 expect(actual.request().headers().origin).toBe(fixture.origin);
 expect(new URLSearchParams(actual.request().postData()).get('csrfToken')).toBe(cookie.value);
 expect(actual.status()).toBe(200);
 await expect(page.getByRole('heading',{name:'Den lokale økten er avsluttet.',exact:true})).toBeVisible();
}
test('live UI refreshes class/published progress, retry has one next control, logout works immediately after join',async({browser})=>{
 const teacherContext=await browser.newContext(), studentContext=await browser.newContext();
 const teacher=await teacherContext.newPage(), student=await studentContext.newPage();
 try{
 await login(teacher,'demo-teacher');await teacher.getByRole('textbox',{name:'Klassenavn',exact:true}).fill('Syntetisk UI-regresjon');
 await teacher.getByRole('button',{name:'Opprett klasse',exact:true}).click();await expect(teacher.getByRole('button',{name:'Inviter elev',exact:true})).toBeVisible();
 await teacher.getByRole('button',{name:'Inviter elev',exact:true}).click();const status=teacher.getByRole('status').filter({hasText:'Invitasjonskode:'});await expect(status).toBeVisible();const code=(await status.textContent()).match(/Invitasjonskode: ([A-Za-z0-9_-]+)/)[1];
 await login(student,'demo-student-a');await student.getByRole('textbox',{name:'Engangskode fra spansklæreren',exact:true}).fill(code);await student.getByRole('button',{name:'Bli med i klassen',exact:true}).click();
 await expect(student.getByRole('status').filter({hasText:'Forespørselen er sendt'})).toBeVisible();
 await logout(student); // No reload between class mutation and native POST logout.
 await teacher.reload();await teacher.getByRole('button',{name:'Forespørsler (1)',exact:true}).click();await teacher.getByRole('button',{name:'Godkjenn elev',exact:true}).click();
 await expect(teacher.getByRole('combobox',{name:'Klasse',exact:true})).toContainText('1 elever');
 await teacher.getByRole('textbox',{name:'Tittel på lekse',exact:true}).fill('Syntetisk UI-lekse');await teacher.getByRole('spinbutton',{name:'Antall oppgaver',exact:true}).fill('2');await teacher.getByRole('button',{name:'Publiser lekse',exact:true}).click();
 await expect(teacher.getByRole('button',{name:'Avslutt lekse',exact:true})).toHaveCount(1); // No reload.
 await teacher.route(fixture.origin+'/api/classes',route=>route.abort('failed'));
 await teacher.getByRole('textbox',{name:'Tittel på lekse',exact:true}).fill('Syntetisk kvitteringstest');
 await teacher.getByRole('button',{name:'Publiser lekse',exact:true}).click();
 await expect(teacher.getByRole('status').filter({hasText:'Leksen «Syntetisk kvitteringstest» er publisert'})).toBeVisible();
 await expect(teacher.getByRole('button',{name:'Publiser lekse',exact:true})).toBeDisabled();
 await expect(teacher.getByRole('button',{name:'Hent oversikten igjen',exact:true})).toBeVisible();
 await teacher.unroute(fixture.origin+'/api/classes');
 await teacher.getByRole('button',{name:'Hent oversikten igjen',exact:true}).click();
 await expect(teacher.getByRole('button',{name:'Avslutt lekse',exact:true})).toHaveCount(2);
 expect((await fixture.database.query("SELECT count(*)::int AS n FROM assignment WHERE title='Syntetisk kvitteringstest'")).rows[0].n).toBe(1);
 await login(student,'demo-student-a');await student.getByRole('listitem').filter({hasText:'Syntetisk UI-lekse'}).getByRole('button',{name:'Fortsett',exact:true}).click();
 const published=(await fixture.database.query("SELECT id,content_snapshot FROM assignment WHERE title='Syntetisk UI-lekse'")).rows[0];
 const [first,second]=published.content_snapshot.questions;
 const wrong=first.options.find(o=>o.id!==first.correctOptionId), right=first.options.find(o=>o.id===first.correctOptionId);
 await student.getByRole('radio',{name:wrong.text,exact:true}).check();await student.getByRole('button',{name:'Sjekk svaret',exact:true}).click();
 await expect(student.getByRole('status').filter({hasText:'Ikke helt.'})).toContainText('Svar lagret.');
 await expect(student.getByText('Ordforråd · 1/2 besvart',{exact:true})).toBeVisible();
 await student.getByRole('button',{name:'Prøv et nytt svar',exact:true}).click();
 await student.getByRole('radio',{name:right.text,exact:true}).check();await student.getByRole('button',{name:'Sjekk svaret',exact:true}).click();
 await expect(student.getByRole('status').filter({hasText:'Riktig.'})).toContainText('Svar lagret.');
 await expect(student.getByRole('button',{name:'Neste oppgave',exact:true})).toHaveCount(1);
 await expect(student.getByText('Ordforråd · 1/2 besvart',{exact:true})).toBeVisible();
 await student.getByRole('button',{name:'Neste oppgave',exact:true}).click();await expect(student.getByRole('heading',{name:'Oppgave 2 av 2',exact:true})).toBeVisible();
 const finalAnswer=second.options.find(o=>o.id===second.correctOptionId);let submitted=[];
 await student.route('**/api/assignments/*/answers',route=>{submitted.push(route.request().postDataJSON());return submitted.length===1?route.abort('failed'):route.continue();});
 await student.getByRole('radio',{name:finalAnswer.text,exact:true}).check();await student.getByRole('button',{name:'Sjekk svaret',exact:true}).click();
 await expect(student.getByRole('status').filter({hasText:'Svaret er ikke bekreftet lagret'})).toBeVisible();
 await expect(student.getByText('Ordforråd · 1/2 besvart',{exact:true})).toBeVisible();await expect(student.getByRole('button',{name:'Neste oppgave',exact:true})).toHaveCount(0);
 await student.getByRole('button',{name:'Prøv å lagre igjen',exact:true}).click();await expect(student.getByRole('status').filter({hasText:'Svar lagret.'})).toBeVisible();
 expect(submitted).toHaveLength(2);expect(submitted[1]).toEqual(submitted[0]);
 await expect(student.getByText('Ordforråd · 2/2 besvart',{exact:true})).toBeVisible();await student.getByRole('button',{name:'Neste oppgave',exact:true}).click();
 await expect(student.getByRole('heading',{name:'Leksen er gjennomført',exact:true})).toBeVisible();
 await student.reload();await expect(student.getByText(/Syntetisk UI-lekse · Ordforråd · 2\/2 besvart/)).toBeVisible();
 await teacher.getByRole('button',{name:'Se fremgang',exact:true}).click();await expect(teacher.getByRole('row').filter({hasText:'Syntetisk UI-lekse'})).toContainText('2/22/2');
 }finally{await teacherContext.close().catch(()=>{});await studentContext.close().catch(()=>{});}
});

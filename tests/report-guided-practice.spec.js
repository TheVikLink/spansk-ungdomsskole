import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const appUrl = pathToFileURL(path.resolve('index.html')).toString();
const skill = 'a1.verbs.regular_ar.present';
test.beforeEach(async ({page}) => {
  await page.goto(appUrl);
  await page.evaluate(() => { localStorage.clear(); showMainApp(); });
});
test('F15: repeated single form cannot award a broad verb badge; varied forms survive reload', async ({page}) => {
  const result = await page.evaluate(() => {
    const targetId = 'a1.verbs.regular_ar.present';
    showPage('verbs'); selectedVerbs = new Set(['hablar']); selectedTense = 'presente'; startVerbSession();
    const answer = (key, person) => {
      verbSessionExercises[verbCurrentIndex] = {verb:verbDatabase[key],pronounIndex:person,tense:'presente'};
      verbAnswerPending = false; showVerbExercise();
      const input = document.getElementById('verbInput'); input.value = input.dataset.expected; checkVerbAnswer(); checkVerbAnswer();
    };
    for (let i=0;i<6;i++) answer('hablar',0);
    const repeated = loadLearningProgress().skillProgress[targetId];
    const prematureBadge = getMasteryBadges().some(b => b.skillId === targetId);
    const status = buildBrainmapModel().skills.find(s => s.id === targetId).status;
    for (const [key,person] of [['hablar',1],['hablar',2],['trabajar',0],['trabajar',1],['trabajar',2]]) answer(key,person);
    return {repeated,prematureBadge,status, varied:loadLearningProgress().skillProgress[targetId],badges:getMasteryBadges()};
  });
  expect(result.repeated?.attempts).toBe(6);
  expect(result.repeated.verbForms).toEqual(['hablar:0']);
  expect(result.prematureBadge).toBe(false);
  expect(['green','gold']).not.toContain(result.status);
  expect(result.varied.verbForms).toHaveLength(6);
  expect(result.badges.some(b => b.skillId===skill)).toBe(true);
  await page.reload();
  expect(await page.evaluate(id => loadLearningProgress().skillProgress[id].verbForms,skill)).toHaveLength(6);
});
for (const strength of [0,5]) test(`F15: three focused rounds vary verbs/persons with ${strength ? 'productive challenge' : 'stem support'}`, async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(({skill,strength}) => {
    const progress = normalizeLearningProgress(null);
    progress.skillProgress[skill] = {strength, attempts:6, correct:strength?6:0}; saveLearningProgress(progress);
  },{skill,strength});
  const seen = new Set();
  for(let round=0;round<3;round++) {
    await page.evaluate(id => startBrainmapSkillPractice(id),skill);
    await expect(page.locator('#verbPracticeGoal')).toContainText(strength ? 'Skriv personordet og verbformen' : 'Finn stammen');
    const forms=await page.evaluate(() => verbSessionExercises.map(e=>`${e.verb.infinitive}:${e.pronounIndex}`));
    expect(forms).toHaveLength(5);
    for(const form of forms) { expect(seen.has(form)).toBe(false); seen.add(form); }
    for(let i=0;i<5;i++) {
      const expected = await page.locator('#verbInput').getAttribute('data-expected');
      if (strength) expect(expected).toMatch(/^(yo|tú|ella|nosotros|vosotros|ellos) /);
      await page.locator('#verbInput').fill(strength ? expected : 'no');
      await page.getByRole('button',{name:'✓ Sjekk svar',exact:true}).click();
      await page.getByRole('button',{name:'Neste',exact:true}).click();
    }
  }
  expect(seen.size).toBe(15);
});
test('F15: future forms do not increase present skill; guidance names the learning goal', async ({page}) => {
  const result=await page.evaluate(() => {
    showPage('verbs'); selectedVerbs=new Set(['hablar']);selectedTense='futuro';startVerbSession();
    const input=document.getElementById('verbInput');input.value=input.dataset.expected;checkVerbAnswer();
    return {progress:loadLearningProgress(), recommendation:getNextPracticeRecommendation([{targetId:'a1.verbs.regular_ar.present',itemType:'skill',skillKind:'verb',prompt:'yo + hablar',attempts:3,strength:0}]),streak:formatQuizStreakSummary()};
  });
  expect(result.progress.skillProgress[skill]).toBeUndefined();
  expect(result.recommendation.label).toContain('regelrette -ar-verb');
  expect(result.streak).not.toContain('/5');
});

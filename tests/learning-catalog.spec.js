import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

const expectedDiagnosisIds = [
  'diag.vocab.greeting.hola.es_no',
  'diag.vocab.greeting.takk.no_es',
  'diag.vocab.family.madre.es_no',
  'diag.vocab.number.fem.no_es',
  'diag.a0.identity.me_llamo.typed',
  'diag.a0.identity.soy_de.choice',
  'diag.a0.articles.indefinite_singular.choice',
  'diag.a0.articles.definite_singular.choice',
  'diag.a1.verbs.regular_ar.present.hablar',
  'diag.a1.verbs.regular_er.present.comer',
  'diag.a1.gustar.basic.choice',
  'diag.a1.ser_estar.identity_or_location.choice'
];

test.describe('learning catalog', () => {
  test('defines stable diagnosis questions with known targets and provenance', async ({ page }) => {
    await page.goto(appUrl);

    const catalog = await page.evaluate(() => ({
      skillIds: learningCatalog.skills.map(skill => skill.id),
      wordIds: learningCatalog.words.map(word => word.id),
      diagnosisQuestions: diagnosisQuestionCatalog.map(question => ({
        id: question.id,
        targetType: question.targetType,
        targetId: question.targetId,
        direction: question.direction ?? null,
        responseMode: question.responseMode,
        acceptedAnswers: question.acceptedAnswers,
        sourceNote: question.sourceNote
      }))
    }));

    expect(catalog.diagnosisQuestions.map(question => question.id)).toEqual(expectedDiagnosisIds);
    expect(new Set(catalog.diagnosisQuestions.map(question => question.id)).size).toBe(expectedDiagnosisIds.length);

    for (const question of catalog.diagnosisQuestions) {
      expect(question.sourceNote).toMatch(/^(written-original|teacher-authored|public-curriculum-inspired)$/);
      expect(question.acceptedAnswers.length).toBeGreaterThan(0);
      if (question.targetType === 'skill') {
        expect(catalog.skillIds).toContain(question.targetId);
      } else {
        expect(catalog.wordIds).toContain(question.targetId);
        expect(['noToEs', 'esToNo']).toContain(question.direction);
      }
    }
  });
});

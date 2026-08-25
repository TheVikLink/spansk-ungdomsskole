import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('answer-acceptance fuzz and accent regression', () => {
  test('accepts every glossary pair as the canonical answer in both directions', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const card of cards) {
        for (const direction of ['no-es', 'es-no']) {
          const primaryAnswer = direction === 'no-es' ? card.es : card.no;
          const accepted = getVocabularyAcceptedAnswers(card, direction, primaryAnswer).map(a => a.value);
          const evaluation = isTypedVocabAnswerCorrect(primaryAnswer, primaryAnswer, accepted);
          if (!evaluation.correct) {
            failures.push({
              no: card.no,
              es: card.es,
              direction,
              primaryAnswer,
              accepted,
              resultKind: evaluation.resultKind
            });
          }
        }
      }
      return { totalCards: cards.length, failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('classifies accent-stripped Spanish answers as near-miss, not wrong', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const card of cards) {
        const esLower = card.es.toLowerCase();
        if (!/[áéíóúüñ]/i.test(card.es)) continue;

        const accentStripped = card.es
          .replace(/[áéíóúü]/g, ch => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[ch] || ch))
          .replace(/ñ/g, 'n');

        if (accentStripped === card.es) continue;

        const hasNye = card.es.includes('ñ') || card.es.includes('Ñ');
        const accentOnly = !hasNye && accentStripped !== card.es;
        const nyeOnly = hasNye && !/[áéíóúü]/i.test(card.es);

        const accepted = getVocabularyAcceptedAnswers(card, 'no-es', card.es).map(a => a.value);
        const evaluation = isTypedVocabAnswerCorrect(accentStripped, card.es, accepted);

        if (accentOnly || (hasNye && !/[áéíóúü]/i.test(card.es))) {
          // For accent-only words: should be accent_or_case_variant
          if (accentOnly && evaluation.resultKind !== 'accent_or_case_variant') {
            failures.push({
              no: card.no,
              es: card.es,
              accentStripped,
              expected: 'accent_or_case_variant',
              got: evaluation.resultKind
            });
          }
          // For ñ-only words (no accents): ñ→n should be 'wrong', not 'accent_or_case_variant'
          if (nyeOnly && evaluation.resultKind !== 'wrong') {
            failures.push({
              no: card.no,
              es: card.es,
              accentStripped,
              expected: 'wrong',
              got: evaluation.resultKind,
              reason: 'ñ→n changes the word, should be wrong'
            });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('accepts Norwegian definite forms for every el/la noun', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const card of cards) {
        if (!/^(el|la)\s/i.test(card.es)) continue;
        if (!/^[^,()\s]+$/u.test(card.no)) continue;
        if (vocabularyAnswerAlternatives[`${card.no}|es-no`]) continue;

        const definiteForms = getNorwegianNounDefiniteForms(card);
        if (definiteForms.length === 0) continue;

        for (const form of definiteForms) {
          const accepted = getVocabularyAcceptedAnswers(card, 'es-no', card.no).map(a => a.value);
          const evaluation = isTypedVocabAnswerCorrect(form, card.no, accepted);
          if (!evaluation.correct) {
            failures.push({
              no: card.no,
              es: card.es,
              definiteForm: form,
              accepted,
              resultKind: evaluation.resultKind
            });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('diagnosis accepted answers are all classified as correct', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const question of diagnosisQuestionCatalog) {
        for (const answer of question.acceptedAnswers) {
          const value = getDiagnosisAnswerValue(answer);
          const evaluation = evaluateDiagnosisAnswer(question, value);
          if (!evaluation.correct) {
            failures.push({
              questionId: question.id,
              answerValue: value,
              resultKind: evaluation.resultKind
            });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('diagnosis accent variants are classified as near-miss, not wrong', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const question of diagnosisQuestionCatalog) {
        for (const answer of question.acceptedAnswers) {
          const value = getDiagnosisAnswerValue(answer);
          if (!/[áéíóúü]/i.test(value)) continue;

          const accentStripped = value
            .replace(/[áéíóúü]/g, ch => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[ch] || ch));
          if (accentStripped === value) continue;

          const evaluation = evaluateDiagnosisAnswer(question, accentStripped);
          if (evaluation.resultKind === 'wrong') {
            failures.push({
              questionId: question.id,
              answerValue: value,
              accentStripped,
              resultKind: evaluation.resultKind,
              expected: 'accent_or_case_variant or near_miss'
            });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('diagnosis ñ-stripped answers are classified as wrong', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const question of diagnosisQuestionCatalog) {
        for (const answer of question.acceptedAnswers) {
          const value = getDiagnosisAnswerValue(answer);
          if (!/[ñ]/i.test(value)) continue;

          const nStripped = value.replace(/ñ/gi, 'n');
          const evaluation = evaluateDiagnosisAnswer(question, nStripped);
          if (evaluation.resultKind === 'correct' || evaluation.resultKind === 'accent_or_case_variant') {
            failures.push({
              questionId: question.id,
              answerValue: value,
              nStripped,
              resultKind: evaluation.resultKind,
              expected: 'wrong'
            });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('verb conjugation answers are all classified as correct', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const [key, verb] of Object.entries(verbDatabase)) {
        for (let i = 0; i < verb.presente.length; i++) {
          const expected = verb.presente[i];
          const evaluation = evaluateTypedAnswer(expected, expected);
          if (!evaluation.correct) {
            failures.push({ verb: verb.infinitive, form: expected, resultKind: evaluation.resultKind });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('verb conjugation accent variants are classified as near-miss', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const [key, verb] of Object.entries(verbDatabase)) {
        for (const form of verb.presente) {
          if (!/[áéíóúü]/i.test(form)) continue;
          const accentStripped = form
            .replace(/[áéíóúü]/g, ch => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[ch] || ch));
          if (accentStripped === form) continue;

          const evaluation = evaluateTypedAnswer(accentStripped, form);
          if (evaluation.resultKind !== 'accent_or_case_variant') {
            failures.push({
              verb: verb.infinitive,
              form,
              accentStripped,
              resultKind: evaluation.resultKind,
              expected: 'accent_or_case_variant'
            });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });

  test('every grammar exercise correct answer is in the options', async ({ page }) => {
    await page.goto(appUrl);

    const results = await page.evaluate(() => {
      const failures = [];
      for (const topic of Object.values(grammarTopics)) {
        for (const exercise of topic.exercises) {
          if (!exercise.options || !exercise.answer) continue;
          const correctLower = exercise.answer.toLowerCase();
          const inOptions = exercise.options.some(o => o.toLowerCase() === correctLower);
          if (!inOptions) {
            failures.push({
              topic: topic.id,
              sentence: exercise.sentence,
              answer: exercise.answer,
              options: exercise.options
            });
          }
        }
      }
      return { failures };
    });

    expect(results.failures).toEqual([]);
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareDictationAnswer,
  evaluateAcceptedTextAnswer,
  evaluateTypedAnswer,
  isMissingTildeN,
  normalizeAccentVariant,
  normalizeAnswerText,
} from '../src/domain/answer-grading.js';
import {
  dictationAudioUrl,
  getDictationAudioUrls,
  listeningAudioUrl,
} from '../src/domain/audio-paths.js';
import {
  calculateNextReview,
  getIntervalText,
} from '../src/domain/sm2.js';
import { verifyCatalogsSync } from '../scripts/sync-catalogs.mjs';
import { runDoctor } from '../scripts/doctor.mjs';

test('answer-grading normalizes text, detects accent variants, and preserves ñ distinctness', () => {
  assert.equal(normalizeAnswerText('  ¡Hola   Mundo! '), '¡hola mundo!');
  assert.equal(normalizeAccentVariant('Canción'), 'cancion');
  assert.equal(normalizeAccentVariant('mañana'), 'mañana');

  assert.deepEqual(evaluateTypedAnswer('habló', 'habló'), { resultKind: 'correct', correct: true });
  assert.deepEqual(evaluateTypedAnswer('hablo', 'habló'), { resultKind: 'accent_or_case_variant', correct: false });
  assert.deepEqual(evaluateTypedAnswer('   ', 'habló'), { resultKind: 'skipped', correct: false });

  const multi = evaluateAcceptedTextAnswer('el perro', ['perro', 'el perro']);
  assert.equal(multi.outcome, 'correct');
  assert.equal(multi.correct, true);

  const accentMiss = evaluateAcceptedTextAnswer('el ático'.replace('á', 'a'), ['el ático']);
  assert.equal(accentMiss.outcome, 'incorrect');
  assert.equal(accentMiss.resultKind, 'accent_or_case_variant');

  assert.deepEqual(evaluateTypedAnswer('que tal', '¿qué tal?'), { resultKind: 'accent_or_case_variant', correct: false });
  assert.deepEqual(evaluateTypedAnswer('qué tal', '¿qué tal?'), { resultKind: 'correct', correct: true });
  assert.deepEqual(evaluateTypedAnswer('carinoso', 'cariñoso'), {
    resultKind: 'wrong',
    correct: false,
  });

  const tildeMiss = evaluateAcceptedTextAnswer('carinoso', ['cariñoso', 'cariñosa']);
  assert.equal(tildeMiss.outcome, 'incorrect');
  assert.equal(tildeMiss.resultKind, 'wrong');
  assert.equal(tildeMiss.correct, false);
  assert.equal(isMissingTildeN('carinoso', 'cariñoso'), true);
  assert.equal(isMissingTildeN('hablo', 'habló'), false);
});

test('compareDictationAnswer classifies exact, punctuation, incomplete, and different responses', () => {
  assert.equal(compareDictationAnswer('', 'Ana vive en Madrid.'), 'empty');
  assert.equal(compareDictationAnswer('Ana vive en Madrid.', 'Ana vive en Madrid.'), 'exact');
  assert.equal(compareDictationAnswer('Ana vive en Madrid', 'Ana, vive en Madrid.'), 'punctuation');
  assert.equal(compareDictationAnswer('Ana vive', 'Ana vive en Madrid.'), 'incomplete');
  assert.equal(compareDictationAnswer('Pedro compra pan hoy.', 'Ana vive en Madrid.'), 'different');
});

test('sm2 calculates deterministic intervals and caps ease factor and max interval', () => {
  const now = new Date('2026-11-24T12:00:00.000Z');
  const firstGood = calculateNextReview({}, 2, now);
  assert.equal(firstGood.interval, 1);
  assert.equal(firstGood.repetitions, 1);

  const secondGood = calculateNextReview(firstGood, 2, now);
  assert.equal(secondGood.interval, 3);
  assert.equal(secondGood.repetitions, 2);

  const failed = calculateNextReview(secondGood, 0, now);
  assert.equal(failed.interval, 0);
  assert.equal(failed.repetitions, 0);
  assert.equal(getIntervalText(0, secondGood, now), 'Nå');
  assert.equal(getIntervalText(2, {}, now), '1 dag');
});

test('audio-paths builds encoded URLs for listening and dictation stories', () => {
  assert.equal(listeningAudioUrl({ fullAudio: 'Leo-Sevilla.mp3' }), 'audio/lyttehistorier/Leo-Sevilla.mp3');
  const story = {
    audioDir: 'Ana vive en Madrid',
    audioExt: 'wav',
    fullAudio: 'Ana vive en Madrid full.m4a',
    segments: [['Ana vive en Madrid.', 'Ana vive en Madrid 1']],
  };
  assert.equal(
    dictationAudioUrl(story, 'Ana vive en Madrid 1'),
    'audio/diktat/Ana%20vive%20en%20Madrid/Ana%20vive%20en%20Madrid%201.wav',
  );
  assert.equal(getDictationAudioUrls(story).length, 2);
});

test('extracted src/data catalogs match index.html and doctor reports healthy checks', () => {
  const sync = verifyCatalogsSync();
  assert.equal(sync.inSync, true, `Catalogs out of sync: ${sync.diffs.join(', ')}`);
  const report = runDoctor();
  assert.equal(report.healthy, true);
});

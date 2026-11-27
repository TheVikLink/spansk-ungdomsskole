/**
 * Pure, DOM-free answer normalization and grading shared between the local
 * practice app and the school homework server (`server/activity-catalog.js`).
 *
 * Security & privacy invariant: functions in this module operate strictly in
 * memory and never log or persist raw student free-text responses.
 */

const ACCENT_MAP = Object.freeze({
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
});

export function normalizeAnswerText(value) {
  return String(value ?? '').normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function stripEdgePunctuation(value) {
  return normalizeAnswerText(value).replace(/^[¿¡.,!;:"'«»]+|[?!.,!;:"'«»]+$/gu, '').trim();
}

export function normalizeAccentVariant(value) {
  return normalizeAnswerText(value).replace(/[áéíóúü]/g, (ch) => ACCENT_MAP[ch] || ch);
}

function stripAccentAndPunctuation(value) {
  return stripEdgePunctuation(value).replace(/[áéíóúü]/g, (ch) => ACCENT_MAP[ch] || ch);
}

export function normalizeAccentAndTildeVariant(value) {
  return normalizeAccentVariant(value).replace(/ñ/g, 'n');
}

function stripAccentTildeAndPunctuation(value) {
  return stripAccentAndPunctuation(value).replace(/ñ/g, 'n');
}

export function isMissingTildeN(answer, expected) {
  const normAnswer = normalizeAnswerText(answer);
  const normExpected = normalizeAnswerText(expected);
  if (!normAnswer || !normExpected) return false;
  if (normalizeAccentVariant(normAnswer) === normalizeAccentVariant(normExpected)) return false;
  if (normalizeAccentAndTildeVariant(normAnswer) === normalizeAccentAndTildeVariant(normExpected)) return true;
  const strippedAnswer = stripEdgePunctuation(answer);
  const strippedExpected = stripEdgePunctuation(expected);
  if (!strippedAnswer || !strippedExpected) return false;
  if (stripAccentAndPunctuation(answer) === stripAccentAndPunctuation(expected)) return false;
  return stripAccentTildeAndPunctuation(answer) === stripAccentTildeAndPunctuation(expected);
}

export function normalizeDictationAnswer(value) {
  return String(value ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('es')
    .replace(/^[¿¡,.!?:;«»"']+|[,.!?:;«»"']+$/gu, '');
}

export function compareDictationAnswer(answer, expected) {
  const a = normalizeDictationAnswer(answer);
  const e = normalizeDictationAnswer(expected);
  if (!a) return 'empty';
  if (a === e) return 'exact';
  const withoutPunctuation = (val) => val.replace(/[¿¡,.!?:;«»"']/gu, '');
  if (withoutPunctuation(a) === withoutPunctuation(e)) return 'punctuation';
  const wordCount = (val) => (val.match(/[\p{L}\p{N}]+/gu) || []).length;
  if (wordCount(a) < wordCount(e)) return 'incomplete';
  return 'different';
}

export function evaluateTypedAnswer(answer, expected) {
  const normalizedAnswer = normalizeAnswerText(answer);
  const normalizedExpected = normalizeAnswerText(expected);
  if (!normalizedAnswer) return { resultKind: 'skipped', correct: false };
  if (normalizedAnswer === normalizedExpected) return { resultKind: 'correct', correct: true };
  const strippedAnswer = stripEdgePunctuation(answer);
  const strippedExpected = stripEdgePunctuation(expected);
  if (strippedAnswer && strippedAnswer === strippedExpected) {
    return { resultKind: 'correct', correct: true };
  }
  if (normalizeAccentVariant(answer) === normalizeAccentVariant(expected)
    || (strippedAnswer && stripAccentAndPunctuation(answer) === stripAccentAndPunctuation(expected))) {
    return { resultKind: 'accent_or_case_variant', correct: false };
  }
  return { resultKind: 'wrong', correct: false };
}

/**
 * Evaluates a free-text student response against a list of accepted answers
 * (e.g. from `data/vocabulary-canonical-review.json` or verb conjugation forms).
 * Returns a minimized result suitable for formative feedback and server outcome recording.
 */
export function evaluateAcceptedTextAnswer(answer, acceptedAnswers = []) {
  const normalizedAnswer = normalizeAnswerText(answer);
  if (!normalizedAnswer) {
    return { outcome: 'incorrect', resultKind: 'skipped', correct: false };
  }
  const strippedAnswer = stripEdgePunctuation(answer);
  const candidates = (Array.isArray(acceptedAnswers) ? acceptedAnswers : [acceptedAnswers])
    .map((item) => (typeof item === 'string' ? item : item?.value ?? ''))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (normalizeAnswerText(candidate) === normalizedAnswer
      || (strippedAnswer && stripEdgePunctuation(candidate) === strippedAnswer)) {
      return { outcome: 'correct', resultKind: 'correct', correct: true };
    }
  }

  const answerAccent = normalizeAccentVariant(normalizedAnswer);
  const strippedAccent = stripAccentAndPunctuation(answer);
  for (const candidate of candidates) {
    if (normalizeAccentVariant(candidate) === answerAccent
      || (strippedAccent && stripAccentAndPunctuation(candidate) === strippedAccent)) {
      return { outcome: 'incorrect', resultKind: 'accent_or_case_variant', correct: false };
    }
  }

  return { outcome: 'incorrect', resultKind: 'wrong', correct: false };
}

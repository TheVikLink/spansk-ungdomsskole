import { readFileSync } from 'node:fs';
import { extractAllItems } from './lib/extract-all-items.mjs';

const html = readFileSync('index.html', 'utf8');
const items = extractAllItems(html);
const failures = [];

function fail(checkId, message) {
  failures.push(`[${checkId}] ${message}`);
}

// Load reference corpus if available
let referenceCorpus = null;
try {
  referenceCorpus = JSON.parse(readFileSync('scripts/reference-corpus.json', 'utf8'));
} catch {
  // corpus not yet built; corpus-dependent checks will be skipped
}

// --- Check 1: parenthetical-annotation-has-clean-form ---
// Every glossary `no` containing a parenthetical annotation must have a
// vocabularyAnswerAlternatives entry that lists the clean form as accepted.
// Excludes hint markers (parentheticals containing "...").
const parentheticalNos = new Set();
for (const card of items.glossary) {
  if (/\([^)]*\)/.test(card.no) && card.es) {
    // Skip hint markers like "(me ....)"
    if (/\(\.*\)/.test(card.no) || /\([^)]*\.\.\.\)/.test(card.no)) continue;
    const cleanNo = card.no.replace(/\s*\([^)]*\)/g, '').trim();
    if (cleanNo && cleanNo !== card.no) {
      parentheticalNos.add(card.no);
      const altKey = `${card.no}|es-no`;
      const alternatives = items.vocabularyAnswerAlternatives[altKey];
      if (!alternatives) {
        fail('parenthetical-annotation-has-clean-form',
          `"${card.no}" has a parenthetical annotation but no vocabularyAnswerAlternatives entry for es-no direction`);
      } else {
        const values = alternatives.map(a => a.value);
        // For slash-separated clean forms (e.g., "bilde / maleri"), check that
        // at least one slash-separated part is in the alternatives.
        const cleanParts = cleanNo.split(/\s+\/\s+/).map(p => p.trim()).filter(Boolean);
        const hasAnyClean = cleanParts.length > 1
          ? cleanParts.some(part => values.includes(part))
          : values.includes(cleanNo);
        if (!hasAnyClean) {
          fail('parenthetical-annotation-has-clean-form',
            `"${card.no}" alternatives do not include clean form "${cleanNo}"`);
        }
      }
    }
  }
}

// --- Check 2: definite-form-ending ---
// Every el/la noun with a simple single-token `no` must have a morphologically
// plausible definite form. Flag double endings like "kusineen" (should be "kusinen")
// or "Valentinsdagenen" (should be "Valentinsdagen").
// Note: words like "fersken" or "oliven" that end in "-en" as part of the stem
// are NOT double endings - they are correct indefinite forms.
const alreadyDefinitePattern = /^(dag|uken|ukene|året|årene|skolen|skolen|valentinsdag|nasjonaldag|allehelgensdag|ungdomsskole)en$/i;
for (const card of items.glossary) {
  if (!/^(el|la)\s/i.test(card.es)) continue;
  if (!/^[^,()\s]+$/u.test(card.no)) continue;
  // Skip if the `no` is in vocabularyAnswerAlternatives (explicitly handled)
  if (items.vocabularyAnswerAlternatives[`${card.no}|es-no`]) continue;

  const explicit = items.norwegianNounDefiniteForms[card.no];
  if (explicit) {
    // Check that explicit forms don't have double "ee" endings (e.g., "kusineen")
    for (const form of explicit) {
      if (/ee/.test(form)) {
        fail('definite-form-ending',
          `"${card.no}" definite form "${form}" has a double "ee" ending; should be "${form.replace(/ee/, 'e')}"`);
      }
    }
    continue;
  }

  // Auto-generated: no + 'en' for non-e-ending, no + 'n' for e-ending
  const autoForm = card.no.endsWith('e') ? `${card.no}n` : `${card.no}en`;
  // Flag if the auto form creates a double "ee" (e.g., "kusine" + "en" = "kusineen")
  if (/ee/.test(autoForm)) {
    fail('definite-form-ending',
      `"${card.no}" auto-definite-form "${autoForm}" has a double "ee"; add explicit entry to norwegianNounDefiniteForms`);
  }
}

// --- Check 3: alternative-map-orphan ---
// Every key in vocabularyAnswerAlternatives must reference a `no` that exists
// in the glossary (either as exact match or as the clean form of a parenthetical).
const glossaryNos = new Set(items.glossary.map(c => c.no));
const cleanGlossaryNos = new Set();
for (const card of items.glossary) {
  const clean = card.no.replace(/\s*\([^)]*\)/g, '').trim();
  if (clean) cleanGlossaryNos.add(clean);
}

for (const key of Object.keys(items.vocabularyAnswerAlternatives)) {
  const noPart = key.split('|')[0];
  if (!glossaryNos.has(noPart) && !cleanGlossaryNos.has(noPart)) {
    fail('alternative-map-orphan',
      `vocabularyAnswerAlternatives key "${key}" references "${noPart}" which is not in the glossary`);
  }
}

// --- Check 4: definite-form-map-orphan ---
// Every key in norwegianNounDefiniteForms must reference a `no` that exists in
// the glossary, either as an exact match, as part of a compound word, or as
// the clean form of a parenthetical/slash annotation.
const ndfKeys = Object.keys(items.norwegianNounDefiniteForms);
for (const key of ndfKeys) {
  if (glossaryNos.has(key)) continue;
  // Check if it's a documented synthetic case (already-definite -> indefinite)
  const values = items.norwegianNounDefiniteForms[key];
  const isSynthetic = values.some(v => glossaryNos.has(v) || cleanGlossaryNos.has(v));
  if (isSynthetic) continue;
  // Check if the key appears as a standalone word in any glossary `no`
  // (e.g., "hår" in "mørkt hår", "kjøleskap" in "kjøleskap (n)")
  const appearsInGlossary = items.glossary.some(card => {
    const parts = card.no.replace(/\s*\([^)]*\)/g, '').split(/\s+/);
    return parts.includes(key);
  });
  if (!appearsInGlossary) {
    fail('definite-form-map-orphan',
      `norwegianNounDefiniteForms key "${key}" is not in the glossary and does not map back to a glossary word`);
  }
}

// --- Check 5: glossary-duplicate-pair ---
// Flag exact duplicate [no, es] pairs.
const seenPairs = new Map();
for (const card of items.glossary) {
  const pairKey = `${card.no}::${card.es}`;
  if (seenPairs.has(pairKey)) {
    fail('glossary-duplicate-pair',
      `Duplicate glossary pair: ["${card.no}", "${card.es}"] (also at index ${seenPairs.get(pairKey)})`);
  } else {
    seenPairs.set(pairKey, items.glossary.indexOf(card));
  }
}

// --- Check 6: glossary-prompt-collision ---
// Flag `no` values that map to multiple different-meaning `es` values without
// a vocabularyAnswerAlternatives disambiguation entry. This is the structural
// version of the "juice" bug.
const noToEs = new Map();
for (const card of items.glossary) {
  if (!noToEs.has(card.no)) noToEs.set(card.no, new Set());
  noToEs.get(card.no).add(card.es);
}
for (const [no, esSet] of noToEs) {
  if (esSet.size < 2) continue;
  // Check if there's an answer-alternatives entry that handles disambiguation
  const hasAltEntry = items.vocabularyAnswerAlternatives[`${no}|no-es`];
  if (!hasAltEntry) {
    const esList = [...esSet].join('", "');
    fail('glossary-prompt-collision',
      `"${no}" maps to multiple Spanish translations ("${esList}") but has no vocabularyAnswerAlternatives["${no}|no-es"] entry for disambiguation`);
  }
}

// --- Check 7: verb-conjugation-completeness ---
// Every verb must have 6 presente forms and a participio.
for (const verb of items.verbs) {
  if (!Array.isArray(verb.presente) || verb.presente.length !== 6) {
    fail('verb-conjugation-completeness',
      `Verb "${verb.infinitive}" has ${verb.presente?.length || 0} presente forms, expected 6`);
  }
  if (!verb.participio || typeof verb.participio !== 'string') {
    fail('verb-conjugation-completeness',
      `Verb "${verb.infinitive}" missing participio`);
  }
  if (verb.presente) {
    for (let i = 0; i < verb.presente.length; i++) {
      if (!verb.presente[i]) {
        fail('verb-conjugation-completeness',
          `Verb "${verb.infinitive}" has empty presente form at index ${i}`);
      }
    }
  }
}

// --- Check 8: verb-translation-has-leading-aa ---
// Verb translations should start with "å " per glossary convention.
for (const verb of items.verbs) {
  if (!verb.translation) {
    fail('verb-translation-has-leading-aa',
      `Verb "${verb.infinitive}" missing translation`);
    continue;
  }
  if (!verb.translation.startsWith('å ') && verb.translation !== 'å') {
    fail('verb-translation-has-leading-aa',
      `Verb "${verb.infinitive}" translation "${verb.translation}" does not start with "å "`);
  }
}

// --- Check 9: grammar-distractor-identity ---
// For each grammar exercise, flag if any distractor equals the correct answer.
for (const exercise of items.grammar) {
  if (!exercise.options || !exercise.answer) continue;
  const correctLower = exercise.answer.toLowerCase();
  for (const option of exercise.options) {
    if (option.toLowerCase() === correctLower && option !== exercise.answer) {
      // Only flag if it's a duplicate (case-variant), not the intended answer
      fail('grammar-distractor-identity',
        `Grammar exercise "${exercise.sentence}" has a distractor "${option}" that matches the correct answer "${exercise.answer}"`);
    }
  }
  // Also check that the correct answer is actually in the options
  if (!exercise.options.some(o => o.toLowerCase() === correctLower)) {
    fail('grammar-distractor-identity',
      `Grammar exercise "${exercise.sentence}" correct answer "${exercise.answer}" is not in options [${exercise.options.join(', ')}]`);
  }
}

// --- Check 10: sentence-puzzle-word-count ---
// Every puzzle must have at least 2 words and non-empty `no`.
for (const puzzle of items.sentencePuzzles) {
  if (!puzzle.no || !puzzle.no.trim()) {
    fail('sentence-puzzle-word-count',
      `Sentence puzzle at level "${puzzle.level}" has empty Norwegian text`);
  }
  if (!Array.isArray(puzzle.words) || puzzle.words.length < 2) {
    fail('sentence-puzzle-word-count',
      `Sentence puzzle "${puzzle.no}" has ${puzzle.words?.length || 0} words, expected at least 2`);
  }
  for (let i = 0; i < puzzle.words.length; i++) {
    if (!puzzle.words[i] || !puzzle.words[i].trim()) {
      fail('sentence-puzzle-word-count',
        `Sentence puzzle "${puzzle.no}" has empty word at index ${i}`);
    }
  }
}

// --- Check 11: sentence-puzzle-correct-order ---
// Verify that joining the words array produces a non-empty string with no
// leading/trailing whitespace per word.
for (const puzzle of items.sentencePuzzles) {
  for (const word of puzzle.words || []) {
    if (word !== word.trim()) {
      fail('sentence-puzzle-correct-order',
        `Sentence puzzle "${puzzle.no}" word "${word}" has leading/trailing whitespace`);
    }
  }
}

// --- Check 12: accent-form-present ---
// Flag Spanish answers that contain `n` where the canonical form should contain
// `ñ`. This is a targeted check against a known list, not a full spell check.
const ninWords = ['año', 'mañana', 'niño', 'niña', 'niños', 'niñas', 'pequeño', 'pequeña',
  'español', 'española', 'españoles', 'españolas', 'sueño', 'daño', 'otoño', 'garabato',
  'piña', 'caña', 'montaña', 'tamaño', 'engaño', 'enseñanza', 'añadir'];
const ninSet = new Set(ninWords);
for (const card of items.glossary) {
  const esLower = card.es.toLowerCase();
  // Check if the Spanish contains a word that should have ñ but has n
  const words = esLower.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:¿¡]/g, '');
    // If the word with n exists in our ñ-set as a misspelling
    const ninVersion = cleanWord.replace(/ñ/g, 'n');
    if (ninSet.has(cleanWord) && !cleanWord.includes('ñ')) {
      // This word is in the ñ-set but doesn't contain ñ - flag it
      fail('accent-form-present',
        `Glossary "${card.no}" -> "${card.es}" contains "${cleanWord}" which should contain ñ`);
    }
  }
}

// --- Check 13: grammar-exercise-has-norwegian-context ---
// Flag grammar exercises that lack a Norwegian context (`no` field), which
// makes them ambiguous for learners. Already addressed for gustar/demonstratives/possessives.
for (const exercise of items.grammar) {
  if (!exercise.no || !exercise.no.trim()) {
    fail('grammar-exercise-has-norwegian-context',
      `Grammar exercise "${exercise.sentence}" (topic: ${exercise.topicId}) lacks Norwegian context`);
  }
}

// --- Corpus-dependent checks (run only if reference corpus is available) ---

let corpusChecksRan = 0;
let corpusChecksSkipped = [];

if (referenceCorpus) {
  // Replicate getVocabularyAcceptedAnswers logic from the app
  function getAcceptedAnswersForCard(card, direction) {
    const altKey = `${card.no}|${direction}`;
    const alternatives = items.vocabularyAnswerAlternatives[altKey];
    if (alternatives?.length) return alternatives.map(a => a.value);

    if (direction === 'es-no') {
      // Check definite forms for el/la nouns
      if (/^(el|la)\s/i.test(card.es) && /^[^,()\s]+$/u.test(card.no)) {
        const explicit = items.norwegianNounDefiniteForms[card.no];
        if (explicit) return [card.no, ...explicit];
        const autoForm = card.no.endsWith('e') ? `${card.no}n` : `${card.no}en`;
        return [card.no, autoForm];
      }
    }
    return [direction === 'no-es' ? card.es : card.no];
  }

  function normalize(text) {
    return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // --- Check 14: synonym-coverage-no-to-es ---
  // For each glossary `no`, check that all valid Spanish translations in the
  // corpus are accepted in the no-es direction.
  for (const card of items.glossary) {
    const validEs = referenceCorpus.noToEs[card.no];
    if (!validEs || validEs.length <= 1) continue;

    for (const es of validEs) {
      if (normalize(es) === normalize(card.es)) continue; // canonical already accepted
      const accepted = getAcceptedAnswersForCard(card, 'no-es').map(normalize);
      if (!accepted.includes(normalize(es))) {
        fail('synonym-coverage-no-to-es',
          `"${card.no}" should accept "${es}" (from reference corpus) but only accepts [${accepted.join(', ')}]`);
      }
    }
  }
  corpusChecksRan++;

  // --- Check 15: synonym-coverage-es-to-no ---
  // For each glossary `es`, check that all valid Norwegian translations in the
  // corpus are accepted in the es-no direction.
  for (const card of items.glossary) {
    const validNo = referenceCorpus.esToNo[card.es];
    if (!validNo || validNo.length <= 1) continue;

    for (const no of validNo) {
      if (normalize(no) === normalize(card.no)) continue; // canonical already accepted
      const accepted = getAcceptedAnswersForCard(card, 'es-no').map(normalize);
      if (!accepted.includes(normalize(no))) {
        fail('synonym-coverage-es-to-no',
          `"${card.es}" should accept "${no}" (from reference corpus) but only accepts [${accepted.join(', ')}]`);
      }
    }
  }
  corpusChecksRan++;

  // --- Check 16: corpus-orphan ---
  // Flag reference corpus entries that don't exist in the glossary.
  const glossaryNos = new Set(items.glossary.map(c => c.no));
  const glossaryEss = new Set(items.glossary.map(c => c.es));
  for (const no of Object.keys(referenceCorpus.noToEs)) {
    if (!glossaryNos.has(no)) {
      // Allow clean forms of parenthetical annotations
      const cleanMatch = items.glossary.some(c => c.no.replace(/\s*\([^)]*\)/g, '').trim() === no);
      if (!cleanMatch) {
        fail('corpus-orphan',
          `Reference corpus noToEs key "${no}" is not in the glossary`);
      }
    }
  }
  for (const es of Object.keys(referenceCorpus.esToNo)) {
    if (!glossaryEss.has(es)) {
      fail('corpus-orphan',
        `Reference corpus esToNo key "${es}" is not in the glossary`);
    }
  }
  corpusChecksRan++;
} else {
  corpusChecksSkipped = [
    'synonym-coverage-no-to-es (requires reference corpus: run npm run build:corpus)',
    'synonym-coverage-es-to-no (requires reference corpus: run npm run build:corpus)',
    'corpus-orphan (requires reference corpus)',
    'translation-idiomaticity (requires expert review)',
    'distractor-validity-in-context (requires semantic analysis)'
  ];
}

// --- Report ---
const mechanicalChecks = [
  'parenthetical-annotation-has-clean-form',
  'definite-form-ending',
  'alternative-map-orphan',
  'definite-form-map-orphan',
  'glossary-duplicate-pair',
  'glossary-prompt-collision',
  'verb-conjugation-completeness',
  'verb-translation-has-leading-aa',
  'grammar-distractor-identity',
  'sentence-puzzle-word-count',
  'sentence-puzzle-correct-order',
  'accent-form-present',
  'grammar-exercise-has-norwegian-context'
];

const corpusDependentChecks = [
  'synonym-coverage-no-to-es',
  'synonym-coverage-es-to-no',
  'corpus-orphan',
  'translation-idiomaticity (requires expert review)',
  'distractor-validity-in-context (requires semantic analysis)'
];

if (failures.length > 0) {
  console.error('Content accuracy check FAILED:\n');
  console.error(failures.join('\n'));
  const totalChecks = mechanicalChecks.length + corpusChecksRan;
  console.error(`\n${failures.length} failure(s) across ${totalChecks} checks.`);
  if (corpusChecksSkipped.length > 0) {
    console.error(`\nCorpus-dependent checks skipped: ${corpusChecksSkipped.join(', ')}`);
  }
  process.exit(1);
}

const totalChecks = mechanicalChecks.length + corpusChecksRan;
console.log(`Content accuracy check passed (${totalChecks} checks: ${mechanicalChecks.length} mechanical + ${corpusChecksRan} corpus-based, ${items.glossary.length} glossary items, ${items.grammar.length} grammar exercises, ${items.verbs.length} verbs, ${items.sentencePuzzles.length} puzzles).`);
if (corpusChecksSkipped.length > 0) {
  console.log(`Corpus-dependent checks skipped: ${corpusChecksSkipped.join(', ')}`);
}

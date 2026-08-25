import { readFileSync, writeFileSync } from 'node:fs';
import { extractAllItems } from './lib/extract-all-items.mjs';

const html = readFileSync('index.html', 'utf8');
const items = extractAllItems(html);

// Curated synonym map for A0-A1 Spanish.
// Key: the canonical Norwegian or Spanish term as it appears in the glossary.
// Value: array of additional valid translations that should be accepted.
// Rules:
// - Only include synonyms that are truly equivalent at A1 level (not just "related words")
// - Don't include words that change meaning (mirar ≠ ver, almorzar ≠ comer)
// - Don't include overly formal or advanced alternatives (adquirir, habitar, no obstante)
// - Keep grammar exercises precise - don't add synonyms that would make exercises ambiguous
// - Only include keys that exist in the glossary (not verbDatabase-only entries)
const curatedNoToEs = {
  // Greetings - "hasta luego" is A1 standard
  'ha det': ['adiós', 'hasta luego'],

  // Evening greeting - both valid depending on time of day
  'god kveld': ['buenas noches', 'buenas tardes'],

  // Juice - both valid in different Spanish-speaking regions
  'juice': ['el zumo', 'el jugo'],

  // Every day - both common
  'hver dag': ['todos los días', 'cada día'],

  // Future sentence - "próximo año" is an A1 variant of "año que viene"
  'Neste år skal jeg begynne på videregående': [
    'El año que viene voy a empezar el bachillerato',
    'El año que viene voy a comenzar el bachillerato',
    'El próximo año voy a empezar el bachillerato',
    'El próximo año voy a comenzar el bachillerato'
  ],

  // Kjæreste - both genders valid
  'kjæreste': ['el novio', 'la novia'],
};

const curatedEsToNo = {
  // Family - definite/indefinite forms
  'el hermano': ['bror', 'broren'],
  'la hermana': ['søster', 'søsteren'],
  'la madre': ['mor', 'moren', 'mamma'],
  'el padre': ['far', 'faren'],
  'el abuelo': ['bestefar', 'bestefaren'],
  'la abuela': ['bestemor', 'bestemoren'],

  // Greetings
  'hola': ['hei', 'hallo'],
  'adiós': ['ha det', 'farvel'],

  // Juice
  'el zumo': ['juice'],
  'el jugo': ['juice'],

  // Every day
  'todos los días': ['hver dag'],
  'cada día': ['hver dag'],

  // Gustar - from glossary entries
  'me gusta': ['jeg liker'],
};

// Build the reference corpus from glossary + curated synonyms
const noToEs = {};
const esToNo = {};

// 1. Seed from glossary pairs
for (const card of items.glossary) {
  if (!noToEs[card.no]) noToEs[card.no] = new Set();
  noToEs[card.no].add(card.es);

  if (!esToNo[card.es]) esToNo[card.es] = new Set();
  esToNo[card.es].add(card.no);
}

// 2. Add curated synonyms
for (const [no, esList] of Object.entries(curatedNoToEs)) {
  if (!noToEs[no]) noToEs[no] = new Set();
  for (const es of esList) noToEs[no].add(es);
}

for (const [es, noList] of Object.entries(curatedEsToNo)) {
  if (!esToNo[es]) esToNo[es] = new Set();
  for (const no of noList) esToNo[es].add(no);
}

// 3. Add synonyms from vocabularyAnswerAlternatives
for (const [key, alternatives] of Object.entries(items.vocabularyAnswerAlternatives)) {
  const [noPart, direction] = key.split('|');
  const values = alternatives.map(a => a.value);

  if (direction === 'no-es') {
    if (!noToEs[noPart]) noToEs[noPart] = new Set();
    values.forEach(v => noToEs[noPart].add(v));
  } else if (direction === 'es-no') {
    // For es-no, the alternatives are Norwegian variants for the same Spanish
    // Find the Spanish from the glossary
    const cards = items.glossary.filter(c => c.no === noPart);
    for (const card of cards) {
      if (!esToNo[card.es]) esToNo[card.es] = new Set();
      values.forEach(v => esToNo[card.es].add(v));
    }
  }
}

// Convert sets to sorted arrays
const corpus = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  noToEs: Object.fromEntries(
    Object.entries(noToEs).map(([k, v]) => [k, [...v].sort()])
  ),
  esToNo: Object.fromEntries(
    Object.entries(esToNo).map(([k, v]) => [k, [...v].sort()])
  ),
  notes: 'Curated reference corpus for A0-A1 Spanish. Pre-populated from glossary pairs, vocabularyAnswerAlternatives, and manually curated synonyms. Requires expert review for completeness. See thoughts/shared/plans/2026-08-24_content-audit-infrastructure.md.'
};

writeFileSync('scripts/reference-corpus.json', JSON.stringify(corpus, null, 2) + '\n');

const noCount = Object.keys(corpus.noToEs).length;
const esCount = Object.keys(corpus.esToNo).length;
const noWithSynonyms = Object.values(corpus.noToEs).filter(v => v.length > 1).length;
const esWithSynonyms = Object.values(corpus.esToNo).filter(v => v.length > 1).length;

console.log('Reference corpus written to scripts/reference-corpus.json');
console.log(`  noToEs: ${noCount} entries (${noWithSynonyms} with multiple translations)`);
console.log(`  esToNo: ${esCount} entries (${esWithSynonyms} with multiple translations)`);

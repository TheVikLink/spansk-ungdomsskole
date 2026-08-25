import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { extractAllItems } from './lib/extract-all-items.mjs';

const html = readFileSync('index.html', 'utf8');
const items = extractAllItems(html);

mkdirSync('output', { recursive: true });
writeFileSync('output/audit-items.json', JSON.stringify(items, null, 2) + '\n');

const counts = {
  glossary: items.glossary.length,
  diagnosis: items.diagnosis.length,
  grammar: items.grammar.length,
  verbs: items.verbs.length,
  sentencePuzzles: items.sentencePuzzles.length,
  prepositions: items.prepositions.length,
  vocabularyAnswerAlternatives: Object.keys(items.vocabularyAnswerAlternatives).length,
  norwegianNounDefiniteForms: Object.keys(items.norwegianNounDefiniteForms).length
};

console.log('Extracted curriculum items to output/audit-items.json');
for (const [key, count] of Object.entries(counts)) {
  console.log(`  ${key}: ${count}`);
}

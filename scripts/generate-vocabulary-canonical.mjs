import { readFileSync, writeFileSync } from 'node:fs';
import { extractAllItems } from './lib/extract-all-items.mjs';

const html = readFileSync('index.html', 'utf8');
const { glossary, vocabularyAnswerAlternatives, norwegianNounDefiniteForms } = extractAllItems(html);
const entries = glossary.map((card, index) => {
  const noKey = `${card.no}|es-no`;
  const esKey = `${card.no}|no-es`;
  const values = key => (vocabularyAnswerAlternatives[key] || []).map(answer => answer.value);
  return {
    id: `vocab-${String(index + 1).padStart(4, '0')}`,
    norsk: card.no,
    spansk: card.es,
    kategori: card.category,
    svar: {
      'es-no': [...new Set([card.no, ...values(noKey), ...(norwegianNounDefiniteForms[card.no] || [])])],
      'no-es': [...new Set([card.es, ...values(esKey)])]
    }
  };
});
writeFileSync('data/vocabulary-canonical.json', `${JSON.stringify({ schemaVersion: 1, description: 'Canonical vocabulary source. Edit entries and regenerate index.html.', entries }, null, 2)}\n`);
console.log(`Wrote ${entries.length} canonical vocabulary entries.`);

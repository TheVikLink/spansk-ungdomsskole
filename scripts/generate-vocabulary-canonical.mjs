import { readFileSync, writeFileSync } from 'node:fs';
import { extractAllItems } from './lib/extract-all-items.mjs';

const html = readFileSync('index.html', 'utf8');
const { glossary, vocabularyAnswerAlternatives, norwegianNounDefiniteForms } = extractAllItems(html);
const small = ['null', 'én', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'åtte', 'ni', 'ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
const tens = ['', '', 'tjue', 'tretti', 'førti', 'femti', 'seksti', 'sytti', 'åtti', 'nitti'];
function norwegianNumber(value, nynorsk = false) {
  const n = Number(String(value).replace(/\s/gu, ''));
  if (!Number.isInteger(n) || n < 0 || n > 99999) return null;
  if (n < 20) return small[n].replace(/^én$/, nynorsk ? 'ein' : 'én').replace(/^syv$/, nynorsk ? 'sju' : 'syv');
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? (n % 10 === 1 ? (nynorsk ? 'ein' : 'én') : small[n % 10].replace(/^syv$/, nynorsk ? 'sju' : 'syv')) : '');
  if (n < 1000) return `${nynorsk && Math.floor(n / 100) === 1 ? 'eitt' : (nynorsk ? small[Math.floor(n / 100)].replace(/^én$/, 'ein') : 'ett')} hundre${n % 100 ? ` og ${norwegianNumber(n % 100, nynorsk)}` : ''}`;
  const thousands = Math.floor(n / 1000);
  return `${thousands === 1 ? (nynorsk ? 'eitt' : 'ett') : norwegianNumber(thousands, nynorsk)} tusen${n % 1000 ? ` ${norwegianNumber(n % 1000, nynorsk)}` : ''}`;
}
const entries = glossary.map((card, index) => {
  const noKey = `${card.no}|es-no`;
  const esKey = `${card.no}|no-es`;
  const values = key => (vocabularyAnswerAlternatives[key] || []).map(answer => answer.value);
  const numeric = card.category === 'tall' ? card.no.replace(/\s/gu, '') : '';
  const numberVariants = numeric && /^\d+$/u.test(numeric) ? [norwegianNumber(numeric), norwegianNumber(numeric, true)] : [];
  return {
    id: `vocab-${String(index + 1).padStart(4, '0')}`,
    norsk: card.no,
    spansk: card.es,
    kategori: card.category,
    svar: {
      'es-no': [...new Set([card.no, ...numberVariants, ...values(noKey), ...(norwegianNounDefiniteForms[card.no] || [])].filter(Boolean))],
      'no-es': [...new Set([card.es, ...values(esKey)])]
    }
  };
});
writeFileSync('data/vocabulary-canonical.json', `${JSON.stringify({ schemaVersion: 1, description: 'Canonical vocabulary source. Edit entries and regenerate index.html.', entries }, null, 2)}\n`);
console.log(`Wrote ${entries.length} canonical vocabulary entries.`);

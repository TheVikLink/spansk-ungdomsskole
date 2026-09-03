import { readFileSync, writeFileSync } from 'node:fs';
import { buildApprovedAlternatives, mergeApprovedAlternatives } from './lib/curriculum-audit.mjs';
import { extractAllItems } from './lib/extract-all-items.mjs';

const reportPath = process.argv[2] || 'output/curriculum-audit-report.json';
const apply = process.argv.includes('--apply');
const htmlPath = 'index.html';
const html = readFileSync(htmlPath, 'utf8');
const items = extractAllItems(html);
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const generated = buildApprovedAlternatives(items.glossary, report.candidates);
const manual = JSON.parse(readFileSync('data/godkjente-oversettelser.json', 'utf8'));
const manualAlternatives = {};
for (const entry of manual.filter(item => item.status === 'approved')) {
  const key = `${entry.norsk}|${entry.retning}`;
  const values = [entry.norsk, ...(entry.godkjente || [])];
  manualAlternatives[key] = values.map((value, index) => ({
    answerId: index === 0 ? 'primary' : `manual-${index}`,
    value,
    canonicalMeaningId: `manual:${entry.spansk}`
  }));
}
const merged = mergeApprovedAlternatives(
  mergeApprovedAlternatives(items.vocabularyAnswerAlternatives, generated),
  manualAlternatives
);
const source = `const vocabularyAnswerAlternatives = ${JSON.stringify(merged, null, 4)};`;
const start = html.indexOf('const vocabularyAnswerAlternatives = {');
if (start === -1) throw new Error('Could not find vocabularyAnswerAlternatives declaration');
let depth = 0;
let end = -1;
const objectStart = html.indexOf('{', start);
for (let i = objectStart; i < html.length; i++) {
  if (html[i] === '{') depth++;
  else if (html[i] === '}') {
    depth--;
    if (depth === 0) { end = i + 1; break; }
  }
}
if (end === -1 || html[end] !== ';') throw new Error('Could not find end of vocabularyAnswerAlternatives declaration');
if (apply) {
  writeFileSync(htmlPath, `${html.slice(0, start)}${source}${html.slice(end + 1)}`);
  console.log(`Applied ${Object.keys(generated).length} generated answer groups to ${htmlPath}`);
} else {
  console.log(`Dry run: ${Object.keys(generated).length} generated answer groups; rerun with --apply to update ${htmlPath}`);
}

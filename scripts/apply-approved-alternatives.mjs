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
const canonical = JSON.parse(readFileSync('data/vocabulary-canonical.json', 'utf8'));
const manualAlternatives = {};
for (const entry of canonical.entries) {
  for (const [direction, values] of Object.entries(entry.svar || {})) {
    const key = `${entry.norsk}|${direction}`;
    manualAlternatives[key] = values.map((value, index) => ({
      answerId: index === 0 ? 'primary' : `canonical-${index}`,
      value,
      canonicalMeaningId: `canonical:${entry.id}`
    }));
  }
}
const merged = mergeApprovedAlternatives(
  mergeApprovedAlternatives(items.vocabularyAnswerAlternatives, generated),
  manualAlternatives
);
const source = `const vocabularyAnswerAlternatives = ${JSON.stringify(merged, null, 4)};`;
const glossarySource = `const glossary = ${JSON.stringify(canonical.entries.map(entry => [entry.norsk, entry.spansk, entry.kategori]), null, 4)};`;
const glossaryStart = html.indexOf('const glossary = [');
if (glossaryStart === -1) throw new Error('Could not find glossary declaration');
const glossaryObjectStart = html.indexOf('[', glossaryStart);
let glossaryDepth = 0;
let glossaryEnd = -1;
for (let i = glossaryObjectStart; i < html.length; i++) {
  if (html[i] === '[') glossaryDepth++;
  else if (html[i] === ']') {
    glossaryDepth--;
    if (glossaryDepth === 0) { glossaryEnd = i + 1; break; }
  }
}
if (glossaryEnd === -1 || html[glossaryEnd] !== ';') throw new Error('Could not find end of glossary declaration');
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
  const withGlossary = `${html.slice(0, glossaryStart)}${glossarySource}${html.slice(glossaryEnd + 1)}`;
  const adjustedStart = withGlossary.indexOf('const vocabularyAnswerAlternatives = {');
  const adjustedObjectStart = withGlossary.indexOf('{', adjustedStart);
  let adjustedDepth = 0;
  let adjustedEnd = -1;
  for (let i = adjustedObjectStart; i < withGlossary.length; i++) {
    if (withGlossary[i] === '{') adjustedDepth++;
    else if (withGlossary[i] === '}') { adjustedDepth--; if (adjustedDepth === 0) { adjustedEnd = i; break; } }
  }
  writeFileSync(htmlPath, `${withGlossary.slice(0, adjustedStart)}${source}${withGlossary.slice(adjustedEnd + 2)}`);
  console.log(`Applied ${canonical.entries.length} canonical entries and ${Object.keys(generated).length} generated answer groups to ${htmlPath}`);
} else {
  console.log(`Dry run: ${Object.keys(generated).length} generated answer groups; rerun with --apply to update ${htmlPath}`);
}

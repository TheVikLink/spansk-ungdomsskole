import { readFileSync, writeFileSync } from 'node:fs';
import { extractAllItems } from './lib/extract-all-items.mjs';
import { buildApprovedAlternatives } from './lib/curriculum-audit.mjs';

const reportPath = process.argv[2] || 'output/curriculum-audit-report.json';
const outputPath = process.argv[3] || 'output/approved-vocabulary-alternatives.json';
const items = extractAllItems(readFileSync('index.html', 'utf8'));
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const alternatives = buildApprovedAlternatives(items.glossary, report.candidates);
writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, generatedFrom: report.inputHash, alternatives }, null, 2)}\n`);
console.log(`Approved alternatives written to ${outputPath}`);

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { extractDiagnosisCatalog } from './lib/extract-inline-catalog.mjs';
import { extractLearningCatalog } from './lib/extract-all-items.mjs';

const reviewPath = 'data/vocabulary-canonical-review.json';
const canonicalPath = 'data/vocabulary-canonical.json';
const htmlPath = 'index.html';
const json = value => JSON.stringify(value, null, 4).replaceAll('<', '\\u003c');

export function validateVocabularyReview(review) {
  if (review?.schemaVersion !== 1 || !Array.isArray(review.entries) || !review.entries.length) {
    throw new Error(`${reviewPath}: expected schemaVersion 1 and a non-empty entries array`);
  }
  const ids = new Set();
  const pairs = new Set();
  for (const entry of review.entries) {
    for (const field of ['id', 'norsk', 'spansk', 'kategori']) {
      if (typeof entry[field] !== 'string' || !entry[field].trim() || entry[field] !== entry[field].trim()) {
        throw new Error(`${reviewPath}: invalid ${field} in ${entry.id || 'entry'}`);
      }
    }
    if (ids.has(entry.id)) throw new Error(`${reviewPath}: duplicate id ${entry.id}`);
    ids.add(entry.id);
    const pair = JSON.stringify([entry.norsk, entry.spansk]);
    if (pairs.has(pair)) throw new Error(`${reviewPath}: duplicate word pair ${pair}`);
    pairs.add(pair);
    for (const direction of ['es-no', 'no-es']) {
      const answers = entry.svar?.[direction];
      if (!Array.isArray(answers) || !answers.length || answers.some(value => typeof value !== 'string' || !value.trim() || value !== value.trim())) {
        throw new Error(`${reviewPath}: invalid answers for ${entry.id} ${direction}`);
      }
    }
  }
  return review;
}

// Generated JSON only: quoted brackets/braces must not end a declaration.
function replaceLiteral(html, marker, value) {
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${marker}`);
  const begin = start + marker.length;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let i = begin; i < html.length; i++) {
    const char = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quoted) quoted = false;
    } else if (char === '"' || char === "'") quoted = char;
    else if (char === '[' || char === '{') depth++;
    else if (char === ']' || char === '}') {
      depth--;
      if (depth === 0) return html.slice(0, start) + marker + json(value) + html.slice(i + 1);
    }
  }
  throw new Error(`Unclosed ${marker}`);
}

const replaceDeclaration = (html, name, value) => replaceLiteral(html, `const ${name} = `, value);

function renderDiagnosisVocabulary(html, review) {
  const legacyIds = { 'core.hola': 'vocab-0064', 'core.gracias': 'vocab-0065', 'core.madre': 'vocab-0179', 'core.cinco': 'vocab-0005' };
  const entries = new Map(review.entries.map(entry => [entry.id, entry]));
  const catalog = extractLearningCatalog(html);
  const references = new Map();
  for (const word of catalog.words) {
    word.vocabularyId ??= legacyIds[word.id];
    const entry = entries.get(word.vocabularyId);
    if (!entry) throw new Error(`Level-test word ${word.id} refers to missing review entry ${word.vocabularyId}. Remove or replace that catalog reference before building.`);
    references.set(word.id, entry);
    if (!entry.svar['es-no'].includes(word.no)) word.no = entry.norsk;
    if (!entry.svar['no-es'].includes(word.es)) word.es = entry.spansk;
  }
  const questions = extractDiagnosisCatalog(html).map(question => {
    if (question.targetType !== 'word') return question;
    const entry = references.get(question.targetId);
    if (!entry) throw new Error(`Missing vocabulary reference for ${question.id}`);
    const direction = question.direction === 'noToEs' ? 'no-es' : 'es-no';
    const promptDirection = direction === 'no-es' ? 'es-no' : 'no-es';
    const prompt = entry.svar[promptDirection].includes(question.prompt)
      ? question.prompt : direction === 'no-es' ? entry.norsk : entry.spansk;
    const acceptedAnswers = entry.svar[direction].map((value, index) => ({
      answerId: index === 0 ? 'primary' : `canonical-${index}`,
      value,
      canonicalMeaningId: `canonical:${entry.id}`
    }));
    const changed = prompt !== question.prompt || JSON.stringify(acceptedAnswers) !== JSON.stringify(question.acceptedAnswers);
    return { ...question, vocabularyId: entry.id, prompt, acceptedAnswers, contentVersion: question.contentVersion + (changed ? 1 : 0) };
  });
  const open = '<script type="application/json" id="diagnosis-catalog-data">';
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf('</script>', start);
  const result = html.slice(0, start) + '\n' + JSON.stringify(questions, null, 2).replaceAll('<', '\\u003c') + '\n' + html.slice(end);
  const catalogStart = result.indexOf('const learningCatalog = ');
  const catalogSource = result.slice(catalogStart);
  const wordsMarker = catalogSource.match(/\n\s+(?:"words"|words):\s+/)?.[0];
  if (!wordsMarker) throw new Error('Missing learningCatalog.words');
  return result.slice(0, catalogStart) + replaceLiteral(catalogSource, wordsMarker, catalog.words);
}

export function renderVocabulary(html, review) {
  validateVocabularyReview(review);
  const alternatives = Object.create(null);
  for (const entry of review.entries) {
    for (const direction of ['es-no', 'no-es']) {
      const key = `${entry.norsk}|${direction}`;
      alternatives[key] ??= [];
      alternatives[key].push(...entry.svar[direction].map((value, index) => ({
        answerId: index === 0 ? 'primary' : `canonical-${index}`,
        value,
        canonicalMeaningId: `canonical:${entry.id}`
      })));
    }
  }
  let result = replaceDeclaration(html, 'glossary', review.entries.map(entry => [entry.norsk, entry.spansk, entry.kategori]));
  result = replaceDeclaration(result, 'vocabularyAnswerAlternatives', alternatives);
  const nounForms = Object.fromEntries(review.entries
    .filter(entry => /^(el|la)\s/iu.test(entry.spansk) && /^[^,()\s]+$/u.test(entry.norsk))
    .map(entry => [entry.norsk, entry.svar['es-no'].filter(value => value !== entry.norsk)])
    .filter(([, values]) => values.length));
  result = replaceDeclaration(result, 'norwegianNounDefiniteForms', nounForms);
  if (!result.includes('const vocabularyCanonicalIds = ')) {
    result = result.replace('const glossary = ', 'const vocabularyCanonicalIds = [];\n\n        const glossary = ');
  }
  result = replaceDeclaration(result, 'vocabularyCanonicalIds', review.entries.map(entry => entry.id));
  return renderDiagnosisVocabulary(result, review);
}

export function syncVocabulary({ check = false, dryRun = false } = {}) {
  const review = validateVocabularyReview(JSON.parse(readFileSync(reviewPath, 'utf8')));
  const html = readFileSync(htmlPath, 'utf8');
  // Prepare every output before writing either file.
  const output = renderVocabulary(html, review);
  const canonical = `${JSON.stringify({ schemaVersion: 1, description: `Generated from ${reviewPath}. Do not edit; run npm run build:app.`, entries: review.entries }, null, 2)}\n`;
  const readExisting = filename => {
    try { return readFileSync(filename, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  };
  const stale = [[htmlPath, html, output], [canonicalPath, readExisting(canonicalPath), canonical]].filter(([, current, expected]) => current !== expected);
  if (check && stale.length) throw new Error(`Vocabulary differs from ${reviewPath}: ${stale.map(([filename]) => filename).join(', ')}. Run npm run build:app.`);
  if (!check && !dryRun) for (const [filename, , expected] of stale) writeFileSync(filename, expected);
  console.log(`${check ? 'Verified' : dryRun ? 'Dry run:' : 'Synchronized'} ${review.entries.length} vocabulary entries from ${reviewPath}${dryRun ? `; ${stale.length} files need updating` : ''}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  syncVocabulary({ check: process.argv.includes('--check'), dryRun: process.argv.includes('--dry-run') });
}

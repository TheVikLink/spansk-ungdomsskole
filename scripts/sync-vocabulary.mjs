import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { extractDiagnosisCatalog } from './lib/extract-inline-catalog.mjs';
import { extractLearningCatalog } from './lib/extract-all-items.mjs';

const reviewPath = 'data/vocabulary-canonical-review.json';
const canonicalPath = 'data/vocabulary-canonical.json';
const htmlPath = 'index.html';
const recognitionPath = 'data/vocabulary-recognition-theme.json';
const json = value => JSON.stringify(value, null, 4).replaceAll('<', '\\u003c');

export function validateRecognitionLearning(theme, review) {
  const fail = message => { throw new Error(`${recognitionPath}: ${message}`); };
  const entries = new Map(review.entries.map(entry => [entry.id, entry]));
  const starters = new Set(theme.starterIds);
  const ids = new Set();
  if (!Array.isArray(theme.sentences) || !theme.sentences.length) fail('Missing sentence activities');
  for (const item of theme.sentences) {
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) fail('Invalid or duplicate sentence ID');
    ids.add(item.id);
    for (const field of ['promptNb', 'explanationNb']) {
      if (typeof item[field] !== 'string' || !item[field].trim()) fail(`Missing ${field} for ${item.id}`);
    }
    if (!['tiles', 'typed'].includes(item.mode)) fail(`Invalid sentence mode ${item.id}`);
    if (!Array.isArray(item.wordIds) || item.wordIds.length < 2 || new Set(item.wordIds).size !== item.wordIds.length
        || item.wordIds.some(id => !starters.has(id) || !entries.has(id))) fail(`Sentence must refer to starter words: ${item.id}`);
    const allowed = new Set(['es', 'no', 'un', 'una']);
    for (const id of item.wordIds) for (const word of entries.get(id).spansk.toLowerCase().split(/\s+/)) allowed.add(word);
    if (!Array.isArray(item.tokens) || item.tokens.length < 4
        || item.tokens.some(word => typeof word !== 'string' || !allowed.has(word.toLowerCase()))) fail(`Unknown sentence token ${item.id}`);
    const words = item.tokens.map(word => word.toLowerCase());
    if (words.filter(word => word === 'es').length !== 1 || words.filter(word => word === 'no').length > 1
        || (words.includes('no') && words.indexOf('no') !== words.indexOf('es') - 1)) fail(`Invalid es/no es order ${item.id}`);
    const subject = entries.get(item.wordIds[0]).spansk.toLowerCase().split(/\s+/);
    if (!['el', 'la'].includes(subject[0]) || subject.some((word, i) => words[i] !== word)) fail(`Subject/article mismatch ${item.id}`);
    for (const id of item.wordIds) {
      const stem = entries.get(id).spansk.toLowerCase().replace(/^(el|la)\s+/, '');
      if (!words.join(' ').includes(stem)) fail(`Unused sentence word ${id}`);
    }
    for (let i = 0; i < words.length; i++) if (['un', 'una'].includes(words[i])) {
      const noun = item.wordIds.map(id => entries.get(id)).find(entry => entry.spansk.toLowerCase().slice(3) === words[i + 1]);
      if (!noun || words[i] !== (noun.spansk.startsWith('el ') ? 'un' : 'una')) fail(`Indefinite article mismatch ${item.id}`);
    }
  }
  if (!Array.isArray(theme.families) || !theme.families.length) fail('Missing word families');
  const members = new Map(theme.members.map(member => [member.vocabularyId, member]));
  const familyIds = new Set();
  for (const family of theme.families) {
    if (typeof family.id !== 'string' || !family.id || familyIds.has(family.id)) fail('Invalid or duplicate family ID');
    familyIds.add(family.id);
    for (const field of ['title', 'introNb', 'cautionNb']) {
      if (typeof family[field] !== 'string' || !family[field].trim()) fail(`Missing family ${field}`);
    }
    if (!members.has(family.probeId) || !entries.has(family.probeId)) fail(`Unknown family probe ${family.probeId}`);
    if (!Array.isArray(family.examples) || family.examples.length < 2) fail('Missing family examples');
    const exampleIds = new Set();
    for (const example of family.examples) {
      const member = members.get(example.vocabularyId);
      if (!member || !entries.has(example.vocabularyId) || example.vocabularyId === family.probeId
          || exampleIds.has(example.vocabularyId)) fail('Unknown, duplicate or revealed family probe');
      exampleIds.add(example.vocabularyId);
      if (!['nb', 'en'].includes(example.language)
          || !member[example.language === 'nb' ? 'bridgeNb' : 'bridgeEn']) fail('Missing labelled language bridge');
    }
  }
  return theme;
}

export function validateRecognitionTheme(theme, review) {
  const fail = message => { throw new Error(`${recognitionPath}: ${message}`); };
  if (theme?.schemaVersion !== 1 || theme.id !== 'wordkeys-recognizable'
      || !Array.isArray(theme.members) || !theme.members.length
      || !Array.isArray(theme.starterIds) || theme.starterIds.length < 10) fail('Invalid theme or starter selection');
  for (const field of ['title', 'descriptionNb', 'sourceNote', 'reviewNote']) {
    if (typeof theme[field] !== 'string' || !theme[field].trim()) fail(`Missing ${field}`);
  }
  const canonicalIds = new Set(review.entries.map(entry => entry.id));
  const members = new Set();
  for (const member of theme.members) {
    if (!canonicalIds.has(member.vocabularyId) || members.has(member.vocabularyId)) fail(`Unknown or duplicate member ${member.vocabularyId}`);
    members.add(member.vocabularyId);
    for (const field of ['bridgeNb', 'bridgeEn', 'noteNb']) {
      if (typeof member[field] !== 'string' || member[field] !== member[field].trim()) fail(`Invalid ${field} for ${member.vocabularyId}`);
    }
    if (!(member.bridgeNb || member.bridgeEn) || member.reviewStatus !== 'agent-reviewed') fail(`Missing reviewed bridge for ${member.vocabularyId}`);
  }
  const starters = new Set();
  for (const id of theme.starterIds) {
    if (!members.has(id) || starters.has(id)) fail(`Unknown or duplicate starter ${id}`);
    starters.add(id);
  }
  return validateRecognitionLearning(theme, review);
}

export function renderRecognitionTheme(html, theme, review) {
  validateRecognitionTheme(theme, review);
  const open = '<script type="application/json" id="recognition-theme-data">';
  const block = `${open}\n${json(theme)}\n    </script>`;
  const start = html.indexOf(open);
  if (start < 0) return html.replace('<script type="application/json" id="grammar-lessons-data">', `${block}\n    <script type="application/json" id="grammar-lessons-data">`);
  const end = html.indexOf('</script>', start);
  if (end < 0) throw new Error('Unclosed recognition-theme-data');
  return html.slice(0, start) + block + html.slice(end + '</script>'.length);
}

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
  const theme = JSON.parse(readFileSync(recognitionPath, 'utf8'));
  const output = renderRecognitionTheme(renderVocabulary(html, review), theme, review);
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

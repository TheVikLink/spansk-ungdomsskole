import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const htmlPath = 'index.html';
const checkOnly = process.argv.includes('--check');

function extractConstLiteral(html, marker, openChar, closeChar) {
  const decl = html.indexOf(marker);
  if (decl < 0) throw new Error(`${marker} not found in ${htmlPath}`);
  const start = html.indexOf(openChar, html.indexOf('=', decl));
  let depth = 0;
  let quote = '';
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = start; i < html.length; i += 1) {
    const ch = html[i];
    const next = html[i + 1];
    if (inLineComment) { if (ch === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (ch === '*' && next === '/') { inBlockComment = false; i += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '/' && next === '/') { inLineComment = true; i += 1; continue; }
    if (ch === '/' && next === '*') { inBlockComment = true; i += 1; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === openChar) depth += 1;
    else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) {
        const ctx = vm.createContext(Object.create(null));
        return new vm.Script(`(${html.slice(start, i + 1)})`).runInContext(ctx, { timeout: 500 });
      }
    }
  }
  throw new Error(`${marker} literal not balanced in ${htmlPath}`);
}

export function verifyCatalogsSync(html = readFileSync(htmlPath, 'utf8')) {
  const diagFile = JSON.parse(readFileSync('src/data/diagnosis-catalog.json', 'utf8'));
  const gramLessonsFile = JSON.parse(readFileSync('src/data/grammar-lessons.json', 'utf8'));
  const listeningFile = JSON.parse(readFileSync('src/data/listening-stories.json', 'utf8'));
  const dictationFile = JSON.parse(readFileSync('src/data/dictation-stories.json', 'utf8'));
  const learningFile = JSON.parse(readFileSync('src/data/learning-catalog.json', 'utf8'));
  const verbsFile = JSON.parse(readFileSync('src/data/verbs.json', 'utf8'));

  const diagMatch = html.match(/<script type="application\/json" id="diagnosis-catalog-data">\s*([\s\S]*?)\s*<\/script>/);
  const gramMatch = html.match(/<script type="application\/json" id="grammar-lessons-data">\s*([\s\S]*?)\s*<\/script>/);
  if (!diagMatch || !gramMatch) throw new Error('Inline JSON script blocks missing from index.html');

  const inlineDiag = JSON.parse(diagMatch[1]);
  const inlineGram = JSON.parse(gramMatch[1]);
  const inlineListening = extractConstLiteral(html, 'const LISTENING_STORIES =', '[', ']');
  const inlineDictStories = extractConstLiteral(html, 'const DICTATION_STORIES =', '[', ']');
  const inlineDictTrans = extractConstLiteral(html, 'const DICTATION_TRANSLATIONS =', '{', '}');
  const inlineLearning = extractConstLiteral(html, 'const learningCatalog =', '{', '}');
  const inlineVerbs = extractConstLiteral(html, 'const verbDatabase =', '{', '}');

  const diffs = [];
  if (JSON.stringify(diagFile) !== JSON.stringify(inlineDiag)) diffs.push('src/data/diagnosis-catalog.json');
  if (JSON.stringify(gramLessonsFile) !== JSON.stringify(inlineGram)) diffs.push('src/data/grammar-lessons.json');
  if (JSON.stringify(listeningFile.stories) !== JSON.stringify(inlineListening)) diffs.push('src/data/listening-stories.json');
  if (JSON.stringify(dictationFile.stories) !== JSON.stringify(inlineDictStories) || JSON.stringify(dictationFile.translations) !== JSON.stringify(inlineDictTrans)) {
    diffs.push('src/data/dictation-stories.json');
  }
  if (JSON.stringify(learningFile) !== JSON.stringify(inlineLearning)) diffs.push('src/data/learning-catalog.json');
  if (JSON.stringify(verbsFile.verbs) !== JSON.stringify(inlineVerbs)) diffs.push('src/data/verbs.json');

  return {
    inSync: diffs.length === 0,
    diffs,
    counts: {
      diagnosisQuestions: diagFile.length,
      grammarLessons: gramLessonsFile.lessons.length,
      listeningStories: listeningFile.stories.length,
      dictationStories: dictationFile.stories.length,
      learningSkills: learningFile.skills.length,
      verbs: Object.keys(verbsFile.verbs).length,
    },
  };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const html = readFileSync(htmlPath, 'utf8');
  const status = verifyCatalogsSync(html);
  if (!status.inSync) {
    if (checkOnly) {
      throw new Error(`Extracted catalogs out of sync with index.html: ${status.diffs.join(', ')}. Run npm run sync:catalogs.`);
    }
    // Re-sync src/data/*.json from index.html when inline blocks were updated by sync:vocabulary or curriculum updates
    const diagMatch = html.match(/<script type="application\/json" id="diagnosis-catalog-data">\s*([\s\S]*?)\s*<\/script>/);
    const gramMatch = html.match(/<script type="application\/json" id="grammar-lessons-data">\s*([\s\S]*?)\s*<\/script>/);
    writeFileSync('src/data/diagnosis-catalog.json', `${JSON.stringify(JSON.parse(diagMatch[1]), null, 2)}\n`);
    writeFileSync('src/data/grammar-lessons.json', `${JSON.stringify(JSON.parse(gramMatch[1]), null, 2)}\n`);
    writeFileSync('src/data/listening-stories.json', `${JSON.stringify({ version: 1, stories: extractConstLiteral(html, 'const LISTENING_STORIES =', '[', ']') }, null, 2)}\n`);
    writeFileSync('src/data/dictation-stories.json', `${JSON.stringify({ version: 1, stories: extractConstLiteral(html, 'const DICTATION_STORIES =', '[', ']'), translations: extractConstLiteral(html, 'const DICTATION_TRANSLATIONS =', '{', '}') }, null, 2)}\n`);
    writeFileSync('src/data/learning-catalog.json', `${JSON.stringify(extractConstLiteral(html, 'const learningCatalog =', '{', '}'), null, 2)}\n`);
    writeFileSync('src/data/verbs.json', `${JSON.stringify({ version: 1, verbs: extractConstLiteral(html, 'const verbDatabase =', '{', '}') }, null, 2)}\n`);
    console.log(`Synchronized extracted catalogs in src/data/: ${status.diffs.join(', ')}`);
  } else {
    console.log(`Catalogs in sync (${status.counts.learningSkills} skills, ${status.counts.verbs} verbs, ${status.counts.listeningStories} listening, ${status.counts.dictationStories} dictation).`);
  }
}

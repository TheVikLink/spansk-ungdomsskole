import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Script, createContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { extractAllItems } from './lib/extract-all-items.mjs';
import review from '../data/vocabulary-canonical-review.json' with { type: 'json' };

const html = await readFile('index.html', 'utf8');
const extracted = extractAllItems(html);
const declaration = html.indexOf('const LISTENING_STORIES =');
if (declaration < 0) throw new Error('LISTENING_STORIES was not found');
const start = html.indexOf('[', html.indexOf('=', declaration));
let depth = 0, quote = '', escaped = false, end = -1;
for (let i = start; i < html.length; i += 1) {
  const char = html[i];
  if (quote) {
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) quote = '';
    continue;
  }
  if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
  if (char === '[') depth += 1;
  if (char === ']') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
}
if (end < 0) throw new Error('LISTENING_STORIES literal was not balanced');
const context = createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
const stories = new Script(`(${html.slice(start, end)})`).runInContext(context, { timeout: 100 });
const listening = stories.find((story) => story.id === 'leo-sevilla');
if (!listening?.fullAudio || !Array.isArray(listening.questions)) throw new Error('Approved local Leo listening exercise was not found');
const audioBytes = await readFile(new URL(`../audio/lyttehistorier/${listening.fullAudio}`, import.meta.url));
const audioDigest = createHash('sha256').update(audioBytes).digest('hex');
const audioFilename = `${audioDigest}.wav`;
const mediaDirectory = new URL('../server/content-media/', import.meta.url);
await mkdir(mediaDirectory, { recursive: true });
try {
  const existing = await readFile(new URL(audioFilename, mediaDirectory));
  if (createHash('sha256').update(existing).digest('hex') !== audioDigest) throw new Error(`Immutable school audio asset ${audioFilename} has unexpected content`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  await writeFile(new URL(audioFilename, mediaDirectory), audioBytes, { flag: 'wx' });
}
const stableVocabularyIds = new Map(review.entries.map((item) => [`${item.norsk}\0${item.spansk}`, item.id]));
const vocabulary = extracted.glossary.map((item) => ({ ...item, id: stableVocabularyIds.get(`${item.no}\0${item.es}`) }));
if (vocabulary.some((item) => !item.id)) throw new Error('A live glossary item is missing its stable canonical review id');
const catalog = {
  vocabulary,
  grammar: extracted.grammar.map((item, index) => ({ ...item, id: `grammar:${item.topicId}:${index + 1}` })),
  verbs: extracted.verbs.map((item) => ({ ...item, id: `verb:${item.key}:present` })),
  listening: {
    id: listening.id, title: listening.title, level: listening.level, audio: `/audio/school-content/${audioFilename}`,
    questions: listening.questions,
  },
};
await writeFile('server/content-catalog.json', `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Built local school exercise catalog: ${catalog.vocabulary.length} words, ${catalog.grammar.length} grammar items, ${catalog.verbs.length} verbs, ${listening.questions.length} listening questions`);

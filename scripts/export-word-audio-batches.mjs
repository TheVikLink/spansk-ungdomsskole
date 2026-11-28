import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_OUT_DIR = 'output/word-audio-batches';
const DEFAULT_LIMIT = 100;
const DEFAULT_BATCH_SIZE = 50;

// Prioriterte oppstartsid-er fra hjem-anbefalingene og gjenkjennelige velkomstord.
const MADRIGAL_WELCOME_IDS = ['vocab-0525', 'vocab-0523', 'vocab-0561'];
const HOME_STARTER_IDS = [
  'vocab-0064', 'vocab-0065', 'vocab-0066', 'vocab-0412', 'vocab-0417',
  'vocab-0421', 'vocab-0434', 'vocab-0435', 'vocab-0436', 'vocab-0437',
  'vocab-0307', 'vocab-0438', 'vocab-0439', 'vocab-0440',
  'vocab-0068', 'vocab-0069', 'vocab-0418', 'vocab-0419', 'vocab-0422', 'vocab-0425',
];
const PRIORITY_CATEGORIES = [
  'hilsener',
  'tall',
  'familie',
  'skole',
  'Mat og drikke',
  'verb',
  'bindeord',
  'hjem',
  'farger',
  'rutiner',
  'klokka',
  'ord og uttrykk',
];

export function normalizeAudioLookup(value) {
  return String(value || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/^(?:el|la|los|las|un|una)\s+/i, '')
    .replace(/[¡!¿?.,()]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanSpanishForTts(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatTtsPromptLine(spanish) {
  const cleaned = cleanSpanishForTts(spanish);
  if (!cleaned) return '';
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

export function slugifyWord(value) {
  return cleanSpanishForTts(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'ord';
}

export function selectCoreWords({
  vocabEntries,
  approvedEntries = [],
  recognitionStarterIds = [],
  limit = DEFAULT_LIMIT,
  includeExisting = false,
}) {
  const byId = new Map(vocabEntries.map(entry => [entry.id, entry]));
  const existingKeys = new Set(
    includeExisting
      ? []
      : approvedEntries.map(entry => normalizeAudioLookup(entry.word || entry.normalized)),
  );
  const seenKeys = new Set();
  const seenSlugs = new Set();
  const selected = [];

  const tryAdd = (entry, prioritySource) => {
    if (!entry || selected.length >= limit) return;
    const cleaned = cleanSpanishForTts(entry.spansk);
    if (!cleaned || /[/,]/.test(cleaned)) return;
    const lookupKey = normalizeAudioLookup(cleaned);
    if (!lookupKey || existingKeys.has(lookupKey) || seenKeys.has(lookupKey)) return;

    let slug = slugifyWord(cleaned);
    if (seenSlugs.has(slug)) slug = `${slug}-${entry.id}`;
    seenKeys.add(lookupKey);
    seenSlugs.add(slug);

    selected.push({
      vocabId: entry.id,
      spansk: cleaned,
      ttsText: formatTtsPromptLine(cleaned),
      norsk: entry.norsk,
      kategori: entry.kategori,
      prioritySource,
      slug,
      targetPath: `audio/ord/${slug}.mp3`,
    });
  };

  for (const id of MADRIGAL_WELCOME_IDS) tryAdd(byId.get(id), 'madrigal-welcome');
  for (const id of HOME_STARTER_IDS) tryAdd(byId.get(id), 'home-starter');
  for (const category of PRIORITY_CATEGORIES) {
    for (const entry of vocabEntries) {
      if (entry.kategori === category) tryAdd(entry, `category:${category}`);
    }
  }
  for (const id of recognitionStarterIds) tryAdd(byId.get(id), 'recognition-starter');
  for (const entry of vocabEntries) tryAdd(entry, 'remaining-vocab');

  return selected;
}

export function exportWordAudioBatches({
  outDir = DEFAULT_OUT_DIR,
  limit = DEFAULT_LIMIT,
  batchSize = DEFAULT_BATCH_SIZE,
  startBatch = 1,
  prefix = 'kjerneord',
  includeExisting = false,
  vocabPath = 'data/vocabulary-canonical-review.json',
  approvedPath = 'data/approved-word-audio.json',
  recognitionPath = 'data/vocabulary-recognition-theme.json',
} = {}) {
  const vocabJson = JSON.parse(readFileSync(vocabPath, 'utf8'));
  const vocabEntries = Array.isArray(vocabJson) ? vocabJson : (vocabJson.entries || []);
  const approvedJson = JSON.parse(readFileSync(approvedPath, 'utf8'));
  const recognitionJson = JSON.parse(readFileSync(recognitionPath, 'utf8'));

  const selected = selectCoreWords({
    vocabEntries,
    approvedEntries: approvedJson.entries || [],
    recognitionStarterIds: recognitionJson.starterIds || [],
    limit,
    includeExisting,
  });

  mkdirSync(outDir, { recursive: true });
  const batches = [];

  for (let offset = 0; offset < selected.length; offset += batchSize) {
    const batchNumber = startBatch + Math.floor(offset / batchSize);
    const batchId = `bolk-${String(batchNumber).padStart(2, '0')}-${prefix}`;
    const fileName = `${batchId}.txt`;
    const slice = selected.slice(offset, offset + batchSize).map((item, idx) => ({
      index: idx + 1,
      ...item,
    }));

    // To linjeskift og avsluttende punktum gir tydelig setningspause uten oppleste tegn.
    const textContent = `${slice.map(item => item.ttsText).join('\n\n')}\n`;
    writeFileSync(join(outDir, fileName), textContent, 'utf8');
    batches.push({
      batchId,
      fileName,
      wordCount: slice.length,
      items: slice,
    });
  }

  const manifest = {
    schemaVersion: 1,
    accent: 'es-ES',
    generatedAt: new Date().toISOString(),
    totalWords: selected.length,
    batchSize,
    batches,
  };
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const readme = [
    '# Luvvoice-eksport for kjerneord (es-ES)',
    '',
    '1. Åpne Luvvoice og velg en standard spansk stemme (Spania, es-ES).',
    '2. Kopier alt innholdet fra én bolk-fil av gangen og lim inn i tekstfeltet:',
    ...batches.map(b => `   - \`${b.fileName}\` (${b.wordCount} ord)`),
    '3. Last ned MP3-filen for hver bolk (f.eks. til `~/Downloads/bolk-01.mp3`).',
    '4. Kjør splitt-skriptet for å klippe automatisk til enkeltord og synkronisere appen:',
    '',
    '```bash',
    ...batches.map(b => `node scripts/split-word-audio-batch.mjs --input ~/Downloads/${b.batchId}.mp3 --batch ${b.batchId}`),
    '```',
    '',
  ].join('\n');
  writeFileSync(join(outDir, 'LESMEG.md'), readme, 'utf8');

  return { outDir, manifest, batches };
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--include-existing') opts.includeExisting = true;
    else if (arg.startsWith('--limit=')) opts.limit = Number(arg.split('=')[1]);
    else if (arg === '--limit' && argv[i + 1]) { opts.limit = Number(argv[++i]); }
    else if (arg.startsWith('--batch-size=')) opts.batchSize = Number(arg.split('=')[1]);
    else if (arg === '--batch-size' && argv[i + 1]) { opts.batchSize = Number(argv[++i]); }
    else if (arg.startsWith('--start-batch=')) opts.startBatch = Number(arg.split('=')[1]);
    else if (arg === '--start-batch' && argv[i + 1]) { opts.startBatch = Number(argv[++i]); }
    else if (arg.startsWith('--prefix=')) opts.prefix = arg.split('=')[1];
    else if (arg === '--prefix' && argv[i + 1]) { opts.prefix = argv[++i]; }
    else if (arg.startsWith('--out=')) opts.outDir = arg.split('=')[1];
    else if (arg === '--out' && argv[i + 1]) { opts.outDir = argv[++i]; }
  }
  return opts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { batches, manifest, outDir } = exportWordAudioBatches(parseArgs(process.argv.slice(2)));
  console.log(`Eksporterte ${manifest.totalWords} kjerneord til ${batches.length} bolker i ${outDir}/:`);
  for (const b of batches) console.log(`  - ${b.fileName} (${b.wordCount} ord)`);
}

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const START_MARKER = '/* GENERATED APPROVED WORD AUDIO START */';
const END_MARKER = '/* GENERATED APPROVED WORD AUDIO END */';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

export function validateWordAudio(approvedJson, { baseDir = '.' } = {}) {
  assert(approvedJson?.schemaVersion === 1, 'Ugyldig schemaVersion i approved-word-audio.json');
  assert(Array.isArray(approvedJson.entries), 'approved-word-audio.json mangler entries-liste');

  const seenPaths = new Set();
  const overrides = {};

  for (const entry of approvedJson.entries) {
    assert(typeof entry?.word === 'string' && entry.word.trim(), 'Oppføring mangler word');
    assert(typeof entry?.normalized === 'string' && entry.normalized.trim(), `Oppføring mangler normalized: ${entry.word}`);
    assert(typeof entry?.path === 'string' && /^audio\/.+\.mp3$/.test(entry.path), `Ugyldig lydsti: ${entry?.path}`);
    assert(typeof entry?.source === 'string' && entry.source.trim(), `Oppføring mangler source: ${entry.path}`);
    assert(!seenPaths.has(entry.path), `Duplikat lydsti i approved-word-audio.json: ${entry.path}`);
    seenPaths.add(entry.path);

    const diskPath = baseDir === '.' ? entry.path : join(baseDir, entry.path);
    assert(existsSync(diskPath), `Registrert lydfil mangler på disk: ${diskPath}`);

    if (entry.source !== 'refold-v1') {
      overrides[entry.word] = {
        word: entry.word,
        path: entry.path,
        source: entry.source,
      };
    }
  }

  return overrides;
}

export function syncWordAudio({
  check = false,
  approvedPath = 'data/approved-word-audio.json',
  htmlPath = 'index.html',
  baseDir = '.',
} = {}) {
  const approvedJson = JSON.parse(readFileSync(approvedPath, 'utf8'));
  const overrides = validateWordAudio(approvedJson, { baseDir });
  const serialized = JSON.stringify(overrides).replaceAll('<', '\\u003c');
  const replacement = `${START_MARKER}${serialized}${END_MARKER}`;

  const html = readFileSync(htmlPath, 'utf8');
  const pattern = /\/\* GENERATED APPROVED WORD AUDIO START \*\/[\s\S]*?\/\* GENERATED APPROVED WORD AUDIO END \*\//;
  assert(pattern.test(html), `Mangler ${START_MARKER} ... ${END_MARKER} i ${htmlPath}`);

  const next = html.replace(pattern, () => replacement);
  if (check) {
    assert(next === html, 'APPROVED_WORD_AUDIO_OVERRIDES er ikke synkronisert. Kjør npm run sync:word-audio.');
  } else if (next !== html) {
    writeFileSync(htmlPath, next, 'utf8');
  }

  return {
    totalApproved: approvedJson.entries.length,
    overrideCount: Object.keys(overrides).length,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes('--check');
  const { totalApproved, overrideCount } = syncWordAudio({ check });
  console.log(`Enkeltord-lyd: ${totalApproved} godkjente opptak (${overrideCount} Luvvoice/tillegg) synkronisert.`);
}

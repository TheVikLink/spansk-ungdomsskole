import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
export function validatePronunciation(catalog, manifest, read = path => readFileSync(path)) {
  assert(catalog.schemaVersion === 1 && catalog.catalogVersion === 1, 'Ugyldig katalogversjon');
  assert(catalog.items?.length === 31 && manifest.files?.length === 62, 'Forventet 31 temaer og 62 lydfiler');
  const paths = new Set();
  for (const file of manifest.files) {
    assert(/^audio\/uttale\/refold-v1\/ESPhoneticWritingSystem_([1-9]|[12]\d|3[01])_(word|sentence)\.mp3$/.test(file.path), 'Ugyldig lydsti');
    assert(!paths.has(file.path), 'Duplikat lydfil'); paths.add(file.path);
    const bytes = read(file.path);
    assert(bytes.length === file.bytes && hash(bytes) === file.sha256, `Lydhash/størrelse avviker: ${file.path}`);
    assert(file.seconds > 0, 'Ugyldig varighet');
  }
  const ids = new Set();
  for (const item of catalog.items) {
    assert(item.id === `refold-es-${String(item.sourceIndex).padStart(2, '0')}` && !ids.has(item.id), 'Ugyldig kort-ID'); ids.add(item.id);
    for (const key of ['title', 'word', 'wordNo', 'sentence', 'sentenceNo', 'explanation', 'reflection']) {
      assert(typeof item[key] === 'string' && item[key].trim() && !/[<>]/.test(item[key]), `Ugyldig tekst: ${item.id}/${key}`);
    }
    assert(!Object.hasOwn(item, 'ipa') && Object.keys(item.audio).sort().join(',') === 'sentence,word', 'Kun ord- og setningsmodeller, uten lydskrift');
    for (const role of ['word', 'sentence']) {
      assert(item.audio[role] === `audio/uttale/refold-v1/ESPhoneticWritingSystem_${item.sourceIndex}_${role}.mp3` && paths.has(item.audio[role]), 'Feil lydrolle');
    }
    for (const role of ['word', 'sentence']) {
      let previousEnd = 0;
      assert(Array.isArray(item.focus?.[role]) && item.focus[role].length > 0, 'Mangler bokstavmarkering');
      for (const range of item.focus[role]) {
        assert(Array.isArray(range) && range.length === 2 && range.every(Number.isInteger) && range[0] >= previousEnd && range[1] > range[0] && range[1] <= item[role].length, 'Ugyldig bokstavmarkering');
        previousEnd = range[1];
      }
    }
    assert(!Object.hasOwn(item, 'question'), 'Uttaleskolen skal ikke inneholde flervalgstrinn');
  }
  const groupIds = catalog.groups.flatMap(g => g.itemIds);
  assert(groupIds.length === 31 && new Set(groupIds).size === 31 && groupIds.every(id => ids.has(id)), 'Ufullstendig temadekning');
  assert(new Set(catalog.groups.map(g => g.id)).size === catalog.groups.length && catalog.groups.every(g => /^[a-z-]+$/.test(g.id)), 'Ugyldig tema-ID');
  return true;
}

export function syncPronunciation({ check = false } = {}) {
  const catalog = JSON.parse(readFileSync('data/pronunciation-refold.json'));
  const manifest = JSON.parse(readFileSync('data/pronunciation-audio-manifest.json'));
  validatePronunciation(catalog, manifest);
  const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
  const sources = ['src/pronunciation-core.js', 'src/pronunciation-recording.js', 'src/pronunciation-offline.js', 'src/pronunciation-ui.js'].map(path => readFileSync(path, 'utf8')).join('\n');
  const block = `// BEGIN GENERATED PRONUNCIATION\nconst pronunciationCatalog = ${json(catalog)};\nconst pronunciationManifest = ${json(manifest)};\n${sources}\n// END GENERATED PRONUNCIATION`;
  const html = readFileSync('index.html', 'utf8');
  const next = html.includes('// BEGIN GENERATED PRONUNCIATION')
    ? html.replace(/\/\/ BEGIN GENERATED PRONUNCIATION[\s\S]*?\/\/ END GENERATED PRONUNCIATION/, () => block)
    : html.replace(/<script>/, () => `<script>\n${block}\n`);
  assert(next !== html || html.includes(block), 'Fant ikke appens skriptblokk');
  if (check) assert(next === html, 'Kjør npm run sync:pronunciation');
  else writeFileSync('index.html', next);
  console.log('Uttale: 31 temaer, 62 kontrollerte lydfiler og synkronisert app.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) syncPronunciation({ check: process.argv.includes('--check') });

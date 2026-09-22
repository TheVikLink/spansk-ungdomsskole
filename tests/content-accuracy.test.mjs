import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { findMissingEnye } from '../scripts/lib/check-missing-enye.mjs';

const html = readFileSync('index.html', 'utf8');
const script = path.resolve('scripts/check-content-accuracy.mjs');

function auditWithExtraCards(cards) {
  const directory = mkdtempSync(path.join(tmpdir(), 'spansk-content-test-'));
  try {
    const marker = 'const glossary = [';
    assert.ok(html.includes(marker));
    const additions = cards.map(([no, es]) => JSON.stringify([no, es, 'audit-fixture'])).join(',');
    writeFileSync(path.join(directory, 'index.html'), html.replace(marker, `${marker}\n${additions},`));
    const result = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('the real audit rejects missing ñ in a known Norwegian meaning context', () => {
  const result = auditWithExtraCards([['et lite barn', 'el nino'], ['spansk språk', 'espanol']]);
  assert.equal(result.status, 1);
  assert.match(result.output, /\[accent-form-present\].*el nino/);
  assert.match(result.output, /\[accent-form-present\].*espanol/);
});

test('known ñ forms are accepted, including punctuation, uppercase and decomposed Unicode', () => {
  const cards = [
    ['et lite barn', '¡EL NIÑO!'], ['spansk språk', 'español'],
    ['femten år', 'quince años'], ['i morgen', 'mañana'], ['jeg er trøtt', 'tengo sueño']
  ].map(([no, es]) => ({ no, es: es.normalize('NFD') }));
  assert.deepEqual(findMissingEnye(cards), []);
});

test('context distinguishes genuine n words and names from missing ñ', () => {
  assert.deepEqual(findMissingEnye([
    { no: 'anus', es: 'el ano' }, { no: 'grått hår', es: 'una cana' },
    { no: 'jeg lyder', es: 'sueno' }, { no: 'hånd', es: 'la mano' },
    { no: 'personnavnet Nino', es: 'Nino' }, { no: 'krusedull', es: 'garabato' }
  ]), []);
  assert.deepEqual(findMissingEnye([
    { no: 'et år', es: 'un ano' }, { no: 'sukkerrør', es: 'cana' }, { no: 'søvn', es: 'sueno' }
  ]).map(error => error.expected), ['año', 'caña', 'sueño']);
});

test('all documented meaning families catch targeted mutations, not general n replacement', () => {
  const cases = [
    ['år', 'años'], ['morgen', 'mañana'], ['barn', 'niños'], ['jente', 'niña'],
    ['små', 'pequeñas'], ['spansk', 'españoles'], ['drøm', 'sueño'], ['skade', 'daño'],
    ['høst', 'otoño'], ['ananas', 'piña'], ['siv', 'caña'], ['fjell', 'montañas'],
    ['størrelse', 'tamaño'], ['bedrag', 'engaño'], ['undervisning', 'enseñanza'], ['tilføye', 'añadir']
  ];
  for (const [no, es] of cases) {
    assert.deepEqual(findMissingEnye([{ no, es }]), [], es);
    const errors = findMissingEnye([{ no, es: `«${es.replaceAll('ñ', 'n').toUpperCase()}»` }]);
    assert.equal(errors.length, 1, es);
    assert.equal(errors[0].expected, es);
  }
});

test('a green corpus-backed audit still discloses that expert review did not run', () => {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /13 mechanical \+ 3 corpus/);
  assert.match(result.stdout, /Expert review not performed: translation idiomaticity, distractor validity in context/);
});

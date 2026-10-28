import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCulturePackages, renderCulturePreview } from '../scripts/build-culture-preview.mjs';
import * as cultureBuilder from '../scripts/build-culture-preview.mjs';

const catalog = JSON.parse(readFileSync('data/culture-packages.json', 'utf8'));
const review = JSON.parse(readFileSync('data/vocabulary-canonical-review.json', 'utf8'));
const validate = data => validateCulturePackages(data, review);

test('student and teacher lessons provide a route back to the culture catalogue', () => {
  for (const role of ['student', 'teacher']) {
    assert.match(renderCulturePreview(catalog.packages[0], role), /href="\.\.\/index\.html">Alle kulturopplegg<\/a>/);
  }
});

test('six complete Mundo AM lessons have distinct local images and long supported texts', () => {
  const lessons = ['honduras', 'colombia', 'mexico', 'espana', 'peru', 'guinea-ecuatorial'].map(slug => catalog.packages.find(pack => pack.id === `un-dia-en-${slug}`));
  assert.ok(lessons.every(Boolean), 'Every requested country must have a complete authored package');
  assert.equal(new Set(lessons.map(pack => pack.countries[0].visual.path)).size, 6);
  for (const pack of lessons) {
    assert.equal(pack.countries.length, 1);
    assert.equal(pack.countries[0].paragraphs.length, 6);
    const count = pack.countries[0].paragraphs.join(' ').trim().split(/\s+/).length;
    assert.ok(count >= 250 && count <= 380, `${pack.id}: ${count} words`);
    assert.ok(pack.countries[0].readingGlossary.length >= 45);
    assert.equal(pack.questions.length, 4);
    assert.equal(pack.vocabulary.length, 10);
    assert.ok(pack.orientation.path.endsWith('.svg'));
    assert.ok(pack.sources.length >= 2);
    assert.doesNotMatch(renderCulturePreview(pack), /Juleord du kan|Lær juleglosene/);
  }
});

test('the culture catalogue gives each package its own student and teacher entry', () => {
  assert.equal(typeof cultureBuilder.renderCultureCatalog, 'function');
  const second = structuredClone(catalog.packages[0]);
  second.id = 'un-dia-en-honduras';
  second.title = 'Honduras: Un día en Copán Ruinas';
  const html = cultureBuilder.renderCultureCatalog({ packages: [catalog.packages[0], second] });
  for (const id of ['jul-spania-chile', 'un-dia-en-honduras']) {
    assert.match(html, new RegExp(`${id}/index\\.html`));
    assert.match(html, new RegExp(`${id}/laerer\\.html`));
  }
  assert.match(html, /Mundo AM/);
  assert.match(html, /Honduras: Un día en Copán Ruinas/);
});

test('a complete single-country lesson uses the same culture validation', () => {
  const changed = structuredClone(catalog);
  changed.packages = [changed.packages[0]];
  const pack = changed.packages[0];
  pack.id = 'un-dia-en-honduras';
  pack.countries = [pack.countries[0]];
  pack.questions.forEach(question => { question.countryId = pack.countries[0].id; });
  assert.doesNotThrow(() => validate(changed));
});

test('a country lesson renders its own map, reading labels and PDF links', () => {
  const pack = structuredClone(catalog.packages[0]);
  pack.id = 'un-dia-en-honduras';
  pack.title = 'Honduras: Un día en Copán Ruinas';
  pack.countries = [pack.countries[0]];
  pack.orientation = { path: 'images/kultur/mundo-am/honduras-kart.svg', alt: 'Honduras på verdenskartet', caption: 'Copán Ruinas ligger i Honduras.', width: 720, height: 350 };
  pack.recall.title = 'Ord fra dagen i Honduras';
  pack.recall.buttonLabel = 'Lær Honduras-glosene';
  const student = renderCulturePreview(pack);
  const teacher = renderCulturePreview(pack, 'teacher');
  assert.match(student, /honduras-kart\.svg/);
  assert.match(student, /Ord fra dagen i Honduras/);
  assert.match(student, /Lær Honduras-glosene/);
  assert.match(student, /Spørsmål til teksten<\/h2>/);
  assert.match(student, /un-dia-en-honduras-elev\.pdf/);
  assert.match(teacher, /un-dia-en-honduras-laererveiledning\.pdf/);
  assert.doesNotMatch(student, /Juleord du kan|Lær juleglosene|landenes-plassering/);
});

test('the complete Christmas draft has two countries, ten words and a continuous 45-minute guide', () => {
  assert.doesNotThrow(() => validate(catalog));
  const pack = catalog.packages[0];
  assert.equal(pack.status, 'draft');
  assert.equal(pack.review.status, 'pending');
  assert.equal(pack.countries.length, 2);
  assert.equal(pack.vocabulary.length, 10);
  assert.equal(pack.questions.length, 4);
  assert.equal(pack.teacher.schedule.at(-1).end, 45);
  assert.equal(pack.vocabulary.filter(word => word.canonicalId).length, 3);
});

for (const [name, mutate, pattern] of [
  ['unknown vocabulary reference', pack => { pack.countries[0].visual.hotspots[0].termId = 'unknown'; }, /ordreferanse/],
  ['a point outside the image', pack => { pack.countries[0].visual.hotspots[0].x = 1.2; }, /koordinat/],
  ['duplicate point IDs', pack => { pack.countries[0].visual.hotspots[1].id = pack.countries[0].visual.hotspots[0].id; }, /duplikat/],
  ['an ambiguous multiple choice key', pack => { pack.questions[0].options[1].id = pack.questions[0].options[0].id; }, /duplikat/],
  ['a missing answer option', pack => { pack.questions[0].answerId = 'not-an-option'; }, /fasit/],
  ['a missing factual source', pack => { pack.countries[0].sourceIds = ['missing']; }, /kildereferanse/],
  ['a gap in the lesson', pack => { pack.teacher.schedule[1].start += 1; }, /tidsplan/],
  ['unreviewed published content', pack => { pack.status = 'published'; }, /gjennomgang/],
  ['a canonical word that was retranslated in the pack', pack => { pack.vocabulary[0].no = 'feil'; }, /kanonisk/],
  ['an unsafe image path', pack => { pack.countries[0].visual.path = 'https://tracker.example/a.png'; }, /bildefil/]
]) {
  test(`rejects ${name}`, () => {
    const mutated = structuredClone(catalog);
    mutate(mutated.packages[0]);
    assert.throws(() => validate(mutated), pattern);
  });
}

test('student rendering has no teacher answer key and safely escapes authored text', () => {
  const changed = structuredClone(catalog.packages[0]);
  changed.subtitle = '<script>window.bad = true</script>';
  const student = renderCulturePreview(changed, 'student');
  const teacher = renderCulturePreview(changed, 'teacher');
  assert.match(student, /&lt;script&gt;/);
  assert.doesNotMatch(student, /<script>window.bad/);
  assert.doesNotMatch(student, /data-teacher-key/);
  assert.match(teacher, /data-teacher-key/);
  assert.match(student, /KI-generert (?:illustrasjon|bilde)/);
  assert.match(student, /Les og oversett i par/);
  assert.doesNotMatch(student, /Velg lesestøtte|Før du avslutter|belegg/i);
  assert.doesNotMatch(student, /class="reading-glossary"|Ordliste til teksten/);
});

test('generated preview files match their current source', () => {
  for (const [name, role] of [['index.html', 'student'], ['laerer.html', 'teacher']]) {
    assert.equal(readFileSync(`docs/kultur/jul-spania-chile/${name}`, 'utf8'), renderCulturePreview(catalog.packages[0], role));
  }
});

test('reading annotations keep the text and match whole words and longest expressions', () => {
  const pack = structuredClone(catalog.packages[0]);
  const text = 'El turrón y Turrón. Allí allíextra, pan de Pascua.';
  pack.countries[0].paragraphs = [text];
  pack.countries[0].readingGlossary = [
    { es: 'allí', no: 'der' },
    { es: 'el turrón', no: 'mandelkonfekt', textForms: [{ es: 'turrón', no: 'mandelkonfekt' }] },
    { es: 'pan', no: 'brød' },
    { es: 'pan de Pascua', no: 'julebakverk' }
  ];
  const html = renderCulturePreview(pack);
  const reading = html.match(/<div class="reading" lang="es">([\s\S]*?)<\/div>/)[1];
  assert.match(reading, /data-translation="mandelkonfekt"[^>]*>El turrón<\/button>/);
  assert.match(reading, /data-translation="mandelkonfekt"[^>]*>Turrón<\/button>/);
  assert.match(reading, /data-translation="der"[^>]*>Allí<\/button>/);
  assert.match(reading, /data-translation="julebakverk"[^>]*>pan de Pascua<\/button>/);
  assert.doesNotMatch(reading, />allíextra<\/button>|>pan<\/button>/);
  assert.equal(reading.replace(/<[^>]*>/g, ''), text);
});

test('authored reading forms must occur as complete words in that country text', () => {
  const changed = structuredClone(catalog);
  changed.packages[0].countries[0].readingGlossary[0].textForms = [{ es: 'texto inexistente', no: 'tekst som ikke finnes' }];
  assert.throws(() => validate(changed), /tekstform/);
});

test('teacher guidance retains its answer key without the pre-use assessment section', () => {
  const html = renderCulturePreview(catalog.packages[0], 'teacher');
  assert.match(html, /data-teacher-key/);
  assert.match(html, /Abren los regalos/);
  assert.doesNotMatch(html, /Vurdering før elevbruk|Lærerfaglig gjennomgang av språk/);
});

test('Mundo AM includes two local credited photographs beside relevant paragraphs', () => {
  for (const pack of catalog.packages.filter(p => p.id.startsWith('un-dia-en-'))) {
    const country = pack.countries[0];
    assert.equal(country.photos?.length, 2, pack.id);
    const html = renderCulturePreview(pack);
    for (const photo of country.photos) {
      assert.equal(photo.license, 'CC BY 2.0');
      assert.ok(photo.author && photo.sourceUrl && photo.licenseUrl && photo.caption && photo.alt);
      assert.match(html, new RegExp(photo.path));
      assert.ok(html.includes(photo.author.replaceAll('&', '&amp;')));
      assert.ok(html.includes(photo.licenseUrl));
    }
  }
});

test('photograph validation rejects missing attribution and restricted licenses', () => {
  const baseline = structuredClone(catalog);
  const country = baseline.packages[1].countries[0];
  // Use the existing image as a real local fixture; licensing fields are synthetic.
  country.photos = [{ id: 'fixture-photo', path: country.visual.path, width: 1536, height: 1024, alt: 'Sted', caption: 'Sted', afterParagraph: 1, author: 'Fotograf', originalTitle: 'Fixture photograph', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Fixture.jpg', date: '2020', changes: 'Ingen' }];
  assert.doesNotThrow(() => validate(baseline));
  for (const patch of [{ author: '' }, { originalTitle: '' }, { license: 'CC BY-NC 2.0' }, { sourceUrl: 'javascript:alert(1)' }, { afterParagraph: 99 }, { path: 'images/../secret.jpg' }]) {
    const changed = structuredClone(baseline);
    Object.assign(changed.packages[1].countries[0].photos[0], patch);
    assert.throws(() => validate(changed));
  }
});


test('six country pages use one credited real word picture without duplicating it in the reading', () => {
  for (const pack of catalog.packages.slice(1)) {
    const visual = pack.countries[0].visual;
    assert.equal(visual.kind, 'photograph');
    const html = renderCulturePreview(pack, 'student');
    assert.equal((html.match(/data-real-word-picture/g) || []).length, 1);
    assert.equal((html.match(/class="location-photo/g) || []).length, 1);
    assert.equal(html.split('src="../../../' + visual.path + '"').length - 1, 1);
    assert.ok(html.includes(visual.author));
    assert.ok(html.includes(visual.originalTitle));
    assert.ok(!html.includes('KI-genererte'));
    for (const [field, value] of [['author', ''], ['license', 'CC BY-NC 2.0'], ['sourceUrl', 'javascript:alert(1)']]) {
      const changed = structuredClone(catalog);
      changed.packages.find(p => p.id === pack.id).countries[0].visual[field] = value;
      assert.throws(() => validate(changed));
    }
  }
});

test('lesson shortcuts target unique headings and question-specific countries in every package', () => {
  for (const pack of catalog.packages) {
    const html = renderCulturePreview(pack);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), anchor);
    assert.equal((html.match(/aria-label="I denne økten"/g) || []).length, pack.countries.length + 1);
    for (const country of pack.countries) assert.ok(html.includes(`id="${country.id}-title" tabindex="-1"`));
    assert.doesNotMatch(renderCulturePreview(pack, 'teacher'), /I denne økten/);
  }
  const changed = structuredClone(catalog);
  changed.packages[0].pairTask.imageCountryId = 'unknown';
  assert.throws(() => validate(changed), /Ukjent bildeland/);
});

test('catalogue prerequisites are required and draft status reflects authored review status', () => {
  const changed = structuredClone(catalog);
  delete changed.packages[0].catalogPrerequisites;
  assert.throws(() => validate(changed), /Mangler katalogforkunnskaper/);
  changed.packages[0].catalogPrerequisites = ' ';
  assert.throws(() => validate(changed), /Mangler katalogforkunnskaper/);
  const draft = cultureBuilder.renderCultureCatalog(catalog);
  for (const pack of catalog.packages) assert.ok(draft.includes(pack.catalogPrerequisites));
  assert.equal((draft.match(/Arbeidsutkast · til lærervurdering/g) || []).length, 7);
  const published = structuredClone(catalog.packages[0]);
  published.status = 'published';
  published.review.status = 'approved';
  published.review.teacherReviewedOn = '2026-10-07';
  assert.doesNotThrow(() => validate({ ...catalog, packages: [published] }));
  assert.doesNotMatch(cultureBuilder.renderCultureCatalog({ packages: [published] }), /Arbeidsutkast · til lærervurdering/);
});

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const readData = file => JSON.parse(readFileSync(path.join('data', file), 'utf8'));
const words = new Map(readData('vocabulary-canonical-review.json').entries.map(word => [word.id, word]));
const packs = new Map(readData('culture-packages.json').packages.map(pack => [pack.id, pack]));
const recognition = readData('vocabulary-recognition-theme.json');
const themes = readData('lesson-themes.json');
const culture = readData('lesson-culture.json');
const check = process.argv.includes('--check');

function save(relative, content) {
  const file = path.join('undervisning', relative);
  if (check) {
    if (readFileSync(file, 'utf8') !== content) throw Error('Må bygges på nytt: ' + file);
    return;
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function slug(name) {
  return name.toLowerCase().replaceAll('æ', 'ae').replaceAll('ø', 'o').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
}

function document(title, css, body) {
  return `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><link rel="stylesheet" href="${css}"></head>
<body><main>${body}</main></body></html>
`;
}

const list = items => '<ol>' + items.map(item => `<li>${escape(item)}</li>`).join('') + '</ol>';
const nav = '<nav><a href="../index.html">Alle undervisningstimer</a></nav>';

function verifyCoverage(expected, actual) {
  if (expected.size !== actual.length || actual.some(key => !expected.has(key)) || new Set(actual).size !== actual.length) {
    throw Error('Temaene i undervisningstimene avviker fra innholdskatalogen.');
  }
}

verifyCoverage(new Set([...words.values()].map(word => word.kategori)), themes.filter(l => l.category).map(l => l.category));
verifyCoverage(new Set(packs.keys()), culture.map(l => l.pack));
verifyCoverage(new Set([recognition.id]), themes.filter(l => l.theme).map(l => l.theme));

function vocabularyFor(lesson) {
  if (lesson.pack) return packs.get(lesson.pack).vocabulary.map(word => word.es);
  const entries = lesson.ids.map(id => words.get(id));
  if (entries.includes(undefined) || new Set(lesson.ids).size !== entries.length
      || (lesson.category && !entries.some(word => word.kategori === lesson.category))
      || (lesson.theme && !lesson.ids.every(id => recognition.starterIds.includes(id)))) {
    throw Error('Ugyldige glose-ID-er for ' + lesson.title);
  }
  return entries.map(word => word.spansk);
}

const overview = [[], []];
const directories = new Set();
for (const lesson of [...themes, ...culture]) {
  const id = lesson.pack || lesson.theme || slug(lesson.category);
  const vocabulary = vocabularyFor(lesson);
  if (directories.has(id)) throw Error('Duplikat: ' + id);
  directories.add(id);
  if (vocabulary.length < 5 || vocabulary.length > 10 || lesson.script.length < 4
      || lesson.writing.length !== 3 || lesson.questions.length !== 3 || lesson.cards.length !== 2) {
    throw Error('Ufullstendig undervisningstime: ' + id);
  }

  const title = escape(lesson.title);
  const audio = lesson.pack === 'un-dia-en-mexico' ? 'marked-oaxaca.mp3' : id + '.mp3';
  const script = lesson.script.map((line, i) => (i % 2 ? 'B: ' : 'A: ') + line).join('\n');
  save(id + '/lyttemanus.txt', `${lesson.title}

Lydfil: ${audio}
To stemmer. Rolig tempo med korte pauser. Les bare replikkene.

${script}
`);

  const cards = lesson.cards.map((instructions, i) => `<article><small>Samtalekort ${i ? 'B' : 'A'}</small><h2>${title}</h2><p>${escape(instructions)}</p><p>Hold kortet skjult. Spør på spansk og lytt til svaret. Bytt på å spørre.</p></article>`).join('');
  save(id + '/partnerkort.html', document(lesson.title, '../time.css', nav + '<div class="pair">' + cards + '</div>'));

  const route = lesson.pack ? 'gloser/' + lesson.pack : 'time/' + lesson.ids.join(',');
  const writing = lesson.writing.map(([prompt]) => `<label>${escape(prompt)}<textarea rows="2" lang="es" autocomplete="off"></textarea></label>`).join('\n');
  const body = `${nav}
<header><p>Spansk A1 / 45 minutter</p><h1>${title}</h1><p>${escape(lesson.goal)}</p></header>
<section><h2>1. Øv på glosene (10 min)</h2>
<p lang="es">${vocabulary.map(escape).join(', ')}.</p>
<p><a target="_blank" rel="noopener" href="../../index.html#${escape(route)}">Åpne glosene</a> i en ny fane. Prøv å si svaret før du snur kortet. Gå tilbake hit når økten er ferdig.</p></section>
<section data-writing><h2>2. Skriv på spansk (8 min)</h2><p>Prøv alle tre før du åpner eksemplene. Det du skriver blir i denne fanen.</p>
${writing}
<details hidden><summary>Sammenlign etter at du har skrevet</summary><div lang="es">${list(lesson.writing.map(([, example]) => example))}</div><p>Andre forståelige formuleringer er også mulige.</p></details></section>
<section><h2>3. Lytt to ganger (7 min)</h2><p>Lytt først etter hva samtalen handler om. Lytt så etter detaljene og svar på papir.</p>
${list(lesson.questions.map(([question]) => question))}
<audio controls preload="none" aria-label="Lytt til samtalen" src="${audio}" onerror="this.hidden=true;this.nextElementSibling.textContent='Opptaket kan ikke spilles av. Læreren leser manuset to ganger.'"></audio>
<p role="status">Læreren kan lese samtalen høyt.</p></section>
<section><h2>4. Snakk i par (15 min)</h2><p><a href="partnerkort.pdf">Skriv ut partnerkortene (A4)</a> eller <a href="partnerkort.html">åpne kortene i nettleseren</a>. Bruk ett ark per par og klipp mellom A og B. Gjennomfør begge rollene. Gjenta med en ny partner og mindre støtte.</p></section>
<section><h2>5. Hent fram ordene igjen (5 min)</h2><p>Legg bort kortene. Si én ny setning med to av ordene. La partneren stille et spørsmål. Neste øvingsdag bruker dere «Repeter gloser» på Start med samme profil når kortene forfaller.</p></section>
<details><summary>For læreren: manus, fasit og forberedelse</summary><p>Skriv ut kortene før timen. Ved første lytting holder elevene manuset lukket.</p>
<p><a href="lyttemanus.txt">Åpne manus til innlesing</a>. Legg ferdig opptak i samme mappe som timen med filnavnet <code>${audio}</code>.</p>
${list(lesson.questions.map(([, answer]) => answer))}
<p>Lytt etter om begge kan stille et spørsmål, forstå partnerens svar og bruke opplysningen til å løse oppgaven.</p></details>
<script src="../writing.js" defer></script>`;
  save(id + '/index.html', document(lesson.title, '../time.css', body));
  const topic = lesson.category || packs.get(lesson.pack)?.title || recognition.title;
  overview[lesson.pack ? 1 : 0].push({ id, title, topic });
}

const sections = overview.map((group, i) => {
  group.sort((a, b) => a.topic.localeCompare(b.topic, 'nb'));
  const links = group.map(({ id, title, topic }) => `<li><a href="${id}/index.html"><strong>${title}</strong><small>${escape(topic)}</small></a></li>`).join('\n');
  return `<h2>${i ? 'Kultur og hverdagsliv' : 'Glosetemaer'}</h2><ul class="catalog">${links}</ul>`;
});
save('index.html', document('Undervisningstimer i spansk', 'time.css', `<nav><a href="../index.html">Til øvingsappen</a></nav>
<header><h1>Undervisningstimer i spansk</h1><p>45 minutter med gloser, skriving, lytting og samtalekort. Velg tema og skriv ut ett kortpar per elevpar.</p></header>
${sections.join('\n')}`));

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { isFreeLessonId } from '../src/domain/school-license.js';

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
const writeLines = '<div class="write-line" aria-hidden="true"></div><div class="write-line" aria-hidden="true"></div>';
const nav = '<nav><a href="../index.html">Alle undervisningstimer</a></nav>';
const audioSpeedControls = '<div class="audio-speed" role="group" aria-label="Avspillingshastighet" data-audio-speed><span class="audio-speed-label">Hastighet:</span><button type="button" class="speed-btn" data-rate="1" aria-pressed="true">1x (normal)</button><button type="button" class="speed-btn" data-rate="0.75" aria-pressed="false">0,75x</button><button type="button" class="speed-btn" data-rate="0.5" aria-pressed="false">0,5x</button></div>';

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function renderPartnerCards(lesson, escapedTitle, id) {
  const { infoGap } = lesson;
  if (!infoGap) {
    throw Error('Mangler infoGap for ' + id);
  }

  if (!Array.isArray(infoGap.headers) || infoGap.headers.length < 2 || infoGap.headers.length > 5
      || !infoGap.headers.every(nonEmptyText)
      || !Array.isArray(infoGap.rows) || infoGap.rows.length < 2 || infoGap.rows.length > 6
      || !Array.isArray(infoGap.phrases) || infoGap.phrases.length === 0 || !infoGap.phrases.every(nonEmptyText)
      || !nonEmptyText(infoGap.introA) || !nonEmptyText(infoGap.introB)) {
    throw Error('Ugyldig infoGap-oppsett for ' + id);
  }

  const goalA = nonEmptyText(infoGap.goalA) ? infoGap.goalA : infoGap.goal;
  const goalB = nonEmptyText(infoGap.goalB) ? infoGap.goalB : infoGap.goal;
  if (!nonEmptyText(goalA) || !nonEmptyText(goalB)) {
    throw Error('Mangler sluttmål i infoGap for ' + id);
  }

  let aOwn = 0;
  let bOwn = 0;
  for (const row of infoGap.rows) {
    if (!Array.isArray(row) || row.length !== infoGap.headers.length) {
      throw Error('Ugyldig radlengde i infoGap for ' + id);
    }
    for (const cell of row) {
      if (nonEmptyText(cell)) continue;
      if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
        const keys = Object.keys(cell);
        if (keys.length === 1 && keys[0] === 'A' && nonEmptyText(cell.A)) {
          aOwn += 1;
          continue;
        }
        if (keys.length === 1 && keys[0] === 'B' && nonEmptyText(cell.B)) {
          bOwn += 1;
          continue;
        }
      }
      throw Error('Ugyldig celle i infoGap for ' + id);
    }
  }
  if (aOwn < 1 || bOwn < 1) {
    throw Error('infoGap må ha hemmelig informasjon for både A og B i ' + id);
  }

  const headersHtml = infoGap.headers.map(h => `<th scope="col">${escape(h)}</th>`).join('');
  const phrasesHtml = infoGap.phrases.map(p => `<li>${escape(p)}</li>`).join('');

  const renderSide = side => {
    const intro = side === 'A' ? infoGap.introA : infoGap.introB;
    const goalText = side === 'A' ? goalA : goalB;
    const rowsHtml = infoGap.rows.map(row => {
      const cellsHtml = row.map((cell, colIndex) => {
        if (typeof cell === 'string') {
          return colIndex === 0 ? `<th scope="row">${escape(cell)}</th>` : `<td>${escape(cell)}</td>`;
        }
        const ownValue = cell[side];
        if (ownValue !== undefined) {
          return `<td class="gap-given">${escape(ownValue)}</td>`;
        }
        return '<td class="gap-blank" aria-label="Fyll inn svar fra partner"><span class="gap-write-line" aria-hidden="true"></span></td>';
      }).join('');
      return `<tr>${cellsHtml}</tr>`;
    }).join('');

    return `<article class="info-gap-card" data-side="${side}"><div class="card-head"><small>Samtalekort ${side}</small><h2>${escapedTitle}</h2></div><p class="card-intro">${escape(intro)}</p><table class="gap-table"><thead><tr>${headersHtml}</tr></thead><tbody>${rowsHtml}</tbody></table><div class="card-phrases"><strong>Hjelp på spansk:</strong><ul lang="es">${phrasesHtml}</ul></div><p class="card-goal"><strong>Til slutt:</strong> ${escape(goalText)}</p></article>`;
  };

  return `<div class="pair pair-infogap">${renderSide('A')}<div class="cut-line" aria-hidden="true"><span>Klipp langs linjen</span></div>${renderSide('B')}</div>`;
}

function verifyCoverage(expected, actual) {
  if (expected.size !== actual.length || actual.some(key => !expected.has(key)) || new Set(actual).size !== actual.length) {
    throw Error('Temaene i undervisningstimene avviker fra innholdskatalogen.');
  }
}

verifyCoverage(new Set([...words.values()].map(word => word.kategori)), themes.filter(l => l.category).map(l => l.category));
verifyCoverage(new Set(packs.keys()), culture.map(l => l.pack));
verifyCoverage(new Set([recognition.id]), themes.filter(l => l.theme).map(l => l.theme));

function vocabularyPairsFor(lesson) {
  if (lesson.pack) return packs.get(lesson.pack).vocabulary.map(word => ({ es: word.es, nb: word.no }));
  const entries = lesson.ids.map(id => words.get(id));
  if (entries.includes(undefined) || new Set(lesson.ids).size !== entries.length
      || (lesson.category && !entries.some(word => word.kategori === lesson.category))
      || (lesson.theme && !lesson.ids.every(id => recognition.starterIds.includes(id)))) {
    throw Error('Ugyldige glose-ID-er for ' + lesson.title);
  }
  return entries.map(word => ({ es: word.spansk, nb: word.norsk.replace(/\s*\([a-z]\)$/u, '') }));
}

function formatTopicLabel(topic) {
  if (topic === 'Kapittel 8: Tareas de casa') return 'Ukens husarbeid';
  if (topic === 'familie-setninger') return 'Familie (setninger)';
  return topic ? topic[0].toLocaleUpperCase('nb') + topic.slice(1) : topic;
}

const freeLessons = [];
const paidThemes = [];
const paidCulture = [];
const directories = new Set();

for (const lesson of [...themes, ...culture]) {
  const id = lesson.pack || lesson.theme || slug(lesson.category);
  const vocabularyPairs = vocabularyPairsFor(lesson);
  const vocabulary = vocabularyPairs.map(word => word.es);
  if (directories.has(id)) throw Error('Duplikat: ' + id);
  directories.add(id);
  if (vocabulary.length < 5 || vocabulary.length > 10 || lesson.script.length < 4
      || lesson.writing.length !== 3 || lesson.questions.length !== 3 || lesson.cards.length !== 2) {
    throw Error('Ufullstendig undervisningstime: ' + id);
  }

  const free = isFreeLessonId(id);
  const title = escape(lesson.title);
  const goal = escape(lesson.goal);
  const audio = lesson.pack === 'un-dia-en-mexico' ? 'marked-oaxaca.mp3' : id + '.mp3';
  const script = lesson.script.map((line, i) => (i % 2 ? 'B: ' : 'A: ') + line).join('\n');
  save(id + '/lyttemanus.txt', `${lesson.title}

Lydfil: ${audio}
To stemmer. Rolig tempo med korte pauser. Les bare replikkene.

${script}
`);

  save(id + '/partnerkort.html', document(lesson.title, '../time.css', nav + renderPartnerCards(lesson, title, id)));

  const worksheetWriting = lesson.writing.map(([prompt]) => `<li><p>${escape(prompt)}</p>${writeLines}</li>`).join('');
  const worksheetListening = lesson.questions.map(([question]) => `<li><p>${escape(question)}</p>${writeLines}</li>`).join('');
  const worksheetBody = `<nav class="no-print"><a href="index.html">Tilbake til lærersiden</a></nav>
<article class="worksheet">
<header class="worksheet-head"><div class="worksheet-meta"><span>Navn: ___________________________</span><span>Dato: ______________</span></div><p>Spansk A1 / Elevark</p><h1>${title}</h1><p>${goal}</p></header>
<section><h2>1. Gloser for timen</h2><ul class="worksheet-vocab">${vocabularyPairs.map(({ es, nb }) => `<li><strong lang="es">${escape(es)}</strong> – ${escape(nb)}</li>`).join('')}</ul></section>
<section><h2>2. Skriv på spansk</h2><ol class="worksheet-list">${worksheetWriting}</ol></section>
<section><h2>3. Lytteøvelse</h2><p>Lytt to ganger og skriv svarene på linjene.</p><ol class="worksheet-list">${worksheetListening}</ol></section>
<p class="worksheet-foot">4. Snakk i par: Læreren deler ut Samtalekort A og B.</p>
</article>`;
  save(id + '/arbeidsark.html', document(`${lesson.title} (Elevark)`, '../time.css', worksheetBody));

  const route = lesson.pack ? 'gloser/' + lesson.pack : 'time/' + lesson.ids.join(',');
  const examplesList = list(lesson.writing.map(([, example]) => example));
  const studentWriting = lesson.writing.map(([prompt]) => `<label>${escape(prompt)}<textarea rows="2" lang="es" autocomplete="off"></textarea></label>`).join('\n');
  const studentListening = lesson.questions.map(([question], i) => `<label>${i + 1}. ${escape(question)}<textarea rows="2" autocomplete="off"></textarea></label>`).join('\n');

  const studentBody = `<nav><a href="../../index.html">Til øvingsappen</a></nav>
<header><p>Elevside / Spansk A1 / 45 minutter</p><h1>${title}</h1><p>${goal}</p></header>
<section><h2>1. Øv på glosene (10 min)</h2>
<p lang="es">${vocabulary.map(escape).join(', ')}.</p>
<p><a target="_blank" rel="noopener" href="../../index.html#${escape(route)}">Åpne glosene</a> i en ny fane. Prøv å si svaret før du snur kortet. Gå tilbake hit når økten er ferdig.</p></section>
<section data-writing><h2>2. Skriv på spansk (8 min)</h2><p>Prøv alle tre før du åpner eksemplene.</p>
<p class="accent-hint">Tips: Hold inne a, e, i, o, u, n eller ? og ! på tastaturet for spanske tegn, eller klikk på knappene under.</p>
<div class="accent-bar" role="group" aria-label="Spanske tegn" data-accent-bar></div>
${studentWriting}
<details hidden><summary>Sammenlign etter at du har skrevet</summary><div lang="es">${examplesList}</div><p>Andre forståelige formuleringer er også mulige.</p></details></section>
<section data-listening><h2>3. Lytteøvelse (7 min)</h2><p>Lytt først etter hva samtalen handler om. Lytt en gang til og skriv svarene under.</p>
<audio controls preload="metadata" aria-label="Lytt til samtalen" src="${audio}" onerror="this.hidden=true;this.nextElementSibling.textContent='Opptaket kan ikke spilles av. Læreren leser samtalen to ganger.'"></audio>
<p role="status">Spill av opptaket eller lytt når læreren spiller av i klasserommet.</p>
${audioSpeedControls}
${studentListening}
</section>
<section><h2>4. Snakk i par (15 min)</h2><p>Du får Samtalekort A eller Samtalekort B av læreren. Hold kortet skjult for partneren din, still spørsmål på spansk og lytt til svaret. Bytt roller når dere er ferdige.</p></section>
<section><h2>5. Hent fram ordene igjen (5 min)</h2><p>Legg bort kortene. Si én ny setning med to av ordene. La partneren stille et spørsmål. Neste øvingsdag bruker dere «Repeter gloser» på Start med samme profil når ordene er klare for repetisjon.</p></section>
<script src="../writing.js" defer></script>`;
  save(id + '/elev.html', document(`${lesson.title} (Elevside)`, '../time.css', studentBody));

  const schoolActivityId = lesson.category ? `vocabulary.${id}.v1` : 'vocabulary.all.v1';
  const teacherNav = '<nav><a href="../index.html">Alle undervisningstimer</a><a href="elev.html">Åpne elevsiden</a></nav>';
  const teacherBody = `${teacherNav}
<header><p>Lærerside / Spansk A1 / 45 minutter</p><h1>${title}</h1><p>${goal}</p></header>
<section class="teacher-toolbar" aria-labelledby="teacherToolsTitle">
<h2 id="teacherToolsTitle">Del og skriv ut til klassen</h2>
<p>Del elevsiden for digital øving uten fasit og uten partnerkort, eller skriv ut elevark og samtalekort på papir.</p>
<div class="package-actions">
<button type="button" class="btn-primary" data-copy-student-link data-lesson-id="${id}" data-free="${free ? 'true' : 'false'}">Kopier elevlenke (uten fasit)</button>
<a class="btn-secondary" href="elev.html">Forhåndsvis elevside</a>
<a class="btn-secondary" href="arbeidsark.pdf">Skriv ut elevark (PDF)</a>
<a class="btn-secondary" href="partnerkort.pdf">Skriv ut partnerkortene (A4)</a>
</div>
<p class="toolbar-status" role="status" data-student-link-status></p>
</section>
<section><h2>1. Øv på glosene (10 min)</h2>
<p lang="es">${vocabulary.map(escape).join(', ')}.</p>
<p><a target="_blank" rel="noopener" href="../../index.html#${escape(route)}">Åpne glosene</a> i en ny fane. Elevene prøver å si svaret før de snur kortet.</p></section>
<section><h2>2. Skriv på spansk (8 min)</h2><p>Elevene skriver svarene i skriveboksene på elevsiden eller på utskrevet elevark før de sammenligner med eksemplene.</p>
${list(lesson.writing.map(([prompt]) => prompt))}
<details><summary>Eksempelsvar</summary><div lang="es">${examplesList}</div><p>Andre forståelige formuleringer er også mulige.</p></details></section>
<section><h2>3. Lytteøvelse (7 min)</h2><p>Spill av lytteøvelsen høyt for klassen to ganger. Elevene svarer i skriveboksene på elevsiden eller på utskrevet <a href="arbeidsark.pdf">elevark (PDF)</a>.</p>
${list(lesson.questions.map(([question]) => question))}
<audio controls preload="metadata" aria-label="Lytt til samtalen" src="${audio}" onerror="this.hidden=true;this.nextElementSibling.textContent='Opptaket kan ikke spilles av. Les lyttemanuset høyt to ganger.'"></audio>
<p role="status">Klar for avspilling i klasserommet.</p>
${audioSpeedControls}</section>
<section><h2>4. Snakk i par (15 min)</h2><p><a href="partnerkort.pdf">Skriv ut partnerkortene (A4)</a> eller <a href="partnerkort.html">åpne kortene i nettleseren</a>. Bruk ett ark per par og klipp mellom A og B, slik at hver elev bare ser sitt eget kort.</p></section>
<section><h2>5. Hent fram ordene igjen (5 min)</h2><p>Legg bort kortene. Elevene sier én ny setning med to av ordene og lar partneren stille et spørsmål. Neste øvingsdag bruker de «Repeter gloser» på Start med samme profil når ordene er klare for repetisjon.</p></section>
<details><summary>For læreren: manus, fasit og forberedelse</summary><p>Skriv ut partnerkortene før timen (og elevarket hvis klassen jobber på papir). Elevsiden inneholder ikke denne seksjonen, ikke lyttemanuset og ikke partnerkortene.</p>
<p><a href="lyttemanus.txt">Åpne lyttemanus</a></p>
<p><a href="/school?activity=${encodeURIComponent(schoolActivityId)}&amp;title=${encodeURIComponent(lesson.title)}">Gi temaet som digital skolelekse (Feide)</a>.</p>
<h3>Fasit til lytteøvelsen</h3>
${list(lesson.questions.map(([, answer]) => answer))}
<p>Lytt etter om begge kan stille et spørsmål, forstå partnerens svar og bruke opplysningen til å løse oppgaven.</p></details>
<script src="../teacher.js" defer></script>`;
  save(id + '/index.html', document(lesson.title, '../time.css', teacherBody));

  const topic = formatTopicLabel(lesson.category || packs.get(lesson.pack)?.title || recognition.title);
  const group = lesson.pack ? 'culture' : 'theme';
  const entry = { id, title, topic, group, free };
  if (free) freeLessons.push(entry);
  else if (lesson.pack) paidCulture.push(entry);
  else paidThemes.push(entry);
}

const renderCatalogSection = (heading, entries) => {
  entries.sort((a, b) => a.topic.localeCompare(b.topic, 'nb'));
  const links = entries.map(({ id, title, topic, group: groupKind, free }) => {
    const badgeClass = free ? 'lesson-badge badge-free' : 'lesson-badge badge-paid';
    const badgeLabel = free ? 'Gratis prøve' : 'Undervisningspakken';
    return `<li data-lesson-id="${id}" data-group="${groupKind}" data-free="${free ? 'true' : 'false'}"><a href="${id}/index.html"><span class="card-top"><small>${escape(topic)}</small><span class="${badgeClass}">${badgeLabel}</span></span><strong>${title}</strong></a></li>`;
  }).join('\n');
  return `<section class="catalog-section"><h2>${heading}</h2><ul class="catalog">${links}</ul></section>`;
};

const sections = [
  renderCatalogSection('Gratis prøvetimer', freeLessons),
  renderCatalogSection('Glosetemaer', paidThemes),
  renderCatalogSection('Kultur og hverdagsliv', paidCulture),
];

const orderSubject = encodeURIComponent('Bestilling eller demo: Undervisningspakken i Spansk på 1-2-3');
const orderBody = encodeURIComponent('Hei Ole Henrik,\n\nSkolen vår vil gjerne bestille eller se en kort demo av Undervisningspakken (3 490 kr per skole per år).\n\nSkolenavn:\nKontaktperson:\nAntall spanskgrupper:');
save('index.html', document('Undervisningstimer i spansk', 'time.css', `<nav><a href="../index.html">Til øvingsappen</a><a href="../school">Skolemodus med Feide</a></nav>
<header><h1>Undervisningstimer i spansk</h1><p>46 ferdige 45-minutters opplegg med gloseøkt, skriving, lytteøvelse, utskrivbart elevark (PDF) og A4-samtalekort med informasjonskløft. Laget for ungdomsskolen og spansk nivå I i videregående.</p></header>
<section class="package-hero" aria-labelledby="packageTitle">
<h2 id="packageTitle">Undervisningspakken – klar til bruk i klasserommet uten elevkontoer</h2>
<ul class="package-highlights">
<li>46 komplette 45-minutters timer (egen lærerside og elevside)</li>
<li>46 naturlige lyttedialoger med ulike spanske aksenter og 1x / 0,75x / 0,5x hastighet</li>
<li>46 utskrivbare elevark og A4-samtalekort med informasjonskløft-tabeller (PDF)</li>
<li>Null elevdata i skyen – ingen ventetid på kommunal DBA</li>
</ul>
<p><strong>Pris: 3 490 kr per skole per år</strong> (inntil 6 klasser, bestilles enkelt på skolens budsjett). Vil skolen også ha Feide-lekser og læreroversikt? Se <a href="../school">Skolepakke med Feide (4 995 kr første år)</a>.</p>
<div class="package-actions">
<a class="btn-primary" href="mailto:olevik91@gmail.com?subject=${orderSubject}&amp;body=${orderBody}">Bestill skolekode til din skole</a>
<a class="btn-secondary" href="wordkeys-recognizable/index.html">Prøv gratis time nå</a>
</div>
</section>
<div id="lockedNotice" class="notice-banner" role="status" hidden></div>
<section id="licensePanel" class="license-card" aria-label="Aktiver skolekode"></section>
<section class="catalog-controls" aria-label="Søk og filtrer undervisningstimer">
<label for="lessonSearchInput" class="sr-only">Søk i alle 46 undervisningstimer</label>
<input type="search" id="lessonSearchInput" placeholder="Søk etter tema, for eksempel familie, mat, klokka eller Colombia">
<div class="filter-row" role="group" aria-label="Filtrer timer">
<button type="button" class="filter-btn" data-filter="all" aria-pressed="true">Alle (${themes.length + culture.length})</button>
<button type="button" class="filter-btn" data-filter="free" aria-pressed="false">Gratis prøvetimer (3)</button>
<button type="button" class="filter-btn" data-filter="theme" aria-pressed="false">Glosetemaer (${themes.length})</button>
<button type="button" class="filter-btn" data-filter="culture" aria-pressed="false">Kultur og hverdagsliv (${culture.length})</button>
</div>
<p id="catalogCount" class="catalog-count" aria-live="polite"></p>
</section>
${sections.join('\n')}
<script src="pakke.js" defer></script>`));

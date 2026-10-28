import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const previewAssetVersion = createHash('sha256')
  .update(readFileSync('docs/kultur/jul-spania-chile/preview.css'))
  .update(readFileSync('docs/kultur/jul-spania-chile/preview.js'))
  .digest('hex').slice(0, 12);

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const check = (value, message) => { if (!value) throw new Error(message); };
const unique = (items, label) => {
  const ids = items.map(item => item.id);
  check(ids.every(id => /^[a-z0-9-]+$/.test(id)) && new Set(ids).size === ids.length, `${label}: manglende ID eller duplikat`);
};

export function validateCulturePackages(catalog, review) {
  check(catalog.schemaVersion === 1 && Array.isArray(catalog.packages) && catalog.packages.length, 'Ugyldig kulturkatalog');
  unique(catalog.packages, 'Pakker');
  const canonical = new Map(review.entries.map(entry => [entry.id, entry]));
  for (const pack of catalog.packages) {
    check(['draft', 'published'].includes(pack.status), 'Ugyldig pakkestatus');
    check(['pending', 'approved'].includes(pack.review?.status), 'Mangler gjennomgang');
    if (pack.status === 'published') check(pack.review.status === 'approved' && /^\d{4}-\d{2}-\d{2}$/.test(pack.review.teacherReviewedOn || ''), 'Publisering krever dokumentert gjennomgang');
    check(typeof pack.catalogPrerequisites === 'string' && pack.catalogPrerequisites.trim(), 'Mangler katalogforkunnskaper');
    check(pack.title && pack.subtitle && pack.objectives.length && pack.prerequisites.length, 'Mangler pakkeoversikt');
    check(pack.countries.length >= 1 && pack.countries.length <= 2 && pack.vocabulary.length === 10 && pack.questions.length === 4, 'Ufullstendig kulturpakke');
    const terms = [...pack.vocabulary, ...pack.supportTerms];
    unique(terms, 'Ord'); unique(pack.countries, 'Land'); unique(pack.questions, 'Oppgaver'); unique(pack.sources, 'Kilder');
    const termIds = new Set(terms.map(term => term.id));
    const sourceIds = new Set(pack.sources.map(source => source.id));
    const countryIds = new Set(pack.countries.map(country => country.id));
    if (pack.pairTask.imageCountryId !== undefined) check(countryIds.has(pack.pairTask.imageCountryId), 'Ukjent bildeland');
    for (const source of pack.sources) check(source.title && /^https:\/\//.test(source.url), 'Ugyldig kilde');
    for (const term of terms) check(term.es && term.no && term.note, 'Mangler ordstøtte');
    for (const word of pack.vocabulary.filter(word => !word.canonicalId)) {
      check(['no-es', 'es-no'].every(direction => word.answers?.[direction]?.length && word.answers[direction].every(answer => typeof answer === 'string' && answer.trim())), 'Mangler fasit for valgfritt ord');
    }
    for (const word of pack.vocabulary.filter(word => word.canonicalId)) {
      const row = canonical.get(word.canonicalId);
      check(row && row.norsk === word.no && row.spansk.toLocaleLowerCase() === word.es.toLocaleLowerCase(), 'Feil kanonisk ordreferanse eller oversettelse');
    }
    const pointIds = new Set();
    for (const country of pack.countries) {
      check(country.paragraphs.length && country.paragraphs.every(p => typeof p === 'string' && p.trim()), 'Mangler elevtekst');
      check(country.readingGlossary?.length >= 30 && country.readingGlossary.every(word => word.es && word.no), 'Mangler leseordliste');
      for (const word of country.readingGlossary) {
        if (word.textForms === undefined) continue;
        check(Array.isArray(word.textForms) && word.textForms.length > 0, 'Ugyldig tekstform');
        for (const form of word.textForms) {
          check(typeof form.es === 'string' && form.es.trim() && typeof form.no === 'string' && form.no.trim(), 'Ugyldig tekstform');
          const pattern = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${regexEscape(form.es)}(?![\\p{L}\\p{M}\\p{N}])`, 'iu');
          check(country.paragraphs.some(paragraph => pattern.test(paragraph)), `Ukjent tekstform: ${form.es}`);
        }
      }
      if (country.photos !== undefined) {
        check(Array.isArray(country.photos) && country.photos.length <= 3, 'Ugyldig fotosamling');
        unique(country.photos, 'Fotografier');
        for (const photo of country.photos) {
          check(/^images\/kultur\/[a-z0-9/-]+\.(jpg|png)$/.test(photo.path) && !photo.path.includes('..') && existsSync(photo.path), 'Ugyldig eller manglende fotografi');
          check(Number.isInteger(photo.afterParagraph) && photo.afterParagraph >= 1 && photo.afterParagraph <= country.paragraphs.length, 'Ugyldig fotoplassering');
          check(photo.width > 0 && photo.height > 0 && photo.alt && photo.caption && photo.author && photo.originalTitle && photo.date && photo.changes, 'Mangler fotometadata eller kreditering');
          check(photo.license === 'CC BY 2.0' && photo.licenseUrl === 'https://creativecommons.org/licenses/by/2.0/', 'Uavklart fotolisens');
          check(/^https:\/\/commons\.wikimedia\.org\/wiki\/File[:%]/.test(photo.sourceUrl), 'Ugyldig fotokilde');
          if (photo.authorUrl) check(/^https:\/\//.test(photo.authorUrl), 'Ugyldig fotografreferanse');
        }
      }
      check(country.sourceIds.length && country.sourceIds.every(id => sourceIds.has(id)), 'Ukjent kildereferanse');
      const visual = country.visual;
      check(/^images\/kultur\/[a-z0-9/-]+\.(jpg|png)$/.test(visual.path) && !visual.path.includes('..') && existsSync(visual.path), 'Ugyldig eller manglende bildefil');
      check(visual.width > 0 && visual.height > 0 && visual.alt && visual.caption && ['ai-illustration', 'photograph'].includes(visual.kind), 'Mangler bildemetadata');
      if (visual.kind === 'photograph') {
        check(visual.author && visual.originalTitle && visual.date && visual.changes, 'Mangler fotometadata eller kreditering');
        check(visual.license === 'CC BY 2.0' && visual.licenseUrl === 'https://creativecommons.org/licenses/by/2.0/', 'Uavklart fotolisens');
        check(/^https:\/\/commons\.wikimedia\.org\/wiki\/File[:%]/.test(visual.sourceUrl), 'Ugyldig fotokilde');
        if (visual.authorUrl) check(/^https:\/\//.test(visual.authorUrl), 'Ugyldig fotografreferanse');
      }
      unique(visual.hotspots, 'Ordpunkter');
      for (const point of visual.hotspots) {
        check(!pointIds.has(point.id), 'Ordpunkter: duplikat'); pointIds.add(point.id);
        check(termIds.has(point.termId), 'Ukjent ordreferanse');
        check(Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1, 'Ugyldig koordinat');
        check(Number.isInteger(point.number) && point.number > 0, 'Ugyldig punktnummer');
      }
    }
    for (const question of pack.questions) {
      check(countryIds.has(question.countryId) && question.prompt && question.hint && question.explanation, 'Ufullstendig spørsmål');
      unique(question.options, 'Svaralternativer');
      check(question.options.length >= 2 && question.options.every(option => option.text) && question.options.some(option => option.id === question.answerId), 'Ugyldig fasit');
    }
    let end = 0;
    for (const step of pack.teacher.schedule) {
      check(step.start === end && step.end > step.start && step.activity && step.guidance, 'Ugyldig tidsplan'); end = step.end;
    }
    check(end === pack.durationMinutes, 'Ugyldig tidsplan');
    check(pack.questions.every(q => pack.teacher.answers.some(a => a.id === q.id && a.answer)), 'Mangler lærerfasit');
  }
}

const list = items => `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
const wordTable = (words, notes = false) => `<table><thead><tr><th scope="col">Spansk</th><th scope="col">Norsk</th>${notes ? '<th scope="col">Hjelp</th>' : ''}</tr></thead><tbody>${words.map(w => `<tr><td lang="es">${esc(w.es)}</td><td>${esc(w.no)}</td>${notes ? `<td>${esc(w.note)}</td>` : ''}</tr>`).join('')}</tbody></table>`;

const regexEscape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const readingForms = word => [{ es: word.es, no: word.no }, ...(word.textForms || [])];

function renderReadingParagraph(paragraph, glossary) {
  const translations = new Map(glossary.flatMap(readingForms).map(form => [form.es.toLocaleLowerCase('es'), form.no]));
  const phrases = [...translations.keys()].sort((a, b) => b.length - a.length).map(regexEscape);
  if (!phrases.length) return esc(paragraph);
  const pattern = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])(?:${phrases.join('|')})(?![\\p{L}\\p{M}\\p{N}])`, 'giu');
  let html = '', end = 0;
  for (const match of paragraph.matchAll(pattern)) {
    html += esc(paragraph.slice(end, match.index));
    html += `<button type="button" class="reading-word" data-translation="${esc(translations.get(match[0].toLocaleLowerCase('es')))}" aria-controls="reading-translation" aria-expanded="false" disabled>${esc(match[0])}</button>`;
    end = match.index + match[0].length;
  }
  return html + esc(paragraph.slice(end));
}

function renderPhotoCaption(photo) {
  const details = `<a href="${esc(photo.sourceUrl)}" rel="noreferrer">${esc(photo.originalTitle)}</a><span class="photo-detail">Dato: ${esc(photo.date)}</span><span class="photo-detail">${esc(photo.changes)}</span>`;
  return `<span class="photo-caption">${esc(photo.caption)}</span><span class="photo-credit">Foto: ${photo.authorUrl ? `<a href="${esc(photo.authorUrl)}" rel="noreferrer">${esc(photo.author)}</a>` : esc(photo.author)} · <a href="${esc(photo.licenseUrl)}" rel="license noreferrer">${esc(photo.license)}</a></span><details class="photo-source culture-screen-only"><summary>Om bildet</summary>${details}</details><div class="photo-source culture-print-only">${details}</div>`;
}
function renderLocationPhoto(photo) {
  return `<figure class="location-photo${photo.width / photo.height > 3 ? ' panorama' : ''}" lang="nb"><img src="../../../${esc(photo.path)}" width="${photo.width}" height="${photo.height}" alt="${esc(photo.alt)}" loading="lazy" decoding="async"><figcaption>${renderPhotoCaption(photo)}</figcaption></figure>`;
}

function renderLessonContents(pack) {
  return `<nav class="lesson-contents" aria-label="I denne økten"><a href="#${pack.countries[0].id}-title">Les</a><a href="#understanding-title">Spørsmål</a><a href="#comparison-title">Samtale</a><a href="#word-recall-title">Gloser</a></nav>`;
}
function renderReadingLinks(pack) {
  return pack.countries.length > 1 ? `<p class="reading-links">Lesetekster: ${pack.countries.map(country => `<a href="#${country.id}-title">${esc(country.name)}</a>`).join(' · ')}</p>` : '';
}

function renderCountry(country, words, sources) {
  const visual = country.visual;
  const panelId = `${country.id}-word-panel`;
  return `<section class="country" id="${esc(country.id)}" aria-labelledby="${country.id}-title">
    <div class="section-heading"><p class="eyebrow">${esc(country.region)}</p><h2 id="${country.id}-title" tabindex="-1" lang="es">${esc(country.spanishTitle)}</h2></div>
    <figure id="${country.id}-picture" tabindex="-1" class="word-picture${visual.height > visual.width ? ' portrait' : ''}" data-word-picture${visual.kind === 'photograph' ? ' data-real-word-picture' : ''}>
      <div class="image-frame"><img src="../../../${esc(visual.path)}" alt="${esc(visual.alt)}" width="${visual.width}" height="${visual.height}">
      <div class="hotspots">${visual.hotspots.map(point => `<button type="button" class="hotspot" id="${point.id}" style="--x:${point.x * 100}%;--y:${point.y * 100}%" aria-label="Ordpunkt ${point.number}" aria-expanded="false" aria-controls="${panelId}" data-term="${point.termId}">${point.number}</button>`).join('')}</div></div>
      <p class="image-error" hidden>Bildet kunne ikke lastes. Du kan fortsatt lese teksten og bruke ordoppslagene.</p>
      <div class="word-panel" id="${panelId}" hidden><div class="word-panel-content" role="status" aria-live="polite"></div><button type="button" class="quiet-button" data-close-label>Lukk ordstøtten</button></div>
      <figcaption lang="nb">${visual.kind === 'photograph' ? renderPhotoCaption(visual) : esc(visual.caption)}</figcaption>
      <div class="picture-fallback" hidden><ol>${visual.hotspots.map(point => {
        const word = words.get(point.termId);
        return `<li><span lang="es">${esc(word.es)}</span> <span class="translation">${esc(word.no)}</span></li>`;
      }).join('')}</ol></div>
    </figure>
    <div class="reading" lang="es">${country.paragraphs.map((p, index) => `<p>${renderReadingParagraph(p, country.readingGlossary)}</p>${(country.photos || []).filter(photo => photo.id !== visual.photoId && photo.afterParagraph === index + 1).map(renderLocationPhoto).join('')}`).join('')}</div>
    <p class="source-note">Faktakilder: ${country.sourceIds.map(id => { const source = sources.get(id); return `<a href="${esc(source.url)}" rel="noreferrer">${esc(source.title)}</a>`; }).join(' · ')}. Vis til teksten når du begrunner svarene.</p>
  </section>`;
}

function renderQuestions(pack) {
  return `<section class="activity" id="understanding"><h2 id="understanding-title" tabindex="-1">Spørsmål til ${pack.countries.length === 1 ? 'teksten' : 'tekstene'}</h2><p>Velg ett svar på hvert spørsmål.</p>
  <div class="questions">${pack.questions.map((q, i) => `<form class="question" data-answer="${q.answerId}" onsubmit="return false">
    <fieldset><legend>${i + 1}. ${esc(q.prompt)}</legend>${q.options.map(option => `<label class="option"><input type="radio" name="${q.id}" value="${option.id}"><span lang="es">${esc(option.text)}</span></label>`).join('')}</fieldset>
    <div class="question-actions"><button type="submit" class="button">Sjekk svaret</button><button type="button" class="quiet-button" data-show-explanation hidden>Se forklaring</button></div>
    <p class="answer-feedback" role="status" aria-live="polite"></p><p class="answer-hint" hidden>${esc(q.hint)}</p><p class="answer-explanation" hidden>${esc(q.explanation)}</p>
    <a class="local-work-link" href="#${q.countryId}-title">${pack.countries.length === 1 ? 'Tilbake til teksten' : `Les ${esc(pack.countries.find(country => country.id === q.countryId).name)}-teksten igjen`}</a>
  </form>`).join('')}</div></section>`;
}

function renderTeacher(pack) {
  return `<section class="activity"><h2>Før timen</h2><p><a href="../pdf/${pack.id}-elev.pdf">Elevark med ordlister som PDF</a></p><h3>Forkunnskaper</h3>${list(pack.prerequisites)}<h3>Mål for økten</h3>${list(pack.objectives)}<p>Ha elevark eller nettprøve klart. Hold lærerfasiten adskilt under første elevforsøk. ${pack.countries.every(country => country.visual.kind === 'photograph') ? 'Fotografiene viser virkelige steder. Personene i fortellingen er fiktive.' : 'Bilder er KI-genererte illustrasjoner av fiktive eksempler.'}</p></section>
  <section class="activity"><h2>45 minutter, steg for steg</h2><ol class="schedule">${pack.teacher.schedule.map(step => `<li><strong>${step.start}–${step.end} min · ${esc(step.activity)}</strong><p>${esc(step.guidance)}</p></li>`).join('')}</ol></section>
  <section class="activity" data-teacher-key><h2>Fasit og vurderingsstøtte</h2><h3>Forståelsesspørsmål</h3><ol>${pack.teacher.answers.map(answer => `<li>${esc(answer.answer)}</li>`).join('')}</ol><h3>Sammenligning</h3>${list(pack.teacher.comparisonNotes)}<h3>Mulige spanske setninger</h3><ul lang="es">${pack.teacher.modelSentences.map(text => `<li>${esc(text)}</li>`).join('')}</ul><h3>Formativ tilbakemelding</h3>${list(pack.teacher.assessment)}</section>
  <section class="activity"><h2>Støtte og utvidelse</h2>${list(pack.teacher.adaptations)}<h3>Ordliste til økten</h3>${wordTable(pack.vocabulary, true)}</section>`;
}

export function renderCulturePreview(pack, role = 'student') {
  const words = new Map([...pack.vocabulary, ...pack.supportTerms].map(term => [term.id, term]));
  const sources = new Map(pack.sources.map(source => [source.id, source]));
  const student = role === 'student';
  const assets = pack.id === 'jul-spania-chile' ? '' : '../jul-spania-chile/';
  const orientation = pack.orientation || { path: 'images/kultur/jul-spania-chile/landenes-plassering.svg', alt: 'Verdenskart med Spania markert i Europa og Chile i Sør-Amerika', width: 720, height: 350, caption: 'Spania ligger i Europa. Chile ligger i Sør-Amerika. Kartgrunnlag: Natural Earth.' };
  const termsJson = JSON.stringify(Object.fromEntries(words)).replace(/</g, '\\u003c');
  const content = student ? `<section class="overview"><p>${esc(pack.intro)}</p><div class="orientation"><img src="../../../${esc(orientation.path)}" alt="${esc(orientation.alt)}" width="${orientation.width}" height="${orientation.height}"><p>${esc(orientation.caption)}</p></div></section>
    <section class="activity reading-task"><h2>${esc(pack.readingTask.title)}</h2>${list(pack.readingTask.steps)}</section>
    <p class="picture-instruction">Pek eller trykk på understrekede ord i teksten for å se norsk oversettelse. Numrene i bildene viser bildeord.</p>
    ${pack.countries.map(country => renderCountry(country, words, sources) + renderLessonContents(pack)).join('')}
    ${renderQuestions(pack)}
    <section class="activity"><p class="eyebrow">Utforsk kultur</p><h2 id="comparison-title" tabindex="-1">Sammenlign og spør</h2>${renderReadingLinks(pack)}<ol>${pack.comparison.map(text => `<li>${esc(text)}<span class="writing-line" aria-hidden="true"></span></li>`).join('')}</ol><p>Åpne spørsmål har flere rimelige svar. Lytt til partnerens begrunnelse.</p></section>
    <section class="activity"><h2>Bruk språket i par</h2><p>${esc(pack.pairTask.instruction)}</p>${pack.pairTask.imageCountryId ? `<a class="local-work-link" href="#${pack.pairTask.imageCountryId}-picture">Se bildet</a>` : ''}<aside data-extra-support><h3>Setningsstartere</h3><ul lang="es">${pack.pairTask.starters.map(text => `<li>${esc(text)}</li>`).join('')}</ul></aside><details><summary>Prøv en utvidelse</summary><p>${esc(pack.pairTask.extension)}</p></details></section>
    <section class="activity" id="word-recall"><h2 id="word-recall-title" tabindex="-1">${esc(pack.recall.title || 'Juleord du kan bruke videre')}</h2><div class="culture-screen-only"><p>Øv på de ti ordene fra teksten. Prøv å huske svaret før du snur kortet.</p><a class="button learn-vocabulary" href="../../../index.html#gloser/${pack.id}">${esc(pack.recall.buttonLabel || 'Lær juleglosene')}</a><p class="return-note">Valgfritt glosesett: ${esc(pack.title)}. ${esc(pack.recall.returnMessage)}</p><details class="recall-words"><summary>Se de ti ordene</summary>${wordTable(pack.vocabulary)}</details></div><div class="culture-print-only"><p>${esc(pack.recall.instruction)}</p>${wordTable(pack.vocabulary)}</div></section>
    ` : renderTeacher(pack);
  return `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(pack.title)}${student ? '' : ' – lærerveiledning'}</title><meta name="referrer" content="no-referrer"><link rel="stylesheet" href="${assets}preview.css?v=${previewAssetVersion}"></head>
<body><a class="skip-link" href="#main">Hopp til innhold</a><header class="top-bar"><div class="brand-links"><a class="brand" href="../../../index.html">Spansk på 1-2-3</a><a class="culture-brand" href="../index.html">Kultur</a></div><nav aria-label="Pakken"><a href="${student ? 'laerer.html' : 'index.html'}">${student ? 'Lærerveiledning' : 'Elevøkten'}</a><button type="button" class="quiet-button" data-print>Skriv ut</button></nav></header>
<main id="main"><header class="lesson-header"><p class="draft-label">Arbeidsutkast · til lærervurdering</p><p class="eyebrow">${pack.durationMinutes} minutter · les, oversett og sammenlign</p><h1>${esc(pack.title)}${student ? '' : '<span class="teacher-subtitle">Lærerveiledning og fasit</span>'}</h1><p class="subtitle">${esc(pack.subtitle)}</p><div class="lesson-links"><a href="../index.html">Alle kulturopplegg</a><a class="start-reading" href="${student ? '#' + pack.countries[0].id + '-title' : 'index.html'}">${student ? 'Start lesingen' : 'Åpne elevøkten'}</a><a href="../pdf/${pack.id}-${student ? 'elev' : 'laererveiledning'}.pdf">${student ? 'Elevark som PDF' : 'Lærerveiledning som PDF'}</a></div></header>
${student ? renderLessonContents(pack) + renderReadingLinks(pack) : ''}
${content}
${student ? '<aside id="reading-translation" class="reading-translation" lang="nb" aria-label="Oversettelse" hidden><div><strong data-reading-spanish lang="es"></strong><p id="reading-translation-text" role="status" aria-live="polite"></p></div><button type="button" class="quiet-button" data-close-translation aria-label="Lukk oversettelsen">Lukk</button></aside>' : ''}
<footer id="sources"><h2>Kilder og innholdsstatus</h2><ul>${pack.sources.map(source => `<li><a href="${esc(source.url)}" rel="noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><p>Originale, tilpassede tekster. Kilder kontrollert ${esc(pack.review.checkedSourcesOn)}. Språk-, bilde- og nivåvurdering hos lærer gjenstår.</p><p>Du leser og svarer lokalt. Prøven lagrer eller sender ikke svarene dine.</p></footer></main>
${student ? `<script type="application/json" id="picture-terms">${termsJson}</script>` : ''}<script src="${assets}preview.js?v=${previewAssetVersion}" defer></script></body></html>
`.replace(/[\t ]+$/gm, '');
}

export function renderCultureCatalog(catalog) {
  return `<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Mundo AM · Kulturopplegg</title><link rel="stylesheet" href="jul-spania-chile/preview.css?v=${previewAssetVersion}"></head><body><a class="skip-link" href="#main">Hopp til innhold</a><header class="top-bar"><div class="brand-links"><a class="brand" href="../../index.html">Spansk på 1-2-3</a><a class="culture-brand" href="index.html" aria-current="page">Kultur</a></div></header><main id="main"><header class="lesson-header catalog-header"><p class="eyebrow">Les · forstå · bruk språket</p><h1>Mundo AM</h1><p class="subtitle">En dag. Et sted. En ny historie.</p><p>Kulturopplegg med tekst, bilder, oppgaver og lærerveiledning. Velg et land eller et tema, og øv videre på ordene fra teksten.</p></header><section class="culture-grid" aria-label="Kulturopplegg">${catalog.packages.map(pack => `<article class="culture-card"><a class="culture-cover" href="${pack.id}/index.html" tabindex="-1" aria-hidden="true"><img src="../../${esc(pack.countries[0].visual.path)}" alt="" width="${pack.countries[0].visual.width}" height="${pack.countries[0].visual.height}" loading="lazy"></a><div class="culture-card-body"><p class="eyebrow">${esc(pack.countries.map(country => country.name).join(' · '))} · ${pack.durationMinutes} min</p>${pack.status === 'draft' ? '<p class="catalog-status">Arbeidsutkast · til lærervurdering</p>' : ''}<h2><a href="${pack.id}/index.html">${esc(pack.title)}</a></h2><p>${esc(pack.summary || pack.subtitle)}</p><p class="catalog-meta"><strong>Forkunnskaper:</strong> ${esc(pack.catalogPrerequisites)}</p><p class="catalog-meta"><strong>Arbeidsform:</strong> Lesing og samtale i par</p><div class="lesson-links"><a href="${pack.id}/index.html">Åpne elevøkten</a><a href="${pack.id}/laerer.html">Lærerveiledning</a></div></div></article>`).join('')}</section><footer><p>Les høyt, oversett i par og utforsk kultur sammen. Hvert opplegg har et valgfritt glosesett og egne papirark.</p><p>Lokale arbeidsutkast. Faktakilder og innholdsstatus finner du i hvert opplegg.</p></footer></main></body></html>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(readFileSync('data/culture-packages.json', 'utf8'));
  const review = JSON.parse(readFileSync('data/vocabulary-canonical-review.json', 'utf8'));
  validateCulturePackages(catalog, review);
  const sets = Object.fromEntries(catalog.packages.map(pack => [pack.id, {
    id: pack.id, title: pack.title, readingAnchor: `${pack.countries[0].id}-title`, words: pack.vocabulary
  }]));
  const app = readFileSync('index.html', 'utf8');
  const block = `// BEGIN GENERATED CULTURE VOCABULARY\n        const cultureVocabularySets = ${JSON.stringify(sets).replace(/</g, '\\u003c')};\n        // END GENERATED CULTURE VOCABULARY`;
  const updatedApp = app.replace(/\/\/ BEGIN GENERATED CULTURE VOCABULARY[\s\S]*?\/\/ END GENERATED CULTURE VOCABULARY/, block);
  check(app.includes('// BEGIN GENERATED CULTURE VOCABULARY'), 'Mangler appens kulturordblokk');
  if (process.argv.includes('--check')) check(app === updatedApp, 'Kulturord i appen: byggavvik');
  else if (app !== updatedApp) writeFileSync('index.html', updatedApp);
  for (const pack of catalog.packages) {
    const out = `docs/kultur/${pack.id}`; mkdirSync(out, { recursive: true });
    for (const [file, role] of [['index.html', 'student'], ['laerer.html', 'teacher']]) {
      const target = `${out}/${file}`;
      const html = renderCulturePreview(pack, role);
      if (process.argv.includes('--check')) check(existsSync(target) && readFileSync(target, 'utf8') === html, `${target}: byggavvik`);
      else writeFileSync(target, html);
    }
  }
  const catalogTarget = 'docs/kultur/index.html';
  const catalogHtml = renderCultureCatalog(catalog);
  if (process.argv.includes('--check')) check(existsSync(catalogTarget) && readFileSync(catalogTarget, 'utf8') === catalogHtml, `${catalogTarget}: byggavvik`);
  else writeFileSync(catalogTarget, catalogHtml);
  console.log('Culture draft and preview: OK');
}

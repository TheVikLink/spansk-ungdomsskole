(() => {
    'use strict';
    const core = globalThis.PronunciationCore;
    const catalog = pronunciationCatalog;
    const root = () => document.getElementById('pronunciationPage');
    const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const itemById = id => catalog.items.find(item => item.id === id);
    let session = null, audio = null, playToken = 0, storageError = '';
    let recorder = null;
    const current = () => session?.items[session.index];
    function loadProgress() {
        try { const raw = localStorage.getItem(core.KEY); return raw ? core.validateProgress(JSON.parse(raw)) : core.emptyProgress(); }
        catch { storageError = 'Uttaleøving kunne ikke leses. Eksporter eksisterende data før du velger å rydde. Du kan fortsatt øve.'; return core.emptyProgress(); }
    }
    function saveProgress(incoming) {
        try {
            const raw = localStorage.getItem(core.KEY);
            const previous = raw ? core.validateProgress(JSON.parse(raw)) : core.emptyProgress();
            const merged = core.mergeProgress(previous, incoming);
            localStorage.setItem(core.KEY, JSON.stringify(merged)); storageError = '';
            return { ok: true };
        } catch (error) {
            storageError = 'Uttaleøving ble ikke lagret. ' + (error.name === 'QuotaExceededError' ? 'Det er ikke nok plass. Eksporter før du rydder.' : error.message);
            return { ok: false, message: storageError };
        }
    }
    function exportProgress() {
        const raw = localStorage.getItem(core.KEY);
        if (!raw) return core.emptyProgress();
        try { return core.validateProgress(JSON.parse(raw)); }
        catch { throw new Error('Uttaledata har et ukjent eller skadet format. Ingen rådata er lagt i eksporten. Behold en tidligere sikkerhetskopi.'); }
    }
    function marked(item, role) {
        let html = '', offset = 0;
        for (const [start, end] of item.focus[role]) {
            html += esc(item[role].slice(offset, start)) + '<strong class="pron-target">' + esc(item[role].slice(start, end)) + '</strong>';
            offset = end;
        }
        return html + esc(item[role].slice(offset));
    }
    function credit() {
        return `<footer class="pron-credit">${esc(catalog.source.credit)} <a href="https://refold.la/" target="_blank" rel="noopener noreferrer">Refold</a> · <a href="${esc(catalog.source.url)}" target="_blank" rel="noopener noreferrer">Originaldekket på AnkiWeb</a></footer>`;
    }
    const button = (action, text, disabled = false, primary = true) => `<button type="button" class="btn ${primary ? 'btn-primary' : 'btn-secondary'}" data-pron-action="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;
    const playButton = (role, text, item = null) => `<button type="button" class="btn btn-secondary pron-play" data-pron-play="${role}" ${item ? `data-pron-item="${item.id}"` : ''}><span aria-hidden="true">▶</span> ${text}</button>`;
    function soundMenu() {
        return `<section class="pron-sound-menu"><h2>Velg en lyd å øve på</h2><nav class="pron-actions" aria-label="Velg en lyd å øve på">${catalog.items.map(item => `<button type="button" class="btn btn-secondary" data-pron-sound="${item.id}" aria-label="Øv på ${esc(item.title)}">${esc(item.title)}</button>`).join('')}</nav></section>`;
    }
    function shell(body) {
        stopModel(); clearRecording();
        root().innerHTML = `${body}<p id="pronunciationAudioStatus" class="pron-status" role="status" aria-live="polite"></p><audio id="pronunciationModelAudio" preload="none" aria-hidden="true"></audio>${soundMenu()}${credit()}`;
        root().querySelector('h1, h2')?.setAttribute('tabindex', '-1');
        root().querySelector('h1, h2')?.focus({ preventScroll: true });
        audio = document.getElementById('pronunciationModelAudio');
        root().scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    function stopModel() {
        playToken++;
        if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
    }
    function clearRecording() { recorder?.clear(); }
    function status(message) { const node = document.getElementById('pronunciationAudioStatus'); if (node) node.textContent = message; }
    function play(role, id) {
        const item = id ? itemById(id) : current();
        if (!item) return;
        if (!item.audio[role]) return;
        recorder?.stop(); recorder?.pause(); stopModel();
        const token = playToken;
        audio.src = item.audio[role]; audio.crossOrigin = 'anonymous';
        if (session) {
            const control = root().querySelector(`[data-pron-play="${role}"]`);
            control?.closest('.pron-practice, .pron-rule')?.append(document.getElementById('pronunciationAudioStatus'));
        }
        status('Spiller modellopptaket.');
        const failure = () => {
            if (token !== playToken) return;
            session?.heard.delete(role); updateButtons();
            status('Lydopptaket er ikke tilgjengelig. Koble til nettet og prøv igjen, eller velg en annen øvelse.');
        };
        audio.onerror = failure;
        audio.onended = () => { if (token !== playToken) return; if (session) session.heard.add(role); updateButtons(); status('Modellopptaket er ferdig.'); };
        audio.play().catch(failure);
    }
    function open() {
        session = null; storageError = ''; renderOverview();
    }
    function renderOverview(selectedGroup = '') {
        const progress = loadProgress();
        const practiced = id => progress.practiced.some(p => p.itemId === id && p.contentVersion === itemById(id).contentVersion);
        const count = catalog.items.filter(item => practiced(item.id)).length;
        const group = catalog.groups.find(g => g.id === selectedGroup) || catalog.groups.find(g => g.itemIds.some(id => !practiced(id))) || catalog.groups[0];
        shell(`<header class="pron-header"><p class="pron-eyebrow">Uttale · fra skrift til lyd</p><h1>Lær å lese spansk høyt</h1><p>Lytt, prøv selv og sammenlign. Korte økter på omtrent 5–8 minutter. Du trenger ikke mikrofon.</p></header>
            <section class="pron-next"><div><h2>${count ? 'Fortsett å øve' : 'Begynn med lydene'}</h2><p>${esc(group.title)} · opptil tre lydkort</p></div><button class="btn btn-primary" type="button" data-pron-start="${group.id}">Start en kort økt</button></section>
            <p class="pron-progress">${count} av 31 lydtemaer øvd. Dette er egen øving, ikke en vurdering av uttalen din.</p>
            ${storageError ? `<p role="alert" class="pron-notice">${esc(storageError)}</p>` : ''}
            <details class="pron-topics"><summary>Velg et annet tema</summary><div class="pron-grid">${catalog.groups.map((g, i) => `<article class="pron-theme"><span class="pron-eyebrow">Tema ${i + 1}</span><h3>${esc(g.title)}</h3><p>${g.itemIds.filter(practiced).length} av ${g.itemIds.length} lydkort øvd</p><button class="btn btn-primary" type="button" data-pron-start="${g.id}">Øv på ${esc(g.title.toLocaleLowerCase())}</button><button class="btn btn-outline" type="button" data-pron-link="${g.id}">Lenke til temaet</button></article>`).join('')}</div></details>
            <div class="pron-actions">${button('library', 'Finn en lyd', false, false)}</div>
            <section class="pron-download"><h2>Øv uten nett</h2><p>Last ned alle ${pronunciationManifest.files.length} modellopptakene. Hele pakken er ca. ${ (pronunciationManifest.files.reduce((sum, file) => sum + file.bytes, 0) / 1000000).toFixed(1).replace('.', ',') } MB. Nettleseren kan rydde plass; sjekk før timen.</p>${button('download', 'Last ned hele uttaleskolen', false, false)}<p id="pronunciationDownloadStatus" role="status"></p></section>
            <details class="pron-help"><summary>Om øving og fremgang</summary><p>Du kan øve uten å snakke eller ta opp. «Øvd» betyr at du har hørt ordet og setningen og valgt å gå videre etter egen øving. Appen vurderer ikke stemmen din.</p><p>Kildepakken har 31 lydtemaer. Egne opptak for ch og ü kommer ikke med i denne pakken. Spansk har flere gyldige regionale uttaler.</p>${button('export', 'Eksporter fremgang', false, false)} ${button('clear-progress', 'Slett bare uttaleøving', false, false)}</details>`);
        updateDownloadStatus();
    }
    function start(groupId) {
        if (activeSessionType) return;
        const selected = itemById(groupId);
        const group = catalog.groups.find(g => g.id === groupId) || (selected && { id: selected.id, title: selected.title, itemIds: [selected.id] }); if (!group) return;
        const items = core.selectSession(group, catalog.items, loadProgress());
        session = { group, items, index: 0, heardByIndex: items.map(() => new Set()), heard: null, done: new Set() };
        activeSessionType = 'pronunciation'; renderLesson();
    }
    function renderLesson() {
        const item = current(); if (!item) return;
        session.heard = session.heardByIndex[session.index];
        const practice = (role, title, text, meaning) => `<section class="pron-practice" aria-labelledby="pronunciation-${role}-title">
            <h3 id="pronunciation-${role}-title">${title}</h3><p class="pron-example" lang="es" data-pron-text="${role}">${text}</p>
            <div class="pron-actions">${playButton(role, role === 'word' ? 'Hør ordet' : 'Hør setningen')}<span class="pron-heard" data-pron-heard="${role}" hidden>✓ Hørt</span></div>
            <details class="pron-meaning"><summary>Norsk betydning</summary><p>${esc(meaning)}</p></details>
            ${role === 'sentence' ? `<p class="pron-note">${esc(item.sentenceNote)}</p>` : ''}</section>`;
        shell(`<div class="pron-lesson">
            <div class="pron-toolbar">${button('exit', 'Avslutt økten', false, false)}<span>Lydkort ${session.index + 1} av ${session.items.length}</span></div>
            <p class="pron-eyebrow">${esc(session.group.title)}</p><h2>Øv på ${esc(item.title)}</h2>
            <div class="pron-rule"><p>${esc(item.explanation)}</p></div>
            <p class="pron-instruction">Les høyt. Hør modellen og prøv igjen.</p>
            ${practice('word', 'Ord', marked(item, 'word'), item.wordNo)}
            ${practice('sentence', 'Setning', marked(item, 'sentence'), item.sentenceNo)}
            <details id="pronunciationRecordingOptions" class="pron-recording-options"><summary>Ta opp og sammenlign (valgfritt)</summary><div id="pronunciationRecorder"></div></details>
            <div class="pron-card-navigation"><p id="pronunciationLessonHint" class="pron-note">Hør ordet og setningen før du går videre.</p>
            <nav class="pron-card-nav" aria-label="Bytt lydkort">${button('previous', 'Forrige lyd', session.index === 0, false)}${button('next', session.index === session.items.length - 1 ? 'Fullfør økten' : 'Neste lyd', true)}</nav></div>
        </div>`);
        mountRecorder();
        document.getElementById('pronunciationRecordingOptions').addEventListener('toggle', event => {
            if (!event.target.isConnected) return;
            if (!event.target.open) clearRecording();
            else event.target.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
        updateButtons();
    }
    function updateButtons() {
        if (!session) return;
        for (const role of ['word', 'sentence']) {
            const badge = root().querySelector(`[data-pron-heard="${role}"]`);
            if (badge) badge.hidden = !session.heard.has(role);
        }
        const ready = session.heard.has('word') && session.heard.has('sentence');
        const next = root().querySelector('[data-pron-action="next"]'); if (next) next.disabled = !ready;
        const hint = document.getElementById('pronunciationLessonHint');
        if (hint) hint.textContent = ready ? 'Prøv gjerne en gang til, eller gå videre.' : session.heard.has('word') ? 'Hør også setningen før du går videre.' : 'Hør ordet og setningen før du går videre.';
    }
    function complete() {
        if (!session || !session.heard.has('word') || !session.heard.has('sentence')) return;
        const now = new Date(); const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        saveProgress({ schemaVersion: 1, catalogVersion: catalog.catalogVersion, practiced: [{ itemId: current().id, contentVersion: current().contentVersion, practicedOn: localDate }] });
        session.done.add(current().id); session.index++;
        if (session.index < session.items.length) {
            renderLesson();
            if (storageError) status(storageError);
        } else {
            const result = session; session = null; activeSessionType = null;
            shell(`<div class="pron-lesson"><h2>Ferdig for nå!</h2><p>Du har øvd på ${result.done.size} lydkort.</p>${storageError ? `<p role="alert">${esc(storageError)}</p>` : ''}<p>Prøv gjerne en kort økt igjen en annen dag.</p>${button('overview', 'Tilbake til temaene')}<button type="button" class="btn btn-secondary" data-pron-start="${result.group.id}">Øv videre på temaet</button></div>`);
        }
    }
    function close() { globalThis.PronunciationOffline.cancel(); stopModel(); clearRecording(); session = null; if (activeSessionType === 'pronunciation') activeSessionType = null; }
    function renderLibrary() {
        shell(`<div class="pron-toolbar">${button('overview', 'Tilbake til temaene', false, false)}</div><h2>Finn en lyd</h2><p>Alle modellopptakene samlet. Denne visningen registrerer ingen fremgang.</p><label for="pronunciationSearch">Søk etter en lyd eller et ord</label><input class="pron-search" id="pronunciationSearch" type="search" autocomplete="off" placeholder="For eksempel ñ, queso eller vokal"><div id="pronunciationLibrary"></div>`);
        filterLibrary('');
    }
    function filterLibrary(query) {
        stopModel();
        const normalized = query.trim().toLocaleLowerCase();
        const matches = catalog.items.filter(item => [item.title, item.word, item.wordNo, catalog.groups.find(g => g.itemIds.includes(item.id)).title].join(' ').toLocaleLowerCase().includes(normalized));
        document.getElementById('pronunciationLibrary').innerHTML = matches.map(item => `<details class="pron-library-card"><summary>${esc(item.title)} <span lang="es">· ${esc(item.word)}</span></summary><p>${esc(item.explanation)}</p><div class="pron-actions">${playButton('word', 'Lytt til ordet / ordene', item)}${playButton('sentence', 'Lytt til setningen', item)}</div><p class="pron-example" lang="es">${marked(item, 'sentence')}</p><p>${esc(item.sentenceNo)}</p><p class="pron-note">${esc(item.sentenceNote)}</p></details>`).join('') || '<p>Ingen lyder passer med søket.</p>';
    }
    // Shared controllers keep model caching separate from temporary learner audio.
    function mountRecorder() { globalThis.PronunciationRecording.mount(document.getElementById('pronunciationRecorder'), { beforeStart: stopModel }); recorder = globalThis.PronunciationRecording; }
    function updateDownloadStatus() { globalThis.PronunciationOffline.status(); }
    function route() {
        const match = /^#uttale(?:\/([a-z-]+))?$/.exec(location.hash);
        if (!match || document.getElementById('mainApp').classList.contains('hidden')) return false;
        if (match[1] && !catalog.groups.some(g => g.id === match[1])) return false;
        if (activeSessionType) return false;
        showPage('pronunciation'); renderOverview(match[1] || ''); return true;
    }
    root()?.addEventListener('input', event => { if (event.target.id === 'pronunciationSearch') filterLibrary(event.target.value); });
    root()?.addEventListener('click', event => {
        const target = event.target.closest('button'); if (!target || target.disabled) return;
        if (target.dataset.pronSound) { close(); start(target.dataset.pronSound); return; }
        if (target.dataset.pronStart) { start(target.dataset.pronStart); return; }
        if (target.dataset.pronPlay) { play(target.dataset.pronPlay, target.dataset.pronItem); return; }
        if (target.dataset.pronLink) {
            const link = new URL(location.href); link.hash = 'uttale/' + target.dataset.pronLink;
            let box = document.getElementById('pronunciationShare');
            if (!box) { box = document.createElement('div'); box.id = 'pronunciationShare'; root().prepend(box); }
            box.innerHTML = `<label for="pronunciationShareInput">Kopier denne lenken til leksen: ${esc(catalog.groups.find(g => g.id === target.dataset.pronLink).title)}</label><input id="pronunciationShareInput" class="pron-search" readonly value="${esc(link.href)}"><p>Be eleven gjøre én kort økt. Ingenting sendes til læreren.${location.protocol === 'file:' ? ' Denne lokale filadressen må erstattes med appens nettadresse når den publiseres.' : ''}</p>`;
            box.querySelector('input').focus(); box.querySelector('input').select(); return;
        }
        const action = target.dataset.pronAction;
        if (action === 'overview' || action === 'exit') { close(); renderOverview(); }
        if (action === 'library') renderLibrary();
        if (action === 'previous' && session?.index > 0) { session.index--; renderLesson(); }
        if (action === 'next') complete();
        if (action === 'download') globalThis.PronunciationOffline.download();
        if (action === 'export') exportAllProgress();
        if (action === 'clear-progress' && confirm('Slette bare uttaleøving? Eksporter først hvis du vil beholde en kopi. Andre øvelser beholdes.')) { clearRecording(); localStorage.removeItem(core.KEY); storageError = ''; renderOverview(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { stopModel(); clearRecording(); } });
    window.addEventListener('pagehide', () => { stopModel(); clearRecording(); });
    window.addEventListener('hashchange', route);
    globalThis.Pronunciation = { open, close, route, loadProgress, exportProgress, importProgress: saveProgress, clearRecording };
})();

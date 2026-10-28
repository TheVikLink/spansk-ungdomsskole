(() => {
    'use strict';
    let container = null, beforeStart = () => {}, state = 'idle', generation = 0;
    let stream = null, recording = null, chunks = [], bytes = 0, timer = null, ownAudio = null, objectUrl = null, message = '';
    const MAX_BYTES = 1000000, MAX_MS = 15000;
    const stopTracks = () => { stream?.getTracks().forEach(track => { track.onended = null; track.stop(); }); stream = null; };
    function render() {
        if (!container?.isConnected) return;
        const restoreFocus = container.contains(document.activeElement);
        container.className = 'pron-record'; container.dataset.state = state;
        const button = (action, label, disabled = false) => `<button class="btn btn-secondary" type="button" data-record-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
        container.innerHTML = `<h3>Midlertidig opptak</h3><p>Valgfritt: Opptaket brukes bare mens du øver. Det sendes ikke og lagres ikke som en fil eller i fremgangen din. Det slettes når du tar et nytt, går videre eller forlater oppgaven.</p><p id="pronunciationRecordingStatus" role="status" aria-live="polite"></p><div class="pron-actions">${
            state === 'waiting' ? button('clear', 'Avbryt – øv uten mikrofon') :
            state === 'recording' ? button('stop', 'Stopp opptaket') :
            state === 'processing' ? button('clear', 'Slett opptaket') :
            state === 'ready' ? button('play', 'Hør mitt opptak') + button('pause', 'Stopp avspilling') + button('start', 'Ta et nytt opptak') + button('clear', 'Slett opptaket') :
            button('start', 'Ta opp stemmen min')
        }</div><p class="pron-note">Maks 15 sekunder. Du kan alltid fortsette uten mikrofon.</p>`;
        const status = container.querySelector('#pronunciationRecordingStatus');
        status.textContent = state === 'waiting' ? 'Venter på mikrofontillatelse. Du kan avbryte og øve uten mikrofon.' : state === 'recording' ? 'Tar opp – mikrofonen er på. Stopp når du er ferdig.' : state === 'processing' ? 'Mikrofonen er av. Gjør opptaket klart til lytting.' : message;
        if (ownAudio) container.append(ownAudio);
        if (restoreFocus) container.querySelector('button')?.focus({ preventScroll: true });
    }
    function clear() {
        generation++; clearTimeout(timer); timer = null;
        if (recording) {
            recording.ondataavailable = null; recording.onstop = null; recording.onerror = null;
            if (recording.state !== 'inactive') { try { recording.stop(); } catch {} }
        }
        recording = null; stopTracks(); chunks = []; bytes = 0;
        if (ownAudio) { ownAudio.oncanplay = null; ownAudio.onerror = null; ownAudio.pause(); ownAudio.removeAttribute('src'); ownAudio.load(); ownAudio.remove(); }
        ownAudio = null;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = null; state = 'idle'; message = 'Ingen opptak er beholdt.'; render();
    }
    function failed(text) { clear(); message = text + ' Du kan fortsatt øve uten mikrofon.'; render(); }
    function stop() {
        if (state !== 'recording') return;
        state = 'processing'; clearTimeout(timer); timer = null;
        try { recording.stop(); stopTracks(); render(); }
        catch { failed('Opptaket ble avbrutt og er fjernet.'); }
    }
    async function start() {
        if (['waiting', 'recording', 'processing'].includes(state)) return;
        clear(); beforeStart();
        if (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            failed('Opptak er ikke tilgjengelig i denne nettleseren. Bruk appens sikre nettadresse dersom du vil ta opp.'); return;
        }
        const token = generation;
        state = 'waiting'; render();
        try {
            const granted = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            if (token !== generation || !container?.isConnected || document.hidden) { granted.getTracks().forEach(track => track.stop()); return; }
            stream = granted;
            const probe = document.createElement('audio');
            const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type) && probe.canPlayType(type));
            recording = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 });
            const recorder = recording;
            recorder.ondataavailable = event => {
                if (token !== generation || !event.data?.size) return;
                bytes += event.data.size;
                if (bytes > MAX_BYTES) { failed('Opptaket ble for stort og er fjernet. Prøv et kortere forsøk.'); return; }
                chunks.push(event.data);
                if (bytes === MAX_BYTES) stop();
            };
            recorder.onerror = () => { if (token === generation) failed('Opptaket kunne ikke fullføres.'); };
            recorder.onstop = () => {
                if (token !== generation) return;
                clearTimeout(timer); timer = null; stopTracks();
                recording = null;
                if (!bytes || bytes > MAX_BYTES) { failed('Det kom ikke et spillbart opptak.'); return; }
                const blob = new Blob(chunks, { type: recorder.mimeType }); chunks = []; bytes = 0;
                objectUrl = URL.createObjectURL(blob);
                ownAudio = document.createElement('audio'); ownAudio.id = 'pronunciationOwnAudio'; ownAudio.hidden = true; ownAudio.preload = 'auto';
                ownAudio.oncanplay = () => { if (token !== generation) return; ownAudio.oncanplay = null; state = 'ready'; message = 'Mikrofonen er av. Du kan høre og sammenligne opptaket.'; render(); };
                ownAudio.onerror = () => { if (token === generation) failed('Nettleseren kunne ikke spille opptaket.'); };
                ownAudio.src = objectUrl; render(); ownAudio.load();
            };
            stream.getTracks().forEach(track => { track.onended = () => { if (token === generation) stop(); }; });
            recorder.start(250); state = 'recording'; render();
            timer = setTimeout(stop, MAX_MS);
        } catch (error) {
            if (token !== generation) return;
            const text = error.name === 'NotAllowedError' ? 'Mikrofonen er ikke tillatt.' : error.name === 'NotFoundError' ? 'Fant ingen mikrofon.' : 'Mikrofonen eller opptaksformatet er ikke tilgjengelig.';
            failed(text);
        }
    }
    function pause() { ownAudio?.pause(); }
    function mount(element, options) {
        clear(); container = element; beforeStart = options.beforeStart; message = ''; render();
        // The element itself survives state renders; assigning replaces any previous handler.
        if (container) container.onclick = event => {
            const action = event.target.closest('button')?.dataset.recordAction;
            if (action === 'start') start();
            if (action === 'stop') stop();
            if (action === 'clear') clear();
            if (action === 'pause') pause();
            if (action === 'play' && state === 'ready' && ownAudio) {
                const token = generation;
                beforeStart(); ownAudio.currentTime = 0;
                ownAudio.play().catch(() => { if (token === generation) failed('Nettleseren kunne ikke spille opptaket.'); });
            }
        };
    }
    globalThis.PronunciationRecording = { mount, stop, pause, clear };
})();

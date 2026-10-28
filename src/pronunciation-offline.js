(() => {
    'use strict';
    const files = pronunciationManifest.files;
    const cacheName = 'spansk123-audio-v1';
    let controller = null, viewToken = 0;
    const available = () => Boolean(globalThis.isSecureContext && globalThis.caches && globalThis.crypto?.subtle && /^https?:$/.test(location.protocol));
    const url = file => new URL(file.path, location.href).href;
    async function valid(response, file) {
        if (!response || response.status !== 200 || !response.headers.get('content-type')?.startsWith('audio/')) return false;
        const bytes = await response.clone().arrayBuffer();
        if (bytes.byteLength !== file.bytes) return false;
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
        return hash === file.sha256;
    }
    function text(message) { const el = document.getElementById('pronunciationDownloadStatus'); if (el) el.textContent = message; }
    function buttons(busy) {
        const button = document.querySelector('[data-pron-action="download"]'); if (button) button.disabled = busy;
        document.getElementById('pronunciationCancelDownload')?.remove();
        if (busy && button) {
            const cancel = document.createElement('button'); cancel.id = 'pronunciationCancelDownload'; cancel.className = 'btn btn-secondary'; cancel.type = 'button'; cancel.textContent = 'Avbryt nedlastingen'; cancel.onclick = () => controller?.abort(); button.after(cancel);
        }
    }
    async function removeAlphabetClips(cache) {
        for (const request of await cache.keys()) {
            if (request.url.startsWith(new URL('audio/uttale/refold-v1/', location.href).href) && /_letter\.mp3$/.test(new URL(request.url).pathname)) await cache.delete(request);
        }
    }
    async function status() {
        const token = ++viewToken;
        if (controller) return;
        if (!available()) { text('Offline-nedlasting krever appens nettadresse med HTTPS eller localhost. Modellfilene kan fortsatt spilles fra en komplett lokal appmappe.'); return; }
        try {
            const cache = await caches.open(cacheName); await removeAlphabetClips(cache); let count = 0;
            for (const file of files) if (await valid(await cache.match(url(file)), file)) count++;
            if (token === viewToken && !controller) text(`${count} av ${files.length} opptak er klare uten nett.${count === files.length ? ' Hele uttaleskolen er lastet ned.' : ' Last ned resten før du øver uten nett.'}`);
        } catch { if (token === viewToken) text('Kunne ikke kontrollere lagringsplassen. Du kan øve med internett.'); }
    }
    async function download() {
        if (controller) return;
        if (!available()) { await status(); return; }
        controller = new AbortController(); const request = controller; viewToken++;
        buttons(true); text('Kontrollerer og laster ned modellopptak …');
        let count = 0;
        try {
            const cache = await caches.open(cacheName); await removeAlphabetClips(cache);
            for (const file of files) {
                if (request.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                const key = url(file);
                if (!(await valid(await cache.match(key), file))) {
                    // Otherwise the service worker would serve the damaged cached copy again.
                    await cache.delete(key);
                    const timeout = setTimeout(() => request.abort(), 15000);
                    try {
                        const response = await fetch(key, { cache: 'reload', credentials: 'omit', signal: request.signal });
                        if (!(await valid(response, file))) throw new Error('Ufullstendig eller feil lydfil');
                        if (request.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                        await cache.put(key, response);
                    }
                    finally { clearTimeout(timeout); }
                }
                count++; text(`${count} av ${files.length} opptak er klare uten nett.${count === files.length ? ' Hele uttaleskolen er lastet ned.' : ' Laster ned …'}`);
            }
        } catch (error) {
            text(`${count} opptak kontrollert denne gangen. ${error.name === 'AbortError' ? 'Nedlastingen ble avbrutt.' : 'Nedlastingen ble ikke fullført. Sjekk nett og ledig lagringsplass.'} Prøv igjen for å fortsette med filene som mangler.`);
        } finally { if (controller === request) controller = null; buttons(false); }
    }
    function cancel() { viewToken++; controller?.abort(); }
    window.addEventListener('pagehide', cancel);
    globalThis.PronunciationOffline = { status, download, cancel };
})();

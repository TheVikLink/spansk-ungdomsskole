const copyBtn = document.querySelector('[data-copy-student-link]');
const statusEl = document.querySelector('[data-student-link-status]');

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  return false;
}

if (copyBtn && statusEl) {
  copyBtn.addEventListener('click', async () => {
    const lessonId = copyBtn.dataset.lessonId || '';
    const isFree = copyBtn.dataset.free === 'true';
    copyBtn.disabled = true;
    statusEl.textContent = 'Lager elevlenke …';
    try {
      let targetUrl = new URL('elev.html', window.location.href).href;
      let expiresNote = '';
      if (!isFree && window.location.protocol.startsWith('http')) {
        const response = await fetch('/api/license/student-link', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ lessonId }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.url) targetUrl = new URL(data.url, window.location.origin).href;
          if (data?.expiresAt) expiresNote = `, gyldig til ${data.expiresAt}`;
        }
      }
      const copied = await copyText(targetUrl);
      statusEl.textContent = copied
        ? `Elevlenke kopiert (uten fasit${expiresNote}).`
        : `Kopier elevlenken (uten fasit${expiresNote}): ${targetUrl}`;
    } catch {
      const fallbackUrl = new URL('elev.html', window.location.href).href;
      const copied = await copyText(fallbackUrl);
      statusEl.textContent = copied
        ? 'Elevlenke kopiert (uten fasit).'
        : `Kopier elevlenken (uten fasit): ${fallbackUrl}`;
    } finally {
      copyBtn.disabled = false;
    }
  });
}

const audio = document.querySelector('audio');
const speedGroup = document.querySelector('[data-audio-speed]');
if (audio && speedGroup) {
  const speedButtons = [...speedGroup.querySelectorAll('button[data-rate]')];
  for (const btn of speedButtons) {
    btn.addEventListener('click', () => {
      const rate = Number(btn.dataset.rate) || 1;
      audio.playbackRate = rate;
      audio.defaultPlaybackRate = rate;
      for (const candidate of speedButtons) {
        candidate.setAttribute('aria-pressed', candidate === btn ? 'true' : 'false');
      }
    });
  }
}

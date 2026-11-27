(() => {
  'use strict';

  const ALLOWED_ORIGINS = new Set(['https://www.spansk123.no', 'https://spansk123.no']);
  const BLOCKED_PREFIXES = ['/school', '/auth/', '/api/'];
  const ALLOWED_EVENTS = new Set(['pdf_download', 'audio_play', 'license_activate']);
  const SLUG_RE = /^[a-z0-9-]+$/u;
  const PDF_PATH_RE = /^\/undervisning\/([a-z0-9-]+)\/([a-z0-9-]+\.pdf)$/u;
  const LESSON_PATH_RE = /^\/undervisning\/([a-z0-9-]+)\//u;
  const MP3_FILE_RE = /^([a-z0-9-]+\.mp3)$/u;

  function ensureVaQueue() {
    if (typeof window.va !== 'function') {
      window.va = function () {
        (window.vaq = window.vaq || []).push(arguments);
      };
    }
  }

  function sanitizeUrl(rawUrl) {
    try {
      const parsed = new URL(String(rawUrl || window.location.href), window.location.origin);
      const pathname = parsed.pathname || '/';
      if (BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
        return null;
      }
      return `${parsed.origin}${pathname}`;
    } catch {
      return null;
    }
  }

  function sanitizeEventPayload(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.type === 'pageview') {
      const cleanUrl = sanitizeUrl(raw.url);
      return cleanUrl ? { ...raw, url: cleanUrl } : null;
    }
    if (raw.type !== 'event') {
      return null;
    }

    const hasPayload = Boolean(raw.payload && typeof raw.payload === 'object');
    const source = hasPayload ? raw.payload : raw;
    const eventName = typeof source.name === 'string' ? source.name : '';
    if (!ALLOWED_EVENTS.has(eventName)) return null;

    const cleanUrl = sanitizeUrl(raw.url);
    if (!cleanUrl) return null;

    const inputData = source.data && typeof source.data === 'object' ? source.data : null;
    if (!inputData) return null;

    let cleanData = null;
    if (eventName === 'license_activate') {
      const type = inputData.type === 'demo' || inputData.type === 'school' ? inputData.type : null;
      if (!type) return null;
      cleanData = { type };
    } else {
      const lesson = typeof inputData.lesson === 'string' && SLUG_RE.test(inputData.lesson) ? inputData.lesson : null;
      const file = typeof inputData.file === 'string' && /^[a-z0-9.-]+$/u.test(inputData.file) ? inputData.file : null;
      if (!lesson || !file) return null;
      cleanData = { lesson, file };
    }

    if (hasPayload) {
      return {
        ...raw,
        url: cleanUrl,
        payload: {
          name: eventName,
          data: cleanData,
        },
      };
    }

    return {
      ...raw,
      url: cleanUrl,
      name: eventName,
      data: cleanData,
    };
  }

  function isOptedOut() {
    try {
      if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return true;
      if (navigator.onLine === false) return true;
      // Intentional privacy guard (matching src/visitor-analytics.js and docs/besoksstatistikk.md):
      // never attach a pre-existing Vercel attribution identity to anonymous counts.
      if (window.localStorage && window.localStorage.getItem('__va_attribution')) return true;
    } catch {
      return false;
    }
    return false;
  }

  function shouldInjectVercelScript() {
    if (isOptedOut()) return false;
    if (!ALLOWED_ORIGINS.has(window.location.origin)) return false;
    return Boolean(window.location.protocol === 'https:');
  }

  function injectVercelInsightsScript() {
    if (!shouldInjectVercelScript()) return;
    if (document.querySelector('script[data-spansk123-va="1"], script[src="/_vercel/insights/script.js"]')) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    script.referrerPolicy = 'no-referrer';
    script.setAttribute('data-spansk123-va', '1');
    (document.head || document.body || document.documentElement).appendChild(script);
  }

  function initCustomEvents() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;
      let resolved;
      try {
        resolved = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (resolved.origin !== window.location.origin) return;
      const match = PDF_PATH_RE.exec(resolved.pathname);
      if (!match) return;
      window.va('event', {
        name: 'pdf_download',
        data: {
          lesson: match[1],
          file: match[2],
        },
      });
    });

    const playedAudio = new WeakSet();
    document.addEventListener(
      'play',
      (event) => {
        const audio = event.target;
        if (!(audio instanceof HTMLAudioElement)) return;
        if (playedAudio.has(audio)) return;
        const lessonMatch = LESSON_PATH_RE.exec(window.location.pathname);
        if (!lessonMatch) return;
        const rawSrc = audio.currentSrc || audio.getAttribute('src') || '';
        if (!rawSrc) return;
        let resolved;
        try {
          resolved = new URL(rawSrc, window.location.href);
        } catch {
          return;
        }
        const basename = resolved.pathname.split('/').pop() || '';
        const fileMatch = MP3_FILE_RE.exec(basename);
        if (!fileMatch) return;
        playedAudio.add(audio);
        window.va('event', {
          name: 'audio_play',
          data: {
            lesson: lessonMatch[1],
            file: fileMatch[1],
          },
        });
      },
      true
    );
  }

  ensureVaQueue();
  window.va('beforeSend', (event) => sanitizeEventPayload(event));
  injectVercelInsightsScript();
  initCustomEvents();
})();

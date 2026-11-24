// Public entry-page counts only. Included exclusively by the opt-in Vercel build.
(() => {
  try {
    const publicHosts = new Set(['www.spansk123.no', 'spansk123.no']);
    const publicPaths = new Set(['/', '/index.html']);
    if (location.protocol !== 'https:' || !publicHosts.has(location.hostname) || !publicPaths.has(location.pathname)) return;
    if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.onLine === false) return;
    // Never attach a pre-existing Vercel identity to these aggregate counts.
    if (localStorage.getItem('__va_attribution')) return;
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      // The vendor's hook cannot redact document.referrer: fail closed instead.
      if (!['https:', 'http:'].includes(referrer.protocol) || referrer.pathname !== '/' || referrer.search || referrer.hash || referrer.username || referrer.password) return;
    }
    if (window.__spanskVisitorAnalytics || window.va || window.vaq || window.vai) return;
    window.__spanskVisitorAnalytics = true;
    let counted = false;
    window.va = (...args) => { (window.vaq = window.vaq || []).push(args); };
    window.va('beforeSend', event => {
      if (counted || !event || event.type !== 'pageview') return null;
      try {
        const url = new URL(event.url);
        if (url.origin !== location.origin || !publicPaths.has(url.pathname)) return null;
        counted = true;
        return { type: 'pageview', url: `${location.origin}/` };
      } catch { return null; }
    });
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    script.referrerPolicy = 'no-referrer';
    document.head.appendChild(script);
  } catch {
    // Blocked storage, missing analytics or an offline network must not stop practice.
  }
})();

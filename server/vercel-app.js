import express from 'express';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSchoolContentAudioPath } from './activity-catalog.js';
import {
  HOME_MARKDOWN,
  attachAgentReadinessRoutes,
  prefersMarkdown,
  renderNotFoundMarkdown,
} from './agent-readiness.js';
import { createSchoolRuntime } from './runtime.js';
import { startupFailureCode } from './startup-diagnostics.js';
import { createUndervisningRouter } from './undervisning-access.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC_HTML_CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";
const SCHOOL_INFO_CSP = "default-src 'none'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
const FAVICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="36" fill="#dc2626"/><text x="96" y="122" text-anchor="middle" font-size="96">🇪🇸</text></svg>';
const FAVICON_LINK = '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 192 192\'%3E%3Crect width=\'192\' height=\'192\' rx=\'36\' fill=\'%23dc2626\'/%3E%3Ctext x=\'96\' y=\'122\' text-anchor=\'middle\' font-size=\'96\'%3E%F0%9F%87%AA%F0%9F%87%B8%3C/text%3E%3C/svg%3E">';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function lessonSlug(name) {
  return String(name || '')
    .toLowerCase()
    .replaceAll('æ', 'ae')
    .replaceAll('ø', 'o')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
}

function loadAllowedLessonLookup() {
  const byId = new Map();
  const byActivity = new Map();
  const byTitle = new Map();
  try {
    const themes = JSON.parse(readFileSync(path.join(projectRoot, 'data', 'lesson-themes.json'), 'utf8'));
    const culture = JSON.parse(readFileSync(path.join(projectRoot, 'data', 'lesson-culture.json'), 'utf8'));
    for (const lesson of [...themes, ...culture]) {
      const id = lesson.pack || lesson.theme || lessonSlug(lesson.category);
      const title = typeof lesson.title === 'string' ? lesson.title.trim() : '';
      if (!id || !title) continue;
      byId.set(id, title);
      byTitle.set(title, title);
      if (lesson.category) byActivity.set(`vocabulary.${id}.v1`, title);
    }
  } catch {
    // Allowlist stays empty if lesson data files are unavailable.
  }
  return { byId, byActivity, byTitle };
}

const ALLOWED_LESSONS = loadAllowedLessonLookup();

function resolveAllowedSchoolLessonTitle(query) {
  if (!query || typeof query !== 'object') return null;
  if (typeof query.lesson === 'string' && ALLOWED_LESSONS.byId.has(query.lesson)) {
    return ALLOWED_LESSONS.byId.get(query.lesson);
  }
  if (typeof query.title === 'string' && ALLOWED_LESSONS.byTitle.has(query.title)) {
    return ALLOWED_LESSONS.byTitle.get(query.title);
  }
  if (typeof query.activity === 'string' && ALLOWED_LESSONS.byActivity.has(query.activity)) {
    return ALLOWED_LESSONS.byActivity.get(query.activity);
  }
  return null;
}

function buildSchoolInfoMailto(selectedTitle) {
  const topicLine = selectedTitle ? `\nTema av interesse: ${selectedTitle}` : '';
  const subject = encodeURIComponent('Bestilling eller demo: Skolepakke med Feide (Spansk på 1-2-3)');
  const body = encodeURIComponent(
    `Hei Ole Henrik,\n\nSkolen eller kommunen vår ønsker en 15-minutters demo eller DBA-pakke for Skolepakke med Feide.${topicLine}\n\nSkole eller kommune:\nKontaktperson:\nØnsket tidspunkt:`,
  );
  return `mailto:ole@spansk123.no?subject=${subject}&body=${body}`;
}

function renderSchoolInfoHtml(query) {
  const selectedTitle = resolveAllowedSchoolLessonTitle(query);
  const mailtoHref = buildSchoolInfoMailto(selectedTitle);
  const selectedBanner = selectedTitle
    ? `\n    <div class="notice-banner" role="status">\n      <strong>Du valgte «${escapeHtml(selectedTitle)}» som digital Feide-lekse.</strong>\n      <p>Digital leksetildeling med Feide aktiveres per skole eller kommune. Bestill en 15-minutters demo eller DBA-pakke nedenfor, så kobler vi opp skolen deres.</p>\n    </div>`
    : '';
  return `<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#dc2626">
  ${FAVICON_LINK}
  <title>Skolepakke med Feide | Spansk på 1-2-3</title>
  <link rel="stylesheet" href="/undervisning/time.css">
</head>
<body>
  <main>
    <nav>
      <a href="/">Til øvingsappen</a>
      <a href="/undervisning/">Undervisningstimer</a>
    </nav>
    <header>
      <h1>Skolepakke med Feide</h1>
      <p>Digital leksetildeling, læreroversikt og 46 ferdige 45-minutters undervisningstimer for ungdomsskolen og spansk nivå I i videregående.</p>
    </header>${selectedBanner}
    <section class="package-hero" aria-labelledby="schoolPackageTitle">
      <h2 id="schoolPackageTitle">Aktivering for skoler og kommuner</h2>
      <p>Feide-innlogging og læreroversikt aktiveres per skole eller kommune etter gjennomgang og signert skole- og databehandleravtale (DBA). Vi leverer ferdig DBA (bilag A til D), elevdataflyt og teknisk DPIA-underlag.</p>
      <ul class="package-highlights">
        <li>Feide-innlogging med klasseinvitasjon og lærergodkjenning</li>
        <li>1-klikks leksetildeling fra alle 46 undervisningstimer</li>
        <li>Læreroversikt over ordforråd, grammatikk, verb og lytting</li>
        <li>Minimal datainnsamling: skrivesvar rettes i minnet og lagres aldri</li>
      </ul>
      <p><strong>Pris: 4 995 kr eks. mva. første år</strong> (introduksjonspris for inntil 6 klasser, deretter 7 900 kr eks. mva. per år). Kommune- eller fylkespakke: <strong>19 900 kr eks. mva. per år</strong> for inntil 5 skoler. Vil dere starte i dag uten Feide og uten elevdata? Se <a href="/undervisning/">Undervisningspakken (3 490 kr eks. mva. per skole per år)</a>.</p>
      <div class="package-actions">
        <a class="btn-primary" href="${mailtoHref}">Bestill 15-minutters demo eller DBA-pakke</a>
        <a class="btn-secondary" href="/undervisning/">Prøv 4 gratis undervisningstimer</a>
      </div>
    </section>
    <section>
      <h2>Kom i gang i klasserommet i dag</h2>
      <p>Elevene kan bruke <a href="/">øvingsappen uten innlogging</a> med en gang, og lærere kan åpne <a href="/undervisning/">fire komplette 45-minutters prøvetimer</a> med lydopptak og utskrivbare A/B-samtalekort.</p>
    </section>
    <footer class="portal-footer">
      <a href="/about">Om oss</a> |
      <a href="/contact">Kontakt</a> |
      <a href="/privacy">Personvern</a> |
      <a href="/besoksstatistikk.html">Besøksstatistikk og personvern</a>
    </footer>
  </main>
</body>
</html>`;
}

const NOT_FOUND_HTML = `<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#dc2626">
  ${FAVICON_LINK}
  <title>Fant ikke siden | Spansk på 1-2-3</title>
  <link rel="stylesheet" href="/undervisning/time.css">
</head>
<body>
  <main>
    <nav>
      <a href="/">Til øvingsappen</a>
      <a href="/undervisning/">Undervisningstimer</a>
      <a href="/school">Skolepakke med Feide</a>
    </nav>
    <header>
      <h1>Fant ikke siden (404)</h1>
      <p>Adressen du åpnet finnes ikke på Spansk på 1-2-3.</p>
    </header>
    <section class="package-hero">
      <p>Gå videre til en av hovedsidene:</p>
      <div class="package-actions">
        <a class="btn-primary" href="/">Åpne øvingsappen</a>
        <a class="btn-secondary" href="/undervisning/">Se undervisningstimer</a>
        <a class="btn-secondary" href="/school">Skolepakke med Feide</a>
      </div>
    </section>
    <footer class="portal-footer">
      <a href="/about">Om oss</a> |
      <a href="/contact">Kontakt</a> |
      <a href="/privacy">Personvern</a> |
      <a href="/llms.txt">llms.txt</a> |
      <a href="/sitemap.xml">sitemap.xml</a>
    </footer>
  </main>
</body>
</html>`;

function isSchoolRuntimeEndpoint(pathname) {
  return pathname === '/healthz'
    || pathname === '/school'
    || pathname === '/school/'
    || pathname.startsWith('/api/')
    || pathname.startsWith('/auth/');
}

export function createLazyFunctionApp(loadRuntime) {
  const app = express();
  app.disable('x-powered-by');
  let runtimePromise;

  app.get(['/', '/index.html'], (req, res) => {
    res.vary('Accept');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (prefersMarkdown(req)) {
      return res.status(200).type('text/markdown; charset=utf-8').send(HOME_MARKDOWN);
    }
    res.setHeader('Content-Security-Policy', PUBLIC_HTML_CSP);
    return res.sendFile(path.join(projectRoot, 'index.html'));
  });

  app.get('/manifest.webmanifest', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.sendFile(path.join(projectRoot, 'manifest.webmanifest'));
  });

  app.get('/sw.js', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.type('application/javascript').sendFile(path.join(projectRoot, 'sw.js'));
  });

  app.get('/dist/tailwind.css', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.sendFile(path.join(projectRoot, 'dist/tailwind.css'));
  });

  app.get('/school.js', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.type('js').sendFile(path.join(projectRoot, 'server/public/school.js'));
  });

  app.get('/school.css', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.type('css').sendFile(path.join(projectRoot, 'server/public/school.css'));
  });

  app.get('/favicon.ico', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.type('image/svg+xml').send(FAVICON_SVG);
  });

  attachAgentReadinessRoutes(app, { projectRoot, infoCsp: SCHOOL_INFO_CSP });

  app.get('/docs/kultur/:packId/:page', (req, res) => {
    const packId = req.params.packId;
    const page = req.params.page;
    if (!/^[a-z0-9-]+$/u.test(packId) || (page !== 'index.html' && page !== 'laerer.html')) {
      return res.status(404).end();
    }
    const targetFile = page === 'laerer.html' ? 'index.html' : 'elev.html';
    return res.redirect(302, `/undervisning/${encodeURIComponent(packId)}/${targetFile}`);
  });

  app.get(['/school.html', '/skole', '/skole/'], (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.redirect(301, '/school');
  });

  app.get(['/besoksstatistikk', '/besoksstatistikk/', '/personvern', '/personvern.html'], (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.redirect(301, '/besoksstatistikk.html');
  });

  app.get('/besoksstatistikk.html', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    return res.sendFile(path.join(projectRoot, 'src', 'visitor-analytics-privacy.html'), (error) => {
      if (error && !res.headersSent) res.status(404).end();
    });
  });

  app.get('/googleda8e06f12dba466d.html', (_req, res) => {
    return res.sendFile(path.join(projectRoot, 'googleda8e06f12dba466d.html'), (error) => {
      if (error && !res.headersSent) res.status(404).end();
    });
  });

  app.get('/audio/school-content/:filename', (req, res) => {
    const assetPath = getSchoolContentAudioPath(req.params.filename);
    if (!assetPath) return res.status(404).end();
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return res.sendFile(assetPath, (error) => {
      if (error && !res.headersSent) res.status(404).end();
    });
  });

  app.use('/audio', express.static(path.join(projectRoot, 'audio'), { fallthrough: true, immutable: true, maxAge: '1d' }));
  app.use('/audio', (_req, res) => res.status(404).end());

  app.use(createUndervisningRouter({
    projectRoot,
    getSecret: () => process.env.LICENSE_SIGNING_SECRET || process.env.SESSION_SECRET || '',
    cookieSecure: process.env.NODE_ENV === 'production',
    enforcePaywall: process.env.UNDERVISNING_PAYWALL !== 'false',
  }));

  app.use((req, res, next) => {
    if (!runtimePromise) {
      runtimePromise = Promise.resolve().then(loadRuntime).then((runtime) => {
        if (!runtime?.app || typeof runtime.app !== 'function') throw new Error('Vercel runtime did not return an Express application');
        return runtime.app;
      }).catch((error) => {
        const failureCode = startupFailureCode(error);
        console.error(`School runtime initialization failed: ${failureCode}`);
        throw Object.assign(new Error(failureCode), { failureCode });
      });
    }

    const currentInitialization = runtimePromise;
    currentInitialization.then(
      (runtimeApp) => runtimeApp(req, res, next),
      (error) => {
        if (runtimePromise === currentInitialization) runtimePromise = undefined;
        if (res.headersSent) return;
        const failureCode = error?.failureCode || 'RUNTIME_INIT_FAILED';
        if (failureCode.startsWith('CONFIG_')) {
          if (req.method === 'GET' && (req.path === '/school' || req.path === '/school/')) {
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'same-origin');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('Content-Security-Policy', SCHOOL_INFO_CSP);
            return res.status(200).type('html').send(renderSchoolInfoHtml(req.query));
          }
          if (!isSchoolRuntimeEndpoint(req.path)) {
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Referrer-Policy', 'same-origin');
            res.setHeader('X-Frame-Options', 'DENY');
            res.vary('Accept');
            if ((req.method === 'GET' || req.method === 'HEAD') && prefersMarkdown(req)) {
              return res.status(404).type('text/markdown; charset=utf-8').send(renderNotFoundMarkdown(req.path));
            }
            res.setHeader('Content-Security-Policy', SCHOOL_INFO_CSP);
            if (req.method === 'GET' && req.accepts(['html', 'json']) === 'html') {
              return res.status(404).type('html').send(NOT_FOUND_HTML);
            }
            return res.status(404).json({ error: 'Fant ikke siden.' });
          }
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({ error: 'Tjenesten er midlertidig utilgjengelig' });
      },
    );
  });

  return app;
}

export default createLazyFunctionApp(() => createSchoolRuntime());

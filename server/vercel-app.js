import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSchoolContentAudioPath } from './activity-catalog.js';
import { createSchoolRuntime } from './runtime.js';
import { startupFailureCode } from './startup-diagnostics.js';
import { createUndervisningRouter } from './undervisning-access.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC_HTML_CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";
const SCHOOL_INFO_CSP = "default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
const SCHOOL_INFO_MAILTO = 'mailto:olevik91@gmail.com?subject=Bestilling%20eller%20demo%3A%20Skolepakke%20med%20Feide%20(Spansk%20p%C3%A5%201-2-3)&body=Hei%20Ole%20Henrik%2C%0A%0ASkolen%20eller%20kommunen%20v%C3%A5r%20%C3%B8nsker%20en%2015-minutters%20demo%20eller%20DBA-pakke%20for%20Skolepakke%20med%20Feide.%0A%0ASkole%20eller%20kommune%3A%0AKontaktperson%3A%0A%C3%98nsket%20tidspunkt%3A';
const SCHOOL_INFO_HTML = `<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
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
    </header>
    <section class="package-hero" aria-labelledby="schoolPackageTitle">
      <h2 id="schoolPackageTitle">Aktivering for skoler og kommuner</h2>
      <p>Feide-innlogging og læreroversikt aktiveres per skole eller kommune etter gjennomgang og signert skole- og databehandleravtale (DBA). Vi leverer ferdig DBA (bilag A til D), elevdataflyt og teknisk DPIA-underlag.</p>
      <ul class="package-highlights">
        <li>Feide-innlogging med klasseinvitasjon og lærergodkjenning</li>
        <li>1-klikks leksetildeling fra alle 46 undervisningstimer</li>
        <li>Læreroversikt over ordforråd, grammatikk, verb og lytting</li>
        <li>Minimal datainnsamling: skrivesvar rettes i minnet og lagres aldri</li>
      </ul>
      <p><strong>Pris: 4 995 kr første år</strong> (introduksjonspris for inntil 6 klasser, deretter 7 900 kr per år). Kommune- eller fylkespakke: <strong>19 900 kr per år</strong> for inntil 5 skoler. Vil dere starte i dag uten Feide og uten elevdata? Se <a href="/undervisning/">Undervisningspakken (3 490 kr per skole per år)</a>.</p>
      <div class="package-actions">
        <a class="btn-primary" href="${SCHOOL_INFO_MAILTO}">Bestill 15-minutters demo eller DBA-pakke</a>
        <a class="btn-secondary" href="/undervisning/">Prøv 3 gratis undervisningstimer</a>
      </div>
    </section>
    <section>
      <h2>Kom i gang i klasserommet i dag</h2>
      <p>Elevene kan bruke <a href="/">øvingsappen uten innlogging</a> med en gang, og lærere kan åpne <a href="/undervisning/">tre komplette 45-minutters prøvetimer</a> med lydopptak og utskrivbare A/B-samtalekort.</p>
    </section>
  </main>
</body>
</html>`;

export function createLazyFunctionApp(loadRuntime) {
  const app = express();
  app.disable('x-powered-by');
  let runtimePromise;

  app.get(['/', '/index.html'], (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
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
        if (req.method === 'GET' && (req.path === '/school' || req.path === '/school/') && failureCode.startsWith('CONFIG_')) {
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Referrer-Policy', 'same-origin');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('Content-Security-Policy', SCHOOL_INFO_CSP);
          return res.status(200).type('html').send(SCHOOL_INFO_HTML);
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({ error: 'Tjenesten er midlertidig utilgjengelig' });
      },
    );
  });

  return app;
}

export default createLazyFunctionApp(() => createSchoolRuntime());

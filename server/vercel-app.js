import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSchoolContentAudioPath } from './activity-catalog.js';
import { createSchoolRuntime } from './runtime.js';
import { startupFailureCode } from './startup-diagnostics.js';
import { createUndervisningRouter } from './undervisning-access.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC_HTML_CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'";

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
        console.error(`School runtime initialization failed: ${startupFailureCode(error)}`);
        throw error;
      });
    }

    const currentInitialization = runtimePromise;
    currentInitialization.then(
      (runtimeApp) => runtimeApp(req, res, next),
      () => {
        if (runtimePromise === currentInitialization) runtimePromise = undefined;
        if (res.headersSent) return;
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({ error: 'Tjenesten er midlertidig utilgjengelig' });
      },
    );
  });

  return app;
}

export default createLazyFunctionApp(() => createSchoolRuntime());

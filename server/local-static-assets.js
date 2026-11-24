import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getSchoolContentAudioPath } from './activity-catalog.js';
import { createUndervisningRouter } from './undervisning-access.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const schoolJs = fileURLToPath(new URL('./public/school.js', import.meta.url));
const schoolCss = fileURLToPath(new URL('./public/school.css', import.meta.url));

export function attachLocalStaticAssets(app) {
  const sendPublicFile = (file) => (_req, res) => res.sendFile(path.join(projectRoot, file));
  app.get(['/', '/index.html'], (_req, res, next) => {
    // The public practice document uses inline JavaScript, event handlers and styles.
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
    next();
  }, sendPublicFile('index.html'));
  app.get('/manifest.webmanifest', sendPublicFile('manifest.webmanifest'));
  app.get('/sw.js', (_req, res, next) => { res.type('application/javascript'); next(); }, sendPublicFile('sw.js'));
  app.get('/school.js', (_req, res) => res.type('js').sendFile(schoolJs));
  app.get('/school.css', (_req, res) => res.type('css').sendFile(schoolCss));
  app.get('/audio/school-content/:filename', (req, res) => {
    const assetPath = getSchoolContentAudioPath(req.params.filename);
    if (!assetPath) return res.status(404).end();
    return res.sendFile(assetPath, (error) => { if (error && !res.headersSent) res.status(404).end(); });
  });
  app.use(createUndervisningRouter({
    projectRoot,
    getSecret: () => process.env.LICENSE_SIGNING_SECRET || process.env.SESSION_SECRET || '',
    cookieSecure: false,
    enforcePaywall: process.env.UNDERVISNING_PAYWALL === 'true',
  }));
  app.use('/undervisning', express.static(path.join(projectRoot, 'undervisning'), { fallthrough: false }));
  app.use('/dist', express.static(path.join(projectRoot, 'dist'), { fallthrough: false, immutable: false, maxAge: 0 }));
  app.use('/audio', express.static(path.join(projectRoot, 'audio'), { fallthrough: false, immutable: true, maxAge: '1d' }));
}

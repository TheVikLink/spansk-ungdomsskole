import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getSchoolContentAudioPath } from './activity-catalog.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const schoolJs = fileURLToPath(new URL('./public/school.js', import.meta.url));
const schoolCss = fileURLToPath(new URL('./public/school.css', import.meta.url));

export function attachLocalStaticAssets(app) {
  const sendPublicFile = (file) => (_req, res) => res.sendFile(path.join(projectRoot, file));
  app.get('/', sendPublicFile('index.html'));
  app.get('/index.html', sendPublicFile('index.html'));
  app.get('/manifest.webmanifest', sendPublicFile('manifest.webmanifest'));
  app.get('/sw.js', (_req, res, next) => { res.type('application/javascript'); next(); }, sendPublicFile('sw.js'));
  app.get('/school.js', (_req, res) => res.type('js').sendFile(schoolJs));
  app.get('/school.css', (_req, res) => res.type('css').sendFile(schoolCss));
  app.get('/audio/school-content/:filename', (req, res) => {
    const assetPath = getSchoolContentAudioPath(req.params.filename);
    if (!assetPath) return res.status(404).end();
    return res.sendFile(assetPath, (error) => { if (error && !res.headersSent) res.status(404).end(); });
  });
  app.use('/dist', express.static(path.join(projectRoot, 'dist'), { fallthrough: false, immutable: false, maxAge: 0 }));
  app.use('/audio', express.static(path.join(projectRoot, 'audio'), { fallthrough: false, immutable: true, maxAge: '1d' }));
}

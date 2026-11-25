import express from 'express';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { createRateLimit } from './rate-limit.js';
import {
  FREE_SAMPLE_LESSON_IDS,
  createStudentLessonToken,
  isFreeLessonId,
  licenseCookieName,
  studentLessonCookieName,
  verifySchoolLicenseCode,
  verifyStudentLessonToken,
} from '../src/domain/school-license.js';

const LESSON_ID_PATTERN = /^[a-z0-9-]+$/u;
const ASSET_PATTERN = /^(?:index\.html|elev\.html|arbeidsark\.html|arbeidsark\.pdf|partnerkort\.html|partnerkort\.pdf|lyttemanus\.txt|[a-z0-9-]+\.mp3)$/u;
const TOP_LEVEL_FILES = new Set(['index.html', 'time.css', 'writing.js', 'pakke.js', 'teacher.js']);

function parseCookies(req) {
  const result = {};
  for (const entry of (req.headers.cookie || '').split(';')) {
    const at = entry.indexOf('=');
    if (at < 0) continue;
    const name = entry.slice(0, at).trim();
    try {
      result[name] = decodeURIComponent(entry.slice(at + 1).trim());
    } catch {}
  }
  return result;
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
}

function buildCookieHeader(name, value, { maxAgeSeconds, secure, path: cookiePath = '/' }) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${cookiePath}`,
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax',
    'HttpOnly',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function createUndervisningRouter({
  projectRoot,
  getSecret = () => process.env.LICENSE_SIGNING_SECRET || process.env.SESSION_SECRET || '',
  cookieSecure = process.env.NODE_ENV === 'production',
  enforcePaywall = process.env.UNDERVISNING_PAYWALL !== 'false',
} = {}) {
  const router = express.Router();
  const rootDir = path.resolve(projectRoot);
  const undervisningDir = path.resolve(rootDir, 'undervisning');
  const cookieName = licenseCookieName(cookieSecure);
  const studentCookieName = studentLessonCookieName(cookieSecure);
  const activateLimiter = createRateLimit({ windowMs: 60_000, limit: 30, scope: 'ip', maxBuckets: 2_000 });
  const jsonParser = express.json({ limit: '2kb', strict: true });
  const conditionalJson = (req, res, next) => (req.body !== undefined ? next() : jsonParser(req, res, next));

  const readSecret = () => {
    const value = typeof getSecret === 'function' ? getSecret() : getSecret;
    return typeof value === 'string' ? value.trim() : '';
  };

  const readLicense = (req) => {
    const secret = readSecret();
    if (secret.length < 16) return { valid: false, reason: 'unconfigured' };
    const token = parseCookies(req)[cookieName];
    if (!token) return { valid: false, reason: 'missing' };
    return verifySchoolLicenseCode(token, secret);
  };

  router.get('/api/license/status', (req, res) => {
    setSecurityHeaders(res);
    res.setHeader('Cache-Control', 'no-store, private');
    const verified = readLicense(req);
    if (verified.valid) {
      return res.json({
        active: true,
        enforcePaywall,
        ...verified.license,
        freeLessonIds: FREE_SAMPLE_LESSON_IDS,
      });
    }
    return res.json({
      active: false,
      enforcePaywall,
      freeLessonIds: FREE_SAMPLE_LESSON_IDS,
    });
  });

  router.post('/api/license/activate', activateLimiter, conditionalJson, (req, res) => {
    setSecurityHeaders(res);
    res.setHeader('Cache-Control', 'no-store, private');
    const secret = readSecret();
    if (secret.length < 16) {
      return res.status(503).json({ error: 'Lisenssystemet er ikke konfigurert på denne serveren.' });
    }
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    const verified = verifySchoolLicenseCode(code, secret);
    if (!verified.valid) {
      const errorMessage = verified.reason === 'expired'
        ? 'Skolekoden er utløpt. Kontakt ole@spansk123.no for fornyelse.'
        : 'Ugyldig skolekode. Kontroller at hele koden ble limt inn riktig.';
      return res.status(400).json({ error: errorMessage });
    }

    const expiryEndMs = Date.parse(`${verified.license.expiresAt}T23:59:59.000Z`);
    const remainingSeconds = Math.floor((expiryEndMs - Date.now()) / 1000);
    const maxAgeSeconds = Math.max(60, Math.min(180 * 86_400, remainingSeconds));
    res.append('Set-Cookie', buildCookieHeader(cookieName, code, { maxAgeSeconds, secure: cookieSecure }));
    return res.json({
      active: true,
      ...verified.license,
    });
  });

  router.post('/api/license/deactivate', (_req, res) => {
    setSecurityHeaders(res);
    res.setHeader('Cache-Control', 'no-store, private');
    res.append('Set-Cookie', buildCookieHeader(cookieName, '', { maxAgeSeconds: 0, secure: cookieSecure }));
    return res.json({ active: false });
  });

  router.post('/api/license/student-link', activateLimiter, conditionalJson, async (req, res) => {
    setSecurityHeaders(res);
    res.setHeader('Cache-Control', 'no-store, private');
    const lessonId = typeof req.body?.lessonId === 'string' ? req.body.lessonId.trim() : '';
    if (!LESSON_ID_PATTERN.test(lessonId)) {
      return res.status(404).json({ error: 'Fant ikke undervisningstimen.' });
    }
    const elevPath = path.resolve(undervisningDir, lessonId, 'elev.html');
    if (!elevPath.startsWith(undervisningDir + path.sep)) {
      return res.status(404).json({ error: 'Fant ikke undervisningstimen.' });
    }
    try {
      await access(elevPath, constants.R_OK);
    } catch {
      return res.status(404).json({ error: 'Fant ikke undervisningstimen.' });
    }
    if (!enforcePaywall || isFreeLessonId(lessonId)) {
      return res.json({ url: `/undervisning/${lessonId}/elev.html`, free: true });
    }
    const verified = readLicense(req);
    if (!verified.valid) {
      return res.status(401).json({ error: 'Aktiver skolekode på /undervisning/ først.' });
    }
    const secret = readSecret();
    const sevenDaysAhead = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const expiresAt = verified.license.expiresAt < sevenDaysAhead ? verified.license.expiresAt : sevenDaysAhead;
    const token = createStudentLessonToken({ lessonId, expiresAt }, secret);
    return res.json({
      url: `/undervisning/${lessonId}/elev.html?elev=${encodeURIComponent(token)}`,
      expiresAt,
      free: false,
    });
  });

  router.get('/undervisning', (req, res, next) => {
    if (req.path !== '/undervisning') return next();
    setSecurityHeaders(res);
    return res.redirect(301, '/undervisning/');
  });

  router.get('/undervisning/', async (_req, res, next) => {
    setSecurityHeaders(res);
    const filePath = path.join(undervisningDir, 'index.html');
    try {
      await access(filePath, constants.R_OK);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.sendFile(filePath);
    } catch {
      return next();
    }
  });

  const handleTopLevelOrLesson = async (req, res, next) => {
    setSecurityHeaders(res);
    const segment = req.params.lessonId;
    const requestedAsset = req.params.asset;

    if (!requestedAsset && TOP_LEVEL_FILES.has(segment)) {
      const topFile = path.resolve(undervisningDir, segment);
      if (!topFile.startsWith(undervisningDir + path.sep)) return res.status(404).end();
      try {
        await access(topFile, constants.R_OK);
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        return res.sendFile(topFile);
      } catch {
        return next();
      }
    }

    if (!LESSON_ID_PATTERN.test(segment)) {
      return res.status(404).type('text/plain; charset=utf-8').send('Fant ikke undervisningstimen.');
    }

    const asset = requestedAsset || 'index.html';
    if (!ASSET_PATTERN.test(asset)) {
      return res.status(404).type('text/plain; charset=utf-8').send('Fant ikke ressursen.');
    }

    const lessonDir = path.resolve(undervisningDir, segment);
    const resolvedPath = path.resolve(lessonDir, asset);
    if (!resolvedPath.startsWith(undervisningDir + path.sep)) {
      return res.status(404).end();
    }

    try {
      await access(resolvedPath, constants.R_OK);
    } catch {
      return res.status(404).type('text/plain; charset=utf-8').send('Fant ikke ressursen.');
    }

    const free = isFreeLessonId(segment);
    const hasTeacherAccess = !enforcePaywall || free || readLicense(req).valid;
    const isStudentAsset = asset === 'elev.html' || asset.endsWith('.mp3');
    let hasStudentAccess = false;

    if (!hasTeacherAccess && isStudentAsset) {
      const secret = readSecret();
      const queryToken = asset === 'elev.html' && typeof req.query?.elev === 'string' ? req.query.elev.trim() : '';
      if (queryToken) {
        const verifiedStudent = verifyStudentLessonToken(queryToken, segment, secret);
        if (verifiedStudent.valid) {
          const expiryEndMs = Date.parse(`${verifiedStudent.expiresAt}T23:59:59.000Z`);
          const remainingSeconds = Math.floor((expiryEndMs - Date.now()) / 1000);
          const maxAgeSeconds = Math.max(60, Math.min(7 * 86_400, remainingSeconds));
          res.append('Set-Cookie', buildCookieHeader(studentCookieName, queryToken, {
            maxAgeSeconds,
            secure: cookieSecure,
            path: `/undervisning/${segment}/`,
          }));
          hasStudentAccess = true;
        }
      } else {
        const cookieToken = parseCookies(req)[studentCookieName];
        if (cookieToken && verifyStudentLessonToken(cookieToken, segment, secret).valid) {
          hasStudentAccess = true;
        }
      }
    }

    const allowed = hasTeacherAccess || hasStudentAccess;

    if (!allowed) {
      res.setHeader('Cache-Control', 'no-store, private');
      if (asset.endsWith('.html')) {
        return res.redirect(302, `/undervisning/?las=${encodeURIComponent(segment)}`);
      }
      return res.status(402).type('text/plain; charset=utf-8').send(
        'Denne ressursen inngår i Undervisningspakken. Åpne /undervisning/ for å legge inn skolekode eller bestille.',
      );
    }

    if (!requestedAsset && !req.path.endsWith('/')) {
      return res.redirect(302, `/undervisning/${encodeURIComponent(segment)}/`);
    }

    res.setHeader('Cache-Control', free ? 'public, max-age=3600' : 'no-store, private');
    return res.sendFile(resolvedPath);
  };

  router.get('/undervisning/:lessonId', handleTopLevelOrLesson);
  router.get('/undervisning/:lessonId/:asset', handleTopLevelOrLesson);

  return router;
}

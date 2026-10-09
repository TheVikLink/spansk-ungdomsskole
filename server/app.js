import express from 'express';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { attachLocalStaticAssets } from './local-static-assets.js';
import { z } from 'zod';
import { getActivity, listActivities, snapshotActivity, verifyActivitySnapshot, publicActivitySnapshot, evaluateSnapshot } from './activity-catalog.js';
import { createOidcService } from './oidc-service.js';
import { createSessionService, hashSessionToken } from './session-service.js';
import { linkFeideIdentity, redeemClassInvite, redeemSchoolInvite } from './identity-service.js';
import { createRevocationJournal } from './revocation-journal.js';
import { deleteOwnAccount } from './account-deletion.js';
import { createRateLimit } from './rate-limit.js';
import { safeRouteLabel } from './safe-log-fields.js';

const hash = (value) => createHash('sha256').update(value).digest();
const uuidSchema = z.string().uuid();
const sessionCookieName = (config) => config.mode === 'local-oidc-test' ? 'spansk_session_dev' : '__Host-spansk_session';
const oidcTxCookieName = (config) => config.mode === 'local-oidc-test' ? 'spansk_oidc_tx_dev' : '__Host-spansk_oidc_tx';
const csrfCookieName = (config) => config.mode === 'local-oidc-test' ? 'spansk_csrf_dev' : '__Host-spansk_csrf';
const logoutCookieName = (config) => config.mode === 'local-oidc-test' ? 'spansk_logout_state_dev' : '__Host-spansk_logout_state';

function cookies(request) {
  const result = {};
  for (const entry of (request.headers.cookie || '').split(';')) {
    const at = entry.indexOf('=');
    if (at < 0) continue;
    const name = entry.slice(0, at).trim();
    try { result[name] = decodeURIComponent(entry.slice(at + 1).trim()); } catch {}
  }
  return result;
}

function formPostCallbackUrl(body, config) {
  const allowedFields = new Set(['code', 'state', 'iss', 'error', 'error_description', 'error_uri']);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid OIDC callback form');
  const entries = Object.entries(body);
  if (entries.some(([key, value]) => !allowedFields.has(key) || typeof value !== 'string' || !value)) {
    throw new Error('Invalid OIDC callback form');
  }
  const fields = Object.fromEntries(entries);
  if (!fields.state || Boolean(fields.code) === Boolean(fields.error)) throw new Error('Invalid OIDC callback response');
  if (fields.iss && fields.iss !== config.oidc.issuer) throw new Error('OIDC callback issuer mismatch');
  const callbackUrl = new URL('/auth/callback', config.publicOrigin);
  for (const [key, value] of entries) callbackUrl.searchParams.set(key, value);
  return callbackUrl;
}

const browserFacingPaths = new Set([
  '/', '/index.html', '/school', '/school.js', '/school.css', '/sw.js', '/manifest.webmanifest',
  '/auth/login', '/auth/callback', '/auth/logout/callback',
]);

function isBrowserFacingPath(pathname) {
  return browserFacingPaths.has(pathname) || pathname.startsWith('/dist/') || pathname.startsWith('/audio/');
}

function httpsRedirectTarget(originalUrl, publicOrigin) {
  const target = typeof originalUrl === 'string' && originalUrl.startsWith('/') ? originalUrl.replace(/^\/{2,}/u, '/') : '/';
  const destination = new URL(target, publicOrigin);
  return destination.origin === publicOrigin ? destination.href : `${publicOrigin}/`;
}

function cookie(name, value, config, { httpOnly = true, maxAge = 8 * 60 * 60 * 1000, sameSite = 'Lax' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${Math.floor(maxAge / 1000)}`, `SameSite=${sameSite}`];
  if (config.cookie.secure) parts.push('Secure');
  if (httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

function clearCookie(name, config, httpOnly = true) {
  const parts = [`${name}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (config.cookie.secure) parts.push('Secure');
  if (httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

function logoutStateCookie(state, config) {
  const signature = createHmac('sha256', config.sessionSecret).update(`logout:${state}`).digest('base64url');
  return `${state}.${signature}`;
}

function verifyLogoutStateCookie(value, state, config) {
  if (typeof value !== 'string' || typeof state !== 'string') return false;
  const expected = logoutStateCookie(state, config);
  const a = Buffer.from(expected);
  const b = Buffer.from(value);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function withUserContext(pool, session, action) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.user_id',$1,true), set_config('app.school_id',$2,true), set_config('app.role',$3,true)`, [session.userId, session.schoolId || '', session.role]);
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

function setLoginCookies(res, config, { token, csrfToken, expiresAt }) {
  const maxAge = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  res.append('Set-Cookie', cookie(sessionCookieName(config), token, config, { maxAge }));
  res.append('Set-Cookie', cookie(csrfCookieName(config), csrfToken, config, { httpOnly: false, maxAge, sameSite: 'Strict' }));
}

function clearLoginCookies(res, config) {
  res.append('Set-Cookie', clearCookie(sessionCookieName(config), config));
  res.append('Set-Cookie', clearCookie(csrfCookieName(config), config, false));
}

function safeErrorStatus(error) {
  if (error?.code === 'IDENTITY_REVOKED' || error?.code === '28000') return 403;
  if (error?.code === 'ACCESS_REVOKED') return 404;
  if (error?.code === 'INVITE_INVALID') return 400;
  return 400;
}

export function createSchoolApp({ config, appPool, journalPool, serveLocalStaticAssets = false }) {
  const app = express();
  const sessions = createSessionService(appPool, config);
  const oidc = createOidcService(appPool, config);
  const journal = createRevocationJournal(journalPool);
  const publicHtml = fileURLToPath(new URL('./public/school.html', import.meta.url));

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustedProxyHops);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
    if (config.cookie.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) res.setHeader('Cache-Control', 'no-store, private');
    return next();
  });
  app.use((req, res, next) => {
    if (req.method !== 'TRACE') return next();
    res.setHeader('Connection', 'close');
    return res.status(405).json({ error: 'HTTP TRACE er ikke tillatt.' });
  });
  app.use((req, res, next) => {
    if (config.nodeEnv !== 'production' || req.secure) return next();
    if (['GET', 'HEAD'].includes(req.method) && isBrowserFacingPath(req.path)) {
      return res.redirect(308, httpsRedirectTarget(req.originalUrl, config.publicOrigin));
    }
    res.setHeader('Connection', 'close');
    return res.status(400).json({ error: 'Denne tjenesten krever en sikker forbindelse.' });
  });
  // Local per-process protection only; production must also enforce shared gateway limits.
  app.use(createRateLimit({ windowMs: 60_000, limit: 300, scope: 'ip', maxBuckets: 5_000 }));
  app.use(express.urlencoded({ extended: false, limit: '2kb' }));
  app.use(express.json({ limit: '16kb', strict: true }));

  const loginLimit = createRateLimit({ windowMs: 60_000, limit: 60 });
  const mutationLimit = createRateLimit({ windowMs: 60_000, limit: 50 });
  const currentSession = async (req, res, next) => {
    const token = cookies(req)[sessionCookieName(config)];
    const session = await sessions.resolve(token);
    if (!session) { clearLoginCookies(res, config); return res.status(401).json({ error: 'Logg inn med Feide for å fortsette.' }); }
    try {
      await journal.assertNotRevoked(session.userId);
      if (session.schoolId) await assertSchoolAccess(session.schoolId);
      if (session.schoolGrantId) await journal.assertNotRevoked(session.schoolGrantId);
    } catch (error) {
      clearLoginCookies(res, config);
      return res.status(403).json({ error: 'Tilgangen er stengt. Kontakt skolens administrator.', sessionRevoked: true });
    }
    const requiredAcr = session.role === 'school_admin' ? config.adminRequiredAcr
      : session.role === 'teacher' ? config.teacherRequiredAcr : null;
    if (requiredAcr && session.acr !== requiredAcr) {
      clearLoginCookies(res, config);
      return res.status(403).json({ error: 'Feide bekreftet ikke autentiseringsnivået skolen krever. Velg en sterkere Feide-innlogging eller kontakt skolens administrator.', reauthenticationRequired: true, reauthenticationRole: session.role });
    }
    req.session = session;
    req.sessionToken = token;
    return next();
  };
  const requireSchool = (req, res, next) => req.session.schoolId
    ? next()
    : res.status(409).json({ error: req.session.role === 'pending' ? 'Skoletilgangen din må godkjennes før du kan fortsette.' : 'Velg skolen du skal bruke.' });
  const requireRole = (role) => (req, res, next) => req.session.role === role
    ? next()
    : res.status(403).json({ error: 'Du har ikke tilgang til denne handlingen.' });
  const assertSchoolAccess = async (schoolId) => {
    const result = await appPool.query('SELECT app_school_access_grant($1) AS grant_id', [schoolId]);
    const grantId = result.rows[0]?.grant_id;
    if (!grantId) throw Object.assign(new Error('School access is inactive'), { code: 'ACCESS_REVOKED' });
    await journal.assertNotRevoked(grantId);
  };
  const csrf = async (req, res, next) => {
    const supplied = req.get('x-csrf-token') || req.body?.csrfToken;
    const parsed = cookies(req)[csrfCookieName(config)];
    if (req.get('origin') !== config.publicOrigin || !supplied || supplied !== parsed || !(await sessions.verifyCsrf(req.session, supplied))) {
      return res.status(403).json({ error: 'Forespørselen kunne ikke bekreftes. Oppdater siden og prøv igjen.' });
    }
    return next();
  };
  const requireTeacherClass = async (client, session, classId) => {
    const result = await client.query(
      `SELECT cm.grant_id FROM class_membership cm JOIN school_class c ON c.id=cm.class_id AND c.school_id=cm.school_id
       WHERE cm.school_id=$1 AND cm.class_id=$2 AND cm.user_id=$3 AND cm.role='teacher' AND cm.status='active' AND c.status='active'`,
      [session.schoolId, classId, session.userId],
    );
    if (result.rowCount !== 1) throw Object.assign(new Error('Class access was not found'), { code: 'ACCESS_REVOKED' });
    await journal.assertNotRevoked(result.rows[0].grant_id);
  };
  const requireStudentClass = async (client, session, classId) => {
    const result = await client.query(
      `SELECT grant_id FROM class_membership WHERE school_id=$1 AND class_id=$2 AND user_id=$3 AND role='student' AND status='active'`,
      [session.schoolId, classId, session.userId],
    );
    if (result.rowCount !== 1) throw Object.assign(new Error('Class access was not found'), { code: 'ACCESS_REVOKED' });
    await journal.assertNotRevoked(result.rows[0].grant_id);
  };

  app.get('/healthz', async (_req, res) => {
    try {
      const [primary, security] = await Promise.all([appPool.query('SELECT 1'), journal.checkpoint()]);
      res.status(200).json({ status: primary.rowCount === 1 ? 'ok' : 'unavailable', securityJournal: security.entries === null ? 'unavailable' : 'ok' });
    } catch { res.status(503).json({ status: 'unavailable', securityJournal: 'unavailable' }); }
  });
  app.get('/api/runtime-mode', (_req, res) => res.json({ localOidcTest: config.mode === 'local-oidc-test' }));

  app.get('/school', (_req, res) => { res.setHeader('Cache-Control', 'no-store, private'); res.sendFile(publicHtml); });
  app.get('/auth/login', loginLimit, async (req, res, next) => {
    try {
      const requiredAcrByRole = { teacher: config.teacherRequiredAcr, school_admin: config.adminRequiredAcr };
      const level = typeof req.query.level === 'string' ? req.query.level : '';
      if (level && !['teacher', 'school_admin'].includes(level)) return res.status(400).send('Invalid authentication-level request');
      if (level && !requiredAcrByRole[level]) return res.status(400).send('No additional authentication level is configured');
      const started = await oidc.beginLogin({ requestedAcr: requiredAcrByRole[level] || null });
      res.append('Set-Cookie', cookie(oidcTxCookieName(config), started.handle, config, { maxAge: 5 * 60 * 1000, sameSite: 'None' }));
      return res.redirect(303, started.url.href);
    } catch (error) { return next(error); }
  });

  const handleAuthCallback = async (req, res) => {
    res.append('Set-Cookie', clearCookie(oidcTxCookieName(config), config));
    try {
      if (req.path !== '/auth/callback' || req.originalUrl !== '/auth/callback' || !req.is('application/x-www-form-urlencoded')) {
        throw new Error('Invalid OIDC callback request');
      }
      const callbackUrl = formPostCallbackUrl(req.body, config);
      const identity = await oidc.finishLogin({ handle: cookies(req)[oidcTxCookieName(config)], callbackUrl: callbackUrl.href });
      const linked = await linkFeideIdentity(appPool, identity);
      const membership = linked.membership;
      let role = linked.status === 'pending' ? 'pending' : linked.schoolChoices ? 'select_school' : membership?.role;
      let schoolId = membership?.schoolId || null;
      let idToken = identity.idToken;
      if (!role) throw new Error('No authorized school membership');
      if (membership?.schoolId) await assertSchoolAccess(membership.schoolId);
      if (membership?.grantId) await journal.assertNotRevoked(membership.grantId);
      if (role === 'select_school') role = 'select_school';
      const session = await sessions.create({ userId: linked.userId, schoolId, role, idToken, acr: identity.claims?.acr ?? null });
      setLoginCookies(res, config, session);
      return res.redirect(303, '/school');
    } catch {
      clearLoginCookies(res, config);
      return res.status(403).type('html').send('<!doctype html><html lang="nb"><meta charset="utf-8"><title>Ingen tilgang</title><main><h1>Vi fant ingen aktiv skoletilgang</h1><p>Kontakt spansklæreren eller skolens administrator for å få tilgang. Logg inn på nytt etter at tilgangen er ordnet.</p><a href="/school">Tilbake</a></main></html>');
    }
  };
  app.post('/auth/callback', loginLimit, handleAuthCallback);
  app.get('/auth/callback', loginLimit, (_req, res) => res.status(405).type('text').send('OIDC-callbacken krever POST.'));

  app.post('/auth/logout', currentSession, csrf, mutationLimit, async (req, res) => {
    const ended = await sessions.logout(req.sessionToken);
    clearLoginCookies(res, config);
    if (!ended?.idToken) return res.redirect(303, '/school?logout=local');
    try {
      const external = await oidc.beginLogout(ended.idToken);
      if (!external.url) return res.redirect(303, '/school?logout=local');
      res.append('Set-Cookie', cookie(logoutCookieName(config), logoutStateCookie(external.state, config), config, { maxAge: 5 * 60 * 1000 }));
      return res.redirect(303, external.url.href);
    } catch {
      return res.redirect(303, '/school?logout=local');
    }
  });

  app.post('/api/account/delete', currentSession, csrf, mutationLimit, async (req, res, next) => {
    if (req.body?.confirmation !== 'SLETT KONTO') return res.status(400).json({ error: 'Bekreft sletting ved å skrive SLETT KONTO.' });
    try {
      await deleteOwnAccount(appPool, journal, req.session.userId);
      clearLoginCookies(res, config);
      return res.json({ deleted: true, message: 'Kontoen og tilknyttede personlige lekseresultater er slettet.' });
    } catch (error) { return next(error); }
  });

  app.get('/auth/logout/callback', loginLimit, (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const valid = verifyLogoutStateCookie(cookies(req)[logoutCookieName(config)], state, config);
    res.append('Set-Cookie', clearCookie(logoutCookieName(config), config));
    if (!valid) return res.status(400).type('html').send('<!doctype html><html lang="nb"><meta charset="utf-8"><title>Utlogging</title><h1>Den lokale økten er avsluttet.</h1><p>Vi kunne ikke bekrefte returen fra Feide.</p><a href="/school">Lukk</a></html>');
    return res.type('html').send('<!doctype html><html lang="nb"><meta charset="utf-8"><title>Utlogging</title><h1>Den lokale økten er avsluttet.</h1><p>Feide returnerte til appen. Dette logger ikke nødvendigvis ut andre Feide-tjenester.</p><a href="/school">Tilbake</a></html>');
  });

  app.get('/api/session', currentSession, async (req, res, next) => {
    try {
      const payload = { userId: req.session.userId, displayName: req.session.displayName, schoolId: req.session.schoolId, role: req.session.role };
      if (req.session.role === 'select_school') {
        payload.schools = await withUserContext(appPool, req.session, async (client) => {
          const choices = await client.query('SELECT * FROM app_my_schools()');
          const active = [];
          for (const choice of choices.rows) {
            try {
              await assertSchoolAccess(choice.school_id);
              await journal.assertNotRevoked(choice.grant_id);
              active.push({ id: choice.school_id, name: choice.school_name, role: choice.role });
            } catch {}
          }
          return active;
        });
      }
      return res.json(payload);
    } catch (error) { return next(error); }
  });

  app.post('/api/select-school', currentSession, csrf, mutationLimit, async (req, res, next) => {
    if (req.session.role !== 'select_school') return res.status(403).json({ error: 'Skolevalg er ikke tilgjengelig.' });
    const input = z.object({ schoolId: uuidSchema }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Velg en gyldig skole.' });
    try {
      const choice = await withUserContext(appPool, req.session, async (client) => {
        const choices = await client.query('SELECT * FROM app_my_schools() WHERE school_id=$1', [input.data.schoolId]);
        return choices.rows[0] || null;
      });
      if (!choice) return res.status(403).json({ error: 'Denne skolen er ikke knyttet til Feide-kontoen din.' });
      await assertSchoolAccess(choice.school_id);
      await journal.assertNotRevoked(choice.grant_id);
      const oldSession = await sessions.logout(req.sessionToken);
      const newSession = await sessions.create({ userId: req.session.userId, schoolId: choice.school_id, role: choice.role, idToken: oldSession?.idToken, acr: oldSession?.acr });
      setLoginCookies(res, config, newSession);
      return res.json({ ok: true });
    } catch (error) { return next(error); }
  });

  app.post('/api/join-class', currentSession, csrf, requireSchool, mutationLimit, async (req, res, next) => {
    if (!['student', 'teacher'].includes(req.session.role)) return res.status(403).json({ error: 'Bare en aktiv elev eller lærer ved skolen kan sende klasseforespørsel.' });
    const input = z.object({ code: z.string().min(20).max(100) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Skriv inn invitasjonskoden fra læreren.' });
    try {
      const joined = await redeemClassInvite(appPool, journal, { userId: req.session.userId, code: input.data.code.trim(), sessionTokenHash: hashSessionToken(req.sessionToken), sessionSecret: config.sessionSecret });
      const newSession = await sessions.create({ userId: req.session.userId, schoolId: joined.school_id, role: joined.role, idToken: joined.idToken, acr: req.session.acr });
      setLoginCookies(res, config, newSession);
      return res.json({ ok: true, membership: 'pending', memberRole: joined.role });
    } catch (error) { return res.status(safeErrorStatus(error)).json({ error: error.code === 'INVITE_INVALID' ? 'Koden er ugyldig, utløpt eller brukt.' : 'Skoletilgangen mangler eller koden kan ikke brukes. Kontakt skolens administrator eller spansklæreren.' }); }
  });

  app.post('/api/join-school', currentSession, csrf, mutationLimit, async (req, res) => {
    if (!['pending', 'select_school'].includes(req.session.role)) return res.status(403).json({ error: 'Logg ut og logg inn igjen før du godtar en ny skoleinvitasjon.' });
    const input = z.object({ code: z.string().min(20).max(100) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Skriv inn engangskoden du fikk fra skolens administrator.' });
    try {
      const joined = await redeemSchoolInvite(appPool, journal, {
        userId: req.session.userId, code: input.data.code.trim(),
        sessionTokenHash: hashSessionToken(req.sessionToken), sessionSecret: config.sessionSecret,
      });
      const newSession = await sessions.create({ userId: req.session.userId, schoolId: joined.school_id, role: joined.role, idToken: joined.idToken, acr: req.session.acr });
      setLoginCookies(res, config, newSession);
      return res.json({ ok: true });
    } catch (error) {
      const status = error.code === 'INVITE_INVALID' ? 400 : safeErrorStatus(error);
      return res.status(status).json({ error: error.code === 'INVITE_INVALID' ? 'Koden er ugyldig, utløpt eller allerede brukt.' : 'Skoleinvitasjonen kan ikke brukes. Kontakt skolens administrator.' });
    }
  });

  app.post('/api/school/teacher-invitations', currentSession, csrf, requireSchool, requireRole('school_admin'), mutationLimit, async (req, res, next) => {
    const code = randomBytes(24).toString('base64url');
    const id = randomUUID();
    try {
      await withUserContext(appPool, req.session, async (client) => {
        await client.query("INSERT INTO school_invite(id,school_id,token_hash,created_by,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days')", [id, req.session.schoolId, hash(code), req.session.userId]);
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'school_invite_created','school_invite',$3)", [req.session.schoolId, req.session.userId, id]);
      });
      return res.status(201).json({ id, code, note: 'Del koden direkte med læreren via en verifisert kanal. Den kan brukes én gang og utløper om sju dager.' });
    } catch (error) { return next(error); }
  });

  app.get('/api/school/members', currentSession, requireSchool, requireRole('school_admin'), async (req, res, next) => {
    try {
      const members = await withUserContext(appPool, req.session, async (client) => client.query('SELECT * FROM app_school_members()'));
      return res.json({ members: members.rows.map((member) => ({
        userId: member.user_id,
        displayName: member.display_name,
        role: member.role,
        status: member.membership_status,
      })) });
    } catch (error) { return next(error); }
  });

  app.post('/api/school/members/:userId/revoke', currentSession, csrf, requireSchool, requireRole('school_admin'), mutationLimit, async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.userId).success) return res.status(404).json({ error: 'Skolemedlemmet finnes ikke.' });
    try {
      const result = await withUserContext(appPool, req.session, async (client) => {
        const school = await client.query("SELECT id FROM school WHERE id=$1 AND status='active' FOR UPDATE", [req.session.schoolId]);
        if (!school.rowCount) return 'not_found';
        const target = await client.query(
          "SELECT grant_id,role FROM school_membership WHERE school_id=$1 AND user_id=$2 AND status='active' FOR UPDATE",
          [req.session.schoolId, req.params.userId],
        );
        if (!target.rowCount) return 'not_found';
        if (req.params.userId === req.session.userId) return 'self';
        if (target.rows[0].role === 'school_admin') {
          const count = await client.query("SELECT count(*)::int AS n FROM school_membership WHERE school_id=$1 AND role='school_admin' AND status='active'", [req.session.schoolId]);
          if (count.rows[0].n <= 1) return 'last_admin';
        }
        const classMemberships = await client.query(
          "SELECT grant_id FROM class_membership WHERE school_id=$1 AND user_id=$2 AND status IN ('active','pending') ORDER BY grant_id FOR UPDATE",
          [req.session.schoolId, req.params.userId],
        );
        for (const membership of classMemberships.rows) await journal.revoke(membership.grant_id, 'class_membership_removed');
        await journal.revoke(target.rows[0].grant_id, 'school_membership_removed');
        const changed = await client.query('SELECT app_revoke_school_member($1) AS result', [req.params.userId]);
        if (changed.rows[0].result !== 'revoked') return changed.rows[0].result;
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'membership_revoked','membership',$3)", [req.session.schoolId, req.session.userId, req.params.userId]);
        return 'revoked';
      });
      if (result === 'not_found') return res.status(404).json({ error: 'Skolemedlemmet finnes ikke eller har allerede mistet tilgang.' });
      if (result === 'self') return res.status(409).json({ error: 'Du kan ikke fjerne din egen skoletilgang her.' });
      if (result === 'last_admin') return res.status(409).json({ error: 'Legg til en annen skoleadministrator før den siste administratoren fjernes.' });
      return res.json({ ok: true });
    } catch (error) { return next(error); }
  });

  app.post('/api/school/teacher-invitations/:inviteId/revoke', currentSession, csrf, requireSchool, requireRole('school_admin'), mutationLimit, async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.inviteId).success) return res.status(404).json({ error: 'Invitasjonen finnes ikke.' });
    try {
      const revoked = await withUserContext(appPool, req.session, async (client) => {
        const found = await client.query('SELECT id FROM school_invite WHERE school_id=$1 AND id=$2 AND used_at IS NULL AND revoked_at IS NULL FOR UPDATE', [req.session.schoolId, req.params.inviteId]);
        if (!found.rowCount) return false;
        await journal.revoke(found.rows[0].id, 'school_invitation_revoked');
        await client.query('UPDATE school_invite SET revoked_at=now() WHERE school_id=$1 AND id=$2', [req.session.schoolId, req.params.inviteId]);
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'school_invite_revoked','school_invite',$3)", [req.session.schoolId, req.session.userId, req.params.inviteId]);
        return true;
      });
      return revoked ? res.json({ ok: true }) : res.status(404).json({ error: 'Invitasjonen finnes ikke, er brukt eller er allerede trukket tilbake.' });
    } catch (error) { return next(error); }
  });

  app.get('/api/activities', currentSession, requireSchool, requireRole('teacher'), (_req, res) => res.json({ activities: listActivities() }));

  app.get('/api/classes', currentSession, requireSchool, requireRole('teacher'), async (req, res, next) => {
    try {
      const classes = await withUserContext(appPool, req.session, async (client) => {
        const result = await client.query(
          `SELECT c.id,c.name,c.school_year,cm.grant_id,
             (SELECT count(*)::int FROM class_membership pending WHERE pending.school_id=c.school_id AND pending.class_id=c.id AND pending.role IN ('student','teacher') AND pending.status='pending') AS pending_members
           FROM school_class c JOIN class_membership cm ON cm.school_id=c.school_id AND cm.class_id=c.id
           WHERE c.school_id=$1 AND cm.user_id=$2 AND cm.role='teacher' AND cm.status='active' AND c.status='active' ORDER BY c.name`,
          [req.session.schoolId, req.session.userId],
        );
        const visible = [];
        for (const row of result.rows) if (!(await journal.isRevoked(row.grant_id))) {
          const count = await client.query("SELECT count(*)::int AS students FROM class_membership WHERE school_id=$1 AND class_id=$2 AND role='student' AND status='active'", [req.session.schoolId, row.id]);
          visible.push({ id: row.id, name: row.name, schoolYear: row.school_year, studentCount: count.rows[0].students, pendingMemberCount: row.pending_members });
        }
        return visible;
      });
      return res.json({ classes });
    } catch (error) { return next(error); }
  });

  app.post('/api/classes', currentSession, csrf, requireSchool, requireRole('teacher'), mutationLimit, async (req, res, next) => {
    const input = z.object({ name: z.string().trim().min(1).max(100), schoolYear: z.string().regex(/^\d{4}(?:-\d{4})?$/u) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Skriv klassenavn og skoleår.' });
    try {
      const id = randomUUID();
      await withUserContext(appPool, req.session, async (client) => {
        await client.query('INSERT INTO school_class(id,school_id,name,school_year) VALUES($1,$2,$3,$4)', [id, req.session.schoolId, input.data.name, input.data.schoolYear]);
        await client.query("INSERT INTO class_membership(school_id,class_id,user_id,role) VALUES($1,$2,$3,'teacher')", [req.session.schoolId, id, req.session.userId]);
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'class_created','class',$3)", [req.session.schoolId, req.session.userId, id]);
      });
      return res.status(201).json({ id, name: input.data.name, schoolYear: input.data.schoolYear });
    } catch (error) { return next(error); }
  });

  app.post('/api/classes/:classId/invitations', currentSession, csrf, requireSchool, requireRole('teacher'), mutationLimit, async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.classId).success) return res.status(404).json({ error: 'Klassen finnes ikke.' });
    const input = z.object({ role: z.enum(['student', 'teacher']).default('student') }).safeParse(req.body ?? {});
    if (!input.success) return res.status(400).json({ error: 'Velg en gyldig invitasjonstype.' });
    try {
      const code = randomBytes(24).toString('base64url');
      await withUserContext(appPool, req.session, async (client) => {
        await requireTeacherClass(client, req.session, req.params.classId);
        const invite = await client.query('INSERT INTO class_invite(school_id,class_id,token_hash,created_by,role,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval \'7 days\') RETURNING id', [req.session.schoolId, req.params.classId, hash(code), req.session.userId, input.data.role]);
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'invite_created','invite',$3)", [req.session.schoolId, req.session.userId, invite.rows[0].id]);
      });
      const memberLabel = input.data.role === 'teacher' ? 'medlærer' : 'elev';
      return res.status(201).json({ code, note: `Del koden direkte med én ${memberLabel}. Den kan brukes én gang, utløper om sju dager og gir bare en forespørsel som må godkjennes av læreren.` });
    } catch (error) { return next(error); }
  });

  app.post('/api/classes/:classId/members/:studentId/revoke', currentSession, csrf, requireSchool, requireRole('teacher'), mutationLimit, async (req, res, next) => {
    if (![req.params.classId, req.params.studentId].every((id) => uuidSchema.safeParse(id).success)) return res.status(404).json({ error: 'Klassemedlemmet finnes ikke.' });
    try {
      const revoked = await withUserContext(appPool, req.session, async (client) => {
        await client.query('SELECT id FROM school_class WHERE school_id=$1 AND id=$2 FOR UPDATE', [req.session.schoolId, req.params.classId]);
        await requireTeacherClass(client, req.session, req.params.classId);
        const member = await client.query("SELECT grant_id FROM class_membership WHERE school_id=$1 AND class_id=$2 AND user_id=$3 AND role IN ('student','teacher') AND status IN ('active','pending') FOR UPDATE", [req.session.schoolId, req.params.classId, req.params.studentId]);
        if (member.rowCount !== 1) return null;
        const memberRole = await client.query("SELECT role FROM class_membership WHERE school_id=$1 AND class_id=$2 AND user_id=$3", [req.session.schoolId, req.params.classId, req.params.studentId]);
        if (memberRole.rows[0].role === 'teacher' && (await client.query("SELECT count(*)::int AS n FROM class_membership WHERE school_id=$1 AND class_id=$2 AND role='teacher' AND status='active'", [req.session.schoolId, req.params.classId])).rows[0].n <= 1) return 'last_teacher';
        await journal.revoke(member.rows[0].grant_id, 'class_membership_removed');
        const result = await client.query('SELECT app_revoke_class_member($1,$2) AS revoked', [req.params.classId, req.params.studentId]);
        if (!result.rows[0].revoked) throw Object.assign(new Error('Membership could not be revoked'), { code: 'REVOCATION_CONFLICT' });
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'membership_revoked','membership',$3)", [req.session.schoolId, req.session.userId, req.params.studentId]);
        return true;
      });
      if (!revoked) return res.status(404).json({ error: 'Klassemedlemmet finnes ikke.' });
      if (revoked === 'last_teacher') return res.status(409).json({ error: 'Legg til en annen aktiv klasselærer før den siste læreren fjernes.' });
      return res.json({ ok: true });
    } catch (error) { return next(error); }
  });

  app.get('/api/classes/:classId/requests', currentSession, requireSchool, requireRole('teacher'), async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.classId).success) return res.status(404).json({ error: 'Klassen finnes ikke.' });
    try {
      const requests = await withUserContext(appPool, req.session, async (client) => {
        await requireTeacherClass(client, req.session, req.params.classId);
        const result = await client.query(`SELECT cm.user_id AS "studentId",cm.role,u.display_name AS "displayName",cm.grant_id AS "grantId"
          FROM class_membership cm JOIN app_user u ON u.id=cm.user_id
          WHERE cm.school_id=$1 AND cm.class_id=$2 AND cm.role IN ('student','teacher') AND cm.status='pending' ORDER BY u.display_name`,
        [req.session.schoolId, req.params.classId]);
        const visible = [];
        for (const row of result.rows) if (!(await journal.isRevoked(row.grantId))) visible.push({ studentId: row.studentId, role: row.role, displayName: row.displayName });
        return visible;
      });
      return res.json({ requests });
    } catch (error) { return next(error); }
  });

  app.post('/api/classes/:classId/members/:studentId/approve', currentSession, csrf, requireSchool, requireRole('teacher'), mutationLimit, async (req, res, next) => {
    if (![req.params.classId, req.params.studentId].every((id) => uuidSchema.safeParse(id).success)) return res.status(404).json({ error: 'Elevforespørselen finnes ikke.' });
    try {
      const approved = await withUserContext(appPool, req.session, async (client) => {
        await requireTeacherClass(client, req.session, req.params.classId);
        const result = await client.query('SELECT app_approve_class_member($1,$2) AS approved', [req.params.classId, req.params.studentId]);
        if (!result.rows[0].approved) return false;
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'membership_approved','membership',$3)", [req.session.schoolId, req.session.userId, req.params.studentId]);
        return true;
      });
      return approved ? res.json({ ok: true }) : res.status(404).json({ error: 'Elevforespørselen finnes ikke eller er allerede behandlet.' });
    } catch (error) { return next(error); }
  });

  app.post('/api/assignments', currentSession, csrf, requireSchool, requireRole('teacher'), mutationLimit, async (req, res, next) => {
    const input = z.object({ classId: uuidSchema, activityId: z.string().min(1).max(100), title: z.string().trim().min(1).max(120), questionCount: z.coerce.number().int().min(1).max(50), dueAt: z.string().datetime().optional() }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Kontroller klasse, leksetittel, antall oppgaver og frist.' });
    const activity = getActivity(input.data.activityId);
    if (!activity || input.data.questionCount > activity.questions.length) return res.status(400).json({ error: 'Velg et gyldig innhold og antall oppgaver.' });
    if (input.data.dueAt) {
      const deadline = new Date(input.data.dueAt).getTime();
      if (deadline <= Date.now() || deadline > Date.now() + 91 * 24 * 60 * 60 * 1000) return res.status(400).json({ error: 'Fristen må være i framtiden og innen tre måneder.' });
    }
    try {
      const id = randomUUID();
      const { snapshot, contentVersion } = snapshotActivity(activity, input.data.questionCount);
      const recipientCount = await withUserContext(appPool, req.session, async (client) => {
        await requireTeacherClass(client, req.session, input.data.classId);
        await client.query(
          `INSERT INTO assignment(id,school_id,class_id,created_by,area,content_id,content_version,content_snapshot,question_limit,title,due_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)`,
          [id, req.session.schoolId, input.data.classId, req.session.userId, activity.area, activity.id, contentVersion, JSON.stringify(snapshot), input.data.questionCount, input.data.title, input.data.dueAt || null],
        );
        const recipients = await client.query(
          `INSERT INTO assignment_recipient(school_id,assignment_id,student_id)
           SELECT $1,$2,user_id FROM class_membership WHERE school_id=$1 AND class_id=$3 AND role='student' AND status='active' RETURNING student_id`,
          [req.session.schoolId, id, input.data.classId],
        );
        if (!recipients.rowCount) throw Object.assign(new Error('Class has no active student members'), { code: 'EMPTY_CLASS' });
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'assignment_created','assignment',$3)", [req.session.schoolId, req.session.userId, id]);
        return recipients.rowCount;
      });
      return res.status(201).json({ id, title: input.data.title, area: activity.area, contentVersion, recipientCount, dueAt: input.data.dueAt || null });
    } catch (error) {
      if (error.code === 'EMPTY_CLASS') return res.status(409).json({ error: 'Inviter eleven først. Leksen publiseres til klassen slik den er akkurat nå.' });
      return next(error);
    }
  });

  app.post('/api/assignments/:assignmentId/close', currentSession, csrf, requireSchool, requireRole('teacher'), mutationLimit, async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.assignmentId).success) return res.status(404).json({ error: 'Leksen finnes ikke.' });
    try {
      const closed = await withUserContext(appPool, req.session, async (client) => {
        const result = await client.query(
          `UPDATE assignment SET status='closed' WHERE school_id=$1 AND id=$2 AND status='published'
           AND app_is_class_member(school_id,class_id,'teacher') RETURNING id,class_id`,
          [req.session.schoolId, req.params.assignmentId],
        );
        const assignment = result.rows[0];
        if (!assignment) return false;
        await requireTeacherClass(client, req.session, assignment.class_id);
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'assignment_closed','assignment',$3)", [req.session.schoolId, req.session.userId, assignment.id]);
        return true;
      });
      return closed ? res.json({ ok: true }) : res.status(404).json({ error: 'Leksen finnes ikke eller er allerede avsluttet.' });
    } catch (error) { return next(error); }
  });

  app.get('/api/assignments', currentSession, requireSchool, async (req, res, next) => {
    if (!['teacher', 'student'].includes(req.session.role)) return res.status(403).json({ error: 'Du har ikke tilgang til lekser.' });
    try {
      const assignments = await withUserContext(appPool, req.session, async (client) => {
        const result = await client.query(
          `SELECT a.id,a.class_id,a.area,a.content_id,a.content_version,a.content_snapshot,a.question_limit,a.title,a.due_at,a.created_at,
             c.name AS class_name,cm.grant_id AS class_grant_id,
             (SELECT count(DISTINCT le.question_id)::int FROM learning_event le WHERE le.school_id=a.school_id AND le.assignment_id=a.id AND le.student_id=$2) AS answered
           FROM assignment a JOIN school_class c ON c.school_id=a.school_id AND c.id=a.class_id
           JOIN class_membership cm ON cm.school_id=a.school_id AND cm.class_id=a.class_id AND cm.user_id=$2 AND cm.role=$3 AND cm.status='active'
           WHERE a.school_id=$1 AND a.status='published' ORDER BY a.due_at NULLS LAST,a.created_at DESC`,
          [req.session.schoolId, req.session.userId, req.session.role],
        );
        const visible = [];
        for (const row of result.rows) {
          const contentAvailable = row.content_snapshot?.id === row.content_id
            && row.content_snapshot?.area === row.area
            && row.content_snapshot?.questions?.length === row.question_limit
            && verifyActivitySnapshot(row.content_snapshot, row.content_version);
          if (req.session.role === 'student' && !contentAvailable) continue;
          if (await journal.isRevoked(row.class_grant_id)) continue;
          if (req.session.role === 'student') {
            const recipient = await client.query("SELECT 1 FROM assignment_recipient WHERE school_id=$1 AND assignment_id=$2 AND student_id=$3 AND status='assigned'", [req.session.schoolId, row.id, req.session.userId]);
            if (!recipient.rowCount) continue;
          }
          const activityTitle = contentAvailable ? row.content_snapshot.title : 'Innhold mangler publisert versjon';
          const answered = req.session.role === 'student' ? row.answered : 0;
          visible.push({ id: row.id, classId: row.class_id, className: row.class_name, area: row.area, title: row.title, dueAt: row.due_at, questionCount: row.question_limit, answered, activityTitle, contentAvailable });
        }
        return visible;
      });
      return res.json({ assignments });
    } catch (error) { return next(error); }
  });

  app.post('/api/me/export', currentSession, csrf, requireSchool, requireRole('student'), mutationLimit, async (req, res, next) => {
    try {
      const output = await withUserContext(appPool, req.session, async (client) => {
        const profile = await client.query('SELECT id,display_name FROM app_user WHERE id=$1', [req.session.userId]);
        const events = await client.query(
          `SELECT id,area,content_id,content_version,question_id,outcome,attempt,hints_used,practice_session,created_at
           FROM learning_event WHERE school_id=$1 AND student_id=$2 ORDER BY created_at`,
          [req.session.schoolId, req.session.userId],
        );
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'export_created','membership',$2)", [req.session.schoolId, req.session.userId]);
        return { exportedAt: new Date().toISOString(), student: profile.rows[0], learningEvents: events.rows };
      });
      return res.json(output);
    } catch (error) { return next(error); }
  });

  app.get('/api/assignments/:assignmentId', currentSession, requireSchool, requireRole('student'), async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.assignmentId).success) return res.status(404).json({ error: 'Leksen finnes ikke.' });
    try {
      const payload = await withUserContext(appPool, req.session, async (client) => {
        const result = await client.query(
          `SELECT a.id,a.class_id,a.area,a.content_id,a.content_version,a.content_snapshot,a.question_limit,a.title,a.due_at,cm.grant_id AS class_grant_id
           FROM assignment a JOIN assignment_recipient ar ON ar.school_id=a.school_id AND ar.assignment_id=a.id AND ar.student_id=$3 AND ar.status='assigned'
           JOIN class_membership cm ON cm.school_id=a.school_id AND cm.class_id=a.class_id AND cm.user_id=$3 AND cm.role='student' AND cm.status='active'
           WHERE a.school_id=$1 AND a.id=$2 AND a.status='published'`, [req.session.schoolId, req.params.assignmentId, req.session.userId],
        );
        const assignment = result.rows[0];
        if (!assignment) return null;
        await journal.assertNotRevoked(assignment.class_grant_id);
        if (assignment.content_snapshot?.id !== assignment.content_id || assignment.content_snapshot?.area !== assignment.area
          || assignment.content_snapshot?.questions?.length !== assignment.question_limit
          || !verifyActivitySnapshot(assignment.content_snapshot, assignment.content_version)) return null;
        const exercise = publicActivitySnapshot(assignment.content_snapshot, assignment.question_limit);
        if (!exercise) return null;
        const previous = await client.query(
          `SELECT DISTINCT ON (question_id) question_id,attempt,outcome FROM learning_event
           WHERE school_id=$1 AND assignment_id=$2 AND student_id=$3 ORDER BY question_id,attempt DESC,created_at DESC`,
          [req.session.schoolId, assignment.id, req.session.userId],
        );
        return { assignment: { id: assignment.id, title: assignment.title, area: assignment.area, dueAt: assignment.due_at, questionCount: assignment.question_limit }, exercise, answers: previous.rows, practiceSession: randomUUID() };
      });
      return payload ? res.json(payload) : res.status(404).json({ error: 'Leksen finnes ikke eller er ikke tildelt deg.' });
    } catch (error) { return next(error); }
  });

  app.post('/api/assignments/:assignmentId/answers', currentSession, csrf, requireSchool, requireRole('student'), mutationLimit, async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.assignmentId).success) return res.status(404).json({ error: 'Leksen finnes ikke.' });
    const input = z.object({ eventId: uuidSchema, practiceSession: uuidSchema, questionId: z.string().min(1).max(160), answerId: z.string().min(1).max(160) }).safeParse(req.body);
    if (!input.success) return res.status(400).json({ error: 'Velg et svar på oppgaven.' });
    try {
      const answer = await withUserContext(appPool, req.session, async (client) => {
        const assignmentResult = await client.query('SELECT class_id,area,content_id,content_version,content_snapshot,question_limit FROM assignment WHERE school_id=$1 AND id=$2 AND status=\'published\'', [req.session.schoolId, req.params.assignmentId]);
        const assignment = assignmentResult.rows[0];
        if (!assignment) return null;
        await requireStudentClass(client, req.session, assignment.class_id);
        const recipient = await client.query("SELECT 1 FROM assignment_recipient WHERE school_id=$1 AND assignment_id=$2 AND student_id=$3 AND status='assigned'", [req.session.schoolId, req.params.assignmentId, req.session.userId]);
        if (!recipient.rowCount) return null;
        if (assignment.content_snapshot?.id !== assignment.content_id || assignment.content_snapshot?.area !== assignment.area
          || assignment.content_snapshot?.questions?.length !== assignment.question_limit
          || !verifyActivitySnapshot(assignment.content_snapshot, assignment.content_version)) return null;
        const selected = assignment.content_snapshot.questions.slice(0, assignment.question_limit).find((question) => question.id === input.data.questionId);
        if (!selected) return null;
        const scored = evaluateSnapshot(assignment.content_snapshot, input.data.questionId, input.data.answerId);
        if (!scored) return { invalidAnswer: true };
        const dupe = await client.query('SELECT outcome,question_id,assignment_id FROM learning_event WHERE id=$1 AND school_id=$2 AND student_id=$3', [input.data.eventId, req.session.schoolId, req.session.userId]);
        if (dupe.rowCount) {
          if (dupe.rows[0].assignment_id !== req.params.assignmentId || dupe.rows[0].question_id !== input.data.questionId || dupe.rows[0].outcome !== scored.outcome) return { conflict: true };
          return { outcome: dupe.rows[0].outcome, explanation: scored.explanation, saved: true, duplicate: true };
        }
        const attempt = await client.query('SELECT coalesce(max(attempt),0)::int+1 AS next FROM learning_event WHERE school_id=$1 AND assignment_id=$2 AND student_id=$3 AND question_id=$4', [req.session.schoolId, req.params.assignmentId, req.session.userId, input.data.questionId]);
        const nextAttempt = attempt.rows[0].next;
        if (nextAttempt > 20) return { limitReached: true };
        await client.query(
          `INSERT INTO learning_event(id,school_id,assignment_id,student_id,area,content_id,content_version,question_id,outcome,attempt,hints_used,practice_session)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11)`,
          [input.data.eventId, req.session.schoolId, req.params.assignmentId, req.session.userId, assignment.area, assignment.content_id, assignment.content_version, input.data.questionId, scored.outcome, nextAttempt, input.data.practiceSession],
        );
        return { outcome: scored.outcome, explanation: scored.explanation, saved: true, attempt: nextAttempt };
      });
      if (!answer) return res.status(404).json({ error: 'Leksen finnes ikke eller tilgangen er avsluttet.' });
      if (answer.invalidAnswer) return res.status(400).json({ error: 'Dette svaret hører ikke til oppgaven.' });
      if (answer.conflict) return res.status(409).json({ error: 'Svaret er allerede lagret med en annen verdi.' });
      if (answer.limitReached) return res.status(429).json({ error: 'Du har brukt alle forsøkene på denne oppgaven.' });
      return res.json(answer);
    } catch (error) { return next(error); }
  });

  app.get('/api/classes/:classId/progress', currentSession, requireSchool, requireRole('teacher'), async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.classId).success) return res.status(404).json({ error: 'Klassen finnes ikke.' });
    try {
      const data = await withUserContext(appPool, req.session, async (client) => {
        await requireTeacherClass(client, req.session, req.params.classId);
        const result = await client.query(
          `WITH latest AS (
             SELECT DISTINCT ON (school_id,assignment_id,student_id,question_id) school_id,assignment_id,student_id,question_id,outcome
             FROM learning_event WHERE school_id=$1 ORDER BY school_id,assignment_id,student_id,question_id,attempt DESC,created_at DESC
           )
           SELECT u.id AS student_id,u.display_name,a.id AS assignment_id,a.title,a.area,a.question_limit,a.content_id,
             count(latest.question_id)::int AS answered,
             count(latest.question_id) FILTER(WHERE latest.outcome='correct')::int AS correct
           FROM school_class c JOIN class_membership cm ON cm.school_id=c.school_id AND cm.class_id=c.id AND cm.role='student' AND cm.status='active'
           JOIN app_user u ON u.id=cm.user_id
           JOIN assignment_recipient ar ON ar.school_id=c.school_id AND ar.student_id=u.id AND ar.status='assigned'
           JOIN assignment a ON a.school_id=ar.school_id AND a.id=ar.assignment_id AND a.class_id=c.id AND a.status='published'
           LEFT JOIN latest ON latest.school_id=a.school_id AND latest.assignment_id=a.id AND latest.student_id=u.id
           WHERE c.school_id=$1 AND c.id=$2
           GROUP BY u.id,u.display_name,a.id,a.title,a.area,a.question_limit,a.content_id ORDER BY u.display_name,a.area,a.title`,
          [req.session.schoolId, req.params.classId],
        );
        return result.rows;
      });
      const allowedRows = [];
      for (const row of data) {
        if (!(await getClassGrantForStudent(appPool, req.session, req.params.classId, row.student_id, journal))) continue;
        allowedRows.push({ studentId: row.student_id, name: row.display_name, assignmentId: row.assignment_id, title: row.title, area: row.area,
          attempted: row.answered, total: row.question_limit, correct: row.correct });
      }
      return res.json({ rows: allowedRows });
    } catch (error) { return next(error); }
  });

  app.post('/api/classes/:classId/export', currentSession, csrf, requireSchool, requireRole('teacher'), mutationLimit, async (req, res, next) => {
    if (!uuidSchema.safeParse(req.params.classId).success) return res.status(404).json({ error: 'Klassen finnes ikke.' });
    try {
      const output = await withUserContext(appPool, req.session, async (client) => {
        await requireTeacherClass(client, req.session, req.params.classId);
        const result = await client.query(
          `WITH latest AS (
             SELECT DISTINCT ON (school_id,assignment_id,student_id,question_id) school_id,assignment_id,student_id,question_id,outcome
             FROM learning_event WHERE school_id=$1 ORDER BY school_id,assignment_id,student_id,question_id,attempt DESC,created_at DESC
           )
           SELECT u.id AS student_id,u.display_name,a.area,a.title,count(DISTINCT latest.question_id)::int AS answered,
             count(DISTINCT latest.question_id) FILTER(WHERE latest.outcome='correct')::int AS correct
           FROM class_membership cm JOIN app_user u ON u.id=cm.user_id
           JOIN assignment a ON a.school_id=cm.school_id AND a.class_id=cm.class_id
           JOIN assignment_recipient ar ON ar.school_id=a.school_id AND ar.assignment_id=a.id AND ar.student_id=u.id AND ar.status='assigned'
           LEFT JOIN latest ON latest.school_id=a.school_id AND latest.assignment_id=a.id AND latest.student_id=u.id
           WHERE cm.school_id=$1 AND cm.class_id=$2 AND cm.role='student' AND cm.status='active'
           GROUP BY u.id,u.display_name,a.id,a.area,a.title ORDER BY u.display_name,a.area,a.title`, [req.session.schoolId, req.params.classId],
        );
        await client.query("INSERT INTO audit_event(school_id,actor_id,action,target_type,target_id) VALUES($1,$2,'export_created','class',$3)", [req.session.schoolId, req.session.userId, req.params.classId]);
        return { exportedAt: new Date().toISOString(), rows: result.rows };
      });
      for (const row of output.rows) if (!(await getClassGrantForStudent(appPool, req.session, req.params.classId, row.student_id, journal))) row.display_name = undefined;
      output.rows = output.rows.filter((row) => row.display_name);
      return res.json(output);
    } catch (error) { return next(error); }
  });

  if (serveLocalStaticAssets) attachLocalStaticAssets(app);
  app.use((_req, res) => res.status(404).json({ error: 'Fant ikke ressursen.' }));

  app.use((error, req, res, _next) => {
    if (res.headersSent) return;
    if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON-forespørselen er ugyldig.' });
    if (error?.type === 'entity.too.large') return res.status(413).json({ error: 'Forespørselen er for stor.' });
    if (error?.code === 'ACCESS_REVOKED') return res.status(404).json({ error: 'Ressursen finnes ikke eller tilgangen er avsluttet.' });
    if (error?.code === '23505') return res.status(409).json({ error: 'Dette finnes allerede. Kontroller klassen og prøv igjen.' });
    if (error?.code === '23514' || error?.code === '22P02') return res.status(400).json({ error: 'Opplysningene er ugyldige.' });
    // Never log request paths, query strings, headers, tokens, SQL details or identity claims.
    console.error(`School app request failed: ${req.method} ${safeRouteLabel(req)} (${typeof error?.code === 'string' ? error.code : 'unknown'})`);
    return res.status(503).json({ error: 'Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.' });
  });

  return { app, sessions, oidc, journal };
}

async function getClassGrantForStudent(pool, session, classId, studentId, journal) {
  const result = await withUserContext(pool, session, async (client) => client.query(
    "SELECT grant_id FROM class_membership WHERE school_id=$1 AND class_id=$2 AND user_id=$3 AND role='student' AND status='active'",
    [session.schoolId, classId, studentId],
  ));
  if (result.rowCount !== 1) return false;
  return !(await journal.isRevoked(result.rows[0].grant_id));
}

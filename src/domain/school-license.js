import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Stateless, zero-PII signed license tokens for Undervisningspakken.
 * Format: SP123.<base64url(JSON)>.<base64url(16-byte HMAC-SHA256)>
 */

export const FREE_SAMPLE_LESSON_IDS = Object.freeze([
  'wordkeys-recognizable',
  'hilsener',
  'tall',
]);

export const ALLOWED_PLANS = Object.freeze([
  'undervisningspakke',
  'skolepakke',
  'kommunepakke',
]);

const LICENSE_PREFIX = 'SP123';
const STUDENT_LESSON_PREFIX = 'SP123E';
const HMAC_DOMAIN = 'spansk123-license:v1:';
const STUDENT_HMAC_DOMAIN = 'spansk123-student-lesson:v1:';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const LESSON_ID_PATTERN = /^[a-z0-9-]+$/u;

export function isFreeLessonId(lessonId) {
  return FREE_SAMPLE_LESSON_IDS.includes(lessonId);
}

export function licenseCookieName(secure) {
  return secure ? '__Host-spansk123_license' : 'spansk123_license_dev';
}

export function studentLessonCookieName(secure) {
  // Uses __Secure- instead of __Host- because student cookies are scoped to Path=/undervisning/<lessonId>/.
  return secure ? '__Secure-spansk123_elev' : 'spansk123_elev_dev';
}

function assertValidSecret(secret) {
  if (typeof secret !== 'string' || secret.length < 16) {
    throw new Error('License signing secret must be at least 16 characters');
  }
}

function signPayload(payloadB64, secret, domain = HMAC_DOMAIN) {
  return createHmac('sha256', secret)
    .update(`${domain}${payloadB64}`)
    .digest()
    .subarray(0, 16)
    .toString('base64url');
}

function isValidCalendarDate(dateStr) {
  if (!DATE_PATTERN.test(dateStr)) return false;
  const parsed = new Date(`${dateStr}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateStr;
}

export function createSchoolLicenseCode({
  school,
  plan = 'undervisningspakke',
  expiresAt,
  licenseId,
}, secret) {
  assertValidSecret(secret);
  const trimmedSchool = typeof school === 'string' ? school.trim() : '';
  if (!trimmedSchool || trimmedSchool.length > 120) {
    throw new Error('School name must be 1 to 120 characters');
  }
  if (!ALLOWED_PLANS.includes(plan)) {
    throw new Error(`Unsupported license plan: ${plan}`);
  }
  if (typeof expiresAt !== 'string' || !isValidCalendarDate(expiresAt)) {
    throw new Error('expiresAt must be a valid YYYY-MM-DD date');
  }
  const id = typeof licenseId === 'string' && licenseId.trim()
    ? licenseId.trim()
    : `lic-${randomBytes(4).toString('hex')}`;

  const payload = {
    v: 1,
    id,
    plan,
    school: trimmedSchool,
    exp: expiresAt,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = signPayload(payloadB64, secret);
  return `${LICENSE_PREFIX}.${payloadB64}.${sigB64}`;
}

export function verifySchoolLicenseCode(code, secret, now = new Date()) {
  if (typeof secret !== 'string' || secret.length < 16) {
    return { valid: false, reason: 'unconfigured' };
  }
  if (typeof code !== 'string') {
    return { valid: false, reason: 'malformed' };
  }
  const trimmed = code.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3 || parts[0] !== LICENSE_PREFIX || !parts[1] || !parts[2]) {
    return { valid: false, reason: 'malformed' };
  }

  const [, payloadB64, sigB64] = parts;
  const expectedSig = Buffer.from(signPayload(payloadB64, secret), 'base64url');
  let providedSig;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (providedSig.length !== expectedSig.length || !timingSafeEqual(providedSig, expectedSig)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.v !== 1
      || !ALLOWED_PLANS.includes(payload.plan)
      || typeof payload.id !== 'string' || !payload.id.trim()
      || typeof payload.school !== 'string' || !payload.school.trim() || payload.school.trim().length > 120
      || typeof payload.exp !== 'string' || !isValidCalendarDate(payload.exp)) {
    return { valid: false, reason: 'malformed' };
  }

  const todayUtc = now.toISOString().slice(0, 10);
  if (payload.exp < todayUtc) {
    return { valid: false, reason: 'expired' };
  }

  return {
    valid: true,
    license: {
      id: payload.id,
      plan: payload.plan,
      school: payload.school.trim(),
      expiresAt: payload.exp,
    },
  };
}

export function createStudentLessonToken({
  lessonId,
  expiresAt,
}, secret) {
  assertValidSecret(secret);
  const trimmedLessonId = typeof lessonId === 'string' ? lessonId.trim() : '';
  if (!LESSON_ID_PATTERN.test(trimmedLessonId)) {
    throw new Error('Invalid lessonId for student token');
  }
  if (typeof expiresAt !== 'string' || !isValidCalendarDate(expiresAt)) {
    throw new Error('expiresAt must be a valid YYYY-MM-DD date');
  }
  const payload = {
    v: 1,
    lessonId: trimmedLessonId,
    exp: expiresAt,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = signPayload(payloadB64, secret, STUDENT_HMAC_DOMAIN);
  return `${STUDENT_LESSON_PREFIX}.${payloadB64}.${sigB64}`;
}

export function verifyStudentLessonToken(token, expectedLessonId, secret, now = new Date()) {
  if (typeof secret !== 'string' || secret.length < 16) {
    return { valid: false, reason: 'unconfigured' };
  }
  if (typeof token !== 'string' || typeof expectedLessonId !== 'string' || !LESSON_ID_PATTERN.test(expectedLessonId)) {
    return { valid: false, reason: 'malformed' };
  }
  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts[0] !== STUDENT_LESSON_PREFIX || !parts[1] || !parts[2]) {
    return { valid: false, reason: 'malformed' };
  }
  const [, payloadB64, sigB64] = parts;
  const expectedSig = Buffer.from(signPayload(payloadB64, secret, STUDENT_HMAC_DOMAIN), 'base64url');
  let providedSig;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (providedSig.length !== expectedSig.length || !timingSafeEqual(providedSig, expectedSig)) {
    return { valid: false, reason: 'invalid_signature' };
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.v !== 1
      || payload.lessonId !== expectedLessonId
      || typeof payload.exp !== 'string' || !isValidCalendarDate(payload.exp)) {
    return { valid: false, reason: 'malformed' };
  }
  const todayUtc = now.toISOString().slice(0, 10);
  if (payload.exp < todayUtc) {
    return { valid: false, reason: 'expired' };
  }
  return {
    valid: true,
    lessonId: payload.lessonId,
    expiresAt: payload.exp,
  };
}

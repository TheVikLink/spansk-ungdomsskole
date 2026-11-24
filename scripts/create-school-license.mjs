import { existsSync, readFileSync } from 'node:fs';
import { ALLOWED_PLANS, createSchoolLicenseCode } from '../src/domain/school-license.js';

function loadDotEnvIfNeeded() {
  if (process.env.LICENSE_SIGNING_SECRET || process.env.SESSION_SECRET || !existsSync('.env')) return;
  for (const rawLine of readFileSync('.env', 'utf8').split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (key !== 'LICENSE_SIGNING_SECRET' && key !== 'SESSION_SECRET') continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnvIfNeeded();

function readArg(prefix) {
  const match = process.argv.slice(2).find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1) : '';
}

const school = readArg('--school');
const expiresAt = readArg('--expires');
const plan = readArg('--plan') || 'undervisningspakke';
const licenseId = readArg('--id') || undefined;
const origin = (readArg('--origin') || 'https://www.spansk123.no').replace(/\/$/u, '');
const secret = (process.env.LICENSE_SIGNING_SECRET || process.env.SESSION_SECRET || '').trim();

if (!school || !expiresAt) {
  console.error('Bruk: npm run license:create -- --school="Eksempel ungdomsskole" --expires=2027-08-31 [--plan=undervisningspakke] [--id=skole-01] [--origin=https://www.spansk123.no]');
  console.error(`Gyldige pakker: ${ALLOWED_PLANS.join(', ')}`);
  process.exit(1);
}

if (secret.length < 16) {
  console.error('Mangler LICENSE_SIGNING_SECRET eller SESSION_SECRET (minst 16 tegn) i miljøvariabler eller .env.');
  process.exit(1);
}

const code = createSchoolLicenseCode({ school, plan, expiresAt, licenseId }, secret);
const activationUrl = `${origin}/undervisning/?kode=${encodeURIComponent(code)}`;

console.log(`Skole: ${school.trim()}`);
console.log(`Pakke: ${plan}`);
console.log(`Gyldig til: ${expiresAt}`);
console.log(`Skolekode:\n${code}\n`);
console.log(`Direktelenke for 1-klikks aktivering:\n${activationUrl}`);

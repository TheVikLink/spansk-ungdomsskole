import express from 'express';
import { randomBytes } from 'node:crypto';
import { attachLocalStaticAssets } from '../server/local-static-assets.js';
import { createSchoolLicenseCode } from '../src/domain/school-license.js';

process.env.UNDERVISNING_PAYWALL = 'true';

const configuredSecret = (process.env.LICENSE_SIGNING_SECRET || process.env.SESSION_SECRET || '').trim();
const usingEphemeralSecret = configuredSecret.length < 16;
const secret = usingEphemeralSecret ? randomBytes(24).toString('hex') : configuredSecret;
process.env.LICENSE_SIGNING_SECRET = secret;

const school = (process.env.PREVIEW_SCHOOL || 'Demo ungdomsskole').trim();
const expiresAt = (process.env.PREVIEW_EXPIRES || '2027-07-01').trim();
const host = '127.0.0.1';
const port = Number(process.env.PORT) || 4173;

const code = createSchoolLicenseCode({ school, expiresAt }, secret);

const app = express();
app.disable('x-powered-by');
attachLocalStaticAssets(app);

const server = app.listen(port, host, () => {
  const origin = `http://${host}:${port}`;
  const unlockUrl = `${origin}/undervisning/?kode=${encodeURIComponent(code)}`;
  console.log('Lokal forhåndsvisning av Spansk på 1-2-3 og Undervisningspakken er startet.');
  console.log(`Elevapp: ${origin}/`);
  console.log(`Lærerportal (låst visning): ${origin}/undervisning/`);
  console.log(`Gratis prøvetime: ${origin}/undervisning/tall/index.html`);
  console.log(`Låst timeeksempel (omdirigerer uten kode): ${origin}/undervisning/familie/index.html`);
  console.log(`Testkode (${school}, gyldig til ${expiresAt}):\n${code}`);
  console.log(`Direktelenke som låser opp alle 46 timene med 1 klikk:\n${unlockUrl}`);
  if (usingEphemeralSecret) {
    console.log('Merk: Bruker midlertidig lokal signeringsnøkkel for denne forhåndsvisningen.');
  }
});

server.on('error', (error) => {
  console.error('Kunne ikke starte lokal forhåndsvisningsserver:', error.message);
  process.exitCode = 1;
});

import { randomBytes } from 'node:crypto';
import { feideOrigin, returnUrl, schoolOrigin, schoolCallbackPath, validateFormFields } from '../return-config.mjs';

const maxBodyBytes = 2048;
const escapeAttribute = (value) => value.replace(/[&<>"']/gu, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function response(body, status, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'Referrer-Policy': 'strict-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Robots-Tag': 'noindex, nofollow',
      ...headers,
    },
  });
}

async function boundedFormBody(request) {
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let body = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return body + decoder.decode();
    bytes += value.byteLength;
    if (bytes > maxBodyBytes) {
      await reader.cancel();
      throw new Error('Form body too big');
    }
    body += decoder.decode(value, { stream: true });
  }
}

export default {
  async fetch(request) {
    if (request.url !== returnUrl) return response('Siden finnes ikke.', 404);
    if (request.method !== 'POST') return response('Feide-returen krever POST.', 405, { Allow: 'POST' });
    if (request.headers.get('origin') !== feideOrigin) return response('Returen kommer ikke fra Feide.', 403);
    const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (type !== 'application/x-www-form-urlencoded' || !request.body) {
      return response('Ugyldig format fra Feide.', 415);
    }

    let fields;
    try {
      const body = await boundedFormBody(request);
      fields = validateFormFields(new URLSearchParams(body), feideOrigin);
    } catch {
      return response('Ugyldig retur fra Feide. Start innloggingen på nytt.', 400);
    }

    const nonce = randomBytes(18).toString('base64');
    const action = `${schoolOrigin}${schoolCallbackPath}`;
    const inputs = [...fields].map(([key, value]) => `<input type="hidden" name="${key}" value="${escapeAttribute(value)}">`).join('');
    const html = `<!doctype html>
<html lang="nb"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fortsett til Spansk på 1-2-3</title>
<main><form id="feide-return" method="post" action="${action}">${inputs}<button type="submit">Fortsett til Spansk på 1-2-3</button></form></main>
<script nonce="${nonce}">document.getElementById('feide-return').submit();</script></html>`;
    return response(html, 200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action ${schoolOrigin}; script-src 'nonce-${nonce}'`,
    });
  },
};

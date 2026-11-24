export const schoolOrigin = 'https://skole.spansk123.no';
export const returnOrigin = 'https://feide-retur.spansk123.no';
export const feideOrigin = 'https://auth.dataporten.no';
export const returnUrl = `${returnOrigin}/api/feide-return`;
export const schoolCallbackPath = '/auth/callback';

export function validateFormFields(entries, issuer) {
  const allowed = new Set(['code', 'state', 'iss', 'error', 'error_description', 'error_uri']);
  const fields = new Map();
  for (const [key, value] of entries) {
    if (!allowed.has(key) || fields.has(key) || typeof value !== 'string' || !value) {
      throw new Error('Invalid OIDC callback form');
    }
    fields.set(key, value);
  }
  if (!fields.has('state') || fields.has('code') === fields.has('error')) {
    throw new Error('Invalid OIDC callback response');
  }
  if (fields.has('iss') && fields.get('iss') !== issuer) throw new Error('OIDC callback issuer mismatch');
  return fields;
}

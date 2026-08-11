const OPEN_TAG = '<script type="application/json" id="diagnosis-catalog-data">';
const CLOSE_TAG = '</script>';

export function extractDiagnosisCatalog(html) {
  const start = html.indexOf(OPEN_TAG);
  if (start === -1) {
    throw new Error('Missing diagnosis catalog data block');
  }

  const contentStart = start + OPEN_TAG.length;
  const end = html.indexOf(CLOSE_TAG, contentStart);
  if (end === -1) {
    throw new Error('Unclosed diagnosis catalog data block');
  }

  const source = html.slice(contentStart, end).trim();
  try {
    const catalog = JSON.parse(source);
    if (!Array.isArray(catalog)) throw new Error('catalog must be an array');
    return catalog;
  } catch (error) {
    throw new Error(`Diagnosis catalog is not valid JSON: ${error.message}`);
  }
}

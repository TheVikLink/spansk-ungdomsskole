import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDiagnosisCatalog } from '../scripts/lib/extract-inline-catalog.mjs';

test('extracts the diagnosis catalog from the bounded inline data block', () => {
  const html = `
    <script type="application/json" id="diagnosis-catalog-data">
      [{"id":"diag.one","responseMode":"typed"}]
    </script>
  `;

  assert.deepEqual(extractDiagnosisCatalog(html), [
    { id: 'diag.one', responseMode: 'typed' }
  ]);
});

test('rejects executable content in the diagnosis catalog block', () => {
  const html = `
    <script type="application/json" id="diagnosis-catalog-data">
      [{"id":"diag.one"}]
      alert('unexpected');
    </script>
  `;

  assert.throws(() => extractDiagnosisCatalog(html), /valid JSON/);
});

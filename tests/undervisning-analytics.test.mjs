import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const analyticsSource = await readFile(new URL('../undervisning/analytics.js', import.meta.url), 'utf8');

function createHarness({ url = 'https://www.spansk123.no/undervisning/?kode=SPANSK2026#top', navigator = {}, storedAttribution = null } = {}) {
  const appendedScripts = [];
  const fakeWindow = {
    location: new URL(url),
    localStorage: {
      getItem(key) {
        return key === '__va_attribution' ? storedAttribution : null;
      },
    },
  };
  fakeWindow.window = fakeWindow;

  const context = vm.createContext({
    URL,
    WeakSet,
    Element: class {},
    HTMLAudioElement: class {},
    navigator,
    window: fakeWindow,
    document: {
      addEventListener() {},
      querySelector: () => null,
      createElement: () => {
        const el = {
          attrs: {},
          setAttribute(name, value) {
            this.attrs[name] = value;
          },
        };
        return el;
      },
      head: {
        appendChild(node) {
          appendedScripts.push(node);
        },
      },
    },
  });

  vm.runInContext(analyticsSource, context);
  const beforeSendEntry = (fakeWindow.vaq || []).find(([cmd]) => cmd === 'beforeSend');
  return {
    beforeSend: beforeSendEntry?.[1],
    appendedScripts,
  };
}

test('sanitizes pageview URLs by stripping query params and fragments', () => {
  const { beforeSend, appendedScripts } = createHarness();
  assert.equal(typeof beforeSend, 'function');
  assert.equal(appendedScripts.length, 1);
  assert.equal(appendedScripts[0].src, '/_vercel/insights/script.js');

  const clean = JSON.parse(JSON.stringify(beforeSend({
    type: 'pageview',
    url: 'https://www.spansk123.no/undervisning/?kode=SPANSK2026&elev=abc#trinnet',
  })));
  assert.deepEqual(clean, {
    type: 'pageview',
    url: 'https://www.spansk123.no/undervisning/',
  });
});

test('preserves Vercel Web Analytics payload shape for license_activate, pdf_download and audio_play', () => {
  const { beforeSend } = createHarness();
  const clone = value => JSON.parse(JSON.stringify(value));

  const cleanDemoLicense = clone(beforeSend({
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/?kode=SPANSK2026',
    payload: {
      name: 'license_activate',
      data: { type: 'demo', extra: 'drop-me', secretToken: 'SP123.abc' },
    },
  }));
  assert.deepEqual(cleanDemoLicense, {
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/',
    payload: {
      name: 'license_activate',
      data: { type: 'demo' },
    },
  });

  const cleanSchoolLicense = clone(beforeSend({
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/?school=1',
    payload: {
      name: 'license_activate',
      data: { type: 'school', org: 'should-drop' },
    },
  }));
  assert.deepEqual(cleanSchoolLicense, {
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/',
    payload: {
      name: 'license_activate',
      data: { type: 'school' },
    },
  });

  const cleanPdf = clone(beforeSend({
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/tall/index.html?kode=secret#pdf',
    payload: {
      name: 'pdf_download',
      data: { lesson: 'tall', file: 'partnerkort-a.pdf', elev: 'hemmelig' },
    },
  }));
  assert.deepEqual(cleanPdf, {
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/tall/index.html',
    payload: {
      name: 'pdf_download',
      data: { lesson: 'tall', file: 'partnerkort-a.pdf' },
    },
  });

  const cleanAudio = clone(beforeSend({
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/jul-spania-chile/elev.html?elev=abc',
    payload: {
      name: 'audio_play',
      data: { lesson: 'jul-spania-chile', file: 'dialog.mp3', userAgent: 'drop' },
    },
  }));
  assert.deepEqual(cleanAudio, {
    type: 'event',
    url: 'https://www.spansk123.no/undervisning/jul-spania-chile/elev.html',
    payload: {
      name: 'audio_play',
      data: { lesson: 'jul-spania-chile', file: 'dialog.mp3' },
    },
  });
});

test('supports legacy top-level event shape when payload is absent', () => {
  const { beforeSend } = createHarness();
  const cleanTopLevel = JSON.parse(JSON.stringify(beforeSend({
    type: 'event',
    name: 'pdf_download',
    url: 'https://www.spansk123.no/undervisning/tall/index.html?kode=SP123',
    data: { lesson: 'tall', file: 'arbeidsark.pdf', extra: 'drop' },
  })));
  assert.deepEqual(cleanTopLevel, {
    type: 'event',
    name: 'pdf_download',
    url: 'https://www.spansk123.no/undervisning/tall/index.html',
    data: { lesson: 'tall', file: 'arbeidsark.pdf' },
  });
});

test('drops unknown events, invalid fields, and blocked private routes', () => {
  const { beforeSend } = createHarness();

  for (const blockedPath of ['/school', '/school?activity=1', '/auth/callback', '/api/session']) {
    assert.equal(
      beforeSend({
        type: 'pageview',
        url: `https://www.spansk123.no${blockedPath}`,
      }),
      null
    );
    assert.equal(
      beforeSend({
        type: 'event',
        url: `https://www.spansk123.no${blockedPath}`,
        payload: { name: 'pdf_download', data: { lesson: 'tall', file: 'arbeidsark.pdf' } },
      }),
      null
    );
  }

  for (const invalidEvent of [
    null,
    {},
    { type: 'identify', url: 'https://www.spansk123.no/undervisning/' },
    { type: 'event', url: 'https://www.spansk123.no/undervisning/', payload: { name: 'student_answer', data: { text: 'hola' } } },
    { type: 'event', url: 'https://www.spansk123.no/undervisning/', payload: { name: 'license_activate', data: { type: 'admin' } } },
    { type: 'event', url: 'https://www.spansk123.no/undervisning/', payload: { name: 'license_activate' } },
    { type: 'event', url: 'https://www.spansk123.no/undervisning/', payload: { name: 'pdf_download', data: { lesson: 'tall/bad', file: 'a.pdf' } } },
    { type: 'event', url: 'https://www.spansk123.no/undervisning/', payload: { name: 'audio_play', data: { lesson: 'tall', file: 'bad/path.mp3' } } },
  ]) {
    assert.equal(beforeSend(invalidEvent), null);
  }
});

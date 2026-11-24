import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const loader = await readFile('src/visitor-analytics.js', 'utf8');
// Optional captured real vendor script; keep external network out of regression runs.
const vendorPath = process.env.VERCEL_ANALYTICS_SCRIPT_FIXTURE;
const stub = `window.vaq[0][1]({type:'pageview',url:location.href});`;

for (const width of [390, 1280]) {
  test(`analytics strips URL and HTTP referrer at width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' });
    });
    const requests = [];
    const vendor = vendorPath ? await readFile(vendorPath, 'utf8') : stub;
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname.startsWith('/_vercel/insights/')) {
        requests.push({ path: url.pathname, headers: await request.allHeaders(), body: request.postDataJSON() });
        return route.fulfill({ contentType: url.pathname.endsWith('.js') ? 'text/javascript' : 'application/json', body: url.pathname.endsWith('.js') ? vendor : '{}' });
      }
      if (url.hostname === 'www.spansk123.no') {
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><html><head><meta name="referrer" content="no-referrer"></head><body><h1>Øving</h1><script>${loader}</script></body></html>` });
      }
      return route.abort();
    });
    await page.goto('https://www.spansk123.no/?fbclid=synthetic-secret&answer=private#private', { referer: 'https://www.facebook.com/' });
    await expect.poll(() => requests.some(r => r.path.endsWith('/script.js'))).toBe(true);
    if (vendorPath) {
      await expect.poll(() => requests.filter(r => r.path.endsWith('/view')).length).toBe(1);
      const intake = requests.find(r => r.path.endsWith('/view'));
      expect(intake.body.o).toBe('https://www.spansk123.no/');
      expect(intake.body.r).toBe('https://www.facebook.com/');
      expect(JSON.stringify(intake)).not.toContain('synthetic-secret');
      expect(JSON.stringify(intake)).not.toContain('answer=');
      expect(intake.body.userId).toBeUndefined();
      expect(intake.body.ed).toBeUndefined();
      await page.evaluate(() => {
        history.pushState({}, '', '/school?student=private');
        window.va('event', { name: 'private', data: { answer: 'private' } });
        window.va('identify', { userId: 'private' });
      });
      expect(requests.filter(r => r.path.endsWith('/view')).length).toBe(1);
      expect(requests.some(r => /\/(event|identify)$/.test(r.path))).toBe(false);
    }
    for (const request of requests) expect(request.headers.referer).toBeUndefined();
    await expect(page.getByRole('heading', { name: 'Øving' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('sensitive external referrer prevents every analytics request', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<head><meta name="referrer" content="no-referrer"></head><body><h1>Øving</h1><script>${loader}</script></body>` }));
  await page.goto('https://www.spansk123.no/', { referer: 'https://school.test/student/private?token=synthetic-secret' });
  await expect(page.getByRole('heading', { name: 'Øving' })).toBeVisible();
  expect(requests.filter(url => url.includes('/_vercel/'))).toEqual([]);
});

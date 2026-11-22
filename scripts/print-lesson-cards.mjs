// Run after build-lesson-plans.mjs with the project's installed Playwright Chromium.
import { readdir, rename, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../undervisning/', import.meta.url));
const directories = (await readdir(root, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && (!process.argv[2] || entry.name === process.argv[2]))
  .map(entry => entry.name)
  .sort();
if (!directories.length) throw new Error('Ingen timer funnet. Kjør build-lesson-plans.mjs først.');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });
  for (const directory of directories) {
    const folder = path.join(root, directory);
    await page.goto(pathToFileURL(path.join(folder, 'partnerkort.html')).href);
    const labels = await page.locator('.pair article small').allTextContents();
    if (labels.join('|') !== 'Samtalekort A|Samtalekort B') {
      throw new Error('Mangler partnerkort A eller B i ' + directory);
    }
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true });
    const temporary = path.join(folder, '.partnerkort-' + randomUUID() + '.tmp');
    try {
      await writeFile(temporary, pdf);
      await rename(temporary, path.join(folder, 'partnerkort.pdf'));
    } finally {
      await rm(temporary, { force: true });
    }
  }
  console.log('Skrev partnerkort for ' + directories.length + ' undervisningstimer.');
} finally {
  await browser.close();
}

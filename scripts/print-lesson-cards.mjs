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

  const printHtmlToPdf = async (htmlName, pdfName, check) => {
    await page.goto(pathToFileURL(path.join(folder, htmlName)).href);
    await check();
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: true });
    const temporary = path.join(folder, `.${pdfName}-${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, pdf);
      await rename(temporary, path.join(folder, pdfName));
    } finally {
      await rm(temporary, { force: true });
    }
  };

  for (const directory of directories) {
    var folder = path.join(root, directory);
    await printHtmlToPdf('partnerkort.html', 'partnerkort.pdf', async () => {
      const labels = await page.locator('.pair article small').allTextContents();
      if (labels.join('|') !== 'Samtalekort A|Samtalekort B') {
        throw new Error('Mangler partnerkort A eller B i ' + directory);
      }
    });
    await printHtmlToPdf('partnerkort-a.html', 'partnerkort-a.pdf', async () => {
      const labels = await page.locator('.pair article small').allTextContents();
      if (labels.join('|') !== 'Samtalekort A') {
        throw new Error('Mangler Samtalekort A i ' + directory);
      }
    });
    await printHtmlToPdf('partnerkort-b.html', 'partnerkort-b.pdf', async () => {
      const labels = await page.locator('.pair article small').allTextContents();
      if (labels.join('|') !== 'Samtalekort B') {
        throw new Error('Mangler Samtalekort B i ' + directory);
      }
    });
    await printHtmlToPdf('arbeidsark.html', 'arbeidsark.pdf', async () => {
      const worksheetHeading = (await page.locator('.worksheet h1').textContent() || '').trim();
      if (!worksheetHeading) {
        throw new Error('Mangler elevark-overskrift i ' + directory);
      }
    });
  }
  console.log('Skrev partnerkort (samlet, A, B) og elevark (PDF) for ' + directories.length + ' undervisningstimer.');
} finally {
  await browser.close();
}

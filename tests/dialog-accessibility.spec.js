import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

async function assertDialogKeyboardContract(page, open, name, initialFocus) {
  const trigger = page.locator('#dialog-a11y-trigger');
  await trigger.focus();
  await page.evaluate(open);

  const dialog = page.getByRole('dialog', { name });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator(initialFocus)).toBeFocused();

  const controls = dialog.locator('button, input, textarea, select, a[href], [tabindex="0"]');
  const first = controls.first();
  const last = controls.last();
  await last.focus();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

test('v2p: settings, feedback, import and brainmap dialogs have a keyboard contract', async ({ page }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<button id="dialog-a11y-trigger">Åpne</button>');
    document.getElementById('mainApp')?.classList.remove('hidden');
  });

  await assertDialogKeyboardContract(page, () => showSettings(), /Innstillinger/, '#settingsNameInput');
  await assertDialogKeyboardContract(page, () => showFeedbackView(), /Tilbakemeldinger/, '#feedbackViewClose');
  await assertDialogKeyboardContract(page, () => showChapterTextImport(), /Importer kapittelord/, '#chapterImportCategory');

  const brainmapState = await page.evaluate(() => {
    showPage('brainmap');
    const skillId = Object.keys(getBrainmapSkillActionDescriptors())[0];
    showBrainmapSkillDetail(skillId);
    return { skillId, container: Boolean(document.getElementById('brainmapSkillDetail')), hidden: document.getElementById('brainmapSkillDetail')?.className, html: document.getElementById('brainmapSkillDetail')?.innerHTML };
  });
  const brainmapDialog = page.getByRole('dialog', { name: /.+/ });
  await expect(brainmapDialog).toBeVisible();
  await expect(brainmapDialog).toHaveAttribute('aria-modal', 'true');
  await expect(brainmapDialog.locator('button').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(brainmapDialog).toHaveCount(0);
  await expect(page.locator('#dialog-a11y-trigger')).toBeFocused();
});

test('xm3: central identity and import fields expose accessible names', async ({ page }) => {
  await page.goto(appUrl);
  await expect(page.getByLabel('Fornavn eller elevkode', { exact: false })).toHaveCount(1);
  await page.evaluate(() => showSettings());
  await expect(page.getByLabel('Fornavn eller elevkode', { exact: false })).toHaveCount(2);
  await page.evaluate(() => { closeSettings(); showChapterTextImport(); });
  const importModal = page.locator('.settings-modal');
  await expect(importModal.getByLabel('Kategori', { exact: false })).toHaveCount(1);
  await expect(importModal.getByLabel('Tekst fra ordliste', { exact: false })).toHaveCount(1);
});

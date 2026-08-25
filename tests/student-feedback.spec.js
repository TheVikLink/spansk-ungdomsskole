import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('student feedback channel', () => {
  test('saves a feedback entry to localStorage with schema v1', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      saveFeedbackEntry({
        itemRef: 'vocab:bror:el hermano:es-no',
        source: 'gloser',
        prompt: 'el hermano',
        studentAnswer: 'broren min',
        expectedAnswer: 'bror / broren',
        studentExplanation: 'Broren min er også riktig',
        studentLabel: 'anonym'
      });
      return JSON.parse(localStorage.getItem('spansk123_studentFeedback_v1'));
    });

    expect(result.schemaVersion).toBe(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({
      itemRef: 'vocab:bror:el hermano:es-no',
      source: 'gloser',
      prompt: 'el hermano',
      studentAnswer: 'broren min',
      expectedAnswer: 'bror / broren',
      studentExplanation: 'Broren min er også riktig',
      studentLabel: 'anonym'
    });
    expect(result.entries[0].id).toMatch(/^fb-\d+-\d+$/);
    expect(result.entries[0].createdAt).toBeTruthy();
  });

  test('defaults to anonymous label when no studentLabel is provided', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      saveFeedbackEntry({
        itemRef: 'test:anonymous',
        source: 'test',
        prompt: 'test',
        studentAnswer: 'test',
        expectedAnswer: 'test',
        studentExplanation: ''
      });
      return JSON.parse(localStorage.getItem('spansk123_studentFeedback_v1'));
    });

    expect(result.entries[0].studentLabel).toBe('anonym');
  });

  test('deleteFeedbackEntry removes the correct entry', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      saveFeedbackEntry({ itemRef: 'test:1', source: 'test', prompt: 'a', studentAnswer: 'b', expectedAnswer: 'c', studentExplanation: '' });
      saveFeedbackEntry({ itemRef: 'test:2', source: 'test', prompt: 'd', studentAnswer: 'e', expectedAnswer: 'f', studentExplanation: '' });
      const data = loadStudentFeedback();
      const firstId = data.entries[0].id;
      deleteFeedbackEntry(firstId);
      return loadStudentFeedback();
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].itemRef).toBe('test:2');
  });

  test('resetAllData clears feedback storage', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      saveFeedbackEntry({ itemRef: 'test', source: 'test', prompt: 'a', studentAnswer: 'b', expectedAnswer: 'c', studentExplanation: '' });
    });

    const afterSave = await page.evaluate(() => localStorage.getItem('spansk123_studentFeedback_v1'));
    expect(afterSave).not.toBeNull();

    await page.evaluate(() => clearAllLocalAppData());
    const afterReset = await page.evaluate(() => localStorage.getItem('spansk123_studentFeedback_v1'));
    expect(afterReset).toBeNull();
  });

  test('exportFeedback produces a downloadable JSON file', async ({ page }) => {
    await page.goto(appUrl);

    let downloadTriggered = false;
    page.on('download', () => { downloadTriggered = true; });

    await page.evaluate(() => {
      localStorage.clear();
      saveFeedbackEntry({ itemRef: 'test:export', source: 'test', prompt: 'a', studentAnswer: 'b', expectedAnswer: 'c', studentExplanation: 'test export' });
    });

    await page.evaluate(() => exportFeedback());
    await page.waitForTimeout(500);

    expect(downloadTriggered).toBe(true);
  });

  test('feedback dialog appears from settings and can be submitted', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      studentName = 'TestElev';
      saveFeedbackEntry({
        itemRef: 'vocab:test:test:es-no',
        source: 'gloser',
        prompt: 'test prompt',
        studentAnswer: 'my answer',
        expectedAnswer: 'expected',
        studentExplanation: 'this should be correct because...',
        studentLabel: 'TestElev'
      });
      return loadStudentFeedback();
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].studentLabel).toBe('TestElev');
    expect(result.entries[0].studentExplanation).toBe('this should be correct because...');
  });

  test('feedback link appears after a wrong vocabulary answer', async ({ page }) => {
    await page.goto(appUrl);

    const hasFeedbackLink = await page.evaluate(() => {
      localStorage.clear();
      loadData();
      const card = cards.find(c => c.no === 'bror');
      if (!card) return false;
      currentCard = { card, direction: 'es-no', responseMode: 'typed', typed: true };
      showingAnswer = false;
      document.getElementById('flashcardArea').innerHTML = `
        <input type="text" id="typedVocabInput" value="feil svar" autocomplete="off">
        <div id="typedVocabFeedback"></div>
      `;
      submitTypedVocabAnswer();
      return !!document.querySelector('#typedVocabFeedback button[onclick*="showFeedbackDialog"]');
    });

    expect(hasFeedbackLink).toBe(true);
  });
});

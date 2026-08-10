import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('sentence puzzle game', () => {
  test('starts from the games menu and advances after a correct sentence', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 21';
      showMainApp();
      showPage('games');
    });

    await page.getByRole('button', { name: /Setningspuslespill/ }).click();
    await expect(page.locator('#sentencePuzzleSetup')).toBeVisible();

    await page.getByRole('button', { name: /Start puslespillet/ }).click();
    await expect(page.locator('#sentencePuzzleGame')).toBeVisible();
    await expect(page.getByText('Norsk setning', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Din spanske setning', { exact: true })).toHaveCount(0);
    await expect(page.locator('#spProgressText')).toContainText(/1 av \d+/);
    await expect(page.locator('#spProgressPercent')).toHaveText('0%');
    await expect(page.locator('#spProgressFill')).toHaveAttribute('style', /width: 0%/);
    await expect(page.locator('#spSentenceTarget')).not.toBeEmpty();

    const result = await page.evaluate(() => {
      const expected = spCurrentPuzzle.words;
      expected.forEach(word => {
        document.querySelector(`[data-sp-word="${word.replaceAll('"', '\\"')}"]`).click();
      });
      checkSentencePuzzle();
      return {
        feedback: document.getElementById('spFeedback').textContent,
        score: document.getElementById('spScore').textContent,
        solved: spSolved,
        checkDisabled: document.getElementById('spCheckButton').disabled,
        checkClass: document.getElementById('spCheckButton').className,
        nextDisabled: document.getElementById('spNextButton').disabled,
        nextClass: document.getElementById('spNextButton').className,
        progressPercent: document.getElementById('spProgressPercent').textContent,
        progressWidth: document.getElementById('spProgressFill').style.width
      };
    });

    expect(result.feedback).toContain('Riktig');
    expect(result.score).toBe('1');
    expect(result.solved).toBe(1);
    expect(result.checkDisabled).toBe(true);
    expect(result.checkClass).toContain('btn-secondary');
    expect(result.nextDisabled).toBe(false);
    expect(result.nextClass).toContain('btn-primary');
    expect(result.progressPercent).not.toBe('0%');
    expect(result.progressWidth).not.toBe('0%');

    await page.getByRole('button', { name: /Neste setning/ }).click();
    await expect(page.locator('#spBuiltSentence')).toBeEmpty();
  });

  test('progress bar tracks completed sentences, not the current question number', async ({ page }) => {
    await page.goto(appUrl);

    const progress = await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 24';
      showMainApp();
      showPage('games');
      showGameSetup('sentence-puzzle');
      startSentencePuzzle();

      spQuestionPool = [
        { no: 'En.', words: ['Uno.'] },
        { no: 'To.', words: ['Dos.'] },
        { no: 'Tre.', words: ['Tres.'] },
        { no: 'Fire.', words: ['Cuatro.'] },
        { no: 'Fem.', words: ['Cinco.'] },
        { no: 'Seks.', words: ['Seis.'] }
      ];
      spRoundIndex = 0;
      spSolved = 0;
      renderSentencePuzzleRound();
      const first = {
        text: document.getElementById('spProgressText').textContent,
        percent: document.getElementById('spProgressPercent').textContent,
        width: document.getElementById('spProgressFill').style.width
      };

      spRoundIndex = 5;
      spSolved = 5;
      renderSentencePuzzleRound();
      const lastBeforeAnswer = {
        text: document.getElementById('spProgressText').textContent,
        percent: document.getElementById('spProgressPercent').textContent,
        width: document.getElementById('spProgressFill').style.width
      };

      document.querySelector('[data-sp-word="Seis."]').click();
      checkSentencePuzzle();
      const lastAfterAnswer = {
        percent: document.getElementById('spProgressPercent').textContent,
        width: document.getElementById('spProgressFill').style.width
      };

      return { first, lastBeforeAnswer, lastAfterAnswer };
    });

    expect(progress.first).toEqual({ text: '1 av 6', percent: '0%', width: '0%' });
    expect(progress.lastBeforeAnswer).toEqual({ text: '6 av 6', percent: '83%', width: '83%' });
    expect(progress.lastAfterAnswer).toEqual({ percent: '100%', width: '100%' });
  });

  test('reorders placed word tiles before checking the sentence', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 22';
      showMainApp();
      showPage('games');
      showGameSetup('sentence-puzzle');
      startSentencePuzzle();

      spCurrentPuzzle = { no: 'Jeg heter Ana.', words: ['Me', 'llamo', 'Ana.'] };
      spQuestionPool = [spCurrentPuzzle];
      spRoundIndex = 0;
      renderSentencePuzzleRound();

      spSelectedWords = [
        { word: 'llamo', tileIndex: 1 },
        { word: 'Me', tileIndex: 0 },
        { word: 'Ana.', tileIndex: 2 }
      ];
      renderBuiltSentencePuzzle();
    });

    await page.locator('[data-sp-built-index="1"]').dragTo(page.locator('[data-sp-built-index="0"]'));

    const order = await page.evaluate(() => spSelectedWords.map(entry => entry.word));
    expect(order).toEqual(['Me', 'llamo', 'Ana.']);

    await page.evaluate(() => checkSentencePuzzle());
    await expect(page.locator('#spFeedback')).toContainText('Riktig');
  });

  test('Enter activates the current primary sentence puzzle action', async ({ page }) => {
    await page.goto(appUrl);

    await page.evaluate(() => {
      localStorage.clear();
      studentName = 'Elev 23';
      showMainApp();
      showPage('games');
      showGameSetup('sentence-puzzle');
      startSentencePuzzle();

      spCurrentPuzzle = { no: 'Jeg har to brødre.', words: ['Tengo', 'dos', 'hermanos.'] };
      spQuestionPool = [
        spCurrentPuzzle,
        { no: 'Jeg liker musikk.', words: ['Me', 'gusta', 'la', 'música.'] }
      ];
      spRoundIndex = 0;
      spSolved = 0;
      renderSentencePuzzleRound();
    });

    await page.getByRole('button', { name: 'Tengo' }).click();
    await page.getByRole('button', { name: 'dos' }).click();
    await page.getByRole('button', { name: 'hermanos.' }).click();
    await page.keyboard.press('Enter');

    await expect(page.locator('#spFeedback')).toContainText('Riktig');
    await expect(page.locator('#spNextButton')).toBeEnabled();

    await page.keyboard.press('Enter');

    await expect(page.locator('#spProgressText')).toHaveText('2 av 2');
    await expect(page.locator('#spBuiltSentence')).toBeEmpty();
  });
});

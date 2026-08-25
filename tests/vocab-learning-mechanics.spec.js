import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('index.html')).toString();

test.describe('vocabulary learning mechanics', () => {
  test('adds first-letter hints for cards that share the same prompt side', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const sharedNo = [
        { id: 1, no: 'å forstå', es: 'entender' },
        { id: 2, no: 'å forstå', es: 'comprender' }
      ];
      const sharedEs = [
        { id: 3, no: 'rolig', es: 'tranquilo' },
        { id: 4, no: 'stille', es: 'tranquilo' }
      ];

      return {
        noEsFirst: getVocabPromptText({ card: sharedNo[0], direction: 'no-es' }, sharedNo),
        noEsSecond: getVocabPromptText({ card: sharedNo[1], direction: 'no-es' }, sharedNo),
        esNoFirst: getVocabPromptText({ card: sharedEs[0], direction: 'es-no' }, sharedEs),
        esNoSecond: getVocabPromptText({ card: sharedEs[1], direction: 'es-no' }, sharedEs)
      };
    });

    expect(result).toEqual({
      noEsFirst: 'å forstå (e)',
      noEsSecond: 'å forstå (c)',
      esNoFirst: 'tranquilo (r)',
      esNoSecond: 'tranquilo (s)'
    });
  });

  test('selects a stable percentage of due review cards for typed answers', async ({ page }) => {
    await page.goto(appUrl);

    const typed = await page.evaluate(() => {
      const items = Array.from({ length: 12 }, (_, index) => ({
        card: {
          id: index + 1,
          no: `ord ${index + 1}`,
          es: `palabra ${index + 1}`,
          noEs: { repetitions: 2, nextReview: '2026-05-01T00:00:00.000Z' },
          esNo: { repetitions: 0, nextReview: null }
        },
        direction: 'no-es'
      }));

      return markTypedReviewItems(items, 0.25).map(item => ({
        id: item.card.id,
        typed: item.typed === true
      }));
    });

    expect(typed.filter(item => item.typed)).toHaveLength(3);
    expect(typed.filter(item => item.typed).map(item => item.id)).toEqual([1, 5, 9]);
  });

  test('progresses review cards from flip to select to typed by strength', async ({ page }) => {
    await page.goto(appUrl);

    const modes = await page.evaluate(() => [
      getVocabularyResponseMode({ repetitions: 0, strength: 0 }),
      getVocabularyResponseMode({ repetitions: 1, strength: 1 }),
      getVocabularyResponseMode({ repetitions: 2, strength: 2 }),
      getVocabularyResponseMode({ repetitions: 3, strength: 3 }),
      getVocabularyResponseMode({ repetitions: 4, strength: 4 }),
      getVocabularyResponseMode({ repetitions: 5, strength: 5 }),
      getVocabularyResponseMode({ repetitions: 2, interval: 1 }),
      getVocabularyResponseMode({ repetitions: 4, interval: 7 })
    ]);

    expect(modes).toEqual(['flip', 'flip', 'select', 'select', 'typed', 'typed', 'select', 'typed']);
  });

  test('writes vocabulary ratings to the shared learning progress model', async ({ page }) => {
    await page.goto(appUrl);
    const result = await page.evaluate(() => {
      localStorage.clear();
      const card = { id: 42, no: 'hei', es: 'hola' };
      updateVocabularyLearningProgress(card, 'no-es', 'correct', '2026-08-21T10:00:00.000Z');
      return JSON.parse(localStorage.getItem('spansk123_learningProgress_v1'));
    });

    expect(result.wordProgress['42'].noToEs).toMatchObject({
      strength: 2,
      attempts: 1,
      correct: 1,
      lastSeenAt: '2026-08-21T10:00:00.000Z'
    });
  });

  test('builds deterministic select options for a vocabulary card', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const pool = [
        { id: 1, no: 'rød', es: 'rojo' },
        { id: 2, no: 'blå', es: 'azul' },
        { id: 3, no: 'grønn', es: 'verde' },
        { id: 4, no: 'gul', es: 'amarillo' }
      ];
      return getVocabularySelectOptions({ card: pool[0], direction: 'no-es' }, pool);
    });

    expect(result).toHaveLength(4);
    expect(result.filter(option => option.correct)).toEqual([
      { optionId: 'rojo', label: 'rojo', correct: true }
    ]);
    expect(new Set(result.map(option => option.label)).size).toBe(4);
  });

  test('accepts both indefinite and definite Norwegian forms for el hermano', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      bror: isTypedVocabAnswerCorrect('bror', 'bror', getVocabularyAcceptedAnswers({ no: 'bror', es: 'el hermano' }, 'es-no', 'bror').map(item => item.value)),
      broren: isTypedVocabAnswerCorrect('broren', 'bror', getVocabularyAcceptedAnswers({ no: 'bror', es: 'el hermano' }, 'es-no', 'bror').map(item => item.value))
    }));

    expect(result.bror).toEqual({ resultKind: 'correct', correct: true });
    expect(result.broren).toEqual({ resultKind: 'correct', correct: true });
  });

  test('covers every simple el/la noun with an explicit Norwegian definite form', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      loadData();
      const nounCards = cards.filter(card => /^(el|la)\s/i.test(card.es) && /^[^,()\s]+$/u.test(card.no));
      return nounCards.map(card => ({
        no: card.no,
        es: card.es,
        answers: getVocabularyAcceptedAnswers(card, 'es-no', card.no).map(answer => answer.value)
      }));
    });

    expect(result).not.toHaveLength(0);
    for (const card of result) {
      expect(card.answers, `${card.es} (${card.no}) mangler bestemt norsk variant`).toContainEqual(expect.not.stringMatching(new RegExp(`^${card.no}$`, 'i')));
    }
  });

  test('accepts gangen for el pasillo', async ({ page }) => {
    await page.goto(appUrl);
    const answers = await page.evaluate(() => getVocabularyAcceptedAnswers({ no: 'gang', es: 'el pasillo' }, 'es-no', 'gang').map(answer => answer.value));
    expect(answers).toContain('gang');
    expect(answers).toContain('gangen');
  });

  test('accepts equivalent comenzar and empezar sentence answers', async ({ page }) => {
    await page.goto(appUrl);
    const answers = await page.evaluate(() => getVocabularyAcceptedAnswers({ no: 'Neste år skal jeg begynne på videregående', es: 'El año que viene voy a empezar el bachillerato' }, 'no-es', 'El año que viene voy a empezar el bachillerato').map(answer => answer.value));
    expect(answers).toEqual(expect.arrayContaining([
      'El año que viene voy a empezar el bachillerato',
      'El año que viene voy a comenzar el bachillerato'
    ]));
  });

  test('accepts Norwegian synonyms and Spanish school abbreviation variants', async ({ page }) => {
    await page.goto(appUrl);
    const answers = await page.evaluate(() => ({
      responsible: getVocabularyAcceptedAnswers({ no: 'ansvarsfull', es: 'responsable' }, 'es-no', 'ansvarsfull').map(answer => answer.value),
      school: getVocabularyAcceptedAnswers({ no: 'ungdomsskolen', es: 'la E.S.O' }, 'no-es', 'la E.S.O').map(answer => answer.value)
    }));
    expect(answers.responsible).toEqual(expect.arrayContaining(['ansvarlig', 'ansvarsfull']));
    expect(answers.school).toEqual(expect.arrayContaining(['la E.S.O.', 'la escuela secundaria']));
  });

  test('keeps equivalent vivir meanings distinct and accepts both Norwegian prompts', async ({ page }) => {
    await page.goto(appUrl);
    const answers = await page.evaluate(() => ({
      noToEs: getVocabularyAcceptedAnswers({ no: 'å bo/ å leve', es: 'vivir' }, 'no-es', 'vivir').map(answer => answer.value),
      esToNo: getVocabularyAcceptedAnswers({ no: 'å bo/ å leve', es: 'vivir' }, 'es-no', 'å bo/ å leve').map(answer => answer.value)
    }));
    expect(answers.noToEs).toEqual(['vivir']);
    expect(answers.esToNo).toEqual(['å bo', 'å leve']);
  });

  test('keeps full verb conjugation tables out of vocabulary cards', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      loadData();
      return cards.filter(card => card.category === 'verbbøying' || /^bøying av verbet/i.test(card.no));
    });

    expect(result).toEqual([]);
  });

  test('turns a held Spanish vowel into a high accent without opening native accent menus', async ({ page }) => {
    await page.goto(appUrl);
    await page.setContent('<input id="accent-test" autocomplete="off">');
    await page.evaluate(() => setupAccentInput(document.getElementById('accent-test')));
    const input = page.locator('#accent-test');
    await input.focus();

    await page.keyboard.press('a');
    await expect(input).toHaveValue('a');

    await page.keyboard.down('e');
    await page.waitForTimeout(450);
    await page.keyboard.up('e');
    await expect(input).toHaveValue('aé');
  });

  test('turns held question and exclamation marks into Spanish inverted punctuation', async ({ page }) => {
    await page.goto(appUrl);
    await page.setContent('<input id="punctuation-test" autocomplete="off">');
    await page.evaluate(() => setupAccentInput(document.getElementById('punctuation-test')));
    const input = page.locator('#punctuation-test');
    await input.focus();

    await page.keyboard.down('?');
    await page.waitForTimeout(450);
    await page.keyboard.up('?');
    await page.keyboard.down('!');
    await page.waitForTimeout(450);
    await page.keyboard.up('!');

    await expect(input).toHaveValue('¿¡');
  });

  test('installs the accent helper on every normal text field', async ({ page }) => {
    await page.goto(appUrl);
    const input = page.locator('#addWordSpansk');
    await page.evaluate(() => document.getElementById('addWordSpansk').dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true })));
    await page.waitForTimeout(450);
    await page.evaluate(() => document.getElementById('addWordSpansk').dispatchEvent(new KeyboardEvent('keyup', { key: 'e', bubbles: true })));
    await expect(input).toHaveValue('é');
  });

  test('typed answers classify accent variants while ignoring case and extra spaces', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      sameCase: isTypedVocabAnswerCorrect('sí', 'sí'),
      upperCase: isTypedVocabAnswerCorrect('SÍ', 'sí'),
      missingAccent: isTypedVocabAnswerCorrect('si', 'sí'),
      extraSpace: isTypedVocabAnswerCorrect('  Sí  ', 'sí'),
      doubleSpace: isTypedVocabAnswerCorrect('  buenos  días  ', 'buenos días'),
      wrong: isTypedVocabAnswerCorrect('no', 'sí')
    }));

    expect(result).toEqual({
      sameCase: { resultKind: 'correct', correct: true },
      upperCase: { resultKind: 'correct', correct: true },
      missingAccent: { resultKind: 'accent_or_case_variant', correct: false },
      extraSpace: { resultKind: 'correct', correct: true },
      doubleSpace: { resultKind: 'correct', correct: true },
      wrong: { resultKind: 'wrong', correct: false }
    });
  });

  test('keeps ñ distinct while classifying Spanish accent variants', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      accentVariant: isTypedVocabAnswerCorrect('platano', 'plátano'),
      enye: isTypedVocabAnswerCorrect('ano', 'año'),
      multiWord: isTypedVocabAnswerCorrect('  buenos  días  ', 'buenos días')
    }));

    expect(result).toEqual({
      accentVariant: { resultKind: 'accent_or_case_variant', correct: false },
      enye: { resultKind: 'wrong', correct: false },
      multiWord: { resultKind: 'correct', correct: true }
    });
  });

  test('accepts clean Norwegian forms for cards with parenthetical annotations', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const cases = [
        { no: 'lilla (v)', es: 'violeta', clean: 'lilla' },
        { no: 'lat (v)', es: 'vago', clean: 'lat' },
        { no: 'begravelse (f)', es: 'el Funeral', clean: 'begravelse' },
        { no: 'begravelse (ord på e)', es: 'entierro', clean: 'begravelse' },
        { no: 'rom (annet ord, C)', es: 'el cuarto', clean: 'rom' },
        { no: 'stue (c)', es: 'el cuarto de estar', clean: 'stue' },
        { no: 'kjøleskap (n)', es: 'la nevera', clean: 'kjøleskap' },
        { no: 'genser (j)', es: 'el jersey', clean: 'genser' },
        { no: 'lærer (p)', es: 'el profesor', clean: 'lærer' }
      ];
      return cases.map(c => ({
        label: c.no,
        clean: c.clean,
        accepted: getVocabularyAcceptedAnswers({ no: c.no, es: c.es }, 'es-no', c.no).map(a => a.value),
        evaluation: isTypedVocabAnswerCorrect(c.clean, c.no, getVocabularyAcceptedAnswers({ no: c.no, es: c.es }, 'es-no', c.no).map(a => a.value))
      }));
    });

    for (const item of result) {
      expect(item.accepted, `${item.label} should list clean form "${item.clean}"`).toContain(item.clean);
      expect(item.evaluation.correct, `${item.label}: clean form "${item.clean}" should be correct`).toBe(true);
    }
  });

  test('accepts mamma for la madre in vocabulary practice', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      accepted: getVocabularyAcceptedAnswers({ no: 'mor', es: 'la madre' }, 'es-no', 'mor').map(a => a.value),
      evaluation: isTypedVocabAnswerCorrect('mamma', 'mor', getVocabularyAcceptedAnswers({ no: 'mor', es: 'la madre' }, 'es-no', 'mor').map(a => a.value))
    }));

    expect(result.accepted).toContain('mamma');
    expect(result.evaluation.correct).toBe(true);
  });

  test('accepts buenas tardes as an equivalent for god kveld', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      accepted: getVocabularyAcceptedAnswers({ no: 'god kveld', es: 'buenas noches' }, 'no-es', 'buenas noches').map(a => a.value),
      evaluation: isTypedVocabAnswerCorrect('buenas tardes', 'buenas noches', getVocabularyAcceptedAnswers({ no: 'god kveld', es: 'buenas noches' }, 'no-es', 'buenas noches').map(a => a.value))
    }));

    expect(result.accepted).toContain('buenas tardes');
    expect(result.evaluation.correct).toBe(true);
  });

  test('accepts la novia for kjæreste and kjæresten for el novio', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => ({
      noToEs: getVocabularyAcceptedAnswers({ no: 'kjæreste', es: 'el novio' }, 'no-es', 'el novio').map(a => a.value),
      esToNo: getVocabularyAcceptedAnswers({ no: 'kjæreste', es: 'el novio' }, 'es-no', 'kjæreste').map(a => a.value),
      noviaCorrect: isTypedVocabAnswerCorrect('la novia', 'el novio', getVocabularyAcceptedAnswers({ no: 'kjæreste', es: 'el novio' }, 'no-es', 'el novio').map(a => a.value)),
      kjærestenCorrect: isTypedVocabAnswerCorrect('kjæresten', 'kjæreste', getVocabularyAcceptedAnswers({ no: 'kjæreste', es: 'el novio' }, 'es-no', 'kjæreste').map(a => a.value))
    }));

    expect(result.noToEs).toContain('la novia');
    expect(result.esToNo).toContain('kjæresten');
    expect(result.esToNo).not.toContain('kjæresteen');
    expect(result.noviaCorrect.correct).toBe(true);
    expect(result.kjærestenCorrect.correct).toBe(true);
  });

  test('generates correct definite forms for Norwegian nouns ending in e', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const cases = [
        { no: 'kusine', es: 'la prima', expected: 'kusinen' },
        { no: 'tante', es: 'la tía', expected: 'tanten' },
        { no: 'jakke', es: 'la chaqueta', expected: 'jakken' },
        { no: 'klokke', es: 'el reloj', expected: 'klokken' },
        { no: 'lege', es: 'el médico', expected: 'legen' },
        { no: 'pære', es: 'la pera', expected: 'pæren' },
        { no: 'teppe', es: 'la alfombra', expected: 'teppet' },
        { no: 'smykke', es: 'la cadena', expected: 'smykket' }
      ];
      return cases.map(c => ({
        label: c.no,
        answers: getVocabularyAcceptedAnswers({ no: c.no, es: c.es }, 'es-no', c.no).map(a => a.value),
        expected: c.expected
      }));
    });

    for (const item of result) {
      expect(item.answers, `${item.label} should include definite form "${item.expected}"`).toContain(item.expected);
    }
  });

  test('disambiguates juice prompts by letter after the Spanish article', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const pool = [
        { id: 1, no: 'juice', es: 'el zumo' },
        { id: 2, no: 'juice', es: 'el jugo' }
      ];
      return {
        zumo: getVocabPromptText({ card: pool[0], direction: 'no-es' }, pool),
        jugo: getVocabPromptText({ card: pool[1], direction: 'no-es' }, pool)
      };
    });

    expect(result.zumo).not.toEqual(result.jugo);
  });

  test('shows clean form without parenthetical on card back in es-no direction', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      const card = { id: 1, no: 'begravelse (f)', es: 'el Funeral' };
      return {
        esNoBack: getDisplayAnswerText({ card, direction: 'es-no' }),
        noEsBack: getDisplayAnswerText({ card, direction: 'no-es' })
      };
    });

    expect(result.esNoBack).toBe('begravelse');
    expect(result.noEsBack).toBe('el Funeral');
  });

  test('shows synonym hint for words with multiple Spanish translations', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      loadData();
      const card = cards.find(c => c.no === 'begravelse (f)');
      if (!card) return null;
      return getCardSynonymHint({ card, direction: 'no-es' });
    });

    expect(result).toBeTruthy();
    expect(result).toContain('begravelse');
    expect(result).toContain('entierro');
  });

  test('shows synonym hint for words with multiple Norwegian translations', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      loadData();
      const card = cards.find(c => c.es === 'la clase' && c.no === 'skoletime');
      if (!card) return null;
      return getCardSynonymHint({ card, direction: 'es-no' });
    });

    expect(result).toBeTruthy();
    expect(result).toContain('skoleklasse');
  });

  test('returns null synonym hint for words without glossary synonyms', async ({ page }) => {
    await page.goto(appUrl);

    const result = await page.evaluate(() => {
      localStorage.clear();
      loadData();
      const card = cards.find(c => c.no === 'hund' || c.no === 'bror');
      if (!card) return 'no card';
      return getCardSynonymHint({ card, direction: 'no-es' });
    });

    expect(result).toBeNull();
  });

  test('leech cards are prioritized before normal due cards, even when future scheduled', async ({ page }) => {
    await page.goto(appUrl);

    const order = await page.evaluate(() => {
      cards = [
        {
          id: 1,
          no: 'normal',
          es: 'normal',
          noEs: { repetitions: 2, nextReview: '2026-05-01T00:00:00.000Z', lapses: 0 },
          esNo: { repetitions: 0, nextReview: null, lapses: 0 }
        },
        {
          id: 2,
          no: 'vanskelig',
          es: 'difícil',
          noEs: { repetitions: 4, nextReview: '2099-05-01T00:00:00.000Z', lapses: 3 },
          esNo: { repetitions: 0, nextReview: null, lapses: 0 }
        }
      ];

      return getDueCards(cards).map(item => item.card.id);
    });

    expect(order).toEqual([2, 1]);
  });
});

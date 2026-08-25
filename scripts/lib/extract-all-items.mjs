import { extractDiagnosisCatalog } from './extract-inline-catalog.mjs';

function extractBlock(html, marker, openChar, closeChar) {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`Missing marker: ${marker}`);
  const objStart = html.indexOf(openChar, start);
  if (objStart === -1) throw new Error(`Could not find opening ${openChar} for ${marker}`);
  let depth = 0;
  for (let i = objStart; i < html.length; i++) {
    const ch = html[i];
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return html.slice(objStart, i + 1);
    }
  }
  throw new Error(`Unbalanced ${openChar}${closeChar} starting at ${marker}`);
}

function evalBlock(source) {
  return Function(`"use strict"; return (${source});`)();
}

export function extractGlossary(html) {
  const source = extractBlock(html, 'const glossary = [', '[', ']');
  return evalBlock(source);
}

export function extractVerbDatabase(html) {
  const source = extractBlock(html, 'const verbDatabase = {', '{', '}');
  return evalBlock(source);
}

export function extractPronouns(html) {
  const source = extractBlock(html, 'const pronouns = [', '[', ']');
  return evalBlock(source);
}

export function extractHaberPresente(html) {
  const source = extractBlock(html, 'const haberPresente = [', '[', ']');
  return evalBlock(source);
}

export function extractSentencePuzzleBank(html) {
  const source = extractBlock(html, 'const sentencePuzzleBank = {', '{', '}');
  const bank = evalBlock(source);
  const flat = [];
  for (const [level, puzzles] of Object.entries(bank)) {
    for (const puzzle of puzzles) {
      flat.push({ level, no: puzzle.no, words: puzzle.words });
    }
  }
  return flat;
}

export function extractPrepositions(html) {
  const source = extractBlock(html, 'const prepositions = [', '[', ']');
  return evalBlock(source);
}

export function extractVocabularyAnswerAlternatives(html) {
  const source = extractBlock(html, 'const vocabularyAnswerAlternatives = {', '{', '}');
  return evalBlock(source);
}

export function extractNorwegianNounDefiniteForms(html) {
  const source = extractBlock(html, 'const norwegianNounDefiniteForms = {', '{', '}');
  return evalBlock(source);
}

export function extractGrammarTopics(html) {
  const source = extractBlock(html, 'const grammarTopics = {', '{', '}');
  const topics = evalBlock(source);

  // Also extract the runtime context map that is applied after definition
  let contextMap = {};
  try {
    const ctxSource = extractBlock(html, 'const grammarExerciseContextNo = {', '{', '}');
    contextMap = evalBlock(ctxSource);
  } catch {
    // context map may not exist
  }

  const flat = [];
  for (const topic of Object.values(topics)) {
    for (let i = 0; i < topic.exercises.length; i++) {
      const exercise = topic.exercises[i];
      const contextNo = contextMap[topic.id]?.[i] || null;
      // Apply the same runtime transformation: strip "(der borte)" from sentence
      const cleanedSentence = exercise.sentence.replace(/\s*\(der borte\)/gi, '');
      flat.push({
        topicId: topic.id,
        topicName: topic.name,
        sentence: cleanedSentence,
        answer: exercise.answer,
        options: exercise.options,
        hint: exercise.hint,
        word: exercise.word || exercise.base || null,
        no: contextNo || exercise.no || null
      });
    }
  }
  return flat;
}

export function extractLearningCatalog(html) {
  const source = extractBlock(html, 'const learningCatalog = {', '{', '}');
  return evalBlock(source);
}

export function extractAllItems(html) {
  const glossary = extractGlossary(html);
  const diagnosis = extractDiagnosisCatalog(html);
  const grammar = extractGrammarTopics(html);
  const verbs = extractVerbDatabase(html);
  const pronouns = extractPronouns(html);
  const haberPresente = extractHaberPresente(html);
  const sentencePuzzles = extractSentencePuzzleBank(html);
  const prepositions = extractPrepositions(html);
  const vocabularyAnswerAlternatives = extractVocabularyAnswerAlternatives(html);
  const norwegianNounDefiniteForms = extractNorwegianNounDefiniteForms(html);
  const learningCatalog = extractLearningCatalog(html);

  return {
    glossary: glossary.map(([no, es, category]) => ({ no, es, category })),
    glossaryRaw: glossary,
    diagnosis,
    grammar,
    verbs: Object.entries(verbs).map(([key, verb]) => ({
      key,
      infinitive: verb.infinitive,
      translation: verb.translation,
      type: verb.type,
      presente: verb.presente,
      participio: verb.participio
    })),
    pronouns,
    haberPresente,
    sentencePuzzles,
    prepositions,
    vocabularyAnswerAlternatives,
    norwegianNounDefiniteForms,
    learningCatalog
  };
}

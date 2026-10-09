import catalog from './content-catalog.json' with { type: 'json' };
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const AREAS = Object.freeze({
  vocabulary: 'Ordforråd', grammar: 'Grammatikk', verbs: 'Verbbøying', listening: 'Lytting',
});

export function getSchoolContentAudioPath(filename) {
  if (typeof filename !== 'string' || !/^[a-f0-9]{64}\.wav$/u.test(filename)) return null;
  return fileURLToPath(new URL(`./content-media/${filename}`, import.meta.url));
}

const areas = {
  vocabulary: { title: 'Ordforråd · grunnpakke', id: 'vocabulary.all.v1' },
  verbs: { title: 'Presens · verbbøying', id: 'verbs.present.v1' },
};

const hashIndex = (key, count) => createHash('sha256').update(key).digest().readUInt32BE(0) % count;
const uniqueOptions = (options) => [...new Map(options.filter((option) => option?.id && option?.text).map((option) => [option.id, option])).values()];

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function isActivitySnapshot(snapshot) {
  return Boolean(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
    && typeof snapshot.id === 'string' && typeof snapshot.title === 'string'
    && Object.hasOwn(AREAS, snapshot.area) && Array.isArray(snapshot.questions)
    && snapshot.questions.length > 0 && snapshot.questions.length <= 1000
    && (snapshot.audio === null || typeof snapshot.audio === 'string')
    && snapshot.questions.every((question) => question && typeof question.id === 'string'
      && typeof question.prompt === 'string' && typeof question.explanation === 'string'
      && typeof question.correctOptionId === 'string' && Array.isArray(question.options)
      && question.options.length > 0 && question.options.every((option) => typeof option?.id === 'string' && typeof option?.text === 'string')
      && question.options.some((option) => option.id === question.correctOptionId)));
}

export function snapshotActivity(activity, limit = activity?.questions?.length) {
  const questions = Number.isInteger(limit) && limit > 0 ? activity?.questions?.slice(0, limit) : null;
  if (!activity || !isActivitySnapshot({
    id: activity.id, area: activity.area, title: activity.title, audio: activity.audio ?? null, questions,
  })) throw new TypeError('Cannot snapshot an invalid activity');
  const snapshot = JSON.parse(JSON.stringify({
    id: activity.id,
    area: activity.area,
    title: activity.title,
    audio: activity.audio ?? null,
    questions,
  }));
  const digest = createHash('sha256').update(canonicalJson(snapshot)).digest('hex');
  return { snapshot, contentVersion: `sha256:${digest}` };
}

export function verifyActivitySnapshot(snapshot, contentVersion) {
  if (!isActivitySnapshot(snapshot) || typeof contentVersion !== 'string') return false;
  const digest = createHash('sha256').update(canonicalJson(snapshot)).digest('hex');
  return contentVersion === `sha256:${digest}`;
}

export function publicActivitySnapshot(snapshot, limit) {
  if (!isActivitySnapshot(snapshot)) return null;
  const questions = Number.isInteger(limit) && limit > 0 ? snapshot.questions.slice(0, limit) : snapshot.questions;
  return {
    id: snapshot.id,
    area: snapshot.area,
    title: snapshot.title,
    questionCount: questions.length,
    ...(snapshot.audio ? { audio: snapshot.audio } : {}),
    questions: questions.map(({ id, prompt, options }) => ({ id, prompt, options })),
  };
}

export function evaluateSnapshot(snapshot, questionId, answerId) {
  if (!isActivitySnapshot(snapshot)) return null;
  const question = snapshot.questions.find((item) => item.id === questionId);
  if (!question || !question.options.some((option) => option.id === answerId)) return null;
  return {
    outcome: question.correctOptionId === answerId ? 'correct' : 'incorrect',
    explanation: question.explanation,
  };
}

function vocabularyQuestions() {
  const items = catalog.vocabulary.filter((item) => !/^\d+$/u.test(item.no));
  return items.map((item, index) => {
    const distractors = [];
    for (let offset = 1; offset < items.length && distractors.length < 3; offset += 1) {
      const candidate = items[(index + offset * 37) % items.length];
      if (candidate.es !== item.es && !distractors.some((entry) => entry.es === candidate.es)) distractors.push(candidate);
    }
    return {
      id: item.id, prompt: `Hva heter «${item.no}» på spansk?`,
      options: uniqueOptions([item, ...distractors].map((option) => ({ id: option.id, text: option.es })))
        .sort((a, b) => hashIndex(`${item.id}:${a.id}`, 100000) - hashIndex(`${item.id}:${b.id}`, 100000)),
      correctOptionId: item.id, explanation: `${item.no} heter ${item.es}.`,
    };
  });
}

function grammarQuestions(topicId) {
  return catalog.grammar.filter((item) => item.topicId === topicId).map((item) => {
    const options = uniqueOptions((Array.isArray(item.options) ? item.options : []).map((text, index) => ({ id: `option-${index}-${text}`, text })));
    if (!options.some((option) => option.text === item.answer)) options.push({ id: `answer-${item.id}`, text: item.answer });
    const answer = options.find((option) => option.text === item.answer);
    const prompt = item.sentence.replace('___', '___');
    return { id: item.id, prompt: `${prompt}\n${item.no || ''}`.trim(), options, correctOptionId: answer.id, explanation: item.hint || 'Se på verbformen og meningen i setningen.' };
  });
}

function verbQuestions() {
  const pronouns = ['yo', 'tú', 'él / ella', 'nosotros / nosotras', 'vosotros / vosotras', 'ellos / ellas'];
  return catalog.verbs.flatMap((verb) => verb.presente.map((form, person) => {
    const allForms = catalog.verbs.flatMap((other) => other.presente).filter((candidate) => candidate !== form);
    const picks = [];
    let offset = 0;
    while (picks.length < 3 && offset < allForms.length * 2) {
      const candidate = allForms[(hashIndex(`${verb.key}:${person}:${offset}`, allForms.length) + offset) % allForms.length];
      if (candidate !== form && !picks.includes(candidate)) picks.push(candidate);
      offset += 1;
    }
    const options = uniqueOptions([form, ...picks].map((text) => ({ id: text, text })))
      .sort((a, b) => hashIndex(`${verb.key}:${person}:${a.id}`, 100000) - hashIndex(`${verb.key}:${person}:${b.id}`, 100000));
    return { id: `${verb.id}:${person}`, prompt: `Bøy «${verb.infinitive}» i presens: ${pronouns[person]}`, options, correctOptionId: form, explanation: `${pronouns[person]} ${form} (${verb.translation}).` };
  }));
}

function listeningQuestions() {
  return catalog.listening.questions.map((question) => ({
    id: question.id, prompt: question.prompt,
    options: question.options.map(({ id, text }) => ({ id, text })),
    correctOptionId: question.correctOptionId, explanation: question.explanation,
  }));
}

const allQuestions = {
  'vocabulary.all.v1': vocabularyQuestions(),
  'verbs.present.v1': verbQuestions(),
  'listening.leo-sevilla.v1': listeningQuestions(),
  ...Object.fromEntries([...new Set(catalog.grammar.map((item) => item.topicId))].map((topicId) => [
    `grammar.${topicId}.v1`, grammarQuestions(topicId),
  ])),
};

export const activities = Object.freeze([
  { id: 'vocabulary.all.v1', area: 'vocabulary', title: areas.vocabulary.title, questions: allQuestions['vocabulary.all.v1'] },
  ...[...new Set(catalog.grammar.map((item) => item.topicId))].map((topicId) => ({
    id: `grammar.${topicId}.v1`, area: 'grammar', title: `Grammatikk · ${catalog.grammar.find((item) => item.topicId === topicId).topicName}`, questions: allQuestions[`grammar.${topicId}.v1`],
  })),
  { id: 'verbs.present.v1', area: 'verbs', title: areas.verbs.title, questions: allQuestions['verbs.present.v1'] },
  { id: 'listening.leo-sevilla.v1', area: 'listening', title: `Lytting · ${catalog.listening.title}`, audio: catalog.listening.audio.startsWith('/') ? catalog.listening.audio : `/${catalog.listening.audio}`, questions: allQuestions['listening.leo-sevilla.v1'] },
]);

export function listActivities() {
  return activities.map(({ id, area, title, questions, audio }) => ({ id, area, label: AREAS[area], title, questionCount: questions.length, ...(audio ? { audio } : {}) }));
}

export function getActivity(id) {
  return activities.find((activity) => activity.id === id) || null;
}

export function publicActivity(id, limit) {
  const activity = getActivity(id);
  if (!activity) return null;
  const questions = limit == null ? activity.questions : activity.questions.slice(0, limit);
  return {
    ...listActivities().find((candidate) => candidate.id === id),
    questionCount: questions.length,
    questions: questions.map(({ id: itemId, prompt, options }) => ({ id: itemId, prompt, options })),
  };
}

export function evaluateAnswer(activityId, questionId, answerId) {
  const activity = getActivity(activityId);
  const question = activity?.questions.find((item) => item.id === questionId);
  if (!question || !question.options.some((option) => option.id === answerId)) return null;
  return { outcome: question.correctOptionId === answerId ? 'correct' : 'incorrect', explanation: question.explanation };
}

export function listeningAudioPath() {
  return catalog.listening.audio;
}

import { readFileSync } from 'node:fs';
import { extractDiagnosisCatalog } from './lib/extract-inline-catalog.mjs';

const html = readFileSync('index.html', 'utf8');
const failures = [];

function extractLearningCatalog() {
  const marker = 'const learningCatalog = ';
  const start = html.indexOf(marker);
  if (start === -1) {
    failures.push('Missing learningCatalog');
    return { skills: [], words: [] };
  }
  const objectStart = html.indexOf('{', start);
  const objectEnd = html.indexOf('\n        };', objectStart);
  if (objectStart === -1 || objectEnd === -1) {
    failures.push('Could not parse learningCatalog');
    return { skills: [], words: [] };
  }
  const source = html.slice(objectStart, objectEnd + 10);
  return Function(`"use strict"; return (${source});`)();
}

const validLevels = new Set(['A0', 'A0+', 'A1', 'A1+']);
const validSourceNotes = new Set([
  'written-original',
  'teacher-authored',
  'public-curriculum-inspired',
  'curriculum-derived',
  'a0-foundation',
  'grammar-topic',
  'verb-database',
  'preposition-database'
]);
const expectedDiagnosisIds = [
  'diag.vocab.greeting.hola.es_no',
  'diag.vocab.greeting.takk.no_es',
  'diag.vocab.family.madre.es_no',
  'diag.vocab.number.fem.no_es',
  'diag.a0.identity.me_llamo.typed',
  'diag.a0.identity.soy_de.choice',
  'diag.a0.articles.indefinite_singular.choice',
  'diag.a0.articles.definite_singular.choice',
  'diag.a1.verbs.regular_ar.present.hablar',
  'diag.a1.verbs.regular_er.present.comer',
  'diag.a1.gustar.basic.choice',
  'diag.a1.ser_estar.identity_or_location.choice',
];

const catalog = extractLearningCatalog();
let questions = [];
try {
  questions = extractDiagnosisCatalog(html);
} catch (error) {
  failures.push(error.message);
}

function assertUnique(items, label) {
  const seen = new Set();
  for (const item of items) {
    if (!item.id) failures.push(`${label} item missing id`);
    if (seen.has(item.id)) failures.push(`Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
}

assertUnique(catalog.skills || [], 'skill');
assertUnique(catalog.words || [], 'word');
assertUnique(questions, 'diagnosis question');

const skillIds = new Set((catalog.skills || []).map(skill => skill.id));
const wordIds = new Set((catalog.words || []).map(word => word.id));

for (const skill of catalog.skills || []) {
  if (!validLevels.has(skill.level)) failures.push(`Invalid level for skill ${skill.id}: ${skill.level}`);
  if (!skill.group) failures.push(`Skill ${skill.id} missing group`);
  if (!skill.label || !/[A-Za-zÆØÅæøå]/.test(skill.label)) failures.push(`Skill ${skill.id} missing bokmål label`);
  if (!validSourceNotes.has(skill.sourceNote)) failures.push(`Skill ${skill.id} missing valid sourceNote`);
}

for (const word of catalog.words || []) {
  if (!validLevels.has(word.level)) failures.push(`Invalid level for word ${word.id}: ${word.level}`);
  if (!word.area) failures.push(`Word ${word.id} missing area`);
  if (!word.no || !word.es) failures.push(`Word ${word.id} missing no/es text`);
  if (!validSourceNotes.has(word.sourceNote)) failures.push(`Word ${word.id} missing valid sourceNote`);
}

const actualDiagnosisIds = questions.map(question => question.id);
if (JSON.stringify(actualDiagnosisIds) !== JSON.stringify(expectedDiagnosisIds)) {
  failures.push('Diagnosis question IDs do not match the stable v1 contract');
}

for (const question of questions) {
  if (!validSourceNotes.has(question.sourceNote)) failures.push(`Question ${question.id} missing valid sourceNote`);
  if (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.length === 0) failures.push(`Question ${question.id} missing acceptedAnswers`);
  if (!Number.isInteger(question.contentVersion) || question.contentVersion < 1) failures.push(`Question ${question.id} missing contentVersion`);
  if (!question.primaryConstruct) failures.push(`Question ${question.id} missing primaryConstruct`);
  if (!question.ambiguityReview?.passed || !question.ambiguityReview?.checkedForAlternativeCorrectAnswers || !question.ambiguityReview?.checkedForRegionalVariation) failures.push(`Question ${question.id} missing completed ambiguity review`);
  const acceptedAnswerIds = new Set();
  for (const answer of question.acceptedAnswers || []) {
    if (!answer?.answerId || !answer?.canonicalMeaningId || !answer.value) failures.push(`Question ${question.id} has malformed accepted answer`);
    if (acceptedAnswerIds.has(answer.answerId)) failures.push(`Question ${question.id} has duplicate accepted answer id ${answer.answerId}`);
    acceptedAnswerIds.add(answer.answerId);
  }
  if (question.responseMode === 'choice') {
    if (!Array.isArray(question.options) || question.options.length === 0) failures.push(`Choice question ${question.id} missing options`);
    const optionIds = new Set((question.options || []).map(option => option.optionId));
    for (const option of question.options || []) {
      if (!option.optionId || !option.label) failures.push(`Choice question ${question.id} has malformed option`);
    }
    for (const answer of question.acceptedAnswers || []) {
      if (!optionIds.has(answer.answerId)) failures.push(`Question ${question.id} accepted answer ${answer.answerId} is not an option`);
    }
    const acceptedOptionCount = (question.options || []).filter(option =>
      (question.acceptedAnswers || []).some(answer => answer.answerId === option.optionId)
    ).length;
    if (acceptedOptionCount !== 1) failures.push(`Choice question ${question.id} must have exactly one accepted option, found ${acceptedOptionCount}`);
  }
  if (question.targetType === 'skill' && !skillIds.has(question.targetId)) failures.push(`Question ${question.id} targets unknown skill ${question.targetId}`);
  if (question.targetType === 'word') {
    if (!wordIds.has(question.targetId)) failures.push(`Question ${question.id} targets unknown word ${question.targetId}`);
    if (!['noToEs', 'esToNo'].includes(question.direction)) failures.push(`Word question ${question.id} has invalid direction`);
  }
}

if (!html.includes('está')) failures.push('Expected Spanish accent form está is missing');

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Learning catalog check passed (${catalog.skills.length} skills, ${catalog.words.length} words, ${questions.length} diagnosis questions).`);

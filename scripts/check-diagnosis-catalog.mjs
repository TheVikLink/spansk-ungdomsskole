import { readFileSync } from 'node:fs';
import { extractDiagnosisCatalog } from './lib/extract-inline-catalog.mjs';

const html = readFileSync('index.html', 'utf8');
const questions = extractDiagnosisCatalog(html);
const failures = [];
const ids = new Set();

for (const question of questions) {
  if (ids.has(question.id)) failures.push(`Duplicate question id: ${question.id}`);
  ids.add(question.id);
  if (!Number.isInteger(question.contentVersion) || question.contentVersion < 1) failures.push(`${question.id}: invalid contentVersion`);
  if (!question.instructionNb || !question.prompt) failures.push(`${question.id}: missing instruction or prompt`);
  if (!['typed', 'choice'].includes(question.responseMode)) failures.push(`${question.id}: invalid responseMode`);
  if (!question.primaryConstruct) failures.push(`${question.id}: missing primaryConstruct`);
  if (!question.sourceNote) failures.push(`${question.id}: missing sourceNote`);
  if (!question.ambiguityReview?.passed || !question.ambiguityReview?.reviewedBy?.length || !question.ambiguityReview?.reviewedAt || !question.ambiguityReview?.notes || !question.ambiguityReview.checkedForAlternativeCorrectAnswers || !question.ambiguityReview.checkedForRegionalVariation) {
    failures.push(`${question.id}: incomplete ambiguity review`);
  }
  const answers = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
  if (answers.length === 0) failures.push(`${question.id}: no accepted answers`);
  const answerIds = new Set(answers.map(answer => answer.answerId));
  if (answerIds.size !== answers.length) failures.push(`${question.id}: duplicate accepted answer id`);
  if (answers.some(answer => !answer.answerId || !answer.value || !answer.canonicalMeaningId)) failures.push(`${question.id}: malformed accepted answer`);
  if (question.responseMode === 'choice') {
    const options = Array.isArray(question.options) ? question.options : [];
    const optionIds = new Set(options.map(option => option.optionId));
    if (options.length < 2 || optionIds.size !== options.length) failures.push(`${question.id}: invalid options`);
    if (options.some(option => !option.optionId || !option.label)) failures.push(`${question.id}: malformed option`);
    if (answers.some(answer => !optionIds.has(answer.answerId))) failures.push(`${question.id}: accepted answer is not an option`);
  }
}

if (questions.length !== 12) failures.push(`Expected 12 diagnosis questions, found ${questions.length}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Diagnosis catalog check passed (${questions.length} questions).`);

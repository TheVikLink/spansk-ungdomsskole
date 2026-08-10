import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const failures = [];

function extractConstArray(name) {
  const marker = `const ${name} = `;
  const start = html.indexOf(marker);
  if (start === -1) {
    failures.push(`Missing ${name}`);
    return [];
  }
  const arrayStart = html.indexOf('[', start);
  const arrayEnd = html.indexOf('\n        ];', arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) {
    failures.push(`Could not parse ${name}`);
    return [];
  }
  const source = html.slice(arrayStart, arrayEnd + 10);
  return Function(`"use strict"; return (${source});`)();
}

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
const validSourceNotes = new Set(['written-original', 'teacher-authored', 'public-curriculum-inspired']);
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
const questions = extractConstArray('diagnosisQuestionCatalog');

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

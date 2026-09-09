import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script type="application\/json" id="grammar-lessons-data">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Fant ikke grammar-lessons-data');

const catalog = JSON.parse(match[1]);
const lessons = catalog.lessons;
if (!Array.isArray(lessons)) throw new Error('grammar-lessons-data.lessons må være en liste');

const ids = new Set();
const skillIds = new Set([...html.matchAll(/\{ id: '([^']+)'[^}]*\}/g)].map(item => item[1]));
const publishedIds = new Set(lessons.filter(lesson => lesson.status === 'published').map(lesson => lesson.id));
const errors = [];

for (const lesson of lessons) {
  if (!lesson.id || ids.has(lesson.id)) errors.push(`Duplikat eller manglende leksjons-ID: ${lesson.id || '<mangler>'}`);
  ids.add(lesson.id);
  if (!Array.isArray(lesson.skillIds) || lesson.skillIds.length === 0) errors.push(`${lesson.id}: mangler skillIds`);
  for (const skillId of lesson.skillIds || []) {
    if (!skillIds.has(skillId)) errors.push(`${lesson.id}: ukjent ferdighet ${skillId}`);
  }
  const transfers = lesson.transferExercises || [];
  const transferIds = new Set();
  if (transfers.length < 5) errors.push(`${lesson.id}: trenger minst fem kontrolloppgaver`);
  for (const exercise of transfers) {
    if (!exercise.id || transferIds.has(exercise.id)) errors.push(`${lesson.id}: duplikat kontrolloppgave ${exercise.id || '<mangler>'}`);
    transferIds.add(exercise.id);
    if (!Array.isArray(exercise.options) || !exercise.options.some(option => String(option).toLocaleLowerCase() === String(exercise.answer).toLocaleLowerCase())) {
      errors.push(`${lesson.id}/${exercise.id}: fasit finnes ikke blant svaralternativene`);
    }
    if (!lesson.skillIds.includes(exercise.skillId)) errors.push(`${lesson.id}/${exercise.id}: kontrolloppgaven bruker feil ferdighet`);
  }
  for (const relatedId of [...(lesson.relatedLessonIds || []), lesson.recommendedNext].filter(Boolean)) {
    if (!publishedIds.has(relatedId)) errors.push(`${lesson.id}: peker til upublisert eller ukjent leksjon ${relatedId}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Grammar lesson catalog OK: ${lessons.length} lessons, ${publishedIds.size} published`);
}

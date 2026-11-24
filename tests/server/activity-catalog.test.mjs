import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { activities, evaluateAnswer, evaluateSnapshot, getActivity, getSchoolContentAudioPath, listActivities, publicActivity, publicActivitySnapshot, snapshotActivity, verifyActivitySnapshot } from '../../server/activity-catalog.js';

test('teacher catalog has working content-backed homework in all four requested areas', async () => {
  for (const area of ['vocabulary', 'grammar', 'verbs', 'listening']) {
    const match = activities.find((activity) => activity.area === area);
    assert.ok(match, `missing ${area}`);
    assert.ok(match.questions.length > 0);
    assert.ok(match.questions.every((question) => question.id && question.prompt && question.options.length >= 2));
  }
  assert.equal(listActivities().find((activity) => activity.area === 'listening').questionCount, 3);
  const audio = new URL(listActivities().find((activity) => activity.area === 'listening').audio, 'http://localhost');
  const audioFilename = audio.pathname.split('/').at(-1);
  const audioPath = getSchoolContentAudioPath(audioFilename);
  assert.ok(audioPath);
  await access(audioPath);
  const bytes = await readFile(audioPath);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), audioFilename.slice(0, -4), 'the immutable media URL is content-addressed');
  assert.equal(getSchoolContentAudioPath('../secret.wav'), null);
});

test('student receives prompts and options but no answer key; server grades valid choices', () => {
  for (const activity of activities) {
    const view = publicActivity(activity.id);
    assert.equal('correctOptionId' in view, false);
    assert.equal('explanation' in view.questions[0], false);
    const question = activity.questions[0];
    assert.deepEqual(evaluateAnswer(activity.id, question.id, question.correctOptionId), { outcome: 'correct', explanation: question.explanation });
    const wrong = question.options.find((option) => option.id !== question.correctOptionId);
    assert.equal(evaluateAnswer(activity.id, question.id, wrong.id).outcome, 'incorrect');
    assert.equal(evaluateAnswer(activity.id, question.id, 'fabricated'), null);
  }
  assert.equal(getActivity('not-in-catalog'), null);
});

test('published activity snapshots are detached, content-addressed, private, and independently gradable', () => {
  const activity = getActivity('vocabulary.all.v1');
  const original = structuredClone(activity);
  const published = snapshotActivity(activity);
  assert.match(published.contentVersion, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(verifyActivitySnapshot(published.snapshot, published.contentVersion), true);

  const currentRelease = structuredClone(activity);
  currentRelease.title = `${currentRelease.title} – ny utgave`;
  currentRelease.questions[0].prompt = 'Ny prompt';
  currentRelease.questions[0].correctOptionId = currentRelease.questions[0].options.find((item) => item.id !== currentRelease.questions[0].correctOptionId).id;
  assert.notEqual(snapshotActivity(currentRelease).contentVersion, published.contentVersion);

  const publicQuestion = publicActivitySnapshot(published.snapshot, 1).questions[0];
  assert.equal(publicQuestion.prompt, original.questions[0].prompt);
  assert.equal('correctOptionId' in publicQuestion, false);
  assert.equal('explanation' in publicQuestion, false);
  assert.deepEqual(evaluateSnapshot(published.snapshot, original.questions[0].id, original.questions[0].correctOptionId), {
    outcome: 'correct', explanation: original.questions[0].explanation,
  });
  assert.equal(evaluateSnapshot(published.snapshot, original.questions[0].id, 'fabricated'), null);

  published.snapshot.questions[0].prompt = 'Korruptet etter lagring';
  assert.equal(verifyActivitySnapshot(published.snapshot, published.contentVersion), false);
  Object.assign(activity, original);
});

test('category-specific vocabulary activities and in-memory textAnswer grading work without exposing answer keys', () => {
  const family = getActivity('vocabulary.familie.v1');
  assert.ok(family, 'expected category activity vocabulary.familie.v1');
  assert.ok(family.questions.length >= 5);

  const published = snapshotActivity(family, 3);
  const q = family.questions[0];
  const correctText = q.options.find((opt) => opt.id === q.correctOptionId).text;

  // Exact typed Spanish answer
  const exact = evaluateSnapshot(published.snapshot, q.id, undefined, correctText);
  assert.equal(exact?.outcome, 'correct');

  // Bare noun without article is accepted for vocabulary
  const bare = correctText.replace(/^(?:el|la|los|las|un|una)\s+/iu, '').trim();
  if (bare !== correctText) {
    assert.equal(evaluateSnapshot(published.snapshot, q.id, undefined, bare)?.outcome, 'correct');
  }

  // Empty or whitespace textAnswer is rejected
  assert.equal(evaluateSnapshot(published.snapshot, q.id, undefined, '   '), null);

  // Listening exercises require option selection, not free text
  const listening = snapshotActivity(getActivity('listening.leo-sevilla.v1'));
  assert.equal(evaluateSnapshot(listening.snapshot, listening.snapshot.questions[0].id, undefined, 'Sevilla'), null);
});

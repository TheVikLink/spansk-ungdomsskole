import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('.', import.meta.url).pathname, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const source = html.match(/const LISTENING_STORIES = (\[.*?\]);\s*let dictationState/s)?.[1];
if (!source) throw new Error('Fant ikke LISTENING_STORIES');
const stories = Function(`return ${source}`)();
const out = path.join(root, 'audio', 'lyttehistorier');
mkdirSync(out, { recursive: true });
const tmp = path.join('/tmp', `listening-audio-${process.pid}`);
mkdirSync(tmp, { recursive: true });
for (const story of stories.filter(story => /-Listening\.wav$/u.test(story.fullAudio))) {
  const aiff = path.join(tmp, `${story.id}.aiff`);
  const voice = story.region === 'Mexico' ? 'Paulina' : 'Mónica';
  const rate = story.level === 'A0' ? '145' : '155';
  execFileSync('say', ['-v', voice, '-r', rate, '-o', aiff, story.transcript]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff, '-codec:a', 'pcm_s16le', path.join(out, story.fullAudio)]);
  unlinkSync(aiff);
}

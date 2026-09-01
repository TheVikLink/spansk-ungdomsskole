import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('.', import.meta.url).pathname, '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const source = html.match(/const DICTATION_STORIES = (\[.*?\]);\s*let dictationState/s)?.[1];
if (!source) throw new Error('Fant ikke DICTATION_STORIES');
const stories = Function(`return ${source}`)();
const out = path.join(root, 'audio', 'diktat');
mkdirSync(out, { recursive: true });
const tmp = path.join('/tmp', `dictation-audio-${process.pid}`);
mkdirSync(tmp, { recursive: true });

for (const story of stories) {
  const voice = story.region === 'Mexico' ? 'Paulina' : 'Mónica';
  const segmentFiles = [];
  for (const [text, id] of story.segments) {
    const aiff = path.join(tmp, `${id}.aiff`);
    const mp3 = path.join(out, `${id}.mp3`);
    execFileSync('say', ['-v', voice, '-o', aiff, text]);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff, '-codec:a', 'libmp3lame', '-q:a', '5', mp3]);
    segmentFiles.push(mp3);
    unlinkSync(aiff);
  }
  const list = path.join(tmp, `${story.id}.txt`);
  writeFileSync(list, segmentFiles.map(file => `file '${file}'`).join('\n'));
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(out, `${story.id}-full.mp3`)]);
}

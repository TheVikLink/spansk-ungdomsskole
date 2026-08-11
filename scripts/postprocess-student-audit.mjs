import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const artifactDir = path.resolve(process.argv[2] || 'output/student-agent-audit/latest');
const manifestPath = path.join(artifactDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function findFiles(root, filename, found = []) {
  if (!fs.existsSync(root)) return found;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) findFiles(fullPath, filename, found);
    else if (entry.name === filename) found.push(fullPath);
  }
  return found;
}

const videos = findFiles(path.resolve('test-results'), 'video.webm')
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
const video = videos[0];
const framesDir = path.join(artifactDir, 'frames');
fs.mkdirSync(framesDir, { recursive: true });

const prompt = `# Student video audit analysis prompt

Analyze the attached contact sheet and checkpoint frames as a skeptical 13-16-year-old student using a Spanish learning app.

For every finding, report:
- severity: critical, major, minor, or observation
- exact checkpoint/frame
- what the student sees or cannot infer
- likely student interpretation
- concrete product fix
- whether it needs a regression test

Prioritize broken state transitions, missing feedback, wrong language, ambiguous answer keys, lost progress, keyboard/touch problems, and cognitive overload. Separate directly observed evidence from inference. Do not invent problems that are not visible.
`;
fs.writeFileSync(path.join(artifactDir, 'ANALYZE_PROMPT.md'), prompt);

if (!video) {
  manifest.video = { postProcessed: false, reason: 'Playwright video.webm was not found' };
  manifest.postProcessing = { ffmpeg: 'skipped' };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.warn('Student audit manifest written, but no video.webm was found.');
  process.exit(0);
}

const copiedVideo = path.join(artifactDir, 'student-session.webm');
fs.copyFileSync(video, copiedVideo);
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', copiedVideo], { encoding: 'utf8' });
const frames = spawnSync('ffmpeg', ['-y', '-i', copiedVideo, '-vf', 'fps=1/3,scale=640:-1', path.join(framesDir, 'frame-%03d.png')], { encoding: 'utf8' });
const contact = spawnSync('ffmpeg', ['-y', '-i', copiedVideo, '-vf', 'fps=1/4,scale=480:-1,tile=3x3:padding=8:margin=8', '-frames:v', '1', path.join(artifactDir, 'contact-sheet.png')], { encoding: 'utf8' });

manifest.video = {
  postProcessed: true,
  path: path.relative(artifactDir, copiedVideo),
  metadata: probe.status === 0 ? JSON.parse(probe.stdout) : null
};
manifest.postProcessing = {
  ffmpeg: frames.status === 0 && contact.status === 0 ? 'complete' : 'failed',
  framesDir: path.relative(artifactDir, framesDir),
  contactSheet: 'contact-sheet.png'
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
if (frames.status !== 0 || contact.status !== 0) process.exitCode = 1;
console.log(`Student audit post-processed: ${artifactDir}`);

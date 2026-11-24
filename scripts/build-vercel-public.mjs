import { access, cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFreeLessonId } from '../src/domain/school-license.js';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

export async function buildVercelPublic({ rootDir = repositoryRoot, outputDir = path.join(rootDir, 'public'), visitorAnalytics = false } = {}) {
  const root = path.resolve(rootDir);
  const output = path.resolve(outputDir);
  const relativeOutput = path.relative(root, output);
  if (!relativeOutput || relativeOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeOutput)) {
    throw new Error('Vercel public output must be a child directory of the project root');
  }

  const required = [
    'index.html', 'manifest.webmanifest', 'sw.js', 'dist/tailwind.css', 'audio', 'undervisning',
    'server/public/school.js', 'server/public/school.css', 'server/content-media',
  ];
  if (visitorAnalytics) required.push('src/visitor-analytics.js', 'src/visitor-analytics-privacy.html');
  await Promise.all(required.map((file) => access(path.join(root, file), constants.R_OK)));
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });

  const copyFile = (source, destination = source, extraFilter = null) => cp(path.join(root, source), path.join(output, destination), {
    recursive: true,
    filter: (entry) => !path.basename(entry).startsWith('.') && (!extraFilter || extraFilter(entry)),
  });
  const undervisningRoot = path.join(root, 'undervisning');
  const filterUndervisningPublic = (entry) => {
    const rel = path.relative(undervisningRoot, entry);
    if (!rel) return true;
    const firstSegment = rel.split(path.sep)[0];
    // Top-level files (index.html, time.css, writing.js, pakke.js) and the 3 free sample lessons
    // are served from CDN; all paid lesson folders stay server-gated behind Express.
    if (!rel.includes(path.sep)) {
      if (/\.(?:html|css|js)$/u.test(firstSegment)) return true;
      return isFreeLessonId(firstSegment);
    }
    return isFreeLessonId(firstSegment);
  };
  await copyFile('audio');
  await Promise.all([
    copyFile('index.html'), copyFile('manifest.webmanifest'), copyFile('sw.js'),
    copyFile('dist/tailwind.css'), copyFile('undervisning', 'undervisning', filterUndervisningPublic),
    copyFile('server/public/school.js', 'school.js'), copyFile('server/public/school.css', 'school.css'),
    copyFile('server/content-media', 'audio/school-content'),
  ]);

  if (visitorAnalytics) {
    await Promise.all([
      copyFile('src/visitor-analytics.js', 'visitor-analytics.js'),
      copyFile('src/visitor-analytics-privacy.html', 'besoksstatistikk.html'),
    ]);
    let html = await readFile(path.join(output, 'index.html'), 'utf8');
    let worker = await readFile(path.join(output, 'sw.js'), 'utf8');
    if (!/<head(?:\s[^>]*)?>/i.test(html) || !/<\/body>/i.test(html) || !/name="app-build" content="[^"]*"/.test(html) || !/const APP_BUILD = '[^']*'/.test(worker)) {
      throw new Error('Analytics output needs a complete app document and matching offline build markers');
    }
    html = html.replace(/<head(?:\s[^>]*)?>/i, '$&\n    <meta name="referrer" content="no-referrer">');
    html = html.replace(/<\/body>/i, '<footer style="text-align:center;padding:1rem;font-size:.875rem"><a href="/besoksstatistikk.html">Om besøksstatistikk og personvern</a></footer>\n<script defer src="/visitor-analytics.js" referrerpolicy="no-referrer"></script>\n</body>');
    const [script, privacy] = await Promise.all([
      readFile(path.join(output, 'visitor-analytics.js'), 'utf8'), readFile(path.join(output, 'besoksstatistikk.html'), 'utf8'),
    ]);
    const build = createHash('sha256').update([html, worker, script, privacy].join('\n')).digest('hex').slice(0, 16);
    html = html.replace(/name="app-build" content="[^"]*"/, `name="app-build" content="${build}"`);
    worker = worker.replace(/const APP_BUILD = '[^']*'/, `const APP_BUILD = '${build}'`);
    await Promise.all([writeFile(path.join(output, 'index.html'), html), writeFile(path.join(output, 'sw.js'), worker)]);
  }

  try {
    await access(path.join(root, 'googleda8e06f12dba466d.html'), constants.R_OK);
    await copyFile('googleda8e06f12dba466d.html');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = await buildVercelPublic({ visitorAnalytics: process.argv.includes('--visitor-analytics') });
  console.log(`Staged Vercel public assets in ${path.relative(repositoryRoot, output)}/`);
}

import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

export async function buildVercelPublic({ rootDir = repositoryRoot, outputDir = path.join(rootDir, 'public') } = {}) {
  const root = path.resolve(rootDir);
  const output = path.resolve(outputDir);
  const relativeOutput = path.relative(root, output);
  if (!relativeOutput || relativeOutput.startsWith(`..${path.sep}`) || path.isAbsolute(relativeOutput)) {
    throw new Error('Vercel public output must be a child directory of the project root');
  }

  const required = [
    'index.html', 'manifest.webmanifest', 'sw.js', 'dist/tailwind.css', 'audio',
    'server/public/school.js', 'server/public/school.css', 'server/content-media',
  ];
  await Promise.all(required.map((file) => access(path.join(root, file), constants.R_OK)));
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });

  const copyFile = (source, destination = source) => cp(path.join(root, source), path.join(output, destination), {
    recursive: true,
    filter: (entry) => !path.basename(entry).startsWith('.'),
  });
  await copyFile('audio');
  await Promise.all([
    copyFile('index.html'), copyFile('manifest.webmanifest'), copyFile('sw.js'),
    copyFile('dist/tailwind.css'),
    copyFile('server/public/school.js', 'school.js'), copyFile('server/public/school.css', 'school.css'),
    copyFile('server/content-media', 'audio/school-content'),
  ]);

  try {
    await access(path.join(root, 'googleda8e06f12dba466d.html'), constants.R_OK);
    await copyFile('googleda8e06f12dba466d.html');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = await buildVercelPublic();
  console.log(`Staged Vercel public assets in ${path.relative(repositoryRoot, output)}/`);
}

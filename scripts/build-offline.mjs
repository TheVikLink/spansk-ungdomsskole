import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const filenames = ['index.html', 'dist/tailwind.css', 'manifest.webmanifest', 'sw.js'];
const files = await Promise.all(filenames.map(name => readFile(name, 'utf8')));
const normalize = text => text.replace(/name="app-build" content="[^"]*"/, 'name="app-build" content="BUILD"').replace(/const APP_BUILD = '[^']*'/, "const APP_BUILD = 'BUILD'");
const build = createHash('sha256').update(files.map(normalize).join('\n')).digest('hex').slice(0, 16);
const html = files[0].replace(/name="app-build" content="[^"]*"/, `name="app-build" content="${build}"`);
const worker = files[3].replace(/const APP_BUILD = '[^']*'/, `const APP_BUILD = '${build}'`);
if (process.argv.includes('--check')) {
  if (html !== files[0] || worker !== files[3]) throw new Error('App assets changed: run npm run build:app before delivery.');
  console.log(`Offline build ${build} matches app assets.`);
} else {
  await writeFile('index.html', html); await writeFile('sw.js', worker);
  console.log(`Offline build ${build}`);
}

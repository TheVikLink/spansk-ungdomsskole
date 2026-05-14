import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'src/styles/tailwind.css',
  'dist/tailwind.css',
  'src/components/ui/Button.tsx',
  'src/components/ui/Card.tsx',
  'docs/ui-tailwind-reference/elements/buttons_primary.tsx',
];

const missing = requiredPaths.filter((path) => !existsSync(path));

const html = readFileSync('index.html', 'utf8');
const failures = [];

if (missing.length > 0) {
  failures.push(`Missing paths: ${missing.join(', ')}`);
}

if (/<style\b/i.test(html)) {
  failures.push('index.html still contains an inline <style> block');
}

if (!html.includes('href="./dist/tailwind.css"')) {
  failures.push('index.html does not link ./dist/tailwind.css');
}

if (existsSync('src/styles/tailwind.css')) {
  const css = readFileSync('src/styles/tailwind.css', 'utf8');
  if (!css.includes('@import "tailwindcss";')) {
    failures.push('src/styles/tailwind.css does not import Tailwind');
  }
  if (!css.includes('@layer components')) {
    failures.push('src/styles/tailwind.css does not define a components layer');
  }
  if (!css.includes('@apply')) {
    failures.push('src/styles/tailwind.css does not use Tailwind @apply component recipes');
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Tailwind adoption checks passed');

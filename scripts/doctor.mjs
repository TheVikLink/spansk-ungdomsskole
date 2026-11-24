import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { verifyCatalogsSync } from './sync-catalogs.mjs';

function checkOfflineBuild() {
  const filenames = ['index.html', 'dist/tailwind.css', 'manifest.webmanifest', 'sw.js'];
  for (const name of filenames) {
    if (!existsSync(name)) return { ok: false, reason: `Missing ${name}` };
  }
  const files = filenames.map((name) => readFileSync(name, 'utf8'));
  const normalize = (text) => text
    .replace(/name="app-build" content="[^"]*"/, 'name="app-build" content="BUILD"')
    .replace(/const APP_BUILD = '[^']*'/, "const APP_BUILD = 'BUILD'");
  const expectedBuild = createHash('sha256').update(files.map(normalize).join('\n')).digest('hex').slice(0, 16);
  const htmlBuild = files[0].match(/name="app-build" content="([^"]*)"/)?.[1] || null;
  const swBuild = files[3].match(/const APP_BUILD = '([^']*)'/)?.[1] || null;
  return {
    ok: htmlBuild === expectedBuild && swBuild === expectedBuild,
    expectedBuild,
    htmlBuild,
    swBuild,
  };
}

function getBeadsInProgress() {
  try {
    const out = execFileSync('bd', ['--no-daemon', 'list', '--status=in_progress', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const items = JSON.parse(out);
    return items.map((item) => ({ id: item.id, priority: item.priority, title: item.title }));
  } catch {
    return [];
  }
}

function getGitSummary() {
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
    const statusLines = execFileSync('git', ['status', '--short'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const modified = statusLines.filter((line) => !line.startsWith('??')).length;
    const untracked = statusLines.filter((line) => line.startsWith('??')).length;
    return { branch, modified, untracked, clean: statusLines.length === 0 };
  } catch {
    return { branch: 'unknown', modified: 0, untracked: 0, clean: false };
  }
}

export function runDoctor() {
  const offline = checkOfflineBuild();
  const catalogs = verifyCatalogsSync();
  const git = getGitSummary();
  const inProgress = getBeadsInProgress();
  const review = JSON.parse(readFileSync('data/vocabulary-canonical-review.json', 'utf8'));

  const checks = {
    offlineBuildSync: offline.ok,
    catalogsSync: catalogs.inSync,
    beadsWipWithinLimit: inProgress.length <= 3,
    statusDocPresent: existsSync('docs/STATUS.md'),
    architectureDocPresent: existsSync('ARCHITECTURE.md'),
  };
  const healthy = Object.values(checks).every(Boolean);

  return {
    healthy,
    nodeVersion: process.version,
    buildId: offline.expectedBuild,
    checks,
    counts: {
      vocabularyEntries: review.entries.length,
      ...catalogs.counts,
    },
    git,
    beadsInProgress: inProgress,
    ...(catalogs.diffs.length ? { catalogDiffs: catalogs.diffs } : {}),
  };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const report = runDoctor();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Spansk123 Doctor: ${report.healthy ? 'HEALTHY' : 'ATTENTION NEEDED'} (build ${report.buildId}, Node ${report.nodeVersion})`);
    for (const [name, ok] of Object.entries(report.checks)) {
      console.log(`  [${ok ? 'OK' : 'FAIL'}] ${name}`);
    }
    console.log(`  Catalogs: ${report.counts.vocabularyEntries} vocab, ${report.counts.verbs} verbs, ${report.counts.learningSkills} skills, ${report.counts.listeningStories} listening, ${report.counts.dictationStories} dictation`);
    console.log(`  Git (${report.git.branch}): ${report.git.modified} modified, ${report.git.untracked} untracked`);
    console.log(`  Beads in_progress (${report.beadsInProgress.length}): ${report.beadsInProgress.map((i) => i.id).join(', ') || 'none'}`);
  }
  process.exit(report.healthy ? 0 : 1);
}

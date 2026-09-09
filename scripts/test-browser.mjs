import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
// These are opt-in evidence captures or a public deployment probe, not local regressions.
const manualAudits = new Set(['model-student-video-audit.spec.js', 'qa-full-journey-audit.spec.js', 'qa-live-deploy-probe.spec.js']);
const specs = readdirSync('tests').filter(name => name.endsWith('.spec.js') && !manualAudits.has(name)).sort().map(name => `tests/${name}`);
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...specs, '--browser', 'chromium', '--workers=2', '--reporter=list'], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);

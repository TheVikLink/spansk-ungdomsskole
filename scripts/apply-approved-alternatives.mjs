import { syncVocabulary } from './sync-vocabulary.mjs';

// Compatibility command: audit suggestions never override the reviewed answer key.
// --replace is always implied; a report path cannot supply extra answers.
syncVocabulary({ check: process.argv.includes('--check'), dryRun: !process.argv.includes('--apply') && !process.argv.includes('--check') });

import { syncVocabulary } from './sync-vocabulary.mjs';

// Never reconstruct the source of truth from an older index.html.
syncVocabulary({ check: process.argv.includes('--check') });

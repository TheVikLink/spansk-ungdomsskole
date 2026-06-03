import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');

const forbiddenFragments = [
  {
    text: 'ciento veintitres',
    reason: 'veintitrés needs an accent.',
  },
  {
    text: 'dos cientos cuarenta y cinco',
    reason: '245 is written doscientos cuarenta y cinco.',
  },
  {
    text: 'veintiseis',
    reason: 'veintiséis needs an accent.',
  },
  {
    text: 'los ojos negros", "utseende"',
    reason: 'Brune øyne should be los ojos marrones, not black eyes.',
  },
  {
    text: 'el electrista',
    reason: 'Electrician is el electricista.',
  },
  {
    text: 'hacer cenderismo',
    reason: 'Hiking is hacer senderismo.',
  },
  {
    text: 'relajar", "hobbyer"',
    reason: 'To relax is normally relajarse in this learner context.',
  },
  {
    text: 'el religión',
    reason: 'Religión is feminine: la religión.',
  },
  {
    text: 'vivir, som betyr å spise',
    reason: 'Vivir means to live/reside, not to eat.',
  },
  {
    text: 'váis',
    reason: 'The present-tense vosotros form of ir is vais.',
  },
];

const requiredFragments = [
  'ciento veintitrés',
  'doscientos cuarenta y cinco',
  'veintiséis',
  'los ojos marrones',
  'el electricista',
  'hacer senderismo',
  'relajarse',
  'la religión',
  'vivir, som betyr å bo',
  'voy, vas, va, vamos, vais, van',
];

const failures = [];

for (const fragment of forbiddenFragments) {
  if (html.includes(fragment.text)) {
    failures.push(`Forbidden fragment found: "${fragment.text}" (${fragment.reason})`);
  }
}

for (const fragment of requiredFragments) {
  if (!html.includes(fragment)) {
    failures.push(`Required corrected fragment missing: "${fragment}"`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Content quality check passed (${requiredFragments.length} corrections protected).`);

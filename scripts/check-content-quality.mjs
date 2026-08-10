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
  {
    text: '["jeg står opp tidlig", "me despierto temprano", "rutiner"]',
    reason: 'Står opp is me levanto; me despierto means wakes up.',
  },
  {
    text: '["konfirmasjon", "La Comunión", "høytider"]',
    reason: 'Konfirmasjon is not first communion.',
  },
  {
    text: '["500 på spansk", "quinientos", "tall"]',
    reason: 'The number prompt should be the Norwegian number itself.',
  },
  {
    text: '["Russland på spansk", "Rusia", "land"]',
    reason: 'Country prompts should not include a meta-label.',
  },
  {
    text: '["Sveits (spansk)", "Suiza", "land"]',
    reason: 'Country prompts should not include a meta-label.',
  },
  {
    text: '["Har du klokke?", "¿Tienes hora?", "klokka"]',
    reason: 'The Norwegian prompt asks about owning a clock/watch.',
  },
  {
    text: '["Vet du hvor mye klokka er?", "Perdón, ¿Sabes qué hora es?", "klokka"]',
    reason: 'Use natural Norwegian and match the Spanish prompt without an extra apology.',
  },
  {
    text: '["pult", "la mesa", "skole"]',
    reason: 'A school desk is el pupitre; la mesa is a table.',
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
  '["jeg står opp tidlig", "me levanto temprano", "rutiner"]',
  '["konfirmasjon", "La Confirmación", "høytider"]',
  '["500", "quinientos", "tall"]',
  '["Russland", "Rusia", "land"]',
  '["Sveits", "Suiza", "land"]',
  '["Har du klokke?", "¿Tienes reloj?", "klokka"]',
  '["Vet du hva klokka er?", "¿Sabes qué hora es?", "klokka"]',
  '["pult", "el pupitre", "skole"]',
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

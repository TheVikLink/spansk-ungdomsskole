/**
 * Pure, DOM-free SM-2 spaced repetition calculation module.
 */

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.0;
export const MAX_INTERVAL_DAYS = 180;

export function calculateNextReview(card = {}, quality, now = new Date()) {
  let {
    easeFactor = DEFAULT_EASE_FACTOR,
    interval = 0,
    repetitions = 0,
  } = card;

  if (quality === 0) {
    repetitions = 0;
    interval = 0;
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  } else if (quality === 1) {
    interval = repetitions === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
    repetitions += 1;
  } else if (quality === 2) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else if (quality === 3) {
    if (repetitions === 0) interval = 4;
    else if (repetitions === 1) interval = 7;
    else interval = Math.round(interval * easeFactor * 1.3);
    easeFactor = Math.min(MAX_EASE_FACTOR, easeFactor + 0.15);
    repetitions += 1;
  }

  interval = Math.min(MAX_INTERVAL_DAYS, interval);
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
  };
}

export function getIntervalText(quality, card = {}, now = new Date()) {
  const result = calculateNextReview(card, quality, now);
  if (result.interval === 0) return 'Nå';
  if (result.interval === 1) return '1 dag';
  if (result.interval < 7) return `${result.interval} dager`;
  if (result.interval < 30) return `${Math.round(result.interval / 7)} uker`;
  return `${Math.round(result.interval / 30)} mnd`;
}

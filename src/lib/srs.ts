import type { SavedWord } from '../types';
import { isEnglish } from './i18n/index.ts';

/**
 * Spaced repetition, Anki-style (SM-2 flavour).
 * Again → back in 10 minutes and the ease drops; Hard → ×1.2; Good → ×ease; Easy → ×ease×1.3.
 * The first successful reviews are 1 day (Good) or 4 days (Easy), then the interval keeps growing.
 */
export type Grade = 'again' | 'hard' | 'good' | 'easy';
export const AGAIN_MINUTES = 10;
const MIN_EASE = 1.3;
const DAY = 86400000;

type Card = Pick<SavedWord, 'ease' | 'interval' | 'reps' | 'lapses'>;

export function schedule(card: Card, grade: Grade, now = Date.now()) {
  let ease = card.ease ?? 2.5;
  let interval = card.interval ?? 0;
  let reps = card.reps ?? 0;
  let lapses = card.lapses ?? 0;
  if (grade === 'again') {
    lapses += 1; reps = 0; ease = Math.max(MIN_EASE, ease - 0.2); interval = 0;
    return { ease, interval, reps, lapses, nextReview: new Date(now + AGAIN_MINUTES * 60000).toISOString() };
  }
  if (reps === 0) interval = grade === 'easy' ? 4 : 1;
  else if (grade === 'hard') { interval = Math.max(1, Math.round(Math.max(interval, 1) * 1.2)); ease = Math.max(MIN_EASE, ease - 0.15); }
  else if (grade === 'good') interval = Math.max(interval + 1, Math.round(interval * ease));
  else { interval = Math.max(interval + 2, Math.round(interval * ease * 1.3)); ease += 0.15; }
  reps += 1;
  return { ease, interval, reps, lapses, nextReview: new Date(now + interval * DAY).toISOString() };
}

/** Short label of the next interval for a button (like Anki): 10د / 1ي / 4ي / 3ش … */
export function previewLabel(card: Card, grade: Grade) {
  const en = isEnglish();
  if (grade === 'again') return `${AGAIN_MINUTES}${en ? 'm' : 'د'}`;
  const d = schedule(card, grade).interval;
  return d >= 60 ? `${Math.round(d / 30)}${en ? 'mo' : 'ش'}` : `${d}${en ? 'd' : 'ي'}`;
}

export const isDue = (w: Pick<SavedWord, 'nextReview'>, now = new Date().toISOString()) => !w.nextReview || w.nextReview <= now;
export const dueWords = <T extends Pick<SavedWord, 'nextReview'>>(words: T[], now = new Date().toISOString()) => words.filter((w) => isDue(w, now));

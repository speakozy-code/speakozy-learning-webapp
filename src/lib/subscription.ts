import type { User } from '../types';

/**
 * Marketing-site links follow the host the app runs on. The old *.vercel.app
 * hosts redirect "/" to the app, so they point at the marketing alias instead.
 */
export function siteUrl(path = '/'): string {
  const h = typeof location !== 'undefined' ? location.hostname : '';
  const base = h === 'speakozy-academy.vercel.app' || h === 'speakozy-learning.vercel.app' ? 'https://speakozy-site.vercel.app' : '';
  return base + path;
}
export const PRICING_URL = siteUrl('/pricing');
export const REGISTER_URL = siteUrl('/register');
export const WA_NUMBER = '201091060951';
/** Voice notes and answers are sent to the Speakozy WhatsApp number. */
export const waGroupShare = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

/** Admins and any student not explicitly marked unsubscribed have full access. */
export const isSubscribed = (u?: Pick<User, 'role' | 'subscribed'> | null) => !!u && (u.role === 'admin' || u.subscribed !== false);

/** Free preview limits for people who are not subscribed. */
export const FREE_SHADOWING_VIDEOS = 1;
export const FREE_YALLA_PER_LEVEL = 5;
export const FREE_TASK_WEEKS = 1;

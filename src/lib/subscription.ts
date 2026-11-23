import type { User } from '../types';

export const PRICING_URL = 'https://speakozy.com/pricing';
export const REGISTER_URL = 'https://speakozy.com/register';
export const WA_NUMBER = '201091060951';
/** Voice notes and answers are sent to the Speakozy WhatsApp number. */
export const waGroupShare = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

/** Admins and any student not explicitly marked unsubscribed have full access. */
export const isSubscribed = (u?: Pick<User, 'role' | 'subscribed'> | null) => !!u && (u.role === 'admin' || u.subscribed !== false);

/** Free preview limits for people who are not subscribed. */
export const FREE_SHADOWING_VIDEOS = 1;
export const FREE_YALLA_PER_LEVEL = 5;
export const FREE_TASK_WEEKS = 1;

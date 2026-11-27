import { useSyncExternalStore } from 'react';
import { EN } from './en.ts';

/**
 * Tiny translation layer. The UI is written in Arabic, so the Arabic sentence IS the key:
 *   tr('أهلًا')                       -> 'Hello' when the language is English
 *   tr('كمّل {0}', [title])            -> positional placeholders
 * A missing English entry falls back to the Arabic text (the test in scripts/test-i18n.mjs keeps them in sync).
 */
export type Lang = 'ar' | 'en';

const KEY = 'speakozy-lang';
const listeners = new Set<() => void>();

function readStored(): Lang {
  try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'ar'; } catch { return 'ar'; }
}

let current: Lang = typeof localStorage === 'undefined' ? 'ar' : readStored();
/** The admin area is Arabic-only: while it is on screen the chosen language is ignored. */
let staff = false;
const effective = (): Lang => (staff ? 'ar' : current);

export const getLang = (): Lang => current;
export const isEnglish = () => effective() === 'en';
export const localeTag = () => (isEnglish() ? 'en-GB' : 'ar-EG');

export function setStaffMode(on: boolean) {
  if (staff === on) return;
  staff = on;
  applyLang();
}

/** Page direction follows the UI language. */
export function applyLang() {
  if (typeof document === 'undefined') return;
  const lang = effective();
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'en' ? 'ltr' : 'rtl';
}

export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch {}
  applyLang();
  listeners.forEach((l) => l());
}

export const toggleLang = () => setLang(current === 'en' ? 'ar' : 'en');

/** Subscribe a component (normally the app root) so the tree re-renders when the language changes. */
export function useLang(): Lang {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; }, getLang, () => 'ar' as Lang);
}

export function tr(ar: string, vars?: ReadonlyArray<string | number | undefined | null>): string {
  const text = isEnglish() ? (EN[ar] ?? ar) : ar;
  return vars ? text.replace(/\{(\d+)\}/g, (_, i) => String(vars[Number(i)] ?? '')) : text;
}

/** `dir` for elements whose text is UI copy (Arabic data such as word meanings keeps an explicit rtl). */
export const uiDir = (): 'ltr' | 'rtl' => (isEnglish() ? 'ltr' : 'rtl');

// Difficulty ladder for multiple-choice questions: the lower the level, the shorter and simpler the question.
export type Tier = 1 | 2 | 3 | 4 | 5;
export interface Caps {
  /** max words in a question prompt */ prompt: number;
  /** max words in an answer option */ opt: number;
  /** longest word allowed inside a sentence/definition used as a clue */ letters: number;
  /** max words in a gap-fill sentence */ gap: number;
  /** max words in a definition clue */ def: number;
}
export const CAPS: Record<Tier, Caps> = {
  1: { prompt: 7, opt: 3, letters: 7, gap: 7, def: 6 },     // E1  (A0)
  2: { prompt: 8, opt: 4, letters: 8, gap: 8, def: 7 },     // E2-E3 (A1)
  3: { prompt: 10, opt: 4, letters: 9, gap: 10, def: 8 },   // Pre 1-3 (A2)
  4: { prompt: 12, opt: 5, letters: 11, gap: 12, def: 10 }, // Inter 1-3 (B1)
  5: { prompt: 15, opt: 6, letters: 12, gap: 14, def: 11 }, // Upper and above
};
export function tierOfCefr(cefr?: string): Tier {
  const c = String(cefr || '').toUpperCase();
  if (c.startsWith('A0')) return 1;
  if (c.startsWith('A1')) return 2;
  if (c.startsWith('A2')) return 3;
  if (c.startsWith('B1')) return 4;
  return 5;
}
const wc = (s: string) => String(s).trim().split(/\s+/).filter(Boolean).length;
/** True when a multiple-choice question is short enough for the tier. */
export function fits(q: { prompt: string; options?: string[] }, caps: Caps): boolean {
  return wc(q.prompt) <= caps.prompt && (q.options || []).every((o) => wc(o) <= caps.opt);
}
/** Plain, short English: no odd punctuation and no long/rare-looking words. */
export function simpleEnglish(text: string, caps: Caps, maxWords: number): boolean {
  if (/[;=()"“”\[\]\d]/.test(text)) return false;
  const words = text.trim().split(/\s+/);
  if (words.length > maxWords) return false;
  return words.every((w) => w.replace(/[^A-Za-z']/g, '').length <= caps.letters);
}

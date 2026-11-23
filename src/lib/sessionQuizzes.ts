import { grammarQuestions, shuffle, type GeneratedQuestion } from './grammarQuiz.ts';
import type { GrammarTopic } from './grammar/types.ts';
import { CAPS, simpleEnglish, type Tier } from './difficulty.ts';

export type QuizItem = GeneratedQuestion;
export interface WordLike { word: string; type?: string; examples?: string[]; definitions?: string[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);
const matchCase = (like: string, w: string) => (like[0] === like[0].toLowerCase() ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1));

/** "Flatmate / Roommate" -> "Flatmate": one clean word to show in a question. */
const clean = (x: string) => x.split(/\s*\/\s*/)[0].replace(/\([^)]*\)/g, '').replace(/[.]+$/, '').trim();
const arabicOf = (w: WordLike & { arabic?: string; meaning?: string }) => {
  const first = String(w.arabic || w.meaning || '').replace(/\([^)]*\)/g, '').split(/[،,;/|]/)[0].trim();
  return hasArabic(first) && first.length <= 32 ? first : '';
};

/**
 * Word questions, easiest first. Every word gets: a short gap-fill sentence, a short definition, an Arabic
 * meaning question and a reverse (Arabic -> word) question; the tier decides which ones are allowed and in
 * which order. Variant 'a' (vocabulary quiz) uses the first candidate, 'b' (lesson quiz) the second.
 */
export function wordQuizItems(words: WordLike[], sessionId: string, pool: WordLike[] = [], variant: 'a' | 'b' | 'c' = 'a', tier: Tier = 4): QuizItem[] {
  const caps = CAPS[tier];
  const list = (words || []).filter((w) => w && w.word && !hasArabic(w.word));
  const items: QuizItem[] = [];
  for (const w of list) {
    const re = new RegExp(`(^|[^\\w])(${esc(w.word)})(?=[^\\w]|$)`, 'i');
    const usable = (w.examples || []).filter((ex) => ex && re.test(ex) && !hasArabic(ex) && ex.trim().split(/\s+/).length >= 4 && simpleEnglish(ex, caps, caps.gap));
    const def0 = (w.definitions || []).map((d) => d.replace(/^\(\w+\)\s*/, '')).find((d) => d && !hasArabic(d) && !re.test(d) && simpleEnglish(d.replace(/[.]$/, ''), caps, caps.def));
    const inSession = list.filter((x) => x.word.toLowerCase() !== w.word.toLowerCase());
    const elsewhere = pool.filter((x) => x.word.toLowerCase() !== w.word.toLowerCase() && !hasArabic(x.word) && !inSession.some((y) => y.word === x.word));
    const sameType = (xs: WordLike[]) => xs.filter((x) => w.type && x.type === w.type);
    // topic words first (one of the same part of speech, the rest different so only one answer fits), then any word
    const ordered = [
      ...shuffle(sameType(inSession), sessionId + w.word).slice(0, 1),
      ...shuffle(inSession.filter((x) => !sameType(inSession).includes(x)), sessionId + w.word + 'x'),
      ...shuffle(sameType(inSession).slice(1), sessionId + w.word + 'y'),
      ...shuffle(sameType(elsewhere).concat(elsewhere), sessionId + w.word + 'z'),
    ];
    const wordShown = clean(w.word);
    const distractors = [...new Set(ordered.map((x) => clean(x.word).toLowerCase()))].filter((x) => x && x !== wordShown.toLowerCase()).filter((x) => x.split(' ').length <= caps.opt).slice(0, 3);
    const id = (t: string) => `w-${sessionId}-${t}-${w.word.toLowerCase()}`;
    const kinds: Record<string, () => QuizItem | null> = {
      gap: () => {
        if (!usable[0] || distractors.length < 2) return null;
        const example = usable[0]; const shown = example.match(re)![2];
        return { id: id('gap'), scope: 'word', type: 'mcq', prompt: example.replace(re, '$1____'), options: shuffle([shown, ...distractors.map((d) => matchCase(shown, d))], sessionId + w.word + 'o'), correct: shown, points: 10 };
      },
      def: () => {
        if (!def0 || distractors.length < 2) return null;
        return { id: id('def'), scope: 'word', type: 'mcq', prompt: `Which word means: ${def0.replace(/[.]$/, '')}?`, options: shuffle([wordShown, ...distractors.map((d) => matchCase(wordShown, d))], sessionId + w.word + 'd'), correct: wordShown, points: 10 };
      },
      mean: () => {
        const ar = arabicOf(w as any);
        if (!ar) return null;
        const mine = [...new Set(inSession.map((x) => arabicOf(x as any)).filter((x) => x && x !== ar))];
        const rest = [...new Set(elsewhere.map((x) => arabicOf(x as any)).filter((x) => x && x !== ar && !mine.includes(x)))];
        const wrong = [...shuffle(mine, sessionId + w.word + 'm'), ...shuffle(rest.slice(0, 40), sessionId + w.word + 'n')].slice(0, 3);
        if (wrong.length < 2) return null;
        return { id: id('mean'), scope: 'word', type: 'mcq', prompt: `What does “${wordShown}” mean?`, options: shuffle([ar, ...wrong], sessionId + w.word + 'mo'), correct: ar, points: 10 };
      },
      rev: () => {
        const ar = arabicOf(w as any);
        if (!ar || distractors.length < 2) return null;
        return { id: id('rev'), scope: 'word', type: 'mcq', prompt: `Which word means “${ar}”?`, options: shuffle([wordShown, ...distractors.map((d) => matchCase(wordShown, d))], sessionId + w.word + 'r'), correct: wordShown, points: 10 };
      },
    };
    const order = tier <= 3 ? ['gap', 'mean', 'rev', 'def'] : ['gap', 'def', 'mean', 'rev'];
    const made = order.map((k) => kinds[k]()).filter(Boolean) as QuizItem[];
    if (variant === 'c') { items.push(...made.slice(2)); continue; }
    const pick = made[variant === 'a' ? 0 : 1] || (variant === 'b' ? made[0] : undefined);
    if (pick) items.push(pick);
  }
  return items;
}

export const SESSION_QUIZ_SIZE = 20;
export const GRAMMAR_QUIZ_SIZE = 10;

/** Up to 20 English questions (no repeats) mixing words and grammar: about half each, and either side tops up the other. */
export function sessionQuizItems(words: WordLike[], topics: GrammarTopic[], sessionId: string, pool: WordLike[] = [], total = SESSION_QUIZ_SIZE): QuizItem[] {
  const wq = shuffle(wordQuizItems(words, sessionId, pool), sessionId + 'w');
  const gq = grammarQuestions(sessionId, topics, total);
  const half = Math.floor(total / 2);
  const wantW = Math.min(wq.length, Math.max(half, total - gq.length));
  const wantG = Math.min(gq.length, total - wantW);
  return shuffle([...wq.slice(0, wantW), ...gq.slice(0, wantG)], sessionId + 'all');
}

import { grammarQuestions, shuffle, type GeneratedQuestion } from './grammarQuiz.ts';
import type { GrammarTopic } from './grammar/types.ts';

export type QuizItem = GeneratedQuestion;
export interface WordLike { word: string; type?: string; examples?: string[]; definitions?: string[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);
const matchCase = (like: string, w: string) => (like[0] === like[0].toLowerCase() ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1));

/** English-only word questions: fill the gap in a real example, else match an English definition. */
export function wordQuizItems(words: WordLike[], sessionId: string, pool: WordLike[] = [], variant: 'a' | 'b' = 'a'): QuizItem[] {
  const list = (words || []).filter((w) => w && w.word && !hasArabic(w.word));
  const items: QuizItem[] = [];
  for (const w of list) {
    const re = new RegExp(`(^|[^\\w])(${esc(w.word)})(?=[^\\w]|$)`, 'i');
    const usable = (w.examples || []).filter((ex) => re.test(ex || '') && !hasArabic(ex) && ex.trim().split(/\s+/).length >= 5);
    // variant 'a' (the vocabulary quiz) prefers a gap-fill; variant 'b' (the session quiz) asks the definition instead,
    // so the two quizzes never ask the same thing about the same word.
    const def0 = (w.definitions || []).find((d) => d && d.length < 110 && !hasArabic(d) && !re.test(d));
    const example = variant === 'a' ? usable[0] : (def0 ? undefined : usable[1]);
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
    const distractors = [...new Set(ordered.map((x) => x.word.toLowerCase()))].slice(0, 3);
    if (distractors.length < 2) continue;
    if (example) {
      const m = example.match(re)!;
      const shown = m[2];
      const options = shuffle([shown, ...distractors.map((d) => matchCase(shown, d))], sessionId + w.word + 'o');
      items.push({ id: `w${variant}-${sessionId}-${w.word.toLowerCase()}`, scope: 'word', type: 'mcq', prompt: example.replace(re, `$1____`), options, correct: shown, points: 10 });
      continue;
    }
    const def = def0;
    if (!def) continue;
    const options = shuffle([w.word, ...distractors.map((d) => matchCase(w.word, d))], sessionId + w.word + 'd');
    items.push({ id: `w${variant}-${sessionId}-${w.word.toLowerCase()}`, scope: 'word', type: 'mcq', prompt: `Which word matches this meaning? ${def.replace(/^\(\w+\)\s*/, '')}`, options, correct: w.word, points: 10 });
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

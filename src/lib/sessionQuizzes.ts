import { grammarQuestions, shuffle, type GeneratedQuestion } from './grammarQuiz.ts';
import type { GrammarTopic } from './grammar/types.ts';

export type QuizItem = GeneratedQuestion;
export interface WordLike { word: string; type?: string; examples?: string[]; definitions?: string[] }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);
const matchCase = (like: string, w: string) => (like[0] === like[0].toLowerCase() ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1));

/** English-only word questions: fill the gap in a real example, else match an English definition. */
export function wordQuizItems(words: WordLike[], sessionId: string, pool: WordLike[] = []): QuizItem[] {
  const list = (words || []).filter((w) => w && w.word && !hasArabic(w.word));
  const items: QuizItem[] = [];
  for (const w of list) {
    const re = new RegExp(`(^|[^\\w])(${esc(w.word)})(?=[^\\w]|$)`, 'i');
    const example = (w.examples || []).find((ex) => re.test(ex || '') && !hasArabic(ex) && ex.trim().split(/\s+/).length >= 5);
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
      items.push({ id: `wq-${sessionId}-${w.word.toLowerCase()}`, scope: 'word', type: 'mcq', prompt: example.replace(re, `$1____`), options, correct: shown, points: 10 });
      continue;
    }
    const def = (w.definitions || []).find((d) => d && d.length < 110 && !hasArabic(d) && !re.test(d));
    if (!def) continue;
    const options = shuffle([w.word, ...distractors.map((d) => matchCase(w.word, d))], sessionId + w.word + 'd');
    items.push({ id: `wq-${sessionId}-${w.word.toLowerCase()}`, scope: 'word', type: 'mcq', prompt: `Which word matches this meaning? ${def.replace(/^\(\w+\)\s*/, '')}`, options, correct: w.word, points: 10 });
  }
  return items;
}

/** Nine English questions (no repeats): words first, topped up with grammar. */
export function sessionQuizItems(words: WordLike[], topics: GrammarTopic[], sessionId: string, pool: WordLike[] = []): QuizItem[] {
  const wq = shuffle(wordQuizItems(words, sessionId, pool), sessionId + 'w');
  const gq = grammarQuestions(sessionId, topics, 5);
  const wantG = Math.min(gq.length, Math.max(3, 9 - wq.length));
  const wantW = Math.min(wq.length, 9 - wantG);
  const picked = [...wq.slice(0, wantW), ...gq.slice(0, 9 - wantW)];
  return shuffle(picked, sessionId + 'all');

}

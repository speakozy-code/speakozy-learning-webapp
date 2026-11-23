import type { AppData } from '../types';
import type { RawQ } from './content/types.ts';
import { GRAMMAR_QUESTIONS } from './content/grammarQuestions.ts';
import { TASK_QUESTIONS } from './content/taskQuestions.ts';
import { TALK_QUESTIONS } from './content/talk.ts';
import { grammarFor } from './grammar/index.ts';
import { grammarQuestions, shuffle, type GeneratedQuestion } from './grammarQuiz.ts';
import { wordQuizItems } from './sessionQuizzes.ts';
import { deckQuestions, speakingQuestions } from './lessonBrief.ts';

export const GRAMMAR_PRACTICE_SIZE = 10;
export const SESSION_QUIZ_SIZE = 20;
export const SPEAKING_SIZE = 10;
export const WORD_QUIZ_SIZE = 8;

export interface SessionBank {
  /** Grammar practice: exactly the first 10 authored grammar questions of the lesson. */
  grammar: GeneratedQuestion[];
  /** Vocabulary quiz (after the word list). */
  words: GeneratedQuestion[];
  /** Whole-lesson quiz: up to 20 words + grammar questions, none used anywhere else. */
  session: GeneratedQuestion[];
  /** Open speaking questions for the practice tab (not homework). */
  speaking: string[];
  /** The two daily-task questions of this topic. */
  tasks: { text: string; source: 'authored' | 'generated' }[];
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
/** Two questions are the same when they ask the same thing with the same choices. */
export const questionKey = (q: { prompt: string; options?: string[]; correct?: any }) =>
  norm(q.prompt) + '||' + (q.options || []).map(norm).sort().join('|');
const textKey = (t: string) => 'txt:' + norm(t);

function authored(sessionId: string, raw: RawQ[]): GeneratedQuestion[] {
  return raw.map(([prompt, correct, ...wrong], i) => ({
    id: `ga-${sessionId}-${i + 1}`, scope: 'grammar', type: 'mcq', prompt, correct,
    options: shuffle([correct, ...wrong], `${sessionId}-${i}-${prompt}`), points: 10,
  }));
}

let cache: { refs: any[]; bank: Map<string, SessionBank> } | null = null;

/**
 * One pass over the whole curriculum, in level and session order, with a single "seen" set,
 * so no question (quiz, speaking, daily task, "يلا نتكلم") appears twice anywhere on the site.
 */
export function getBank(data: Pick<AppData, 'levels' | 'sessions' | 'dictionary'>): Map<string, SessionBank> {
  const refs = [data.levels, data.sessions, data.dictionary];
  if (cache && cache.refs.every((r, i) => r === refs[i])) return cache.bank;
  const seen = new Set<string>();
  const claim = (key: string) => { if (seen.has(key)) return false; seen.add(key); return true; };
  Object.values(TALK_QUESTIONS).flat().forEach((q) => claim(textKey(q)));

  const bank = new Map<string, SessionBank>();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  for (const level of levels) {
    const sessions = data.sessions.filter((s) => s.levelId === level.id).sort((a, b) => a.order - b.order);
    // daily tasks are claimed first so the speaking practice can never reuse them
    const taskPlan = new Map<string, SessionBank['tasks']>();
    for (const s of sessions) {
      const mine: SessionBank['tasks'] = [];
      for (const q of TASK_QUESTIONS[s.id] || []) if (mine.length < 2 && claim(textKey(q))) mine.push({ text: q, source: 'authored' });
      taskPlan.set(s.id, mine);
    }
    for (const s of sessions) {
      const words = data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
      const topics = grammarFor(s.id);
      const pool = authored(s.id, GRAMMAR_QUESTIONS[s.id] || []);
      const take = (list: GeneratedQuestion[], max: number) => {
        const out: GeneratedQuestion[] = [];
        for (const q of list) { if (out.length >= max) break; if (claim(questionKey(q))) out.push(q); }
        return out;
      };
      const generated = grammarQuestions(s.id, topics, 60);
      const grammar = take([...pool, ...generated], GRAMMAR_PRACTICE_SIZE);
      const wordA = shuffle(wordQuizItems(words, s.id, data.dictionary, 'a'), s.id + 'wa');
      const wordBq = shuffle(wordQuizItems(words, s.id, data.dictionary, 'b'), s.id + 'wb');
      const wordQs = take(wordA, Math.min(WORD_QUIZ_SIZE, Math.max(4, Math.ceil(words.length / 2))));
      // lesson quiz: words (second style, then leftovers) first, topped up with the remaining grammar questions
      const fromWords = take([...wordBq, ...wordA], Math.min(10, SESSION_QUIZ_SIZE));
      const rest = take([...pool, ...generated], SESSION_QUIZ_SIZE - fromWords.length);
      const session = shuffle([...fromWords, ...rest], s.id + 'sq');
      if (session.length < SESSION_QUIZ_SIZE) {
        const more = take(grammarQuestions(s.id, topics, 200), SESSION_QUIZ_SIZE - session.length);
        session.push(...more);
      }

      const tasks = taskPlan.get(s.id) || [];
      const speakingCandidates = [...deckQuestions(s as any), ...speakingQuestions(s as any, words.map((w) => w.word))];
      const speaking: string[] = [];
      for (const q of speakingCandidates) { if (speaking.length >= SPEAKING_SIZE + 2) break; if (claim(textKey(q))) speaking.push(q); }
      bank.set(s.id, { grammar, words: wordQs, session, speaking, tasks });
    }
  }
  cache = { refs, bank };
  return bank;
}

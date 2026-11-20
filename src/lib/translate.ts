import type { AppData } from '../types';
import { EN_MAP } from './englishMap';
import { enrichWord } from './wordMeanings';

export function tr(s: any): any {
  if (typeof s !== 'string') return s;
  if (EN_MAP[s]) return EN_MAP[s];
  return s
    .replace(/ما معنى كلمة «(.+?)»؟/g, 'What does «$1» mean?')
    .replace(/القاعدة «(.+?)» صحيحة في السيشن ده؟/g, 'Is the rule «$1» correct in this session?')
    .replace(/^أكمل:/, 'Complete:');
}

// Structural content in English. Word meanings and Arabic explanations stay Arabic on purpose.
export function englishify(data: AppData): AppData {
  return {
    ...data,
    grammarNotes: data.grammarNotes || [],
    dictionary: data.dictionary.map(enrichWord),
    levels: data.levels.map((l) => ({ ...l, title: tr(l.title), description: tr(l.description) })),
    sessions: data.sessions.map((s) => ({ ...s, title: tr(s.title), topic: tr(s.topic), sections: s.sections.map((x) => ({ ...x, title: tr(x.title) })) })),
    questions: data.questions.map((q) => ({ ...q, prompt: tr(q.prompt), explanation: tr(q.explanation), options: q.options.map(tr), correct: Array.isArray(q.correct) ? q.correct.map(tr) : tr(q.correct) })),
    tasks: data.tasks.map((t) => ({ ...t, title: tr(t.title) })),
    notifications: data.notifications.map((n) => ({ ...n, title: tr(n.title), body: tr(n.body) })),
  };
}

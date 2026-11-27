import { tr } from './i18n/index.ts';
import { grammarFor } from './grammar/index.ts';

const STOP = new Set(['the', 'and', 'for', 'with', 'verb', 'form', 'forms', 'questions', 'question', 'negative', 'positive', 'vs', 'simple']);
const tokens = (t: string) => t.toLowerCase().split(/[^a-z']+/).filter((w) => w.length >= 3 && !STOP.has(w));

/** The "📌 القاعدة" line of a topic's detailed Arabic explanation. */
const ruleLine = (ar: string) => (ar.split('\n').find((l) => l.startsWith('📌')) || ar.split('\n')[0] || '').replace(/^📌\s*/, '');

/** Arabic reason shown after a wrong answer: the correct answer + the rule (or the word's meaning). */
export function whyWrong(q: { id: string; prompt: string; correct: any; scope?: string }, sessionId: string, dictionary: { word: string; arabic?: string; meaning?: string }[] = []): string {
  const correct = Array.isArray(q.correct) ? q.correct.join(' / ') : String(q.correct);
  if (q.scope === 'word') {
    const entry = dictionary.find((d) => d.word && (q.id.endsWith('-' + d.word) || q.prompt.toLowerCase().includes(d.word.toLowerCase()) || d.word.toLowerCase() === correct.toLowerCase()));
    const mean = entry?.arabic || entry?.meaning || '';
    return `${tr('✅ الإجابة الصح: {0}', [correct])}${mean ? `\n${tr('معنى «{0}»: {1}', [entry!.word, mean])}` : ''}`;
  }
  const topics = grammarFor(sessionId);
  const hay = (q.prompt + ' ' + correct).toLowerCase();
  const scored = topics.map((t) => ({ t, score: tokens(t.title + ' ' + t.formula).filter((w) => hay.includes(w)).length }));
  const best = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score)[0];
  const picked = best ? [best.t] : topics;
  const rules = picked.map((t) => `${picked.length > 1 ? `[${t.title}] ` : ''}${ruleLine(t.ar)}`).join('\n');
  return `${tr('✅ الإجابة الصح: {0}', [correct])}${rules ? `\n${tr('السبب — {0}', [rules])}` : ''}`;
}

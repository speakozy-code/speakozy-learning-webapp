import type { GrammarTopic } from './grammar/index.ts';

const lower = (s: string) => s.replace(/^\w/, (c) => c.toLowerCase());
const list = (xs: string[]) => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** Objectives and summary written from the lesson's real content (its title, grammar topics and words). */
export function lessonOverview(title: string, topics: GrammarTopic[], words: { word: string }[]) {
  const clean = title.replace(/^\s*session\s+\d+\s*[|—:-]\s*/i, '').trim() || 'this topic';
  const w = words.map((x) => x.word).filter((x) => x && !/[؀-ۿ]/.test(x));
  const objectives: string[] = [`Talk about “${clean}” in simple, natural English.`];
  if (w.length) objectives.push(`Learn and use ${w.length} new words, such as ${list(w.slice(0, 3).map((x) => `“${x}”`))}.`);
  for (const t of topics.slice(0, 3)) objectives.push(`Use “${t.title}” correctly (${t.formula.split('·')[0].trim()}).`);
  objectives.push('Avoid the common mistakes and check yourself with the practice and the quiz.');
  const grammar = topics.length ? `You study ${list(topics.map((t) => `“${t.title}”`))}.` : '';
  const vocab = w.length ? `You learn ${w.length} words including ${list(w.slice(0, 4).map((x) => `“${x}”`))}.` : '';
  const summary = `This lesson is about “${clean}”. ${vocab} ${grammar} Then you practise with a words quiz, grammar practice, a lesson quiz and speaking questions, and you finish by sending your answers to the group.`.replace(/\s+/g, ' ').trim();
  return { objectives, summary, lower };
}

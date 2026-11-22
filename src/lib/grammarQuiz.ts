import type { GrammarTopic } from './grammar/types.ts';

export interface GeneratedQuestion {
  id: string; scope: 'grammar' | 'word'; type: 'mcq'; prompt: string;
  options: string[]; correct: string; points: number;
}

// Words that are unambiguous "slots" in a sentence: swapping one for another in its group is wrong.
const GROUPS: string[][] = [
  ['am', 'is', 'are'], ['was', 'were'], ['do', 'does', 'did'], ['have', 'has', 'had'],
  ["don't", "doesn't", "didn't"], ["can't", "mustn't", "shouldn't"], ['can', 'could', 'must'],
  ['should', 'must', 'might'], ['my', 'your', 'his', 'our', 'their'], ['who', 'which', 'where'],
  ['much', 'many'], ['some', 'any'], ['for', 'since'], ['a', 'an'], ['this', 'these'], ['that', 'those'],
  ['will', 'would'],
];

export function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function shuffle<T>(arr: T[], seed: string): T[] {
  const a = arr.slice(); let h = hash(seed);
  for (let i = a.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const strip = (t: string) => t.replace(/^[("'“]+|[.,!?;:)"'”]+$/g, '');

function cloze(sentence: string, seed: string): { prompt: string; correct: string; options: string[] } | null {
  const tokens = sentence.split(/\s+/);
  if (tokens.length < 4 || /\s→\s|\(/.test(sentence)) return null;
  for (let i = 0; i < tokens.length; i++) {
    const raw = strip(tokens[i]); const low = raw.toLowerCase();
    if (low === 'her' || low === 'its') continue;
    // "do" as a main verb ("do our homework") is ambiguous, so only question-initial do/does/did
    if (['do', 'does', 'did'].includes(low) && i !== 0) continue;
    const group = GROUPS.find((g) => g.includes(low));
    if (!group) continue;
    const cap = raw[0] === raw[0].toUpperCase();
    const fix = (w: string) => (cap ? w[0].toUpperCase() + w.slice(1) : w);
    const wrong = shuffle(group.filter((g) => g !== low), seed).slice(0, 2);
    if (!wrong.length) continue;
    const out = tokens.map((t, k) => (k === i ? t.replace(raw, '____') : t)).join(' ');
    const options = shuffle([fix(low), ...wrong.map(fix)], seed + 'o');
    return { prompt: `Choose the missing word: ${out}`, correct: fix(low), options };
  }
  return null;
}

/** Up to `n` grammar questions for a session, built only from the hand-written topics. */
export function grammarQuestions(sessionId: string, topics: GrammarTopic[], n = 4): GeneratedQuestion[] {
  const pairs = topics.flatMap((t) => t.mistakes);
  const picks: GeneratedQuestion[] = [];
  const judges: GeneratedQuestion[] = [];
  const clozes: GeneratedQuestion[] = [];
  const taken = new Set<string>();
  pairs.forEach(([wrong, right], i) => {
    const others = pairs.filter((_, k) => k !== i).map((p) => p[0]);
    const opts = [right, wrong, ...shuffle(others, sessionId + i).slice(0, 1)];
    picks.push({ id: `gq-${sessionId}-m${i}`, scope: 'grammar', type: 'mcq', prompt: 'Which sentence is correct?', options: shuffle(opts, sessionId + 'm' + i), correct: right, points: 10 });
    const showWrong = i % 2 === 0;
    judges.push({ id: `gq-${sessionId}-j${i}`, scope: 'grammar', type: 'mcq', prompt: `Is this sentence correct? “${showWrong ? wrong : right}”`, options: ['Correct', 'Incorrect'], correct: showWrong ? 'Incorrect' : 'Correct', points: 10 });
    taken.add(right);
  });
  for (const t of topics) for (const ex of t.examples) {
    if (taken.has(ex)) continue;
    const c = cloze(ex, sessionId + ex);
    if (!c) continue;
    taken.add(ex);
    clozes.push({ id: `gq-${sessionId}-c${clozes.length}`, scope: 'grammar', type: 'mcq', prompt: c.prompt, options: c.options, correct: c.correct, points: 10 });
  }
  // interleave the three formats so a quiz is never five of the same kind
  const out: GeneratedQuestion[] = [];
  for (let i = 0; out.length < n && i < Math.max(picks.length, judges.length, clozes.length); i++) {
    for (const list of [picks, clozes, judges]) if (list[i] && out.length < n) out.push(list[i]);
  }
  return out;
}

type GrammarSlide = { title: string; rule: string; examples: string[]; detail?: string };

export interface QuizItem {
  id: string;
  scope: 'word' | 'grammar';
  type: 'mcq' | 'fill' | 'truefalse';
  prompt: string;
  options: string[];
  correct: string;
  points: number;
}

type WordLike = {
  word: string;
  arabic?: string;
  meaning?: string;
  type?: string;
  examples?: string[];
  definitions?: string[];
};

function esc(word: string) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pick<T>(list: T[], n: number, seed: number): T[] {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.abs((seed * (i + 3) * 1103515245 + 12345) % (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function uniqueOptions(correct: string, extras: string[], n = 4) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of [correct, ...extras]) {
    const t = String(x || '').trim();
    const key = t.toLowerCase();
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= n) break;
  }
  return out.length >= 2 ? out : [];
}

export function wordQuizItems(words: WordLike[], sessionId: string): QuizItem[] {
  const list = (words || []).filter((w) => w && w.word);
  const bank = list.map((w) => w.word);
  const items: QuizItem[] = [];
  list.forEach((w, i) => {
    const example = (w.examples || []).find((ex) => new RegExp(`\\b${esc(w.word)}\\b`, 'i').test(ex || ''));
    const prompt = example
      ? example.replace(new RegExp(`\\b${esc(w.word)}\\b`, 'i'), '____')
      : `Complete the sentence: In this lesson we use ____.`;
    const distractors = pick(
      bank.filter((x) => x.toLowerCase() !== w.word.toLowerCase()).concat(['book', 'play', 'go', 'have', 'need']),
      3,
      w.word.length + i,
    );
    const options = uniqueOptions(w.word, distractors);
    if (options.length < 2) return;
    items.push({
      id: `wq-${sessionId}-${w.word.toLowerCase()}-fill`,
      scope: 'word',
      type: 'mcq',
      prompt,
      options,
      correct: w.word,
      points: 10,
    });
  });
  return items.slice(0, 8);
}

export function grammarQuizItems(slides: GrammarSlide[], sessionId: string, existingPrompts: string[] = []): QuizItem[] {
  const taken = new Set(existingPrompts.map((x) => x.toLowerCase()));
  const items: QuizItem[] = [];
  const pool = ['is', 'are', 'was', 'were', 'have', 'had', 'do', 'did'];
  for (const slide of slides || []) {
    for (const ex of (slide.examples || []).slice(0, 2)) {
      const tokens = ex.split(/\s+/);
      const idx = tokens.findIndex((tok) => /^(am|is|are|was|were|have|has|had|do|does|did)$/i.test(tok.replace(/[.,!?;:]/g, '')) || /(ed|ing)$/i.test(tok.replace(/[.,!?;:]/g, '')));
      if (idx < 0) continue;
      const raw = tokens[idx];
      const clean = raw.replace(/[.,!?;:]/g, '');
      const prompt = `Complete: ${tokens.map((t, i) => i === idx ? '____' : t).join(' ')}`;
      if (taken.has(prompt.toLowerCase())) continue;
      const options = uniqueOptions(clean, pool.filter((x) => x.toLowerCase() !== clean.toLowerCase()));
      if (options.length < 2) continue;
      taken.add(prompt.toLowerCase());
      items.push({
        id: `gq-${sessionId}-${slide.title.toLowerCase().replace(/\s+/g, '-')}-${items.length}`,
        scope: 'grammar',
        type: 'mcq',
        prompt,
        options,
        correct: clean,
        points: 10,
      });
      if (items.length >= 5) return items;
    }
    if (slide.rule && items.length < 5) {
      const prompt = `True or false: ${slide.title} — ${slide.rule.slice(0, 140)}`;
      if (!taken.has(prompt.toLowerCase())) {
        taken.add(prompt.toLowerCase());
        items.push({
          id: `gq-${sessionId}-${slide.title.toLowerCase().replace(/\s+/g, '-')}-tf`,
          scope: 'grammar',
          type: 'truefalse',
          prompt,
          options: ['True', 'False'],
          correct: 'True',
          points: 10,
        });
      }
    }
  }
  return items.slice(0, 5);
}

export function sessionQuizItems(words: WordLike[], slides: GrammarSlide[], sessionId: string): QuizItem[] {
  const wordQs = wordQuizItems(words, sessionId);
  const grammarQs = grammarQuizItems(slides, sessionId, wordQs.map((q) => q.prompt)).filter((q) => q.type === 'mcq');
  const out: QuizItem[] = [...wordQs.slice(0, 6)];
  let gi = 0;
  while (out.filter((q) => q.scope === 'grammar').length < 3 && grammarQs.length && out.length < 9) {
    const base = grammarQs[gi % grammarQs.length];
    out.push({ ...base, id: `${base.id}-g${out.length}` });
    gi++;
  }
  let wi = 0;
  while (out.length < 9 && wordQs.length) {
    const base = wordQs[wi % wordQs.length];
    out.push({ ...base, id: `${base.id}-x${out.length}` });
    wi++;
    if (wi > 12) break;
  }
  return out.slice(0, 9);
}

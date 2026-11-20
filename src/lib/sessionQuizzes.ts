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
  const items: QuizItem[] = [];
  list.slice(0, 10).forEach((w, i) => {
    const others = list.filter((x) => x.word !== w.word);
    const ar = (w.arabic || w.meaning || '').trim();
    if (ar && others.length >= 2) {
      const distractors = pick(others, 3, w.word.length + i).map((x) => x.arabic || x.meaning || x.word);
      const options = uniqueOptions(ar, distractors);
      if (options.length >= 2) {
        items.push({
          id: `wq-${sessionId}-${w.word.toLowerCase()}-ar`,
          scope: 'word',
          type: 'mcq',
          prompt: `What does “${w.word}” mean?`,
          options,
          correct: ar,
          points: 10,
        });
      }
    }
    const example = (w.examples || []).find((ex) => new RegExp(`\\b${esc(w.word)}\\b`, 'i').test(ex || ''));
    if (example) {
      items.push({
        id: `wq-${sessionId}-${w.word.toLowerCase()}-fill`,
        scope: 'word',
        type: 'fill',
        prompt: example.replace(new RegExp(`\\b${esc(w.word)}\\b`, 'i'), '____'),
        options: [],
        correct: w.word,
        points: 10,
      });
    }
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

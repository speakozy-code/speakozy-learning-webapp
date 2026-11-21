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

function bodySentence(body: string, word: string): string | undefined {
  if (!body) return undefined;
  const re = new RegExp(`[^.!?\\n]*\\b${esc(word)}\\b[^.!?\\n]*[.!?]`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const t = m[0].trim();
    if (t.length > 20 && t.length < 160) return t;
  }
  return undefined;
}

export function wordQuizItems(words: WordLike[], sessionId: string, body = ''): QuizItem[] {
  const list = (words || []).filter((w) => w && w.word);
  const bank = list.map((w) => w.word);
  const items: QuizItem[] = [];
  const usedPrompts = new Set<string>();
  list.forEach((w, i) => {
    const example = (w.examples || []).find((ex) => new RegExp(`\\b${esc(w.word)}\\b`, 'i').test(ex || '')) || bodySentence(body, w.word);
    let prompt: string;
    if (example) {
      prompt = example.replace(new RegExp(`\\b${esc(w.word)}\\b`, 'i'), '____');
    } else {
      const def = (w.definitions || []).find((d) => d && /[a-zA-Z]/.test(d));
      if (!def) return;
      prompt = `Which word means: ${def.slice(0, 140)}`;
    }
    if (usedPrompts.has(prompt.toLowerCase())) return;
    const distractors = pick(
      bank.filter((x) => x.toLowerCase() !== w.word.toLowerCase()).concat(['book', 'play', 'go', 'have', 'need']),
      3,
      w.word.length + i,
    );
    const options = uniqueOptions(w.word, distractors);
    if (options.length < 2) return;
    usedPrompts.add(prompt.toLowerCase());
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

export function sessionQuizItems(words: WordLike[], slides: GrammarSlide[], sessionId: string, body = ''): QuizItem[] {
  const wordQs = wordQuizItems(words, sessionId, body);
  const grammarAll = grammarQuizItems(slides, sessionId, wordQs.map((q) => q.prompt));
  const grammarMcq = grammarAll.filter((q) => q.type === 'mcq');
  const grammarTf = grammarAll.filter((q) => q.type === 'truefalse').map((q) => ({ ...q, type: 'mcq' as const, options: ['True', 'False'] }));
  const out: QuizItem[] = [];
  const used = new Set<string>();
  const add = (q: QuizItem) => {
    const key = q.prompt.toLowerCase();
    if (used.has(key) || out.length >= 9) return;
    used.add(key);
    out.push({ ...q, id: `${q.id}-s${out.length}` });
  };
  wordQs.slice(0, 5).forEach(add);
  grammarMcq.slice(0, 3).forEach(add);
  grammarTf.slice(0, 1).forEach(add);
  wordQs.slice(5).forEach(add);
  grammarMcq.slice(3).forEach(add);
  grammarTf.slice(1).forEach(add);
  return out.slice(0, 9);
}

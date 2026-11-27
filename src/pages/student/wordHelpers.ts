

export const phon = (p?: string) => {
  if (!p) return '';
  const inner = p.replace(/^\/+|\/+$/g, '');
  if (!/[a-zA-Z\u0250-\u02AF\u0300-\u036F]/.test(inner)) return '';
  return /^\//.test(p) ? p : `/${p}/`;
};

// Resolve lesson PDFs by stable session id so stale demo localStorage still shows them.

export function easyExamples(e: { word: string; examples: string[] }): string[] {
  const w = e.word.toLowerCase();
  const has = (x: string) => x.toLowerCase().includes(w.split(' ')[0].slice(0, Math.max(3, w.length - 3)));
  return [...(e.examples || [])].filter((x) => x && has(x)).sort((a, b) => a.length - b.length).slice(0, 2);
}

export function speakWord(word: string) {
  try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
}

/** الكلمات: مراجعة كروت على طريقة AnkiDroid (Again / Hard / Good / Easy) على الكلمات المحفوظة. */

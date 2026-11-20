/** Same-page YouGlish player. The site blocks iframes, so the dock uses their widget. */
export const YOUGLISH_ACCENTS: { code: string; label: string }[] = [
  { code: 'us', label: 'US' },
  { code: 'uk', label: 'UK' },
  { code: 'aus', label: 'AUS' },
  { code: 'can', label: 'CAN' },
];

export function youglishWidgetQuery(word: string, accent = 'us') {
  const clean = String(word || '').trim();
  const acc = YOUGLISH_ACCENTS.some((a) => a.code === accent) ? accent : 'us';
  return { word: clean, lang: 'english', accent: acc };
}

export function youglishEmbedUrl(word: string, accent = 'us'): string {
  const q = youglishWidgetQuery(word, accent);
  return `https://youglish.com/pronounce/${encodeURIComponent(q.word)}/english/${q.accent}`;
}

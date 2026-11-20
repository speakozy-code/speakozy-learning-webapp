/** In-page YouGlish player URL. Same origin panel embeds this; never needs a new tab. */
export function youglishEmbedUrl(word: string, accent = 'us'): string {
  const clean = String(word || '').trim();
  const acc = ['us', 'uk', 'aus', 'can'].includes(accent) ? accent : 'us';
  return `https://youglish.com/pronounce/${encodeURIComponent(clean)}/english/${acc}`;
}

export const YOUGLISH_ACCENTS: { code: string; label: string }[] = [
  { code: 'us', label: 'US' },
  { code: 'uk', label: 'UK' },
  { code: 'aus', label: 'AUS' },
  { code: 'can', label: 'CAN' },
];

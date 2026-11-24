import type { DictionaryEntry } from '../types';

export type LookupEntry = DictionaryEntry & {
  source?: 'local' | 'global' | 'manual';
  phonetic?: string;
  audioUrl?: string;
  definitions?: string[];
  synonyms?: string[];
};

const ENV = (import.meta as any).env || {};
const API = (ENV.VITE_DICTIONARY_API as string) || 'https://api.dictionaryapi.dev/api/v2/entries/en';
const WIKTIONARY = 'https://en.wiktionary.org/api/rest_v1/page/definition/';
const WIKTIONARY_HTML = 'https://en.wiktionary.org/api/rest_v1/page/html/';
const TRANSLATE = 'https://translate.googleapis.com/translate_a/single';
const CACHE_KEY = 'speakozy-word-cache-v4';

function cache(): Record<string, LookupEntry> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(c: Record<string, LookupEntry>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

function stripHtml(s: string) {
  return String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function fromApi(raw: any): LookupEntry {
  const meanings = raw.meanings || [];
  const defs: string[] = [];
  const synonyms: string[] = [];
  const examples: string[] = [];
  meanings.forEach((m: any) => {
    (m.definitions || []).forEach((d: any) => {
      if (d.definition) defs.push(d.definition);
      if (d.example) examples.push(d.example);
    });
    (m.synonyms || []).slice(0, 6).forEach((s: string) => synonyms.push(s));
  });
  const ph = (raw.phonetics || []).find((p: any) => p.audio) || raw.phonetics?.[0];
  const firstDef = defs[0] || 'تعريف غير متوفر من المصدر';
  return {
    id: `online-${raw.word}`,
    word: raw.word,
    meaning: firstDef,
    type: meanings[0]?.partOfSpeech || 'word',
    examples: examples.slice(0, 3),
    arabic: '',
    phonetic: raw.phonetic || ph?.text || '',
    audioUrl: ph?.audio || '',
    definitions: defs.slice(0, 5),
    synonyms: Array.from(new Set(synonyms)).slice(0, 8),
    source: 'global',
    sessionIds: [],
  };
}

/** Fallback provider. dictionaryapi.dev can stall in some browsers; Wiktionary answers. */
export function fromWiktionary(raw: any, word: string): LookupEntry {
  const groups = raw?.en || [];
  const defs: string[] = [];
  let type = '';
  groups.forEach((g: any) => {
    if (!type && g.partOfSpeech) type = String(g.partOfSpeech).toLowerCase();
    (g.definitions || []).forEach((d: any) => {
      const text = stripHtml(d?.definition || '');
      if (text) defs.push(text);
    });
  });
  const firstDef = defs[0] || 'تعريف غير متوفر من المصدر';
  return {
    id: `online-${word}`,
    word,
    meaning: firstDef,
    type: type || 'word',
    examples: [],
    arabic: '',
    phonetic: '',
    audioUrl: '',
    definitions: defs.slice(0, 5),
    synonyms: [],
    source: 'global',
    sessionIds: [],
  };
}

/** Transcript, synonyms and audio extracted from the Wiktionary page. */
export function parseWiktionaryExtras(html: string) {
  const out: { phonetic: string; synonyms: string[]; audioUrl: string } = { phonetic: '', synonyms: [], audioUrl: '' };
  if (!html) return out;
  const ipaSpans = Array.from(html.matchAll(/<span[^>]*\bIPA\b[^>]*>([^<]+)<\/span>/gi)).map((m) => stripHtml(m[1]).trim());
  const ipa = ipaSpans.find((t) => /[\/\[]/.test(t));
  if (ipa) out.phonetic = ipa.slice(0, 60);
  const start = html.search(/synonyms\s*:/i);
  if (start >= 0) {
    const chunkAll = html.slice(start, start + 2500);
    const stop = chunkAll.search(/\b(antonyms|related terms|derived terms|collocations)\s*:/i);
    const chunk = stop > 0 ? chunkAll.slice(0, stop) : chunkAll;
    const links = chunk.match(/<a[^>]*>([^<]+)<\/a>/gi) || [];
    const seen = new Set<string>();
    for (const link of links) {
      const text = stripHtml(link.replace(/<[^>]*>/g, ''));
      const key = text.toLowerCase();
      if (!text || text.length > 28 || /[\/\[\]]/.test(text) || seen.has(key)) continue;
      seen.add(key);
      out.synonyms.push(text);
      if (out.synonyms.length >= 8) break;
    }
  }
  const audio = html.match(/https:\/\/upload\.wikimedia\.org\/[^"' ]+\.ogg/i);
  if (audio) out.audioUrl = audio[0];
  return out;
}

export function cached(word: string): LookupEntry | undefined {
  return cache()[word.toLowerCase().trim()];
}

// كل الكلمات اللي اتجلّبت من المصدر العالمي، عشان تظهر في البحث بعدين.
export function allCached(): LookupEntry[] {
  return Object.values(cache());
}

export function remember(entry: LookupEntry) {
  const c = cache();
  c[entry.word.toLowerCase()] = entry;
  saveCache(c);
}

async function fetchText(url: string, ms: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url: string, ms: number): Promise<any> {
  const text = await fetchText(url, ms);
  return JSON.parse(text);
}

async function arabicMeaning(word: string): Promise<string> {
  try {
    const data = await fetchJson(`${TRANSLATE}?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(word)}`, 4000);
    const parts = data?.[0] || [];
    return stripHtml(parts.map((p: any) => p?.[0] || '').join(' '));
  } catch {
    return '';
  }
}

// أول مصدر ينجح يكسب — المصدر الأساسي وويكشنري بيتسابقوا بدل ما نستنى واحد ورا التاني.
function firstSuccess<T>(tasks: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let pending = tasks.length;
    let lastErr: unknown;
    tasks.forEach((t) => t.then(resolve, (e) => { lastErr = e; pending -= 1; if (pending === 0) reject(lastErr); }));
  });
}

// محلي أولًا للسرعة، ثم المصدر الأساسي، ثم ويكشنري، ثم ترجمة المعنى، ثم إدخال يدوي.
export const isArabicText = (s: string) => /[\u0600-\u06FF]/.test(s);
/** Arabic normalisation for matching: strips diacritics/tatweel and unifies alef, ya and ta marbuta forms. */
export const normAr = (s: string) => String(s || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase();

/** Arabic → English: the main translation plus the alternatives Google lists (nouns, verbs, ...). */
export async function arabicToEnglish(q: string): Promise<string[]> {
  const term = q.trim();
  if (!term) return [];
  try {
    const data = await fetchJson(`${TRANSLATE}?client=gtx&sl=ar&tl=en&dt=t&dt=bd&q=${encodeURIComponent(term)}`, 5000);
    const out: string[] = [];
    const main = (data?.[0] || []).map((x: any) => x?.[0]).filter(Boolean).join('').trim();
    if (main) out.push(main);
    (data?.[1] || []).forEach((grp: any) => (grp?.[1] || []).forEach((w: string) => out.push(w)));
    const seen = new Set<string>();
    return out.map((w) => w.trim()).filter((w) => w && w.split(/\s+/).length <= 3 && !seen.has(w.toLowerCase()) && (seen.add(w.toLowerCase()), true)).slice(0, 8);
  } catch { return []; }
}

export async function lookupWord(word: string, local: DictionaryEntry[]): Promise<LookupEntry | undefined> {
  const w = word.trim().toLowerCase();
  if (!w) return undefined;
  const localHit = local.find((d) => d.word.toLowerCase() === w);
  if (localHit) return { ...localHit, source: 'local' };
  const hit = cached(w);
  if (hit) return hit;

  let entry: LookupEntry | undefined;
  const primary = (async () => {
    const data = await fetchJson(`${API}/${encodeURIComponent(w)}`, 6000);
    const raw = Array.isArray(data) ? data[0] : data;
    if (raw?.meanings) return fromApi(raw);
    throw new Error('no-meanings');
  })();
  const fallback = (async () => {
    const data = await fetchJson(`${WIKTIONARY}${encodeURIComponent(w)}`, 8000);
    if (data?.en?.length) return fromWiktionary(data, word.trim());
    throw new Error('no-wiktionary');
  })();
  entry = await firstSuccess([primary, fallback]).catch(() => undefined);
  if (!entry) return undefined;
  if (!entry.arabic) entry.arabic = await arabicMeaning(word.trim());
  if (!entry.phonetic || !(entry.synonyms || []).length || !entry.audioUrl) {
    try {
      const html = await fetchText(`${WIKTIONARY_HTML}${encodeURIComponent(w)}`, 8000);
      const extras = parseWiktionaryExtras(html);
      if (!entry.phonetic && extras.phonetic) entry.phonetic = extras.phonetic;
      if (!entry.audioUrl && extras.audioUrl) entry.audioUrl = extras.audioUrl;
      if (!(entry.synonyms || []).length && extras.synonyms.length) entry.synonyms = extras.synonyms;
    } catch {}
  }
  remember(entry);
  return entry;
}

import type { DictionaryEntry } from '../types';

export type LookupEntry = DictionaryEntry & {
  source?: 'local' | 'global' | 'manual';
  phonetic?: string;
  audioUrl?: string;
  definitions?: string[];
  synonyms?: string[];
};

const API = (import.meta.env.VITE_DICTIONARY_API as string) || 'https://api.dictionaryapi.dev/api/v2/entries/en';
const CACHE_KEY = 'speakozy-word-cache-v1';

function cache(): Record<string, LookupEntry> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(c: Record<string, LookupEntry>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
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

// أي كلمة عالميًا: محلي أولًا للسرعة، ثم المصدر العالمي القابل للتبديل، ثم إدخال يدوي.
export async function lookupWord(word: string, local: DictionaryEntry[]): Promise<LookupEntry | undefined> {
  const w = word.trim().toLowerCase();
  if (!w) return undefined;
  const localHit = local.find((d) => d.word.toLowerCase() === w);
  if (localHit) return { ...localHit, source: 'local' };
  const hit = cached(w);
  if (hit) return hit;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(`${API}/${encodeURIComponent(w)}`, { signal: controller.signal });
    if (!res.ok) return undefined;
    const data = await res.json();
    const entry = fromApi(Array.isArray(data) ? data[0] : data);
    remember(entry);
    return entry;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

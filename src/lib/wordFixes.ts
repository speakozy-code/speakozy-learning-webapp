import type { DictionaryEntry } from '../types';

// Session word lists must match the lesson topic. The deck import left in grammar contractions, names and
// classroom words; this layer drops them and swaps in a few on-topic words (Arabic meaning only).
const JUNK = new Set([
  'look', 'choose', 'describe', 'simple', 'vocabulary', 'adjective', 'yourself', 'something', 'because', 'before', 'news',
  'picture', 'information', 'formal', 'financial', 'mental', 'best', 'myths', 'checklist', 'without', 'well', 'egypt', 'samy', 'quito',
  'record yourself task', 'sentence a', 'sentence b', 'that is allowed', "never use 'that'", 'starting a story', 'the hard part',
  'where you are now', 'giving advice', 'ai-generated',
]);
/** word|session pairs that do not belong to that lesson's topic. */
const OFF_TOPIC = new Set([
  'football|l1-s2', 'name|l1-s5', 'house|l1-s5', 'call|l1-s6', 'small|l1-s4',
  'work|l2-s2', 'usually|l2-s2', 'friend|l2-s2', 'brother|l2-s2',
  'false|l3-s4', 'true|l3-s4', 'listen|l3-s5', 'phone|l3-s5', 'phrases|l3-s5', 'read|l3-s5', 'listen|l3-s6', 'please|l3-s6', 'advice|l3-s7',
  'good|l8-s1', 'homesick|l8-s1', 'life|l6-s3', 'read|l6-s5', 'great|l7-s3', 'card|l7-s3', 'health|l7-s5',
  'sure|l7-s6', 'believe|l7-s6', 'definitely|l7-s6', 'plays|l7-s7', 'discuss|l11-s1', 'life|l11-s1', 'generation|l11-s1',
  'work|l11-s2', 'find|l11-s2', 'partner|l11-s2',
]);
const ADD: [string, string, string][] = [
  ['l1-s2', 'teacher', 'معلم'], ['l1-s2', 'nurse', 'ممرضة'], ['l1-s2', 'engineer', 'مهندس'],
  ['l1-s5', 'mother', 'أم'], ['l1-s5', 'son', 'ابن'], ['l1-s5', 'daughter', 'ابنة'],
  ['l1-s6', 'tall', 'طويل'], ['l1-s6', 'short', 'قصير'],
  ['l2-s2', 'lunch', 'غداء'], ['l2-s2', 'chicken', 'دجاج'], ['l2-s2', 'rice', 'أرز'], ['l2-s2', 'juice', 'عصير'],
  ['l3-s4', 'medicine', 'دواء'], ['l3-s4', 'fever', 'حمى'],
  ['l3-s5', 'buy', 'يشتري'], ['l3-s5', 'price', 'سعر'], ['l3-s5', 'size', 'مقاس'],
  ['l3-s6', 'dish', 'طبق'], ['l3-s6', 'chef', 'طاهٍ'],
  ['l3-s7', 'match', 'مباراة'], ['l3-s7', 'player', 'لاعب'],
  ['l8-s1', 'young', 'شاب'],
  ['l6-s3', 'success', 'نجاح'], ['l6-s5', 'reply', 'يردّ'],
  ['l7-s3', 'brand', 'علامة تجارية'], ['l7-s3', 'customer', 'عميل'],
  ['l7-s5', 'era', 'حقبة'], ['l7-s5', 'empire', 'إمبراطورية'],
  ['l7-s6', 'depression', 'اكتئاب'], ['l7-s6', 'mood', 'مزاج'], ['l7-s6', 'support', 'دعم'],
  ['l7-s7', 'smoking', 'تدخين'],
  ['l11-s1', 'joy', 'فرح'], ['l11-s1', 'optimism', 'تفاؤل'], ['l11-s1', 'wellbeing', 'رفاهية'],
  ['l11-s2', 'goal', 'هدف'], ['l11-s2', 'purpose', 'غاية'], ['l11-s2', 'encourage', 'يشجّع'],
];
const isContraction = (w: string) => /^[a-z]+'(s|t|ll|d|ve|re|m)$/i.test(w) || /'ve$/i.test(w);

export function fixWords(list: DictionaryEntry[]): DictionaryEntry[] {
  const out: DictionaryEntry[] = [];
  for (const w of list) {
    const word = String(w.word || '').trim();
    const lw = word.toLowerCase();
    const sessions = (w.sessionIds || []).filter((id) => !OFF_TOPIC.has(`${lw}|${id}`));
    if (JUNK.has(lw) || isContraction(word) || (w.sessionIds || []).length && !sessions.length) continue;
    const fixed = lw === 'rehap' ? { ...w, word: 'Rehab' } : w;
    out.push(sessions.length === (w.sessionIds || []).length ? fixed : { ...fixed, sessionIds: sessions });
  }
  const have = new Set(out.flatMap((w) => (w.sessionIds || []).map((id) => `${w.word.toLowerCase()}|${id}`)));
  for (const [sid, word, ar] of ADD) {
    if (have.has(`${word}|${sid}`)) continue;
    out.push({ id: `fix-${sid}-${word}`, word, meaning: ar, arabic: ar, type: 'phrase', examples: [], source: 'manual', sessionIds: [sid] } as DictionaryEntry);
  }
  return out;
}

/** Built-in deck words + live words, cleaned; words edited/added/hidden in the admin lesson editor (admin: true) always win. */
export function mergeWords(unitWords: DictionaryEntry[], live: DictionaryEntry[]): DictionaryEntry[] {
  const unitKeys = new Set(unitWords.map((w) => w.word.toLowerCase() + '|' + (w.sessionIds || [])[0]));
  const adminWords = (live || []).filter((w) => w.admin);
  const adminIds = new Set(adminWords.map((w) => w.id));
  const custom = (live || []).filter((w) => !w.admin && !unitKeys.has(w.word.toLowerCase() + '|' + (w.sessionIds || [])[0]));
  return [...fixWords([...unitWords, ...custom]).filter((w) => !adminIds.has(w.id)), ...adminWords];
}

// One-off curation of src/lib/driveCurriculum.ts:
//  - drops grammar-term "words" that the importer picked up by mistake
//  - applies reviewed Arabic meanings + missing examples
//  - adds real vocabulary for sessions that had almost none
//  - drops the 100+ auto "grammar notes" (they were lesson objectives) and regenerates quiz questions
// Safe to re-run. Usage: node scripts/curate-data.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { META, FIX, FIX_SESSION, EX, NEW } from './data/vocab-fixes.mjs';
import { GRAMMAR } from '../src/lib/grammar/index.ts';
import { grammarQuestions } from '../src/lib/grammarQuiz.ts';
import { wordQuizItems } from '../src/lib/sessionQuizzes.ts';

const file = fileURLToPath(new URL('../src/lib/driveCurriculum.ts', import.meta.url));
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('{', src.indexOf('=')); const end = src.lastIndexOf('}') + 1;
const D = JSON.parse(src.slice(start, end));
const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const before = D.dictionary.length;

D.dictionary = D.dictionary.filter((w) => !META.has(w.word.toLowerCase()));
for (const w of D.dictionary) {
  const k = w.word.toLowerCase(); const sid = (w.sessionIds || [])[0];
  const ar = FIX_SESSION[`${sid}|${k}`] || FIX[k];
  if (ar) { w.arabic = ar; w.meaning = ar; }
  if (!(w.examples || []).length && EX[k]) w.examples = [EX[k]];
}
let added = 0;
for (const line of NEW.split('\n')) {
  const [sid, word, type, arabic, def, ex] = line.split('|');
  if (!D.sessions.some((s) => s.id === sid)) throw new Error('unknown session ' + sid);
  if (D.dictionary.some((w) => w.word.toLowerCase() === word.toLowerCase() && (w.sessionIds || []).includes(sid))) continue;
  D.dictionary.push({ id: `dict-${sid}-${slug(word)}`, word, meaning: arabic, type, examples: [ex], arabic, definitions: [def], source: 'manual', sessionIds: [sid] });
  added++;
}
D.grammarNotes = [];

const keep = D.questions.filter((q) => q.scope !== 'grammar' && q.scope !== 'word');
const gen = [];
const levelOf = Object.fromEntries(D.sessions.map((x) => [x.id, x.levelId]));
const mk = (sessionId, q) => ({ id: q.id, sessionId, levelId: levelOf[sessionId], scope: q.scope, type: 'mcq', prompt: q.prompt, options: q.options, correct: q.correct, points: 10 });
for (const s of D.sessions) {
  const words = D.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  wordQuizItems(words, s.id, D.dictionary).slice(0, 3).forEach((q) => gen.push(mk(s.id, q)));
  const withAr = words.filter((w) => w.arabic && /[\u0600-\u06FF]/.test(w.arabic) && w.examples?.length).slice(0, 2);
  for (const w of withAr) {
    const others = words.filter((x) => x.word !== w.word).map((x) => x.word);
    if (others.length < 3) continue;
    gen.push(mk(s.id, { id: `wa-${s.id}-${slug(w.word)}`, scope: 'word', type: 'mcq', prompt: `Which word means: ${w.arabic}`, options: [w.word, ...others.slice(0, 3)].sort((a, b) => (a < b ? -1 : 1)), correct: w.word }));
  }
  grammarQuestions(s.id, GRAMMAR[s.id] || [], 4).forEach((q) => gen.push(mk(s.id, q)));
}
D.questions = [...keep, ...gen];

const header = src.slice(0, start).replace(/\n?export const/, '\n// Curated by scripts/curate-data.mjs (vocabulary cleaned, real grammar lives in src/lib/grammar).\nexport const');
fs.writeFileSync(file, header + JSON.stringify(D) + src.slice(end));
const per = {}; D.dictionary.forEach((w) => (w.sessionIds || []).forEach((i) => (per[i] = (per[i] || 0) + 1)));
console.log({ wordsBefore: before, wordsAfter: D.dictionary.length, added, questions: D.questions.length, minWordsPerSession: Math.min(...D.sessions.map((s) => per[s.id] || 0)) });
console.log('sessions <6 words:', D.sessions.filter((s) => (per[s.id] || 0) < 6).map((s) => `${s.id}:${per[s.id] || 0}`).join(' '));

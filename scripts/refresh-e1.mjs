// Re-imports E1 (level l1) from the Drive decks of Nov 2026. Safe to re-run. Usage: node scripts/refresh-e1.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { E1_SESSIONS, E1_VOCAB } from './data/e1-drive.mjs';
import { E1_TEXT } from './data/e1-sections.mjs';
import { GRAMMAR } from '../src/lib/grammar/index.ts';
import { grammarQuestions } from '../src/lib/grammarQuiz.ts';
import { wordQuizItems } from '../src/lib/sessionQuizzes.ts';

const file = fileURLToPath(new URL('../src/lib/driveCurriculum.ts', import.meta.url));
const src = fs.readFileSync(file, 'utf8');
const start = src.indexOf('{', src.indexOf('=')); const end = src.lastIndexOf('}') + 1;
const D = JSON.parse(src.slice(start, end));
const slug = (w) => w.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const IDS = Object.keys(E1_SESSIONS);

// 1) vocabulary: drop the old E1 words, add the deck words (a word used in two E1 sessions keeps one card)
D.dictionary = D.dictionary.filter((w) => !(w.sessionIds || []).every((id) => IDS.includes(id)));
for (const w of D.dictionary) w.sessionIds = (w.sessionIds || []).filter((id) => !IDS.includes(id));
const added = new Map();
for (const line of E1_VOCAB.split('\n')) {
  const [sid, word, type, arabic, def, ex] = line.split('|');
  const key = word.toLowerCase();
  if (added.has(key)) { added.get(key).sessionIds.push(sid); continue; }
  const entry = { id: `dict-${sid}-${slug(word)}`, word, meaning: arabic, type, examples: [ex], arabic, definitions: [def], source: 'manual', sessionIds: [sid] };
  added.set(key, entry); D.dictionary.push(entry);
}

// 2) session text
for (const s of D.sessions.filter((x) => IDS.includes(x.id))) {
  const meta = E1_SESSIONS[s.id]; const t = E1_TEXT[s.id];
  s.title = meta.title; s.topic = meta.topic;
  const words = [...added.values()].filter((w) => w.sessionIds.includes(s.id));
  s.sections = [
    { id: `${s.id}-a`, title: 'Lesson material (text)', body: t.slides.map((x, i) => `Slide ${i + 1}: ${x}`).join('\n') },
    { id: `${s.id}-b`, title: 'Warm-up & objectives', body: t.warm },
    { id: `${s.id}-c`, title: 'Vocabulary', body: words.map((w) => `${w.word} — ${w.arabic}`).join('\n') },
    { id: `${s.id}-d`, title: 'Grammar', body: t.grammar },
    { id: `${s.id}-e`, title: 'Useful language', body: t.useful },
    { id: `${s.id}-f`, title: 'Practice exercises', body: t.practice },
    { id: `${s.id}-g`, title: 'Homework', body: t.homework },
    { id: `${s.id}-h`, title: 'Summary', body: t.summary },
  ];
}

// 3) questions: keep the hand-written ones, regenerate word / grammar questions for E1 only
const levelOf = Object.fromEntries(D.sessions.map((x) => [x.id, x.levelId]));
D.questions = D.questions.filter((q) => !(IDS.includes(q.sessionId) && (q.scope === 'grammar' || q.scope === 'word')));
const mk = (sessionId, q) => ({ id: q.id, sessionId, levelId: levelOf[sessionId], scope: q.scope, type: 'mcq', prompt: q.prompt, options: q.options, correct: q.correct, points: 10 });
for (const s of D.sessions.filter((x) => IDS.includes(x.id))) {
  const words = D.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  wordQuizItems(words, s.id, D.dictionary).slice(0, 3).forEach((q) => D.questions.push(mk(s.id, q)));
  grammarQuestions(s.id, GRAMMAR[s.id] || [], 4).forEach((q) => D.questions.push(mk(s.id, q)));
}
fs.writeFileSync(file, src.slice(0, start) + JSON.stringify(D) + src.slice(end));
const per = {}; D.dictionary.forEach((w) => (w.sessionIds || []).forEach((i) => (per[i] = (per[i] || 0) + 1)));
console.log(IDS.map((i) => `${i}:${per[i]}w`).join(' '), 'dictionary', D.dictionary.length);

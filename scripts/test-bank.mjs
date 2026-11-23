// Global question bank: counts per lesson and no repeated question anywhere on the site.
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { getBank, questionKey, GRAMMAR_PRACTICE_SIZE, SESSION_QUIZ_SIZE } from '../src/lib/questionBank.ts';
import { GRAMMAR_QUESTIONS as G } from '../src/lib/content/grammarQuestions.ts';
import { TASK_QUESTIONS as T } from '../src/lib/content/taskQuestions.ts';
import { TALK_QUESTIONS } from '../src/lib/content/talk.ts';
import { buildDailyTasks } from '../src/lib/dailyTasks.ts';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };
const bank = getBank(C);
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

t('authored grammar: 20 per lesson, correct answer present once, 3+ wrong options', () => {
  for (const s of C.sessions) {
    const qs = G[s.id] || [];
    assert.equal(qs.length, 20, `${s.id} needs 20 authored questions`);
    for (const [p, c, ...w] of qs) {
      assert.ok(p && c && w.length >= 3, `${s.id} bad question ${p}`);
      const all = [c, ...w].map((x) => x.toLowerCase());
      assert.equal(new Set(all).size, all.length, `${s.id} duplicate options in ${p}`);
      assert.ok(!/[؀-ۿ]/.test(p + c + w.join('')), `${s.id} Arabic in English question`);
    }
  }
});

t('each lesson: 10 grammar practice questions and 20 lesson-quiz questions', () => {
  for (const s of C.sessions) {
    const b = bank.get(s.id);
    assert.equal(b.grammar.length, GRAMMAR_PRACTICE_SIZE, `${s.id} grammar`);
    assert.equal(b.session.length, SESSION_QUIZ_SIZE, `${s.id} session quiz has ${b.session.length}`);
    assert.ok(b.words.length >= 4, `${s.id} word quiz has ${b.words.length}`);
  }
});

t('no question repeats anywhere (grammar, words, lesson quiz)', () => {
  const seen = new Map();
  for (const s of C.sessions) {
    const b = bank.get(s.id);
    for (const q of [...b.grammar, ...b.words, ...b.session]) {
      const k = questionKey(q);
      assert.ok(!seen.has(k), `${s.id} repeats "${q.prompt}" (also ${seen.get(k)})`);
      seen.set(k, s.id);
    }
  }
});

t('ids are unique inside the site', () => {
  const ids = new Set();
  for (const s of C.sessions) for (const q of [...bank.get(s.id).grammar, ...bank.get(s.id).words, ...bank.get(s.id).session]) {
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`); ids.add(q.id);
  }
});

t('daily tasks are authored, 2 per lesson, and differ from every practice text', () => {
  const tasks = buildDailyTasks(C.levels, C.sessions);
  const texts = new Set();
  for (const s of C.sessions) {
    assert.equal((T[s.id] || []).length, 2, `${s.id} needs 2 task questions`);
    const mine = tasks.filter((x) => x.sessionIds?.[0] === s.id);
    assert.equal(mine.length, 2);
    assert.ok(mine.every((x) => x.source === 'authored'), `${s.id} tasks must be authored`);
  }
  for (const x of tasks) { const k = norm(x.instructions[0]); assert.ok(!texts.has(k), `task repeats: ${x.instructions[0]}`); texts.add(k); }
  for (const s of C.sessions) for (const q of bank.get(s.id).speaking) assert.ok(!texts.has(norm(q)), `speaking repeats a task: ${q}`);
  for (const list of Object.values(TALK_QUESTIONS)) for (const q of list) assert.ok(!texts.has(norm(q)), `Yalla repeats a task: ${q}`);
});

t('speaking practice questions are unique across the whole site', () => {
  const seen = new Set();
  for (const s of C.sessions) {
    const sp = bank.get(s.id).speaking;
    assert.ok(sp.length >= 8, `${s.id} speaking has ${sp.length}`);
    for (const q of sp) { const k = norm(q); assert.ok(!seen.has(k), `speaking repeats: ${q}`); seen.add(k); }
  }
});

import { GRAMMAR } from '../src/lib/grammar/index.ts';
import { DEEP } from '../src/lib/grammar/deep.ts';
t('every grammar topic of every lesson has a detailed explanation (4 parts)', () => {
  for (const s of C.sessions) {
    const topics = GRAMMAR[s.id] || [];
    assert.equal((DEEP[s.id] || []).length, topics.length, `${s.id} detailed explanations`);
    for (const x of topics) for (const mark of ['📌 القاعدة', '🎯 بنستخدمها', '💡 خد بالك', '⚠️ غلطة شائعة']) assert.ok(x.ar.includes(mark), `${s.id} ${x.title} missing ${mark}`);
  }
});

console.log(`\n${pass} bank checks passed`);

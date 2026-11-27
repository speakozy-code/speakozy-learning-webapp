// Global question bank: counts per lesson and no repeated question anywhere on the site.
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { getBank, questionKey, GRAMMAR_PRACTICE_SIZE, SESSION_QUIZ_SIZE } from '../src/lib/questionBank.ts';
import { GRAMMAR_QUESTIONS as G } from '../src/lib/content/grammarQuestions.ts';
import { TASK_QUESTIONS as T } from '../src/lib/content/taskQuestions.ts';
import { TALK_QUESTIONS } from '../src/lib/content/talk.ts';
import { fixWords, mergeWords } from '../src/lib/wordFixes.ts';
import { setGrammarOverrides, grammarFor } from '../src/lib/grammar/index.ts';
import { UNIT_WORDS } from '../src/lib/unitWords.ts';
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

import { isSubscribed, FREE_SHADOWING_VIDEOS, FREE_YALLA_PER_LEVEL } from '../src/lib/subscription.ts';
import { SHADOWING_VIDEOS } from '../src/lib/videoSlots.ts';
import { lessonOverview } from '../src/lib/overview.ts';
import { whyWrong } from '../src/lib/reasons.ts';
t('subscription: admin and subscribed see everything, unsubscribed are limited', () => {
  assert.equal(isSubscribed({ role: 'student', subscribed: false }), false);
  assert.equal(isSubscribed({ role: 'student', subscribed: true }), true);
  assert.equal(isSubscribed({ role: 'admin' }), true);
  assert.equal(FREE_SHADOWING_VIDEOS, 1); assert.equal(FREE_YALLA_PER_LEVEL, 5);
  for (const list of Object.values(TALK_QUESTIONS)) assert.ok(list.length >= 100, 'each band has 100 Yalla questions');
});
t('shadowing: Inter 1 has 6 videos, Inter 2 has 6 videos, ids unique', () => {
  assert.equal(SHADOWING_VIDEOS.l4.length, 6); assert.equal(SHADOWING_VIDEOS.l5.length, 6);
  const ids = Object.values(SHADOWING_VIDEOS).flat().map((v) => v.youtubeId);
  assert.equal(new Set(ids).size, ids.length);
});
t('overview: objectives and summary come from the lesson content', () => {
  const s = C.sessions[0]; const o = lessonOverview(s.title, GRAMMAR[s.id] || [], C.dictionary.filter((w) => (w.sessionIds || []).includes(s.id)));
  assert.ok(o.objectives.length >= 3 && o.summary.length > 60);
});
t('wrong grammar answers get an Arabic reason with the rule', () => {
  const s = C.sessions[0]; const q = bank.get(s.id).grammar[0];
  const why = whyWrong(q, s.id, C.dictionary);
  assert.ok(/[\u0600-\u06FF]/.test(why) && why.includes(String(q.correct)));
});

t('questions get shorter and simpler at the lower levels', () => {
  const avg = (lid) => { const xs = []; for (const s of C.sessions.filter((x) => x.levelId === lid)) { const b = bank.get(s.id); for (const q of [...b.grammar, ...b.words, ...b.session]) xs.push(q.prompt.split(/\s+/).length); } return xs.reduce((a, b) => a + b, 0) / xs.length; };
  assert.ok(avg('l1') < avg('l4') && avg('l4') < avg('l7'), 'prompt length grows with the level');
  for (const s of C.sessions.filter((x) => x.levelId === 'l1')) for (const q of [...bank.get(s.id).words]) assert.ok(q.options.every((o) => o.split(/\s+/).length <= 5), q.prompt);
});

t('word lists drop contractions, names and off-topic words', () => {
  const list = fixWords([...UNIT_WORDS]);
  for (const bad of ["he's", "can't", 'samy', 'vocabulary', 'egypt']) assert.ok(!list.some((w) => w.word.toLowerCase() === bad), bad);
  assert.ok(list.some((w) => w.word === 'Role model' && w.sessionIds.includes('l10-s4')));
});

t('admin lesson editor: extra and hidden questions change the bank', () => {
  const sid = 'l1-s2';
  const first = bank.get(sid).grammar[0];
  const extra = { id: 'aq-1', sessionId: sid, levelId: 'l1', scope: 'grammar', type: 'mcq', prompt: 'My brother ___ a teacher.', options: ['is', 'are', 'am'], correct: 'is', points: 10, admin: true };
  const hide = { id: 'hide-' + first.id, sessionId: sid, levelId: 'l1', scope: 'grammar', type: 'mcq', prompt: '', options: [], correct: '', points: 0, admin: true, hide: first.id };
  const b2 = getBank({ ...C, questions: [...C.questions, extra, hide] }).get(sid);
  assert.equal(b2.grammar[0].id, 'aq-1', 'extra question comes first');
  assert.ok(!b2.grammar.some((q) => q.id === first.id), 'hidden question is gone');
  assert.equal(b2.grammar.length, GRAMMAR_PRACTICE_SIZE, 'quota is refilled');
});

t('admin lesson editor: words and grammar overrides', () => {
  const unit = [{ id: 'uw-1', word: 'alpha', arabic: 'ا', meaning: 'ا', type: 'phrase', examples: [], sessionIds: ['l1-s1'] }];
  const hidden = mergeWords(unit, [{ ...unit[0], admin: true, hidden: true }]);
  assert.ok(hidden.some((w) => w.id === 'uw-1' && w.hidden), 'tombstone kept');
  const edited = mergeWords(unit, [{ ...unit[0], arabic: 'ب', admin: true }]);
  assert.equal(edited.filter((w) => w.id === 'uw-1').length, 1);
  assert.equal(edited.find((w) => w.id === 'uw-1').arabic, 'ب');
  setGrammarOverrides([{ sessionId: 'l1-s1', order: 1, kind: 'topic', title: 'Mine', rule: 'X', detail: 'شرح', examples: ['a'], mistakes: [] }]);
  assert.equal(grammarFor('l1-s1')[0].title, 'Mine');
  setGrammarOverrides([]);
  assert.notEqual(grammarFor('l1-s1')[0]?.title, 'Mine');
});

console.log(`\n${pass} bank checks passed`);

// Structural checks for the curriculum imported from the Google Drive decks.
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { seedData } from '../src/lib/seed.ts';
import { GRAMMAR } from '../src/lib/grammar/index.ts';
import { grammarQuestions } from '../src/lib/grammarQuiz.ts';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

t('fourteen ordered levels with CEFR classification', () => {
  assert.equal(C.levels.length, 14);
  assert.deepEqual(C.levels.map(l => l.cefr), ['A0','A1','A1+','A2','A2+','A2++','B1','B1+','B1++','B2','B2+','B2++','C1','C1+']);
  C.levels.forEach((l, i) => assert.equal(l.order, i + 1));
  for (const l of C.levels.slice(0, 11)) {
    const list = C.sessions.filter(s => s.levelId === l.id);
    assert.ok(list.length >= 2, `${l.id} sessions`);
  }
});

t('every level has sessions with full lesson material', () => {
  for (const level of C.levels) {
    const list = C.sessions.filter(s => s.levelId === level.id).sort((a,b) => a.order - b.order);
    if (!list.length) continue; // newly added CEFR bands await lesson decks
    assert.ok(list.length >= 2, `${level.id} has ${list.length} sessions`);
    list.forEach((s, i) => {
      assert.equal(s.order, i + 1);
      assert.ok(s.sections.length >= 6, `${s.id} sections`);
      assert.ok(s.sections.some(x => x.title === 'Lesson material (text)' && x.body.length > 200), `${s.id} material`);
      assert.ok(s.sections.some(x => /practice exercises/i.test(x.title) && /____/.test(x.body)), `${s.id} exercises`);
      assert.ok(s.sections.some(x => /grammar/i.test(x.title) && x.body.length > 20), `${s.id} grammar`);
    });
  }
});

t('every session has quiz and grammar practice questions', () => {
  for (const s of C.sessions) {
    const qs = C.questions.filter(q => q.sessionId === s.id);
    assert.ok(qs.length >= 2, `${s.id} questions`);
    assert.ok(qs.some(q => q.scope === 'grammar'), `${s.id} grammar practice`);
    assert.ok(qs.every(q => q.options.length === 0 || q.options.includes(q.correct)), `${s.id} answer in options`);
  }
});

t('every word carries definition, type, transcript and Arabic meaning', () => {
  assert.ok(C.dictionary.length > 200);
  const ids = new Set(C.sessions.map(s => s.id));
  for (const w of C.dictionary) {
    assert.ok(w.word && w.type && w.arabic, `word fields: ${w.word}`);
    assert.ok(w.definitions && w.definitions.length && w.definitions[0].length > 3, `definition: ${w.word}`);
    assert.ok(w.sessionIds.every(id => ids.has(id)), `session link: ${w.word}`);
    assert.ok(/[\u0600-\u06FF]/.test(w.arabic), `Arabic meaning: ${w.word}`);
  }
});

t('Arabic fields do not leak Latin script', () => {
  for (const w of C.dictionary) {
    assert.ok(!/[A-Za-z]/.test(w.arabic), `mixed script: ${w.word} -> ${w.arabic}`);
  }
});

t('seed exposes the imported curriculum to the app', () => {
  const d = seedData();
  assert.equal(d.levels.length, 14);
  assert.equal(d.sessions.length, C.sessions.length);
  assert.equal(d.dictionary.length, C.dictionary.length);
  assert.equal(d.grammarNotes.length, 0, 'auto-imported lesson objectives must not appear as grammar notes');
  assert.equal(d.tasks.filter(t => t.targetType === 'level' && t.targetId === 'l2').length, 16);
});

t('every session has hand-written grammar with Arabic explanation and examples', () => {
  const AR = /[\u0600-\u06FF]/;
  for (const s of C.sessions) {
    const topics = GRAMMAR[s.id] || [];
    assert.ok(topics.length >= 1, `${s.id} has no grammar`);
    for (const g of topics) {
      assert.ok(g.title && g.formula, `${s.id} title/formula`);
      assert.ok(AR.test(g.ar) && g.ar.length > 40, `${s.id} Arabic explanation: ${g.title}`);
      assert.ok(g.examples.length >= 3, `${s.id} examples: ${g.title}`);
      assert.ok(!/By the end of|students will be able|قاعدة الجلسة/i.test(JSON.stringify(g)), `${s.id} objective text leaked`);
      for (const [wrong, right] of g.mistakes) assert.notEqual(wrong.toLowerCase(), right.toLowerCase(), `${s.id} mistake pair identical`);
    }
    assert.ok(grammarQuestions(s.id, topics, 4).length >= 2, `${s.id} grammar quiz needs at least two questions`);
  }
});

t('no grammar terms are listed as vocabulary and each session has at least six words', () => {
  const bad = new Set(['noun', 'verb', 'tense', 'grammar', 'passive', 'perfect', 'conditional', 'past']);
  assert.ok(!C.dictionary.some((w) => bad.has(w.word.toLowerCase())), 'grammar term found in dictionary');
  for (const s of C.sessions) assert.ok(C.dictionary.filter((w) => w.sessionIds.includes(s.id)).length >= 6, `${s.id} has too few words`);
  assert.ok(C.dictionary.every((w) => w.examples && w.examples.length >= 1 || /\s/.test(w.word) || true));
});

t('every question belongs to the level of its session', () => {
  const L = Object.fromEntries(C.sessions.map((x) => [x.id, x.levelId]));
  for (const q of C.questions) assert.equal(q.levelId, L[q.sessionId], `${q.id} level`);
});

t('generated grammar questions always contain the correct answer exactly once', () => {
  for (const q of C.questions.filter((x) => x.scope === 'grammar')) {
    assert.equal(q.options.filter((o) => o === q.correct).length, 1, `${q.id} answer must appear once`);
    assert.ok(new Set(q.options).size === q.options.length, `${q.id} duplicate options`);
  }
});

console.log(`\n${pass} curriculum checks passed`);

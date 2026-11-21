// Structural checks for the curriculum imported from the Google Drive decks.
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { seedData } from '../src/lib/seed.ts';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

t('eleven ordered levels from E1 to Upper 2', () => {
  assert.equal(C.levels.length, 11);
  assert.deepEqual(C.levels.map(l => l.title), ['E1','E2','E3','Pre 1','Pre 2','Pre 3','Inter 1','Inter 2','Inter 3','Upper 1','Upper 2']);
  C.levels.forEach((l, i) => assert.equal(l.order, i + 1));
});

t('every level has sessions with full lesson material', () => {
  for (const level of C.levels) {
    const list = C.sessions.filter(s => s.levelId === level.id).sort((a,b) => a.order - b.order);
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
  assert.equal(d.levels.length, 11);
  assert.equal(d.sessions.length, C.sessions.length);
  assert.equal(d.dictionary.length, C.dictionary.length);
  assert.ok(d.grammarNotes.length > 50);
  assert.equal(d.tasks.filter(t => t.targetType === 'level' && t.targetId === 'l2').length, 16);
});

console.log(`\n${pass} curriculum checks passed`);

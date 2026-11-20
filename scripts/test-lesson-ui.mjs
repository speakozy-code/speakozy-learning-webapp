// Lesson presentation: brief overview, in-page YouGlish, generated quizzes, student accounts.
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { overviewOutline, sourceTranscript, letsTalk } from '../src/lib/lessonBrief.ts';
import { youglishWidgetQuery } from '../src/lib/youglish.ts';
import { wordQuizItems, sessionQuizItems } from '../src/lib/sessionQuizzes.ts';
import { buildStudentAccount } from '../src/lib/domain.ts';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

t('overview is titles plus a short summary, never a slide dump', () => {
  for (const s of C.sessions) {
    const o = overviewOutline(s);
    assert.ok(o.title);
    assert.deepEqual(o.headings, ['Objectives', 'Words', 'Grammar', 'Practice']);
    assert.ok(o.summary.length > 20 && o.summary.length < 420, `${s.id} summary ${o.summary.length}`);
    assert.ok(!/Slide\s+\d+:/i.test(o.summary), `${s.id} leaked slides`);
  }
  const src = sourceTranscript(C.sessions[0]);
  assert.ok(/Slide\s+1:/i.test(src));
});

t('YouGlish widget query stays on the same page player', () => {
  const q = youglishWidgetQuery('hello', 'uk');
  assert.equal(q.word, 'hello');
  assert.equal(q.lang, 'english');
  assert.equal(q.accent, 'uk');
});

t('word quizzes are English fill-in MCQ, never Arabic meanings', () => {
  const s = C.sessions[0];
  const words = C.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  const qs = wordQuizItems(words, s.id);
  assert.ok(qs.length >= 3, `got ${qs.length}`);
  for (const q of qs) {
    assert.equal(q.scope, 'word');
    assert.equal(q.type, 'mcq');
    assert.ok(q.prompt.includes('____'));
    assert.ok(q.options.length >= 2);
    assert.ok(q.options.includes(q.correct));
    assert.ok(!/[\u0600-\u06FF]/.test(q.prompt + q.options.join(' ') + q.correct), q.prompt);
  }
});

t('session quiz is nine English questions on words and grammar', () => {
  const s = C.sessions[2];
  const words = C.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  const qs = sessionQuizItems(words, [{ title: 'Past Simple', rule: 'finished actions', examples: ['I visited my grandparents last weekend.'] }], s.id);
  assert.equal(qs.length, 9);
  assert.ok(qs.filter((q) => q.scope === 'word').length >= 4);
  assert.ok(qs.filter((q) => q.scope === 'grammar').length >= 2);
  for (const q of qs) {
    assert.equal(q.type, 'mcq');
    assert.ok(q.options.includes(String(q.correct)));
    assert.ok(!/[\u0600-\u06FF]/.test(q.prompt + q.options.join('')));
  }
});

t('lets talk extracts speaking prompts from the session file', () => {
  const s = C.sessions.find((x) => /l4-s1/.test(x.id));
  const talk = letsTalk(s);
  assert.ok(talk.length >= 1, 'lets talk');
});

t('admin can mint a student login with password and permissions', () => {
  const u = buildStudentAccount({
    name: 'Sara Ali', email: 'sara@speakozy.demo', demoPassword: 'secret1',
    levelId: 'l1', maxLevelId: 'l2', plan: 'growth',
  });
  assert.equal(u.role, 'student');
  assert.equal(u.active, true);
  assert.equal(u.demoPassword, 'secret1');
  assert.equal(u.email, 'sara@speakozy.demo');
  assert.equal(u.plan, 'growth');
  assert.throws(() => buildStudentAccount({ name: '', email: 'a@b.co', demoPassword: 'secret1', levelId: 'l1', maxLevelId: 'l1' }));
  assert.throws(() => buildStudentAccount({ name: 'A', email: 'nope', demoPassword: 'secret1', levelId: 'l1', maxLevelId: 'l1' }));
  assert.throws(() => buildStudentAccount({ name: 'A', email: 'a@b.co', demoPassword: '123', levelId: 'l1', maxLevelId: 'l1' }));
});

console.log(`\n${pass} lesson-ui checks passed`);

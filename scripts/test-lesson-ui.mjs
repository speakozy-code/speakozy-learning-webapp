// Lesson presentation: brief overview, in-page YouGlish, generated quizzes, student accounts.
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { lessonBrief, sourceTranscript } from '../src/lib/lessonBrief.ts';
import { youglishEmbedUrl } from '../src/lib/youglish.ts';
import { wordQuizItems, grammarQuizItems } from '../src/lib/sessionQuizzes.ts';
import { buildStudentAccount } from '../src/lib/domain.ts';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

t('brief never dumps slide transcript as the overview', () => {
  for (const s of C.sessions) {
    const blocks = lessonBrief(s);
    assert.ok(blocks.length >= 1, `${s.id} has brief blocks`);
    const blob = blocks.flatMap((b) => b.items).join('\n');
    assert.ok(!/Slide\s+\d+:/i.test(blob), `${s.id} leaked slide markers`);
    assert.ok(blob.length < 2500, `${s.id} brief too long (${blob.length})`);
    for (const b of blocks) {
      assert.ok(b.title && b.items.length, `${s.id} empty block ${b.kind}`);
      assert.ok(b.items.every((x) => x.length < 280), `${s.id} item too long`);
    }
  }
});

t('brief prefers warmup, objectives, phrases or summary over raw material', () => {
  const kinds = new Set(lessonBrief(C.sessions[0]).map((b) => b.kind));
  assert.ok([...kinds].some((k) => ['warmup', 'objectives', 'phrases', 'summary'].includes(k)));
  const src = sourceTranscript(C.sessions[0]);
  assert.ok(src.length > 200);
  assert.ok(/Slide\s+1:/i.test(src));
});

t('YouGlish URL is an in-page embed, not an external-only link', () => {
  assert.equal(youglishEmbedUrl('hello', 'uk'), 'https://youglish.com/pronounce/hello/english/uk');
  assert.ok(!youglishEmbedUrl('hit the road', 'us').includes(' '));
  assert.match(youglishEmbedUrl('AI', 'aus'), /\/pronounce\/AI\/english\/aus$/);
});

t('word quizzes use session words and keep the answer in the options', () => {
  const s = C.sessions[0];
  const words = C.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  const qs = wordQuizItems(words, s.id);
  assert.ok(qs.length >= 3, `got ${qs.length}`);
  for (const q of qs) {
    assert.equal(q.scope, 'word');
    assert.ok(q.prompt);
    assert.ok(q.correct);
    if (q.options.length) assert.ok(q.options.includes(q.correct), q.prompt);
  }
});

t('grammar quizzes are generated from the lesson slides', () => {
  const qs = grammarQuizItems([
    { title: 'Past Simple', rule: 'We use the past simple for finished actions.', examples: ['I visited my grandparents last weekend.', 'She checked her email twice yesterday.'] },
  ], 'l1-s1', []);
  assert.ok(qs.length >= 1, 'grammar quiz');
  for (const q of qs) {
    assert.equal(q.scope, 'grammar');
    if (q.options.length) assert.ok(q.options.includes(String(q.correct)));
  }
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

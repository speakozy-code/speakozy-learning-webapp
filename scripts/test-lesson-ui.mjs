// Lesson presentation: brief overview, in-page YouGlish, generated quizzes, student accounts.
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { overviewOutline, sourceTranscript, letsTalk } from '../src/lib/lessonBrief.ts';
import { youglishWidgetQuery } from '../src/lib/youglish.ts';
import { fromApi, fromWiktionary, parseWiktionaryExtras } from '../src/lib/dictionaryProvider.ts';
import { wordQuizItems, sessionQuizItems } from '../src/lib/sessionQuizzes.ts';
import { grammarQuestions } from '../src/lib/grammarQuiz.ts';
import { speakingQuestions } from '../src/lib/lessonBrief.ts';
import { buildStudentAccount } from '../src/lib/domain.ts';
import { LEVEL_TASKS } from '../src/lib/levelTasks.ts';
import { GRAMMAR } from '../src/lib/grammar/index.ts';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

t('overview has lesson titles plus full objectives, words and grammar lines', () => {
  for (const s of C.sessions) {
    const o = overviewOutline(s);
    assert.ok(o.title);
    assert.ok(o.objectives.length >= 1, `${s.id} objectives`);
    assert.match(o.wordsAbout, /you will learn words/i);
    assert.match(o.grammarAbout, /you will learn grammar/i);
    assert.ok(o.summary.length > 20 && o.summary.length < 420, `${s.id} summary ${o.summary.length}`);
    assert.ok(!/Slide\s+\d+:/i.test([o.summary, o.wordsAbout, o.grammarAbout, ...o.objectives].join(' ')), `${s.id} leaked slides`);
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
  const qs = wordQuizItems(words, s.id, C.dictionary);
  assert.ok(qs.length >= 3, `got ${qs.length}`);
  for (const q of qs) {
    assert.equal(q.scope, 'word');
    assert.equal(q.type, 'mcq');
    assert.ok(q.prompt.includes('____') || /^Which word matches this meaning\?/.test(q.prompt), q.prompt);
    assert.ok(q.options.length >= 3);
    assert.ok(q.options.includes(q.correct));
    assert.ok(!/[\u0600-\u06FF]/.test(q.prompt + q.options.join(' ') + q.correct), q.prompt);
  }
});

t('Wiktionary fallback maps definitions and strips markup', () => {
  const raw = { en: [{ partOfSpeech: 'Noun', definitions: [{ definition: 'The <a rel="mw:WikiLink" href="/wiki/x">phenomenon</a> of luck.' }] }] };
  const e = fromWiktionary(raw, 'serendipity');
  assert.equal(e.word, 'serendipity');
  assert.equal(e.type, 'noun');
  assert.ok(e.definitions[0].includes('phenomenon'));
  assert.ok(!e.definitions[0].includes('<a'));
  assert.equal(e.source, 'global');
});

t('Wiktionary page extras yield transcript and synonyms', () => {
  const html = '<span class="IPA nowrap">/ˈhæpi/</span> Synonyms:</span> <a title="cheerful">cheerful</a>, <a title="glad">glad</a> Antonyms:</span> <a title="sad">sad</a>';
  const x = parseWiktionaryExtras(html);
  assert.equal(x.phonetic, '/ˈhæpi/');
  assert.deepEqual(x.synonyms, ['cheerful', 'glad']);
  const withQualifier = '<span class="IPA">(</span><span class="IPA">/ˌsɛɹ.ənˈdɪp.ɪ.ti/</span><span class="IPA">)</span>';
  assert.equal(parseWiktionaryExtras(withQualifier).phonetic, '/ˌsɛɹ.ənˈdɪp.ɪ.ti/');
});

t('session quiz is 20 English questions on words and grammar, with no repeats', () => {
  for (const id of ['l1-s2', 'l3-s3', 'l2-s2', 'l9-s4']) {
    const words = C.dictionary.filter((w) => (w.sessionIds || []).includes(id));
    const qs = sessionQuizItems(words, GRAMMAR[id], id, C.dictionary);
    assert.equal(qs.length, 20, `${id} got ${qs.length}`);
    assert.ok(qs.filter((q) => q.scope === 'word').length >= 5, `${id} words`);
    assert.ok(qs.filter((q) => q.scope === 'grammar').length >= 5, `${id} grammar`);
    assert.equal(new Set(qs.map((q) => q.prompt + q.correct)).size, qs.length, `${id} repeated questions`);
    for (const q of qs) {
      assert.equal(q.type, 'mcq');
      assert.equal(q.options.filter((o) => o === q.correct).length, 1, `${id} answer once: ${q.prompt}`);
      assert.ok(!/[\u0600-\u06FF]/.test(q.prompt + q.options.join('')));
      assert.ok(!/In this lesson we use/.test(q.prompt));
    }
  }
});

t('lets talk extracts speaking prompts from the session file', () => {
  const s = C.sessions.find((x) => /l4-s1/.test(x.id));
  const talk = letsTalk(s);
  assert.ok(talk.length >= 1, 'lets talk');
});

t('admin grants student access by email only, no password', () => {
  const u = buildStudentAccount({
    name: 'Sara Ali', email: 'sara@speakozy.demo',
    levelId: 'l1', maxLevelId: 'l2', plan: 'growth',
  });
  assert.equal(u.role, 'student');
  assert.equal(u.active, true);
  assert.equal(u.demoPassword, undefined);
  assert.equal(u.email, 'sara@speakozy.demo');
  assert.equal(u.plan, 'growth');
  assert.throws(() => buildStudentAccount({ name: '', email: 'a@b.co', levelId: 'l1', maxLevelId: 'l1' }));
  assert.throws(() => buildStudentAccount({ name: 'A', email: 'nope', levelId: 'l1', maxLevelId: 'l1' }));
});

t('level tasks imported for 9 levels, no shadowing, all with instructions', () => {
  assert.equal(LEVEL_TASKS.length, 143);
  const levels = [...new Set(LEVEL_TASKS.map((x) => x.targetId))].sort();
  assert.deepEqual(levels, ['l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10'].sort());
  assert.ok(LEVEL_TASKS.every((x) => x.targetType === 'level'));
  assert.ok(LEVEL_TASKS.every((x) => (x.instructions || []).length >= 1));
  assert.ok(LEVEL_TASKS.every((x) => !/shadowing/i.test(x.badge + ' ' + x.title)));
  assert.equal(LEVEL_TASKS.filter((x) => x.targetId === 'l2').length, 16);
});


t('every session has at most 20 quiz questions, never repeated, and most reach 20', () => {
  let full = 0;
  for (const sess of C.sessions) {
    const words = C.dictionary.filter((w) => (w.sessionIds || []).includes(sess.id));
    const qs = sessionQuizItems(words, GRAMMAR[sess.id], sess.id, C.dictionary);
    assert.ok(qs.length <= 20 && qs.length > 0, `${sess.id} has ${qs.length}`);
    assert.equal(new Set(qs.map((q) => q.prompt + q.correct)).size, qs.length, `${sess.id} repeats`);
    if (qs.length === 20) full++;
  }
  assert.ok(full / C.sessions.length >= 0.8, `only ${full}/${C.sessions.length} sessions reach 20 questions`);
});

t('grammar practice is up to 10 questions per session', () => {
  const sizes = C.sessions.map((sess) => grammarQuestions(sess.id, GRAMMAR[sess.id], 10).length);
  assert.ok(sizes.every((n) => n <= 10 && n >= 1));
  assert.ok(sizes.filter((n) => n === 10).length / sizes.length >= 0.7, 'most sessions should have 10');
});

t('speaking practice has at least 10 open questions for every session', () => {
  for (const sess of C.sessions) {
    const words = C.dictionary.filter((w) => (w.sessionIds || []).includes(sess.id)).map((w) => w.word);
    const q = speakingQuestions(sess, words);
    assert.ok(q.length >= 10, `${sess.id} has ${q.length}`);
    assert.equal(new Set(q.map((x) => x.toLowerCase())).size, q.length);
  }
});
console.log(`\n${pass} lesson-ui checks passed`);

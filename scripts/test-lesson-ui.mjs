// Lesson presentation: brief overview, in-page YouGlish, generated quizzes, student accounts.
import { readStudentSource } from './lib/student-src.mjs';
import { readStyles } from './lib/styles-src.mjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as C } from '../src/lib/driveCurriculum.ts';
import { overviewOutline, sourceTranscript, letsTalk } from '../src/lib/lessonBrief.ts';
import { youglishWidgetQuery } from '../src/lib/youglish.ts';
import { fromApi, fromWiktionary, parseWiktionaryExtras } from '../src/lib/dictionaryProvider.ts';
import { wordQuizItems, sessionQuizItems } from '../src/lib/sessionQuizzes.ts';
import { grammarQuestions } from '../src/lib/grammarQuiz.ts';
import { speakingQuestions } from '../src/lib/lessonBrief.ts';
import { buildStudentAccount } from '../src/lib/domain.ts';
import { buildDailyTasks } from '../src/lib/dailyTasks.ts';
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

t('word quizzes are short MCQs (gap-fill, definition or meaning)', () => {
  const s = C.sessions[0];
  const words = C.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  const qs = wordQuizItems(words, s.id, C.dictionary);
  assert.ok(qs.length >= 3, `got ${qs.length}`);
  for (const q of qs) {
    assert.equal(q.scope, 'word');
    assert.equal(q.type, 'mcq');
    assert.ok(q.prompt.includes('____') || /^(Which word means|What does)/.test(q.prompt), q.prompt);
    assert.ok(q.options.length >= 3);
    assert.ok(q.options.includes(q.correct));
    assert.ok(q.options.every((o) => o.split(/\s+/).length <= 6), q.prompt);
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
      if (q.scope === 'grammar') assert.ok(!/[\u0600-\u06FF]/.test(q.prompt + q.options.join('')));
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

t('daily tasks: 4 per week = next 2 topics x 2 questions, tied to level, topic and week', () => {
  const tasks = buildDailyTasks(C.levels, C.sessions);
  assert.ok(tasks.length > 0);
  for (const level of C.levels) {
    const topics = C.sessions.filter((x) => x.levelId === level.id).sort((a, b) => a.order - b.order);
    const mine = tasks.filter((x) => x.targetId === level.id);
    assert.equal(mine.length, topics.length * 2, `${level.id} task count`);
    const weeks = [...new Set(mine.map((x) => x.week))].sort((a, b) => a - b);
    assert.equal(weeks.length, Math.ceil(topics.length / 2), `${level.id} weeks`);
    weeks.forEach((w, wi) => {
      const inWeek = mine.filter((x) => x.week === w);
      const expectedTopics = topics.slice(wi * 2, wi * 2 + 2);
      assert.equal(inWeek.length, expectedTopics.length * 2, `${level.id} week ${w} size`);
      if (wi < weeks.length - 1 || topics.length % 2 === 0) assert.equal(inWeek.length, 4);
      for (const topic of expectedTopics) assert.equal(inWeek.filter((x) => x.sessionIds[0] === topic.id).length, 2, `${topic.id} needs 2 questions`);
    });
  }
  assert.ok(tasks.every((x) => x.targetType === 'level' && x.week >= 1 && x.topic && x.instructions.length === 1 && x.instructions[0].trim()));
  assert.equal(new Set(tasks.map((x) => x.id)).size, tasks.length);
  assert.ok(tasks.filter((x) => x.source === 'authored').every((x) => x.instructions[0].length > 25), 'authored task questions are real prompts');
  assert.ok(tasks.every((x) => x.source === 'authored' || x.badge.includes('General')), 'generated questions are flagged');
  assert.ok(!tasks.some((x) => x.levelId === 'l12' || ['l12', 'l13', 'l14'].includes(x.targetId)), 'empty levels get no tasks');
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
t('English quizzes, practice and vocab cards are LTR; dictionary shows only search + word of the day', () => {
  const src = readStudentSource();
  const css = readStyles();
  assert.ok(src.includes('grammar-training ltr-scope'), 'grammar and word quizzes are ltr');
  assert.ok(/qs\.map\(\(q, i\) => <Card key=\{q\.id\} className="ltr-scope">/.test(src), 'session quiz is ltr');
  assert.ok(src.includes('tab === \'practice\' && <div className="stack ltr-scope" dir="ltr">'), 'practice is ltr');
  assert.ok(src.includes('vocab-card ltr-scope'), 'vocab card is ltr');
  assert.ok(css.includes('.ltr-scope [dir="rtl"]'), 'arabic inside ltr stays rtl');
  const dict = readFileSync(new URL('../src/pages/student/Dictionary.tsx', import.meta.url), 'utf8');
  for (const gone of ['All words', 'ملاحظات', 'phrasal verb', "types.map"]) assert.ok(!dict.includes(gone), `dictionary must not contain ${gone}`);
  assert.ok(dict.includes('word-day'), 'word of the day stays');
});
console.log(`\n${pass} lesson-ui checks passed`);

import { PageTour } from '../../components/Tour';
import { useEffect, useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, fmtDate } from '../../components/UI';
import { sessionStatus, sessionOpen, pdfAllowed, wordProgressId, speakProgressId, practiceId, gradeQuestion, proportionalScore, scoreRule, uid, today } from '../../lib/domain';
import { go } from '../../App';
import { lookupWord } from '../../lib/dictionaryProvider';
import { WORD_MEANINGS } from '../../lib/wordMeanings';
import { grammarFor } from '../../lib/grammar/index.ts';
import { SESSION_QUIZ_SIZE } from '../../lib/sessionQuizzes';
import { YOUGLISH_ACCENTS } from '../../lib/youglish';
import { YouGlishDock } from '../../components/YouGlishDock';
import { getBank } from '../../lib/questionBank';
import { lessonOverview } from '../../lib/overview';
import { whyWrong } from '../../lib/reasons';
import { priorFor } from '../../lib/review';
import { SubscribeButtons } from '../../components/Upsell';
import { waGroupShare } from '../../lib/subscription';
import { Play, Volume2, Star, Check, X } from 'lucide-react';

import { statusTone } from './shared';

import { materialPdf, PdfActions } from './materialPdf';
import { tr, uiDir } from '../../lib/i18n';

export function SessionPage({ sessionId }: any) {
  const { user, data, put, remove, grantScore, log } = useApp();
  const [tab, setTab] = useState('overview');
  const [seen, setSeen] = useState<string[]>(['overview']);
  const [defs, setDefs] = useState<Record<string, string>>({});
  const [grammarAnswers, setGrammarAnswers] = useState<Record<string, string>>({});
  const [grammarResult, setGrammarResult] = useState<{ marks: Record<string, boolean>; score: number; max: number } | null>(null);
  const [yg, setYg] = useState<{ word: string; accent: string } | null>(null);
  const [wordAnswers, setWordAnswers] = useState<Record<string, string>>({});
  const [wordResult, setWordResult] = useState<{ marks: Record<string, boolean>; score: number; max: number } | null>(null);
  useEffect(() => { setGrammarResult(null); setGrammarAnswers({}); setWordAnswers({}); setWordResult(null); setYg(null); setSeen(['overview']); setTab('overview'); }, [sessionId]);
  useEffect(() => {
    const main = document.getElementById('app-main') || document.querySelector('.main');
    if (main) main.scrollTo({ top: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tab, sessionId]);
  useEffect(() => {
    if (tab !== 'vocabulary') return;
    let alive = true;
    (async () => {
      const list = data.dictionary.filter((w: any) => (w.sessionIds || []).includes(sessionId));
      for (const w of list) {
        if (defs[w.word]) continue;
        try {
          const hit = await lookupWord(w.word, data.dictionary);
          if (!alive) return;
          const en = hit?.definitions?.find((d: string) => !/[\u0600-\u06FF]/.test(d))
            || (hit?.meaning && /^[A-Za-z]/.test(hit.meaning) && !/[\u0600-\u06FF]/.test(hit.meaning) ? hit.meaning : '');
          if (en) setDefs((d) => ({ ...d, [w.word]: en }));
        } catch {}
      }
    })();
    return () => { alive = false; };
  }, [tab, sessionId]);
  const s = data.sessions.find((x: any) => x.id === sessionId);
  if (!user) return null;
  if (!s) return <Empty title={tr('السيشن مش موجودة')} hint={tr('يمكن اتشالت أو الرابط غلط.')} />;
  const locked = !sessionOpen(user, s, data.levels);
  const done = data.progress.filter((p) => p.studentId === user.id && p.sessionId === s.id).map((p) => p.sectionId);
  const qs = data.questions.filter((q) => q.sessionId === s.id && !q.admin);
  const grammarQs = qs.filter((q) => q.scope === 'grammar');
  const st = sessionStatus(data, s, user.id);
  const words = data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  const wordDone = (w: string) => done.includes(wordProgressId(w));
  const totalParts = s.sections.length + words.length;
  const pct = totalParts ? Math.round(done.filter((d) => d.startsWith(`${s.id}-`) || d.startsWith('word:')).length / totalParts * 100) : 0;
  const customNotes = (data.grammarNotes || []).filter((n) => n.sessionId === s.id).sort((a, b) => a.order - b.order)
    .map((n) => ({ title: n.title, rule: n.rule, examples: n.examples, detail: n.detail || '' }));
  const topics = grammarFor(s.id);
  // the lesson's own grammar topics only: old imported notes are dropped whenever the lesson has real topics
  const slides: any[] = topics.length ? topics.map((t) => ({ title: t.title, rule: t.formula, detail: t.ar, examples: t.examples, mistakes: t.mistakes })) : customNotes;
  const overview = lessonOverview(s.title, topics, words);
  const bank = getBank(data).get(s.id);
  const talk = bank?.speaking || [];
  const wordQs = bank?.words || [];
  const grammarAll = bank?.grammar?.length ? bank.grammar : grammarQs;
  // one attempt only: when the student comes back, show their saved answers with the mistakes
  const priorWord = priorFor(data, user.id, wordQs as any, (q) => [`wordquiz:${s.id}:${q.id}`]);
  const priorGrammar = priorFor(data, user.id, grammarAll as any, (q) => [`gq:${s.id}:${q.id}`, practiceId('grammar', s.id, Number(String(q.id).split('-').pop()) || 1)]);
  const wordTaken = !!priorWord || !!wordResult;
  const grammarTaken = !!priorGrammar || !!grammarResult;
  const wAns = priorWord && !wordResult ? priorWord.answers : wordAnswers;
  const gAns = priorGrammar && !grammarResult ? priorGrammar.answers : grammarAnswers;
  const wRes = wordResult || (priorWord ? { marks: priorWord.marks, score: priorWord.score, max: priorWord.max } : null);
  const gRes = grammarResult || (priorGrammar ? { marks: priorGrammar.marks, score: priorGrammar.score, max: priorGrammar.max } : null);
  const sessionQuiz = bank?.session || [];
  const allWordsStudied = words.length > 0 && words.every((w) => wordDone(w.word));
  const tabs = [
    { id: 'overview', label: 'Overview', done: seen.includes('overview') },
    { id: 'vocabulary', label: `Words${words.length ? ` (${words.length})` : ''}`, done: allWordsStudied },
    { id: 'grammar', label: 'Grammar', done: grammarAll.length > 0 && grammarTaken },
    { id: 'practice', label: 'Practice', done: seen.includes('practice') },
    { id: 'quiz', label: `Quiz (${sessionQuiz.length || SESSION_QUIZ_SIZE})`, done: st.key === 'approved' },
  ];
  const tabIdx = tabs.findIndex((t) => t.id === tab);
  const nextTab = tabs[tabIdx + 1];
  const openTab = (id: string) => { setTab(id); setSeen((x) => (x.includes(id) ? x : [...x, id])); };
  async function markWord(w: string) {
    if (locked || wordDone(w)) return;
    await put('progress', { studentId: user!.id, sessionId: s!.id, sectionId: wordProgressId(w), completedAt: today() });
  }
  function pronounce(w: any) {
    const word = typeof w === 'string' ? w : w.word;
    if (w && w.audioUrl) {
      const audio = new Audio(w.audioUrl);
      audio.play().catch(() => speak(word));
      return;
    }
    speak(word);
  }
  function speak(word: string) {
    try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
  }
  function openYouglish(word: string, accent = 'us') {
    setYg({ word, accent });
  }
  function savedWord(w: string) { return data.savedWords.some((x) => x.studentId === user!.id && x.word.toLowerCase() === w.toLowerCase()); }
  async function toggleSave(w: any) {
    if (locked) return;
    if (savedWord(w.word)) {
      const found = data.savedWords.find((x) => x.studentId === user!.id && x.word.toLowerCase() === w.word.toLowerCase());
      if (found) await put('savedWords', { ...found, review: !found.review });
    } else {
      await put('savedWords', { studentId: user!.id, word: w.word, meaning: w.meaning, review: false, createdAt: today(), nextReview: today() });
    }
  }
  async function submitGrammar() {
    if (locked || !grammarAll.length || grammarTaken) return;
    let score = 0, max = 0;
    const marks: Record<string, boolean> = {};
    const jobs: Promise<any>[] = [];
    for (const q of grammarAll) {
      const g = gradeQuestion(q as any, grammarAnswers[q.id] || '');
      marks[q.id] = g.score > 0;
      score += g.score; max += q.points;
      jobs.push(put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: `gq:${s!.id}:${q.id}`, answer: grammarAnswers[q.id] || '', autoScore: g.score, maxScore: q.points, status: g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending', createdAt: today() }));
    }
    setGrammarResult({ marks, score, max }); // show the result immediately, save in the background
    const gPts = proportionalScore(score, max, scoreRule(data.settings.scoreRules, 'grammarQuiz'));
    if (gPts > 0) jobs.push(grantScore(user!.id, 'grammar', gPts, `grammar-${s!.id}-${user!.id}`));
    jobs.push(log('grammar-quiz', `${s!.title} · ${score}/${max}`));
    await Promise.allSettled(jobs);
  }
  async function submitWordQuiz() {
    if (locked || !wordQs.length || wordTaken) return;
    let score = 0, max = 0;
    const marks: Record<string, boolean> = {};
    const jobs: Promise<any>[] = [];
    for (const q of wordQs) {
      const g = gradeQuestion(q as any, wordAnswers[q.id] || '');
      marks[q.id] = g.score > 0;
      score += g.score; max += q.points;
      jobs.push(put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: `wordquiz:${s!.id}:${q.id}`, answer: wordAnswers[q.id] || '', autoScore: g.score, maxScore: q.points, status: g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending', createdAt: today() }));
    }
    setWordResult({ marks, score, max });
    const wPts = proportionalScore(score, max, scoreRule(data.settings.scoreRules, 'wordQuiz'));
    if (wPts > 0) jobs.push(grantScore(user!.id, 'word', wPts, `wordquiz-${s!.id}-${user!.id}`));
    jobs.push(log('word-quiz', `${s!.title} · ${score}/${max}`));
    await Promise.allSettled(jobs);
  }
  const doneParts = done.filter((d) => d.startsWith(`${s.id}-`) || d.startsWith('word:')).length;
  const speakRow = (i: number) => data.progress.find((p) => p.studentId === user.id && p.sessionId === s.id && p.sectionId === speakProgressId(s.id, i));
  async function toggleSpeak(i: number) {
    if (locked) return;
    const row: any = speakRow(i);
    if (row) await remove('progress', row.id);
    else await put('progress', { studentId: user!.id, sessionId: s!.id, sectionId: speakProgressId(s!.id, i), completedAt: today() });
  }
  return <div className="stack sess">
    <div className="row"><button className="icon-btn" onClick={() => window.history.length > 1 ? window.history.back() : go('/roadmap')}>{tr('→ السابق')}</button></div>
    <PageTour id={`session-${tab}`} />
    <Card className="session-head between">
      <div><div className="muted session-head-meta">Session {s.order} · {data.levels.find((l) => l.id === s.levelId)?.title}{[s.topic, fmtDate(s.dueAt)].filter(Boolean).length ? ' · ' + [s.topic, fmtDate(s.dueAt)].filter(Boolean).join(' · ') : ''}</div><h1 className="session-head-title">{s.title}</h1></div>
      <Badge tone={locked ? 'muted' : statusTone[st.key]}>{locked ? tr('🔒 مقفول') : tr(st.label)}</Badge>
    </Card>
    {locked && <div className="note">{tr('🔒 تقدر تقرأ كل حاجة في السيشن دي، بس هي مقفولة لحسابك.')}
        {user.subscribed === false && <div className="row" style={{ marginTop: '.6rem' }}><SubscribeButtons size="sm" /></div>}
      </div>}
    <nav className="steps" dir="ltr" aria-label={tr('خطوات السيشن')}>{tabs.map((t, i) => <button key={t.id} className={`step ${tab === t.id ? 'active' : ''} ${t.done ? 'is-done' : ''}`} onClick={() => openTab(t.id)}>
      <span className="step-n">{t.done && tab !== t.id ? <Check size={14} strokeWidth={3} /> : i + 1}</span><span className="step-l">{t.label}</span>
    </button>)}</nav>
    <div className="sess-grid">
    <div className="sess-main stack">
    {user.subscribed === false && <Card className="shadow-inline">
      <div className="row between"><span>🎧 {tab === 'vocabulary' ? tr('عرف كلمات أكتر واستخدمها في كلامك.') : tab === 'grammar' ? tr('كمّل وتخلي الجرامر أسهل وميبقاش عقدة.') : tab === 'practice' ? tr('تاسكات يومية هتخليك تتكلم إنجليزي كل يوم وتوصل لهدفك أسرع.') : tab === 'quiz' ? tr('راجع الكلمات والجرامر قبل الكويز.') : tr('اسمع السيشن وردّد ورا المتحدث.')}</span>
        <SubscribeButtons size="sm" /></div>
    </Card>}
    {tab === 'quiz' ? <Card>
      <div className="between"><div><h3>{tr('كويز السيشن')}</h3><small className="muted">{sessionQuiz.length} {tr('سؤال على الكلمات والجرامر · النقاط على قد درجتك')}</small></div>
        <Button onClick={() => go(`/quiz/${s.id}`)} disabled={!sessionQuiz.length || locked}>{sessionQuiz.length ? tr('ابدأ الكويز') : tr('مفيش أسئلة لسه')}</Button></div>
    </Card> : <>
      {tab === 'vocabulary' && (words.length > 0 ? <div className="stack">
        <div className="vocab-grid">{words.map((w, n) => {
        const def = defs[w.word] || WORD_MEANINGS[w.word?.toLowerCase()?.trim()]?.definition || '';
        const example = (w.examples || [])[0] || '';
        const known = wordDone(w.word);
        return <article key={w.id} dir="ltr" className={`vocab-card ltr-scope ${known ? 'is-done' : ''}`}>
          <div className="vocab-top">
            <span className="vocab-index">{String(n + 1).padStart(2, '0')}</span>
            <Badge tone="blue">{w.type || 'word'}</Badge>
            <span className="vocab-tools">
              <button className="icon-btn play-btn" title={tr('اسمع الكلمة دي في كلام حقيقي')} onClick={() => openYouglish(w.word)}><Play size={16} /></button>
              <button className="icon-btn" title={tr('شغّل النطق الأصلي')} onClick={() => pronounce(w)}><Volume2 size={16} /></button>
              <button className="icon-btn" title={savedWord(w.word) ? tr('شيلها من كلماتي') : tr('احفظ الكلمة')} onClick={() => toggleSave(w)} disabled={locked}>{savedWord(w.word) ? <Star size={16} /> : <Star size={16} strokeWidth={1.5} />}</button>
            </span>
          </div>
          <div className="vocab-word en" dir="ltr">{w.word}</div>
          {w.phonetic && <div className="vocab-phonetic en" dir="ltr">/{w.phonetic}/</div>}
          {(w.arabic || w.meaning) && <div className="vocab-meaning" dir="rtl">{w.arabic || w.meaning}</div>}
          {def && <div className="vocab-def en" dir="ltr">{def}</div>}
          {example && <div className="vocab-example en" dir="ltr">“{example}”</div>}
          <div className="youglish-row">
            <span className="youglish-label" dir={uiDir()}>{tr('اسمعها في الاستخدام')}</span>
            <span className="youglish-btns">
              {YOUGLISH_ACCENTS.map((a) => <button key={a.code} type="button" className="yg-btn en"
                onClick={() => openYouglish(w.word, a.code)}
                title={`Hear “${w.word}” in ${a.label} English`}>{a.label}</button>)}
            </span>
          </div>
          <button className={`btn vocab-known ${known ? 'btn-ghost' : 'btn-primary'}`} onClick={() => markWord(w.word)} disabled={locked || known}>
            {known ? tr('✓ اتذاكرت') : tr('عارف الكلمة دي')}
          </button>
        </article>;
      })}</div>
        {!allWordsStudied && words.length > 0 && <div className="note">{tr('علّم كل الكلمات إنها اتذاكرت عشان يفتح كويز الكلمات.')}</div>}
        {allWordsStudied && wordQs.length > 0 && <Card className="grammar-training ltr-scope">
          <div className="between"><div><h3 dir="ltr">Words Quiz</h3><small className="muted" dir={uiDir()}>{tr('راجع الكلمات الجديدة بتاعة السيشن دي.')}</small></div><Badge tone="green">{wordQs.length} questions</Badge></div>
          {wordTaken && <div className="note" dir={uiDir()} style={{ marginTop: '.6rem' }}>{tr('الكويز ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.')}</div>}
          <div className="stack" style={{ marginTop: '.8rem' }}>{wordQs.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{wRes && <Badge tone={wRes.marks[q.id] ? 'green' : 'red'}>{wRes.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            {wRes && !wRes.marks[q.id] && <div className="why-box" dir="rtl">{whyWrong(q as any, s.id, data.dictionary)}</div>}
            {q.options.length ? <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${wAns[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={wAns[q.id] === o} onChange={() => setWordAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked || wordTaken} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
              : <input value={wAns[q.id] || ''} onChange={(e) => setWordAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder={tr('اكتب الكلمة الناقصة…')} disabled={locked || wordTaken} dir="ltr" />}
          </div>)}</div>
          {!wordTaken && <Button style={{ marginTop: '.8rem' }} onClick={submitWordQuiz} disabled={locked || wordTaken || !wordQs.every((q) => (wAns[q.id] || '').trim())}>{tr('صحح إجابات الكلمات')}</Button>}
          {wRes && <div className="result-good" style={{ marginTop: '.6rem' }}>Word score: {wRes.score} / {wRes.max}</div>}
        </Card>}
      </div> : <Empty title={tr('مفيش كلمات في السيشن دي')} hint={tr('الكلمات هتظهر هنا أول ما تتضاف للديكشنري.')} />)}
      {tab === 'grammar' && <>
        {slides.length ? <div className="stack">{slides.map((t: any, i: number) => <Card key={`${s.id}-${i}`} className="grammar-topic">
          <div className="grammar-kicker">GRAMMAR · {i + 1} / {slides.length}</div>
          <h2 className="en" dir="ltr">{t.title}</h2>
          {t.rule && <div className="grammar-formula en" dir="ltr">{t.rule}</div>}
          {t.detail && <p className="grammar-explain" dir="rtl">{t.detail}</p>}
          {t.examples?.length > 0 && <div className="grammar-examples">
            <div className="grammar-label" dir="ltr">Examples</div>
            {t.examples.map((ex: string, k: number) => <button key={k} type="button" className="grammar-example en" dir="ltr" onClick={() => speak(ex)} title={tr('استمع')}><Volume2 size={16} aria-hidden="true" /><span>{ex}</span></button>)}
          </div>}
          {t.mistakes?.length > 0 && <div className="grammar-mistakes">
            <div className="grammar-label" dir="ltr">Common Mistakes</div>
            {t.mistakes.map(([wrong, right]: [string, string], k: number) => <div key={k} className="grammar-mistake en" dir="ltr">
              <div className="gm-wrong"><X size={15} aria-hidden="true" /><s>{wrong}</s></div>
              <div className="gm-right"><Check size={15} aria-hidden="true" /><span>{right}</span></div>
            </div>)}
          </div>}
        </Card>)}</div> : <Empty title={tr('مفيش جرامر لسه')} hint={tr('ملاحظات الجرامر للسيشن دي هتظهر هنا.')} />}
        {grammarAll.length > 0 && <Card className="grammar-training ltr-scope">
          <div className="between"><div><h3 dir="ltr">Grammar Practice</h3><small className="muted" dir={uiDir()}>{tr('الممارسة بعد الشرح.')}</small></div><Badge tone="green">{grammarAll.length} questions</Badge></div>
          {grammarTaken && <div className="note" dir={uiDir()} style={{ marginTop: '.6rem' }}>{tr('الكويز ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.')}</div>}
          <div className="stack" style={{ marginTop: '.8rem' }}>{grammarAll.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{gRes && <Badge tone={gRes.marks[q.id] ? 'green' : 'red'}>{gRes.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            {gRes && !gRes.marks[q.id] && <div className="why-box" dir="rtl">{whyWrong(q as any, s.id, data.dictionary)}</div>}
            <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${gAns[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={gAns[q.id] === o} onChange={() => setGrammarAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked || grammarTaken} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
          </div>)}</div>
          {!grammarTaken && <Button style={{ marginTop: '.8rem' }} onClick={submitGrammar} disabled={locked || grammarTaken || !grammarAll.every((q) => gAns[q.id])}>{tr('صحح إجابات الجرامر')}</Button>}
          {gRes && <div className="result-good" style={{ marginTop: '.6rem' }}>Grammar score: {gRes.score} / {gRes.max}</div>}
        </Card>}
      </>}
      {tab === 'practice' && <div className="stack ltr-scope" dir="ltr">
        <Card className="activity-card">
          <SectionTitle title="Speaking Practice" action={<Badge tone="blue">{talk.length} questions</Badge>} />
          <p className="muted" dir={uiDir()}>{tr('أسئلة مفتوحة للتدريب — اتكلم بصوت عالي وعلّم على كل سؤال جاوبت عليه. التعليم ده لمتابعتك إنت بس ومش بيتحسب عليه نقط.')}</p>
          {talk.map((q, i) => { const ticked = !!speakRow(i); return <label key={i} className={`req-item speak-item${ticked ? ' is-ticked' : ''}`}><input type="checkbox" className="speak-check" checked={ticked} onChange={() => void toggleSpeak(i)} disabled={locked} /><span className="req-check">{i + 1}</span><span dir="ltr" className="en" style={{ flex: 1 }}>{q}</span></label>; })}
        </Card>
        <Card className="activity-card">
          <SectionTitle title="Voice Notes" action={<Badge>{tr('اختياري')}</Badge>} />
          <p className="muted" dir={uiDir()}>{tr('اختار أي سؤال من الأسئلة اللي فوق، سجّل إجابتك بصوتك، وابعتها على واتساب Speakozy علشان المدرّس يسمعها.')}</p>
          <a className="btn btn-primary btn-sm" href={waGroupShare(tr('فويس نوت Speakozy — {0}', [s.title]))} target="_blank" rel="noreferrer">{tr('افتح الواتساب وابعت')}</a>
        </Card>
      </div>}
      {tab === 'overview' && <div className="stack" dir="ltr">
        <article className="brief-card">
          <div className="brief-kicker">Objectives</div>
          <h3>Lesson objectives</h3>
          <ul className="brief-list">{overview.objectives.map((item, i) => <li key={i} className="en" dir="ltr">{item}</li>)}</ul>
        </article>
        <Card className="brief-card kind-summary">
          <div className="brief-kicker">Summary</div>
          <p className="brief-summary en" dir="ltr">{overview.summary}</p>
        </Card>
      </div>}
    </>}
    </div>
    <aside className="sess-aside">
      <Card className="study-progress">
        <div className="between"><span className="muted">{tr('تقدم السيشن')}</span><strong>{pct}%</strong></div>
        <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
        <small className="muted">{doneParts} {tr('من')} {totalParts} {tr('جزء خلص')}</small>
      </Card>
      {nextTab && <div className="next-step">
        <small>{tr('الخطوة الجاية')}</small>
        <strong dir="ltr">{nextTab.label}</strong>
        <button className="btn btn-primary" onClick={() => openTab(nextTab.id)}>{tr('كمّل ←')}</button>
      </div>}
      {materialPdf(s) && <Card className="pdf-line">
        <strong>{tr('ملخص العرض للمراجعة')}</strong>
        <div className="row" style={{ marginTop: '.5rem' }}><PdfActions s={s} extra={pdfAllowed(user, s, data.levels) && s.driveUrl ? <a className="btn btn-ghost btn-sm" href={s.driveUrl} target="_blank" rel="noreferrer">{tr('PDF من الدرايف ↗')}</a> : null} /></div>
      </Card>}
      {s.driveUrl && <Card>
        <strong>{tr('مصدر إضافي للمشاهدة')}</strong>
        <p className="muted" style={{ margin: '.4rem 0 .6rem' }}>{tr('للمشاهدة بس. لو ما فتحش، يمكن صلاحيات الملف غلط — المحتوى المكتوب هنا كامل.')}</p>
        <a className="btn btn-ghost btn-sm" href={s.driveUrl} target="_blank" rel="noreferrer">{tr('افتح الملف ↗')}</a>
      </Card>}
    </aside>
    </div>
    {yg && <YouGlishDock word={yg.word} accent={yg.accent} onAccent={(accent) => setYg({ word: yg.word, accent })} onClose={() => setYg(null)} />}
  </div>;
}

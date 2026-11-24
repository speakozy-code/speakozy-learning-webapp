import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, Progress, Stat, SectionTitle, Empty, Tabs, Field, Modal, fmtDate, fmtDay, isLate } from '../components/UI';
import { sessionStatus, levelProgress, engagementProgress, sessionOpen, levelFullyOpen, pdfAllowed, wordProgressId, practiceId, totalScore, leaderboard, gradeQuestion, proportionalScore, scoreRule, uid, today, levelLabel, cefrOf, subscriptionDaysLeft, arabicDate } from '../lib/domain';
import { go } from '../App';
import { lookupWord, allCached, isArabicText, normAr, arabicToEnglish, type LookupEntry } from '../lib/dictionaryProvider';
import { WORD_MEANINGS } from '../lib/wordMeanings';
import { grammarFor } from '../lib/grammar/index.ts';
import { overviewOutline, sourceTranscript, letsTalk, voicePrompts, speakingQuestions } from '../lib/lessonBrief';
import { wordQuizItems, sessionQuizItems, SESSION_QUIZ_SIZE, GRAMMAR_QUIZ_SIZE } from '../lib/sessionQuizzes';
import { grammarQuestions } from '../lib/grammarQuiz.ts';
import { YOUGLISH_ACCENTS } from '../lib/youglish';
import { YouGlishDock } from '../components/YouGlishDock';
import { notificationPermission, requestNotifications } from '../lib/pwa';
import { TALK_QUESTIONS } from '../lib/content/talk';
import { getBank } from '../lib/questionBank';
import { lessonOverview } from '../lib/overview';
import { whyWrong } from '../lib/reasons';
import { priorFor, correctText } from '../lib/review';
import { schedule, previewLabel, dueWords, type Grade } from '../lib/srs';
import { UpsellModal, SubscribeButtons } from '../components/Upsell';
import { isSubscribed, FREE_YALLA_PER_LEVEL, FREE_TASK_WEEKS, waGroupShare } from '../lib/subscription';
import { pushSupported, pushEnabled, enablePush, disablePush } from '../lib/push';
import { isStandalone, isIos } from '../lib/pwa';
import { Play, Volume2, Star, Check, BookOpen, X, Trash2 } from 'lucide-react';

const statusTone: Record<string, string> = { locked: 'muted', available: 'blue', progress: 'amber', done: 'blue', review: 'amber', approved: 'green' };
const phon = (p?: string) => {
  if (!p) return '';
  const inner = p.replace(/^\/+|\/+$/g, '');
  if (!/[a-zA-Z\u0250-\u02AF\u0300-\u036F]/.test(inner)) return '';
  return /^\//.test(p) ? p : `/${p}/`;
};

// Resolve lesson PDFs by stable session id so stale demo localStorage still shows them.
const MATERIAL_PDF: Record<string, string> = {
  'l5-s1': './materials/1%20-%20Leisure%20Time.pdf',
  'l5-s2': './materials/2%20-%20Love.pdf',
  'l5-s3': './materials/3%20-%20Education%20and%20University.pdf',
  'l5-s4': './materials/4%20-%20Marriage.pdf',
  'l5-s5': './materials/5_Personality.pdf',
  'l5-s6': './materials/6%20-%20Work.pdf',
  'l5-s7': './materials/7-%20Shopping.pdf',
  'l9-s1': './materials/1%20-%20Leisure%20Time.pdf',
  'l9-s2': './materials/2%20-%20Love.pdf',
  'l9-s3': './materials/3%20-%20Education%20and%20University.pdf',
  'l9-s4': './materials/4%20-%20Marriage.pdf',
  'l9-s5': './materials/5_Personality.pdf',
  'l9-s6': './materials/6%20-%20Work.pdf',
  'l9-s7': './materials/7-%20Shopping.pdf',
};
function materialPdf(s: any): string {
  return s?.pdfUrl || MATERIAL_PDF[s?.id] || `./lesson-pdfs/${s?.id}.pdf`;
}

/** Open / download buttons for a lesson PDF; locked for anyone outside their allowed levels. */
function PdfActions({ s, stop = false, extra = null }: { s: any; stop?: boolean; extra?: React.ReactNode }) {
  const { user, data } = useApp();
  const [upsell, setUpsell] = useState(false);
  if (!user || !materialPdf(s)) return null;
  const ok = pdfAllowed(user, s, data.levels);
  const st = stop ? { onClick: (e: React.MouseEvent) => e.stopPropagation() } : {};
  if (!ok) return <>
    <Button size="sm" variant="ghost" onClick={(e: any) => { e.stopPropagation(); setUpsell(true); }}>🔒 PDF</Button>
    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what={user.subscribed === false ? 'ملفات PDF' : 'PDF المستويات التانية'} />
  </>;
  return <>
    <a className="btn btn-primary btn-sm" href={materialPdf(s)} target="_blank" rel="noreferrer" {...st}>افتح PDF ↗</a>
    <a className="btn btn-ghost btn-sm" href={materialPdf(s)} download {...st}>نزّل PDF ⬇</a>
    {extra}
  </>;
}

export function StudentDashboard() {
  const { user, data } = useApp();
  if (!user) return null;
  const level = data.levels.find((l) => l.id === user.levelId) || data.levels[0];
  const sessions = data.sessions.filter((s) => s.levelId === user.levelId).sort((a, b) => a.order - b.order);
  const next = sessions.find((s) => sessionOpen(user, s, data.levels) && sessionStatus(data, s, user.id).key !== 'approved');
  const myTasks = data.tasks.filter((t) => t.active && (t.targetType === 'all' || (t.targetType === 'student' && t.targetId === user.id)));
  const doneTaskIds = data.taskCompletions.filter((c) => c.studentId === user.id).map((c) => c.taskId);
  const late = myTasks.filter((t) => !doneTaskIds.includes(t.id) && isLate(t.dueAt));
  const notes = data.notifications.filter((n) => n.targetId === 'all' || n.targetId === user.id || n.targetId === user.levelId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const approved = data.attempts.filter((a) => a.studentId === user.id && a.status === 'approved').length;
  const pending = data.attempts.filter((a) => a.studentId === user.id && a.status === 'pending').length;
  const pct = level ? engagementProgress(data, level.id, user.id) : 0;

  return <div className="stack">
    <Card style={{ background: 'linear-gradient(135deg,#0b1220,#16243c)', color: '#fff', border: 0 }}>
      <div className="between">
        <div><div className="muted" style={{ color: '#9fb0c9' }}>أهلًا {user.name} 👋</div><h1 style={{ marginTop: '.35rem' }}>جاهز تكمل من حيث وقفت؟</h1>
          <p className="home-mission">رسالتنا: نساعد أكثر من مليون متعلم يتكلم إنجليزي بثقة — التعليم عندنا متاح وفعال وممتع للجميع. إحنا أكاديمية متخصصة في تعليم اللغة الإنجليزية: جلسات لايف، تاسكات يومية، ومتابعة شخصية خطوة بخطوة.</p>
          <div className="row" style={{ marginTop: '.8rem' }}>
            <Badge tone="green">{level?.title || 'مفيش مستوى'}</Badge>
            <span style={{ color: '#b8c4d6', fontSize: '.85rem' }}>{user.subscribed === false ? 'اشترك عشان تفتح المستويات كاملة' : `مفتوح ليك كامل: ${data.levels.filter((l) => levelFullyOpen(user, l, data.levels)).length} من ${data.levels.length} مستويات`}</span>
          </div>
        </div>
        <Button onClick={() => go(next ? `/session/${next.id}` : '/roadmap')}>{next ? 'كمّل مذاكرة' : 'افتح خريطة المستويات'}</Button>
      </div>
    </Card>

    <Card>
      <SectionTitle title="أبطال Speakozy" action={<span className="muted" style={{ fontSize: '.8rem' }}>أعلى النقاط</span>} />
      {leaderboard(data).length ? <div className="champs-strip">
        {leaderboard(data).slice(0, 10).map((b, i) => <div key={b.id} className={`champ-chip ${b.id === user.id ? 'is-me' : ''}`}>
          <span className="champ-rank">{i + 1}</span>
          <span className="champ-avatar">{b.avatar || '🧑‍🎓'}</span>
          <span className="champ-name">{b.name}{b.id === user.id ? ' (You)' : ''}</span>
          <strong className="champ-points">{b.points} pts</strong>
        </div>)}
      </div> : <Empty title="مفيش طلاب في الترتيب لسه" />}
    </Card>

    <div className="grid g4">
      <Stat label="تقدم المستوى" value={`${pct}%`} sub={level?.title} tone="green" />
      <Stat label="إجمالي النقاط" value={totalScore(data, user.id)} sub="من كل المصادر" />
      <Stat label="كويزات معتمدة" value={approved} sub={pending ? `and ${pending} awaiting review` : 'مفيش حاجة منتظرة'} />
      <Stat label="تاسكات متأخرة" value={late.length} sub={late.length ? 'راجعها النهارده' : 'كل حاجة في السكة'} tone={late.length ? 'danger' : ''} />
    </div>

    <Card>
      <div className="between"><div><h3>تقدمك في {level?.title || 'the level'}</h3><small className="muted">{sessions.filter((s) => sessionStatus(data, s, user.id).key === 'approved').length} من {sessions.length} سيشن معتمدة</small></div></div>
      <div style={{ marginTop: '.8rem' }}><Progress value={pct} /></div>
    </Card>

    <div className="grid g2">
      <Card>
        <SectionTitle title="السيشن الجاية" action={<button className="icon-btn" onClick={() => go('/roadmap')}>شوف الكل ←</button>} />
        {next ? <div className="stack">
          <div className="row between"><strong>{next.title}</strong><Badge tone={statusTone[sessionStatus(data, next, user.id).key]}>{sessionStatus(data, next, user.id).label}</Badge></div>
          <small className="muted">{next.topic} · {fmtDay(next.dueAt)}</small>
          <Button variant="ghost" onClick={() => go(`/session/${next.id}`)}>افتح السيشن</Button>
        </div> : <Empty title="مفيش سيشنات متاحة دلوقتي" hint="هتظهر هنا أول ما الأدمن يفتحلك سيشن جديدة." />}
      </Card>
      <Card>
        <SectionTitle title="آخر الإشعارات" action={<button className="icon-btn" onClick={() => go('/notifications')}>All ←</button>} />
        {notes.length ? <div className="stack">{notes.map((n) => <div key={n.id} className="row between" style={{ alignItems: 'flex-start' }}>
          <div><strong style={{ fontSize: '.9rem' }}>{n.title}</strong><div className="muted" style={{ fontSize: '.82rem' }}>{n.body}</div></div>
          {!n.read && <span className="badge badge-green">جديد</span>}
        </div>)}</div> : <Empty title="مفيش إشعارات" />}
      </Card>
    </div>

    {late.length > 0 && <Card className="danger-zone">
      <SectionTitle title="تاسكات متأخرة" />
      <div className="stack">{late.map((t) => <div key={t.id} className="row between"><span>{t.title}</span><small className="muted">{fmtDate(t.dueAt)}</small></div>)}</div>
      <Button variant="ghost" size="sm" onClick={() => go('/tasks')} style={{ marginTop: '.8rem' }}>Review tasks ←</Button>
    </Card>}
  </div>;
}

export function Roadmap() {
  const { user, data } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  if (!user) return null;
  const currentLevel = data.levels.find((l) => l.id === user.levelId) || levels[0];
  const levelSessions = data.sessions.filter((s) => s.levelId === currentLevel?.id).sort((a, b) => a.order - b.order);
  return <div className="stack">
    <div><h1>خريطة المستويات</h1><p className="muted">عرضين في مكان واحد: سيشناتك الأول وبعدين مسار المستويات كامل. الاتنين للقراءة — ذاكر من الرئيسية أو الماتيريال.</p></div>
    <Card className="roadmap-card">
      <SectionTitle title={`سيشنات ${currentLevel?.title || '—'}`} action={<Badge tone="blue">{levelSessions.length} سيشن</Badge>} />
      <div className="roadmap-map session-map">
        {levelSessions.map((s, i) => {
          const st = sessionStatus(data, s, user.id);
          const open = sessionOpen(user, s, data.levels);
          return <div key={s.id} className={`rm-level ${open ? 'is-open' : 'is-locked'} ${i % 2 ? 'rm-right' : 'rm-left'}`}>
            <div className="rm-marker">{open ? i + 1 : '🔒'}</div>
            <div className="rm-body">
              <div className="between"><strong>{s.title}</strong><Badge tone={statusTone[st.key]}>{st.key === 'locked' ? 'لسه ما بدأتش' : st.label}</Badge></div>
              <p className="muted" style={{ margin: '.3rem 0' }}>{s.topic} · {fmtDay(s.dueAt)}</p>
              <div className="muted" style={{ fontSize: '.8rem' }}>{data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id)).length} كلمة · {s.sections.length} أجزاء</div>
            </div>
          </div>;
        })}
      </div>
    </Card>
    <Card className="roadmap-card">
      <SectionTitle title="المستويات" action={<Badge tone="blue">{levels.length} مستوى — تصنيف CEFR العالمي</Badge>} />
      {user.subscribed === false && <><div className="note">تقدر تتصفح كل المستويات من البداية بتقسيمها العالمي — اشترك عشان تفتح كل الجلسات.</div>
        <Card className="shadow-inline"><div className="row between"><span>🎧 تاسكات يومية هتخليك تتكلم إنجليزي كل يوم وتوصل لهدفك أسرع — ابدأ معانا الشادوينج.</span>
          <SubscribeButtons size="sm" /></div></Card></>}
      <div className="roadmap-map">
        {levels.map((l, i) => {
          const sessions = data.sessions.filter((s) => s.levelId === l.id).sort((a, b) => a.order - b.order);
          const full = levelFullyOpen(user, l, data.levels);
          const pct = engagementProgress(data, l.id, user.id);
          const approved = sessions.filter((s) => sessionStatus(data, s, user.id).key === 'approved').length;
          return <div key={l.id} className={`rm-level is-open ${i % 2 ? 'rm-right' : 'rm-left'}`}>
            <div className="rm-marker">{i + 1}</div>
            <div className="rm-body">
              <div className="between"><strong>{levelLabel(l)}</strong><Badge tone={full ? 'green' : 'muted'}>{levelLabel(l)}</Badge></div>
              <p className="muted" style={{ margin: '.3rem 0' }}>{l.description}</p>
              <div className="rm-dots">{sessions.map((s) => { const st = sessionStatus(data, s, user.id).key; return <span key={s.id} className={`rm-dot ${st === 'approved' ? 'done' : st === 'progress' || st === 'review' || st === 'done' ? 'active' : ''}`} title={s.title} />; })}</div>
              {sessions.length
                ? <div className="muted" style={{ fontSize: '.8rem' }}>{approved} من {sessions.length} سيشن معتمدة · {pct}% مكتمل</div>
                : <div className="muted" style={{ fontSize: '.8rem' }}>🚧 المحتوى قريبًا</div>}
            </div>
          </div>;
        })}
      </div>
    </Card>
  </div>;
}

export function SessionPage({ sessionId }: any) {
  const { user, data, put, grantScore, log } = useApp();
  const [tab, setTab] = useState('overview');
  const [defs, setDefs] = useState<Record<string, string>>({});
  const [grammarAnswers, setGrammarAnswers] = useState<Record<string, string>>({});
  const [grammarResult, setGrammarResult] = useState<{ marks: Record<string, boolean>; score: number; max: number } | null>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const [exerciseResult, setExerciseResult] = useState<any>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [speaking, setSpeaking] = useState('');
  const [writing, setWriting] = useState('');
  const [listening, setListening] = useState('');
  const [videoDraft, setVideoDraft] = useState('');
  const [yg, setYg] = useState<{ word: string; accent: string } | null>(null);
  const [wordAnswers, setWordAnswers] = useState<Record<string, string>>({});
  const [wordResult, setWordResult] = useState<{ marks: Record<string, boolean>; score: number; max: number } | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  useEffect(() => { setSlideIdx(0); setExerciseResult(null); setGrammarResult(null); setGrammarAnswers({}); setWordAnswers({}); setWordResult(null); setYg(null); setSourceOpen(false); }, [sessionId]);
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
  if (!s) return <Empty title="السيشن مش موجودة" hint="يمكن اتشالت أو الرابط غلط." />;
  const locked = !sessionOpen(user, s, data.levels);
  const enMaterial = true;
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
  const outline = overviewOutline(s);
  const overview = lessonOverview(s.title, topics, words);
  const bank = getBank(data).get(s.id);
  const talk = bank?.speaking || [];
  const voices = voicePrompts(s);
  const transcript = sourceTranscript(s);
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
  const writingLines = writing.split(/\n/).map((x) => x.trim()).filter(Boolean).length;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'vocabulary', label: `Words${words.length ? ` (${words.length})` : ''}` },
    { id: 'grammar', label: 'Grammar' },
    { id: 'practice', label: 'Practice' },
    { id: 'quiz', label: `Quiz (${sessionQuiz.length || SESSION_QUIZ_SIZE})` },
  ];
  async function mark(sectionId: string) {
    if (locked || done.includes(sectionId)) return;
    await put('progress', { studentId: user!.id, sessionId: s!.id, sectionId, completedAt: today() });
    await log('study-section', `${s!.title} / ${sectionId}`);
  }
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
  async function savePractice(kind: string, text: string, n: number) {
    if (locked || !text.trim()) return;
    const id = practiceId(kind, s!.id, n);
    const wordsUsed = text.trim().split(/\s+/).length;
    await put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: id, answer: text, autoScore: Math.min(20, Math.max(5, wordsUsed * 2)), maxScore: 20, status: 'pending', createdAt: today() });
    await log(`${kind}-saved`, s!.title);
    if (kind === 'speaking') setSpeaking('');
    if (kind === 'writing') setWriting('');
    if (kind === 'listening') setListening('');
  }
  function speakPrompt() {
    const Rec: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Rec) { setSpeaking((x) => x || `I can talk about ${s!.topic}. `); return; }
    const r = new Rec(); r.lang = 'en-US'; r.interimResults = false;
    r.onresult = (e: any) => setSpeaking((x) => (x ? x + ' ' : '') + e.results[0][0].transcript);
    try { r.start(); } catch {}
  }

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => window.history.length > 1 ? window.history.back() : go('/roadmap')}>→ السابق</button></div>
    <Card className="session-head between">
      <div><div className="muted session-head-meta">Session {s.order} · {data.levels.find((l) => l.id === s.levelId)?.title}{[s.topic, fmtDate(s.dueAt)].filter(Boolean).length ? ' · ' + [s.topic, fmtDate(s.dueAt)].filter(Boolean).join(' · ') : ''}</div><h1 className="session-head-title">{s.title}</h1></div>
      <Badge tone={locked ? 'muted' : statusTone[st.key]}>{locked ? '🔒 مقفول' : st.label}</Badge>
    </Card>
    {locked && <div className="note">🔒 تقدر تقرأ كل حاجة في السيشن دي، بس هي مقفولة لحسابك.
        {user.subscribed === false && <div className="row" style={{ marginTop: '.6rem' }}><SubscribeButtons size="sm" /></div>}
      </div>}
    <Card className="study-progress sticky-progress-session">
      <div className="between"><span className="muted">تقدم السيشن · {done.filter((d) => d.startsWith(`${s.id}-`) || d.startsWith('word:')).length} من {totalParts} جزء خلص</span><strong>{pct}%</strong></div>
      <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
    </Card>
    {materialPdf(s) && <Card className="pdf-line">
      <div className="between"><strong>ملخص العرض للمراجعة</strong>
        <div className="row"><PdfActions s={s} extra={pdfAllowed(user, s, data.levels) && s.driveUrl ? <a className="btn btn-ghost btn-sm" href={s.driveUrl} target="_blank" rel="noreferrer">PDF من الدرايف ↗</a> : null} /></div></div>
    </Card>}
    {s.driveUrl && <Card>
      <SectionTitle title="مصدر إضافي للمشاهدة" />
      <p className="muted">للمشاهدة بس. لو ما فتحش، يمكن صلاحيات الملف غلط — المحتوى المكتوب هنا كامل.</p>
      <a className="btn btn-ghost btn-sm" href={s.driveUrl} target="_blank" rel="noreferrer">افتح الملف ↗</a>
    </Card>}
    <div className="lesson-tabs" dir="ltr">{tabs.map((t) => <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    {user.subscribed === false && <Card className="shadow-inline">
      <div className="row between"><span>🎧 {tab === 'vocabulary' ? 'عرف كلمات أكتر واستخدمها في كلامك.' : tab === 'grammar' ? 'كمّل وتخلي الجرامر أسهل وميبقاش عقدة.' : tab === 'practice' ? 'تاسكات يومية هتخليك تتكلم إنجليزي كل يوم وتوصل لهدفك أسرع.' : tab === 'quiz' ? 'راجع الكلمات والجرامر قبل الكويز.' : 'اسمع السيشن وردّد ورا المتحدث.'}</span>
        <SubscribeButtons size="sm" /></div>
    </Card>}
    {tab === 'quiz' ? <Card>
      <div className="between"><div><h3>كويز السيشن</h3><small className="muted">{sessionQuiz.length} سؤال على الكلمات والجرامر · النقاط على قد درجتك</small></div>
        <Button onClick={() => go(`/quiz/${s.id}`)} disabled={!sessionQuiz.length || locked}>{sessionQuiz.length ? 'ابدأ الكويز' : 'مفيش أسئلة لسه'}</Button></div>
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
              <button className="icon-btn play-btn" title="اسمع الكلمة دي في كلام حقيقي" onClick={() => openYouglish(w.word)}><Play size={16} /></button>
              <button className="icon-btn" title="شغّل النطق الأصلي" onClick={() => pronounce(w)}><Volume2 size={16} /></button>
              <button className="icon-btn" title={savedWord(w.word) ? 'شيلها من كلماتي' : 'احفظ الكلمة'} onClick={() => toggleSave(w)} disabled={locked}>{savedWord(w.word) ? <Star size={16} /> : <Star size={16} strokeWidth={1.5} />}</button>
            </span>
          </div>
          <div className="vocab-word en" dir="ltr">{w.word}</div>
          {w.phonetic && <div className="vocab-phonetic en" dir="ltr">/{w.phonetic}/</div>}
          {(w.arabic || w.meaning) && <div className="vocab-meaning" dir="rtl">{w.arabic || w.meaning}</div>}
          {def && <div className="vocab-def en" dir="ltr">{def}</div>}
          {example && <div className="vocab-example en" dir="ltr">“{example}”</div>}
          <div className="youglish-row">
            <span className="youglish-label" dir="rtl">اسمعها في الاستخدام</span>
            <span className="youglish-btns">
              {YOUGLISH_ACCENTS.map((a) => <button key={a.code} type="button" className="yg-btn en"
                onClick={() => openYouglish(w.word, a.code)}
                title={`Hear “${w.word}” in ${a.label} English`}>{a.label}</button>)}
            </span>
          </div>
          <button className={`btn vocab-known ${known ? 'btn-ghost' : 'btn-primary'}`} onClick={() => markWord(w.word)} disabled={locked || known}>
            {known ? '✓ اتذاكرت' : 'عارف الكلمة دي'}
          </button>
        </article>;
      })}</div>
        {!allWordsStudied && words.length > 0 && <div className="note">علّم كل الكلمات إنها اتذاكرت عشان يفتح كويز الكلمات.</div>}
        {allWordsStudied && wordQs.length > 0 && <Card className="grammar-training ltr-scope">
          <div className="between"><div><h3 dir="ltr">Words Quiz</h3><small className="muted" dir="rtl">راجع الكلمات الجديدة بتاعة السيشن دي.</small></div><Badge tone="green">{wordQs.length} questions</Badge></div>
          {wordTaken && <div className="note" dir="rtl" style={{ marginTop: '.6rem' }}>الكويز ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.</div>}
          <div className="stack" style={{ marginTop: '.8rem' }}>{wordQs.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{wRes && <Badge tone={wRes.marks[q.id] ? 'green' : 'red'}>{wRes.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            {wRes && !wRes.marks[q.id] && <div className="why-box" dir="rtl">{whyWrong(q as any, s.id, data.dictionary)}</div>}
            {q.options.length ? <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${wAns[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={wAns[q.id] === o} onChange={() => setWordAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked || wordTaken} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
              : <input value={wAns[q.id] || ''} onChange={(e) => setWordAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="اكتب الكلمة الناقصة…" disabled={locked || wordTaken} dir="ltr" />}
          </div>)}</div>
          {!wordTaken && <Button style={{ marginTop: '.8rem' }} onClick={submitWordQuiz} disabled={locked || wordTaken || !wordQs.every((q) => (wAns[q.id] || '').trim())}>صحح إجابات الكلمات</Button>}
          {wRes && <div className="result-good" style={{ marginTop: '.6rem' }}>Word score: {wRes.score} / {wRes.max}</div>}
        </Card>}
      </div> : <Empty title="مفيش كلمات في السيشن دي" hint="الكلمات هتظهر هنا أول ما تتضاف للديكشنري." />)}
      {tab === 'grammar' && <>
        {slides.length ? <div className="stack">{slides.map((t: any, i: number) => <Card key={`${s.id}-${i}`} className="grammar-topic">
          <div className="grammar-kicker">GRAMMAR · {i + 1} / {slides.length}</div>
          <h2 className="en" dir="ltr">{t.title}</h2>
          {t.rule && <div className="grammar-formula en" dir="ltr">{t.rule}</div>}
          {t.detail && <p className="grammar-explain" dir="rtl">{t.detail}</p>}
          {t.examples?.length > 0 && <div className="grammar-examples">
            <div className="grammar-label" dir="ltr">Examples</div>
            {t.examples.map((ex: string, k: number) => <button key={k} type="button" className="grammar-example en" dir="ltr" onClick={() => speak(ex)} title="استمع"><Volume2 size={16} aria-hidden="true" /><span>{ex}</span></button>)}
          </div>}
          {t.mistakes?.length > 0 && <div className="grammar-mistakes">
            <div className="grammar-label" dir="ltr">Common Mistakes</div>
            {t.mistakes.map(([wrong, right]: [string, string], k: number) => <div key={k} className="grammar-mistake en" dir="ltr">
              <div className="gm-wrong"><X size={15} aria-hidden="true" /><s>{wrong}</s></div>
              <div className="gm-right"><Check size={15} aria-hidden="true" /><span>{right}</span></div>
            </div>)}
          </div>}
        </Card>)}</div> : <Empty title="مفيش جرامر لسه" hint="ملاحظات الجرامر للسيشن دي هتظهر هنا." />}
        {grammarAll.length > 0 && <Card className="grammar-training ltr-scope">
          <div className="between"><div><h3 dir="ltr">Grammar Practice</h3><small className="muted" dir="rtl">الممارسة بعد الشرح.</small></div><Badge tone="green">{grammarAll.length} questions</Badge></div>
          {grammarTaken && <div className="note" dir="rtl" style={{ marginTop: '.6rem' }}>الكويز ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.</div>}
          <div className="stack" style={{ marginTop: '.8rem' }}>{grammarAll.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{gRes && <Badge tone={gRes.marks[q.id] ? 'green' : 'red'}>{gRes.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            {gRes && !gRes.marks[q.id] && <div className="why-box" dir="rtl">{whyWrong(q as any, s.id, data.dictionary)}</div>}
            <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${gAns[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={gAns[q.id] === o} onChange={() => setGrammarAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked || grammarTaken} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
          </div>)}</div>
          {!grammarTaken && <Button style={{ marginTop: '.8rem' }} onClick={submitGrammar} disabled={locked || grammarTaken || !grammarAll.every((q) => gAns[q.id])}>صحح إجابات الجرامر</Button>}
          {gRes && <div className="result-good" style={{ marginTop: '.6rem' }}>Grammar score: {gRes.score} / {gRes.max}</div>}
        </Card>}
      </>}
      {tab === 'practice' && <div className="stack ltr-scope" dir="ltr">
        <Card className="activity-card">
          <SectionTitle title="Speaking Practice" action={<Badge tone="blue">{talk.length} questions</Badge>} />
          <p className="muted" dir="rtl">أسئلة مفتوحة للتدريب — اتكلم بصوت عالي، ولو عايز رأي المدرّس ابعت إجابتك على أي سؤال للجروب.</p>
          {talk.map((q, i) => <div key={i} className="req-item" style={{ marginTop: '.5rem', gap: '.5rem', flexWrap: 'wrap' }}><span className="req-check">{i + 1}</span><span dir="ltr" className="en" style={{ flex: 1 }}>{q}</span><a className="btn btn-ghost btn-sm" dir="rtl" href={waGroupShare(`فويس نوت Speakozy — ${s.title}\n${i + 1}. ${q}`)} target="_blank" rel="noreferrer">ابعت إجابتك على واتساب</a></div>)}
        </Card>
        <Card className="activity-card">
          <SectionTitle title="Voice Notes" action={<Badge>اختياري</Badge>} />
          <p className="muted" dir="rtl">اختار أي سؤال من الأسئلة اللي فوق، سجّل إجابتك بصوتك، وابعتها على واتساب Speakozy علشان المدرّس يسمعها.</p>
          <a className="btn btn-primary btn-sm" href={waGroupShare(`فويس نوت Speakozy — ${s.title}`)} target="_blank" rel="noreferrer">افتح الواتساب وابعت</a>
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
    {yg && <YouGlishDock word={yg.word} accent={yg.accent} onAccent={(accent) => setYg({ word: yg.word, accent })} onClose={() => setYg(null)} />}
  </div>;
}

export function QuizPage({ sessionId }: any) {
  const { user, data, put, grantScore, log } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const s = data.sessions.find((x) => x.id === sessionId);
  const words = data.dictionary.filter((w) => (w.sessionIds || []).includes(sessionId));
  const qs = s ? (getBank(data).get(s.id)?.session || []) : [];
  if (!user) return null;
  if (!s) return <Empty title="السيشن مش موجودة" />;
  if (!qs.length) return <Empty title="مفيش أسئلة للسيشن دي" hint="راجع خريطة المستويات." />;
  // one attempt only: coming back shows the saved answers with the mistakes
  const prior = priorFor(data, user.id, qs as any, (q) => [q.id]);

  async function submit() {
    if (prior) return;
    let auto = 0, max = 0, pending = 0;
    const jobs: Promise<any>[] = [];
    const marks: Record<string, boolean> = {};
    for (const q of qs) {
      const ans = answers[q.id] || '';
      const g = gradeQuestion(q as any, ans);
      max += q.points; auto += g.score;
      const status = g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending';
      if (!g.auto) pending++;
      marks[q.id] = g.score > 0;
      jobs.push(put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: q.id, answer: ans, autoScore: g.score, maxScore: q.points, status, createdAt: today() }));
    }
    setResult({ auto, max, pending, marks, answers: { ...answers } });
    const qPts = proportionalScore(auto, max, scoreRule(data.settings.scoreRules, 'sessionQuiz'));
    if (qPts > 0) jobs.push(grantScore(user!.id, 'quiz', qPts, `sessionquiz-${s!.id}-${user!.id}`));
    jobs.push(log('quiz-submit', s!.title));
    await Promise.allSettled(jobs);
  }

  const view = result || (prior ? { auto: prior.score, max: prior.max, pending: Object.values(prior.pending).filter(Boolean).length, marks: prior.marks, answers: prior.answers } : null);
  if (view) return <div className="stack">
    <Card className="stack">
      <h2 dir="ltr">{result ? 'Quiz Complete' : 'Your Quiz Review'}</h2>
      <div className={view.pending ? 'note' : 'result-good'}>
        <strong>Score: {view.auto} out of {view.max}</strong>
        {view.pending > 0 && <div>There are {view.pending} written answers to be reviewed by the admin.</div>}
      </div>
      {!result && <div className="note" dir="rtl">الكويز ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.</div>}
      <div className="row"><Button onClick={() => go(`/session/${s.id}`)}>رجوع للسيشن</Button><Button variant="ghost" onClick={() => go('/roadmap')}>الخريطة</Button></div>
    </Card>
    {qs.map((q, i) => {
      const ok = view.marks[q.id];
      return <Card key={q.id} className="ltr-scope">
        <div className="between"><strong dir="ltr" className="en" style={{ textAlign: 'left' }}>{i + 1}. {q.prompt}</strong><Badge tone={ok ? 'green' : 'red'}>{ok ? '✓ Correct' : '✗ Wrong'}</Badge></div>
        <div style={{ marginTop: '.6rem' }}>{q.options.map((o) => {
          const mine = view.answers[q.id] === o;
          const right = correctText(q as any).toLowerCase() === o.toLowerCase();
          return <div key={o} className={`quiz-opt ${mine ? 'selected' : ''}`} style={{ borderColor: right ? 'var(--green, #22c55e)' : mine ? 'var(--red, #ef4444)' : undefined }}>
            <span className="en" dir="ltr">{o}</span>{right && ' ✓'}{mine && !right && ' ✗ (إجابتك)'}{mine && right && ' (إجابتك)'}
          </div>;
        })}</div>
        {!ok && <div className="why-box" dir="rtl">{`إجابتك: ${view.answers[q.id] || '—'}\n${whyWrong(q as any, s.id, data.dictionary)}`}</div>}
      </Card>;
    })}
  </div>;

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => go(`/session/${s.id}`)}>→ السيشن</button></div>
    <Card><h1 dir="ltr">Session Quiz: <span className="en" dir="ltr">{s.title}</span></h1><p className="muted">{qs.length} سؤال على الكلمات والجرامر. النقاط على قد درجتك.</p></Card>
    {qs.map((q, i) => <Card key={q.id} className="ltr-scope">
      <div className="row between"><strong dir="ltr" className="en" style={{textAlign:"left"}}>{i + 1}. {q.prompt}</strong><Badge>{q.points} نقاط</Badge></div>
      <div style={{ marginTop: '.8rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${answers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} style={{ width: 'auto' }} /> <span className="en" dir="ltr">{o}</span></label>)}</div>
    </Card>)}
    <Card><div className="between"><span className="muted">الإجابات الكتابية بتتحفظ للمراجعة.</span><Button onClick={submit}>سلّم الإجابات</Button></div></Card>
  </div>;
}

/** Two short, simple examples that really contain the searched word. */
function easyExamples(e: { word: string; examples: string[] }): string[] {
  const w = e.word.toLowerCase();
  const has = (x: string) => x.toLowerCase().includes(w.split(' ')[0].slice(0, Math.max(3, w.length - 3)));
  return [...(e.examples || [])].filter((x) => x && has(x)).sort((a, b) => a.length - b.length).slice(0, 2);
}

export function DictionaryPage() {
  const { user, data, put, remove, demo } = useApp();
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<LookupEntry | null>(null);
  const [looking, setLooking] = useState(false);
  const [manual, setManual] = useState<any>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [globalHit, setGlobalHit] = useState<LookupEntry | null>(null);
  const [globalTick, setGlobalTick] = useState(0);
  const [arCands, setArCands] = useState<string[]>([]);
  const [yg, setYg] = useState<{ word: string; accent: string } | null>(null);
  if (!user) return null;

  const all = data.dictionary;
  const saved = data.savedWords.filter((w) => w.studentId === user.id);
  const globalEntries = allCached();
  const matches = (d: any) => {
    if (!q) return true;
    const term = q.trim();
    if (isArabicText(term)) return normAr(d.arabic + ' ' + d.meaning).includes(normAr(term));
    const hay = (d.word + ' ' + d.meaning + ' ' + d.arabic + ' ' + (d.examples || []).join(' ')).toLowerCase();
    return hay.includes(term.toLowerCase());
  };
  const seen = new Set<string>();
  const localResults = [...all, ...globalEntries].filter((d: any) => {
    const key = d.word.toLowerCase();
    if (seen.has(key) || !matches(d)) return false;
    seen.add(key); return true;
  }).slice(0, 40);
  const savedResults = saved.filter((d) => !q || (d.word + d.meaning).toLowerCase().includes(q.toLowerCase()) || (isArabicText(q) && normAr(d.meaning).includes(normAr(q.trim()))));
  const suggestions = q.trim().length >= 1
    ? all.filter((d) => d.word.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];
  const wordOfDay = all[(new Date().getDate() * 7) % all.length];
  const reviewList = saved.filter((w) => w.review);
  const reviewCard = reviewList[reviewIdx % Math.max(1, reviewList.length)];

  useEffect(() => {
    let alive = true;
    const term = q.trim();
    setGlobalHit(null); setArCands([]);
    if (term.length < 2) return;
    if (isArabicText(term)) {
      const t = setTimeout(async () => { const c = await arabicToEnglish(term); if (alive) setArCands(c); }, 350);
      return () => { alive = false; clearTimeout(t); };
    }
    const timer = setTimeout(async () => {
      const entry = await lookupWord(term, all);
      if (alive && entry && entry.source !== 'local') setGlobalHit(entry);
    }, 700);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, globalTick]);

  function isSaved(word: string) { return saved.some((w) => w.word.toLowerCase() === word.toLowerCase()); }

  async function showWord(word: string) {
    if (isArabicText(word)) {
      // an Arabic query never goes to the English dictionary as-is: translate it, then open the best English word
      setDetail(null); setLooking(true);
      const cands = arCands.length ? arCands : await arabicToEnglish(word);
      setArCands(cands);
      // look the top candidates up in parallel and open the first one that resolves
      const tries = cands.slice(0, 3).map((c) => lookupWord(c, all).then((e) => { if (!e) throw new Error('none'); return e; }));
      const entry = await new Promise<LookupEntry | undefined>((resolve) => {
        let left = tries.length;
        if (!left) resolve(undefined);
        tries.forEach((t) => t.then(resolve, () => { left -= 1; if (left === 0) resolve(undefined); }));
      });
      if (entry) { setLooking(false); setDetail(entry); setGlobalHit(entry.source === 'global' ? entry : null); return; }
      setLooking(false);
      setManual({ word: cands[0] || '', meaning: word.trim(), type: 'noun', examples: '' });
      return;
    }
    setDetail(null); setLooking(true);
    const entry = await lookupWord(word, all);
    setLooking(false);
    if (entry) { setDetail(entry); setGlobalHit(entry.source === 'global' ? entry : null); }
    else setManual({ word, meaning: '', type: 'noun', examples: '' });
  }
  async function toggle(word: LookupEntry | any) {
    if (isSaved(word.word)) {
      const found = saved.find((w) => w.word.toLowerCase() === word.word.toLowerCase());
      if (found) await remove('savedWords', found.id);
    } else {
      await put('dictionary', {
        id: word.id || `saved-${word.word.toLowerCase()}`,
        word: word.word, meaning: word.meaning, type: word.type || 'word',
        examples: word.examples || [], arabic: word.arabic || '',
        phonetic: word.phonetic, audioUrl: word.audioUrl, definitions: word.definitions,
        synonyms: word.synonyms, source: word.source || 'global', sessionIds: word.sessionIds || [],
        addedBy: user!.id,
      });
      await put('savedWords', { studentId: user!.id, word: word.word, meaning: word.meaning, review: false, createdAt: today(), nextReview: today() });
    }
  }
  async function markReview(w: any, known: boolean) {
    const s = schedule(w, known ? 'good' : 'again');
    await put('savedWords', { ...w, ...s, review: !known });
    setReviewIdx((i) => i + 1); setShowMeaning(false);
  }
  function pronounce(entry: any) {
    if (entry.audioUrl) { new Audio(entry.audioUrl).play().catch(() => speak(entry.word)); return; }
    speak(entry.word);
  }
  function speak(word: string) {
    try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
  }
  async function saveManual() {
    const entry: any = {
      id: `manual-${manual.word.toLowerCase().replace(/\s+/g, '-')}`,
      word: manual.word.trim(), meaning: manual.meaning.trim(), type: manual.type,
      examples: manual.examples.split('\n').filter((x: string) => x.trim()),
      arabic: manual.meaning.trim(), source: 'manual', sessionIds: [], addedBy: user!.id,
    };
    await put('dictionary', entry);
    await put('savedWords', { studentId: user!.id, word: entry.word, meaning: entry.meaning, review: false, createdAt: today(), nextReview: today() });
    setManual(null); setDetail(null); setGlobalTick((t) => t + 1);
  }

  return <div className="stack">
    <div><h1>الديكشنري</h1><p className="muted">تقدر تحفظ أي كلمة، أو تسمعها من المتحدثين الأصليين على YouGlish. الديكشنري فيه آلاف الكلمات الجاهزة، ولو مش موجودة بنجيب معناها من المصدر العالمي.</p></div>

    <Card className="search-hero">
      <div className="row"><span style={{ fontSize: '1.4rem' }}>🔎</span><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { if (isArabicText(q) && arCands[0]) showWord(arCands[0]); else showWord(q); } }} placeholder="اكتب أي كلمة بالإنجليزي أو العربي... مثال: serendipity" aria-label="دوّر في الديكشنري" /></div>
      {suggestions.length > 0 && <div className="dict-suggest">{suggestions.map((d) => <button key={d.id} type="button" className="dict-suggest-item en" dir="ltr" onClick={() => { setQ(d.word); showWord(d.word); }}>{d.word}</button>)}</div>}
      <div className="row" style={{ marginTop: '.7rem', justifyContent: 'flex-end' }}>
        <div className="row"><Button size="sm" variant="ghost" onClick={() => setManual(isArabicText(q) ? { word: '', meaning: q.trim(), type: 'noun', examples: '' } : { word: q.trim(), meaning: '', type: 'noun', examples: '' })}>+ ضيف كلمة</Button><Button size="sm" onClick={() => q.trim() && showWord(q)} disabled={!q.trim() || looking}>{looking ? 'بندوّر...' : 'دوّر عالميًا'}</Button></div>
      </div>
      {q.trim() && !looking && <div className="muted" style={{ marginTop: '.5rem', fontSize: '.82rem' }}>
        نتايج محلية: {localResults.length} · <button className="icon-btn" onClick={() => showWord(q)}>دوّر عالميًا عن "{q}" ←</button>
      </div>}
      {arCands.length > 0 && <div className="global-hit">
        <small className="muted">معناها بالإنجليزي</small>
        <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{arCands.map((w) => <button key={w} type="button" className="word-chip en" dir="ltr" onClick={() => showWord(w)}>{w}</button>)}</div>
      </div>}
      {globalHit && <div className="global-hit">
        <div className="row between"><div><small className="muted">الديكشنري العالمي</small>
          <div className="row"><strong className="en" style={{ fontSize: '1.1rem' }}>{globalHit.word}</strong><Badge tone="blue">{globalHit.type}</Badge>{globalHit.phonetic && <span className="en muted" dir="ltr">{phon(globalHit.phonetic)}</span>}</div>
          <div className="en" dir="ltr">{globalHit.meaning}</div>
          {!!(globalHit.synonyms || []).length && <div className="row" style={{ marginTop: '.4rem' }}>{globalHit.synonyms!.slice(0, 6).map((x) => <span key={x} className="word-chip en">{x}</span>)}</div>}
        </div>
          <div className="row">
            <Button size="sm" variant="ghost" onClick={() => pronounce(globalHit)}>استماع</Button>
            <Button size="sm" variant="ghost" onClick={() => setYg({ word: globalHit.word, accent: 'us' })}>YouGlish</Button>
            <Button size="sm" onClick={() => toggle(globalHit)}>{isSaved(globalHit.word) ? '✓ محفوظة' : 'ضيفها لكلماتي'}</Button>
          </div>
        </div>
      </div>}
    </Card>

    {wordOfDay && <Card className="word-day">
      <div className="between"><div><div className="muted">كلمة اليوم</div><h2 dir="ltr" className="en" style={{ fontSize: '1.7rem' }}>{wordOfDay.word}</h2><div>{wordOfDay.meaning} · {wordOfDay.type}</div></div>
        <div className="row"><Button variant="ghost" onClick={() => speak(wordOfDay.word)}><Volume2 size={16} /></Button><Button onClick={() => showWord(wordOfDay.word)}>افتح الكارت</Button></div>
      </div>
    </Card>}

    {q.trim() && <Card>
      <SectionTitle title={`Results (${localResults.length})`} />
      {localResults.length ? <div className="stack">{localResults.map((d) => <div key={d.id} className="word-row">
        <button className="icon-btn" onClick={() => setDetail({ ...d, source: d.source || 'local' })}><strong className="en" dir="ltr">{d.word}</strong></button>
        <span className="muted" dir="rtl">{d.meaning}</span>
        <div className="row"><Badge>{d.type}</Badge><button className="icon-btn" onClick={() => pronounce(d)}><Volume2 size={16} /></button><Button size="sm" variant={isSaved(d.word) ? 'ghost' : 'primary'} onClick={() => toggle(d)}>{isSaved(d.word) ? '✓' : 'حفظ'}</Button></div>
      </div>)}</div> : <Empty icon="🔍" title="مفيش نتايج محلية" hint="هنجرّب المصدر العالمي تلقائيًا، أو تقدر تضيف الكلمة بنفسك." />}
    </Card>}

    <Modal open={!!detail} title="كارت الكلمة" onClose={() => setDetail(null)}>
      {detail && <div className="stack">
        <div className="between"><div><h2 dir="ltr" className="en" style={{ fontSize: '1.9rem' }}>{detail.word}</h2>
          <div className="row"><Badge tone="green">{detail.type}</Badge>{detail.phonetic && <span className="muted" dir="ltr">{phon(detail.phonetic)}</span>}<Badge tone={detail.source === 'global' ? 'blue' : 'muted'}>{detail.source === 'global' ? 'الديكشنري العالمي' : detail.source === 'manual' ? 'إضافة يدوية' : 'من المنهج'}</Badge></div></div>
          <Button variant="ghost" onClick={() => pronounce(detail)}><Volume2 size={16} /> اسمع النطق</Button></div>
        {detail.arabic && <div className="section-card"><h3>المعنى بالعربي</h3><p dir="rtl" style={{ fontSize: '1.15rem', margin: 0 }}>{detail.arabic}</p></div>}
        <div className="section-card"><h3>التعريف</h3><p className="en" dir="ltr" style={{ margin: 0 }}>{detail.definitions?.[0] || detail.meaning}</p></div>
        <div className="section-card"><h3>مثالين</h3>{easyExamples(detail).length ? easyExamples(detail).map((ex, i) => <div key={i} className="en" dir="ltr" style={{ textAlign: 'left', lineHeight: 1.9 }}>• {ex}</div>) : <p className="muted">مفيش أمثلة متاحة.</p>}</div>
        {detail.phonetic && <div className="section-card"><h3>النطق المكتوب</h3><p className="en" dir="ltr">{phon(detail.phonetic)}</p></div>}
        <div className="section-card"><h3>اسمعها في الاستخدام</h3>
          <div className="youglish-btns">{YOUGLISH_ACCENTS.map((a) => <button key={a.code} type="button" className="yg-btn en" onClick={() => setYg({ word: detail.word, accent: a.code })}>{a.label}</button>)}</div>
        </div>
        {detail.synonyms && detail.synonyms.length > 0 && <div className="section-card"><h3>المرادفات</h3><div className="row">{detail.synonyms.map((x) => <span key={x} className="word-chip en">{x}</span>)}</div></div>}
        {(detail.sessionIds || []).length > 0 && <div className="section-card"><h3>بتظهر في سيشنات</h3>{detail.sessionIds!.map((sid) => { const sess = data.sessions.find((x) => x.id === sid); return sess ? <div key={sid}><button className="icon-btn" onClick={() => { setDetail(null); go(`/session/${sid}`); }}>{sess.title} ←</button></div> : null; })}</div>}
        <Button onClick={() => toggle(detail)}>{isSaved(detail.word) ? 'شيلها من المحفوظات' : 'ضيفها لكلماتي'}</Button>
      </div>}
    </Modal>
    {yg && <YouGlishDock word={yg.word} accent={yg.accent} onAccent={(accent) => setYg({ word: yg.word, accent })} onClose={() => setYg(null)} />}

    <Modal open={!!manual} title="ضيف كلمة بنفسك" onClose={() => setManual(null)}>
      <Field label="الكلمة"><input dir="ltr" value={manual?.word || ''} onChange={(e) => setManual({ ...manual, word: e.target.value })} /></Field>
      <Field label="المعنى بالعربي"><input value={manual?.meaning || ''} onChange={(e) => setManual({ ...manual, meaning: e.target.value })} /></Field>
      <Field label="النوع"><select value={manual?.type || 'noun'} onChange={(e) => setManual({ ...manual, type: e.target.value })}>{['noun','verb','adjective','adverb','phrase','preposition'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="أمثلة (واحد في كل سطر)"><textarea dir="ltr" value={manual?.examples || ''} onChange={(e) => setManual({ ...manual, examples: e.target.value })} /></Field>
      <Button onClick={saveManual} disabled={!manual?.word?.trim() || !manual?.meaning?.trim()}>احفظ الكلمة</Button>
    </Modal>
  </div>;
}

function speakWord(word: string) {
  try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
}

/** الكلمات: مراجعة كروت على طريقة AnkiDroid (Again / Hard / Good / Easy) على الكلمات المحفوظة. */
export function WordsPage() {
  const { user, data, put, remove } = useApp();
  const [tab, setTab] = useState('review');
  const [flipped, setFlipped] = useState(false);
  const [q, setQ] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const [adding, setAdding] = useState<{ word: string; meaning: string; example: string } | null>(null);
  if (!user) return null;
  const saved = data.savedWords.filter((w) => w.studentId === user.id);
  const now = new Date().toISOString();
  // spaced repetition: a word is due when its next review time has come
  const due = dueWords(saved, now).filter((w) => !skipped.includes(w.id)).sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || ''));
  const nextUp = saved.map((w) => w.nextReview || '').filter((x) => x > now).sort()[0];
  const card = due[0];
  const list = saved.filter((w) => !q || (w.word + w.meaning).toLowerCase().includes(q.trim().toLowerCase()));
  async function rate(grade: Grade) {
    if (!card) return;
    const s = schedule(card, grade);
    if (grade === 'again') setSkipped((x) => [...x, card.id]);
    await put('savedWords', { ...card, ...s, review: grade === 'again' });
    setFlipped(false);
  }
  async function addOwn() {
    if (!adding || !adding.word.trim() || !adding.meaning.trim()) return;
    const word = adding.word.trim();
    if (saved.some((w) => w.word.toLowerCase() === word.toLowerCase())) { setAdding(null); return; }
    await put('savedWords', { studentId: user!.id, word, meaning: adding.meaning.trim(), transcript: adding.example.trim() || undefined, review: true, createdAt: today(), nextReview: today() });
    setAdding(null);
  }
  return <div className="stack">
    <div><h1>الكلمات</h1><p className="muted">راجع كلماتك بنظام المراجعة المتباعدة (زي Anki): كل ما تعرف الكلمة أكتر بتتأجل لمدة أطول، والكلمة اللي بتنساها بترجعلك بسرعة. هيجيلك إشعار لما يبقى فيه كلمات مستحقة.</p></div>
    <div><Button size="sm" onClick={() => setAdding({ word: '', meaning: '', example: '' })}>+ ضيف كلمة بنفسك</Button></div>
    <Modal open={!!adding} title="ضيف كلمة" onClose={() => setAdding(null)}>
      <Field label="الكلمة بالإنجليزي"><input dir="ltr" value={adding?.word || ''} onChange={(e) => setAdding({ ...adding!, word: e.target.value })} placeholder="e.g. reliable" /></Field>
      <Field label="المعنى بالعربي"><input dir="rtl" value={adding?.meaning || ''} onChange={(e) => setAdding({ ...adding!, meaning: e.target.value })} /></Field>
      <Field label="جملة مثال (اختياري)"><input dir="ltr" value={adding?.example || ''} onChange={(e) => setAdding({ ...adding!, example: e.target.value })} /></Field>
      <Button onClick={addOwn} disabled={!adding?.word.trim() || !adding?.meaning.trim()}>ضيف للكروت</Button>
    </Modal>
    <div className="grid g3">
      <Stat label="كلمات محفوظة" value={saved.length} />
      <Stat label="مستحقة للمراجعة" value={due.length} tone="green" />
      <Stat label="لسه بتنساها" value={saved.filter((w) => w.review).length} />
    </div>
    <Tabs tabs={[{ id: 'review', label: `مراجعة (${due.length})` }, { id: 'all', label: `كل كلماتي (${saved.length})` }]} active={tab} onChange={setTab} />
    {tab === 'review' && <Card>
      {card ? <div className="flashcard">
        <div className="muted">باقي {due.length} كلمة للمراجعة</div>
        <h2 dir="ltr" className="en" style={{ fontSize: '2rem' }}>{card.word}</h2>
        <Button variant="ghost" onClick={() => speakWord(card.word)}><Volume2 size={16} /> اسمع</Button>
        {flipped
          ? <>
            <div className="result-good" dir="rtl" style={{ margin: '1rem 0' }}>{card.meaning}</div>
            {card.transcript && <div className="muted en" dir="ltr" style={{ marginBottom: '.8rem' }}>{card.transcript}</div>}
            <div className="row" style={{ justifyContent: 'center' }}>
              <Button variant="danger" onClick={() => rate('again')}>لسه بنساها<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'again')}</small></Button>
              <Button variant="ghost" onClick={() => rate('hard')}>صعبة<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'hard')}</small></Button>
              <Button onClick={() => rate('good')}>كويسة<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'good')}</small></Button>
              <Button variant="ghost" onClick={() => rate('easy')}>سهلة<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'easy')}</small></Button>
            </div>
          </>
          : <Button style={{ marginTop: '1rem' }} onClick={() => setFlipped(true)}>اقلب الكارت</Button>}
      </div> : <Empty icon="🎉" title={saved.length ? 'خلصت مراجعة النهاردة' : 'لسه ما حفظتش كلمات'} hint={saved.length ? (nextUp ? `الكلمة الجاية هتتراجع ${new Date(nextUp).toLocaleString('ar-EG', { weekday: 'long', hour: 'numeric', minute: '2-digit' })} — هيجيلك إشعار.` : 'ارجع بكرة لباقي الكلمات.') : 'احفظ كلمات من الديكشنري أو من السيشنات وهتظهر هنا.'} />}
    </Card>}
    {tab === 'all' && <Card>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر في كلماتك" aria-label="دوّر في كلماتك" style={{ marginBottom: '.8rem' }} />
      {list.length ? <div className="saved-grid">{list.map((w) => <div key={w.id} className={`saved-card ${w.review ? 'needs-review' : ''}`}>
        <div className="saved-word en" dir="ltr">{w.word}</div>
        {w.transcript && <div className="saved-transcript en" dir="ltr">{w.transcript}</div>}
        <div className="saved-meaning" dir="rtl">{w.meaning}</div>
        <div className="saved-actions">
          <button className="icon-btn" title="اسمع النطق" onClick={() => speakWord(w.word)}><Volume2 size={16} /></button>
          <button className="icon-btn danger" title="حذف" onClick={() => remove('savedWords', w.id)}><Trash2 size={16} /></button>
        </div>
      </div>)}</div> : <Empty title="مفيش كلمات" hint="احفظ كلمات من الديكشنري." />}
    </Card>}
  </div>;
}


/** يلا نتكلم: سؤال محادثة عشوائي على حسب مستوى الطالب. */
export function YallaNetkellemPage() {
  const { user, data } = useApp();
  const level = data.levels.find((l) => l.id === user?.levelId);
  const band = (level?.cefr || 'A1').slice(0, 2);
  const [pick, setPick] = useState(band in TALK_QUESTIONS ? band : 'A1');
  const [n, setN] = useState(0);
  const [upsell, setUpsell] = useState(false);
  if (!user) return null;
  const subscribed = isSubscribed(user);
  const full = TALK_QUESTIONS[pick] || TALK_QUESTIONS.A1;
  // not subscribed: only the first few questions of every level
  const pool = subscribed ? full : full.slice(0, FREE_YALLA_PER_LEVEL);
  const question = pool[n % pool.length];
  const next = () => { if (!subscribed && n + 1 >= pool.length) { setUpsell(true); return; } setN((x) => subscribed ? x + 1 + Math.floor(Math.random() * Math.max(1, pool.length - 1)) : x + 1); };
  return <div className="stack">
    <div><h1>يلا نتكلم</h1><p className="muted">اضغط على «سؤال جديد»، سجّل ريكورد بتجاوب فيه بصوتك، وابعته للمدرّس على الواتساب.</p></div>
    <Tabs tabs={Object.keys(TALK_QUESTIONS).map((k) => ({ id: k, label: k }))} active={pick} onChange={(k) => { setPick(k); setN(0); }} />
    <Card className="flashcard">
      <h2 dir="ltr" className="en" style={{ textAlign: 'center', lineHeight: 1.6 }}>{question}</h2>
      <div className="row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
        <Button onClick={next}>سؤال جديد</Button>
        <Button variant="ghost" onClick={() => speakWord(question)}><Volume2 size={16} /> اسمع السؤال</Button>
      </div>
    </Card>
    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what="باقي أسئلة يلا نتكلم" />
  </div>;
}

export function TasksPage() {
  const { user, data, put, remove, grantScore } = useApp();
  if (!user) return null;
  // levels opened for this student (from the first to the last allowed level); everyone else: their own level only
  const allLevels = [...data.levels].sort((a, b) => a.order - b.order);
  const [sel, setSel] = useState('');
  const selLevel = allLevels.find((l) => l.id === sel);
  const selOpen = !!selLevel && (user.role === 'admin' || levelFullyOpen(user, selLevel, data.levels));
  const mine = data.tasks.filter((t) => t.active && (t.targetType === 'all' || (t.targetType === 'student' && t.targetId === user.id) || (t.targetType === 'level' && (!sel || t.targetId === sel))));
  const doneIds = data.taskCompletions.filter((c) => c.studentId === user.id).map((c) => c.taskId);
  const isDone = (t: any) => doneIds.includes(t.id);
  const statusOf = (t: any) => data.taskCompletions.find((c) => c.studentId === user.id && c.taskId === t.id)?.status || (isDone(t) ? 'approved' : '');
  const statusBadge = (t: any) => { const st = statusOf(t); return st === 'pending' ? <Badge tone="amber">بانتظار المدرّس</Badge> : st === 'rejected' ? <Badge tone="red">اتردّ — جرّب تاني</Badge> : st === 'approved' ? <Badge tone="green">معتمد</Badge> : null; };
  const levelTasks = mine.filter((t) => (t.instructions || []).length > 0).sort((a, b) => (a.order || 0) - (b.order || 0));
  const otherTasks = mine.filter((t) => !(t.instructions || []).length);
  const groups = selLevel ? [{ l: selLevel, tasks: levelTasks.filter((t) => (t.targetId || user.levelId) === selLevel.id) }].filter((g) => g.tasks.length) : [];
  const level = data.levels.find((l) => l.id === user.levelId);
  const [upsell, setUpsell] = useState(false);
  // outside the student's opened levels (or not subscribed): only the first week is free
  const taskLocked = (t: any) => (!isSubscribed(user) || (!!t.instructions?.length && !selOpen && user.role !== 'admin')) && (t.week || 1) > FREE_TASK_WEEKS;
  async function toggle(t: any) {
    if (taskLocked(t)) { setUpsell(true); return; }
    const existing = data.taskCompletions.find((c) => c.studentId === user!.id && c.taskId === t.id);
    if (existing) {
      if ((existing.status || 'approved') === 'approved') return; // approved by the teacher: can't be undone
      await remove('taskCompletions', existing.id);
    } else {
      await put('taskCompletions', { taskId: t.id, studentId: user!.id, completedAt: today(), status: 'pending' });
      await grantScore(user!.id, 'task', scoreRule(data.settings.scoreRules, 'taskPending'), `task-pending-${t.id}`);
    }
  }
  return <div className="stack">
    <div><h1>تاسكاتي اليومية</h1><p className="muted">دي تاسكات يوميه علشان تتكلم كل يوم. هتسجّل ريكورد بتقرا أو بتجاوب على السؤال في تاسك اليوم وتبعته على جروب الواتساب.</p>
      <a className="btn btn-primary btn-sm" style={{ marginTop: '.6rem' }} href="https://wa.me/201091060951?text=%D8%A8%D8%B9%D8%AA%20%D8%AA%D8%A7%D8%B3%D9%83%20%D8%A7%D9%84%D9%8A%D9%88%D9%85" target="_blank" rel="noreferrer">واتساب</a></div>
    <Card>
      <Field label="الليفل بتاعك" hint="اختار الليفل بتاعك من القايمة علشان تظهرلك تاسكاته."><select value={sel} onChange={(e) => setSel(e.target.value)}>
        <option value="">— اختار الليفل بتاعك —</option>
        {allLevels.map((l) => <option key={l.id} value={l.id}>{levelLabel(l)}</option>)}
      </select></Field>
    </Card>
    {!sel && <div className="note" dir="rtl">اختار الليفل بتاعك من القايمة اللي فوق علشان تظهرلك التاسكات اليومية بتاعته.</div>}
    <div className="grid g3">
      <Stat label="إجمالي التاسكات" value={sel ? mine.length : 0} />
      <Stat label="خلصت" value={sel ? mine.filter(isDone).length : 0} tone="green" />
      <Stat label="الباقي" value={sel ? mine.filter((t) => !isDone(t)).length : 0} />
    </div>
    {levelTasks.length ? <>
    {groups.map(({ l: lvl, tasks: lt }) => <React.Fragment key={lvl.id}>
      <Card className="row between" style={{ gap: '1rem' }}>
        <div><strong>{lvl.title} · Level tasks</strong><div className="muted">{lt.filter(isDone).length} / {lt.length} completed</div></div>
        <div className="progress-track" style={{ flex: 1, maxWidth: 260, marginTop: 0 }}><span style={{ width: `${lt.length ? Math.round((lt.filter(isDone).length / lt.length) * 100) : 0}%` }} /></div>
      </Card>
      {[...new Set(lt.map((x) => x.week || 1))].sort((x, y) => x - y).map((w) => {
        const list = lt.filter((t) => (t.week || 1) === w);
        const topicNames = [...new Set(list.map((t) => t.topic || ''))];
        return <Card key={`${lvl.id}-${w}`}>
          <SectionTitle title={`Week ${w}`} action={<Badge tone="blue">{list.filter(isDone).length}/{list.length}</Badge>} />
          <div className="stack">
            {topicNames.map((topicName) => {
              const items = list.filter((t) => (t.topic || '') === topicName);
              return <div key={topicName} className="stack" dir="ltr" style={{ textAlign: 'left' }}>
                <div><strong className="en">{topicName}</strong>{items[0]?.grammar && <div className="muted" style={{ fontSize: '.82rem' }}>{items[0].grammar}</div>}</div>
                {items.map((t) => {
                  const done = isDone(t);
                  return <div key={t.id} className={`task-item ${done ? 'is-done' : ''} ${taskLocked(t) ? 'locked-item' : ''}`} onClick={taskLocked(t) ? () => setUpsell(true) : undefined}>
                    <div className="task-item-head">
                      <button className={`task-check ${done ? 'checked' : ''}`} onClick={() => toggle(t)} aria-label={done ? 'علّم إنها ما خلصتش' : 'علّم إنها خلصت'}>{done ? '✓' : ''}</button>
                      <div className="task-item-title" style={{ cursor: 'default' }}>
                        <span className="task-badge">{t.badge || t.kind}</span>
                        <strong>{t.title}</strong>
                        <span dir="rtl">{statusBadge(t)}</span>
                      </div>
                    </div>
                    {taskLocked(t) ? <div className="lock-cover" dir="rtl">🔒 اشترك معانا علشان تكمل</div> : <div className="task-instructions" dir="ltr">
                      {(t.instructions || []).map((ins, i) => <div key={i} className="task-ins"><span>{ins}</span></div>)}
                      {t.source === 'generated' && <div className="muted" dir="rtl" style={{ fontSize: '.78rem', marginTop: '.4rem', textAlign: 'right' }}>سؤال عام على موضوع السيشن — ملف السيشن مفيهوش سؤال محادثة لده.</div>}
                    </div>}
                  </div>;
                })}
              </div>;
            })}
          </div>
        </Card>;
      })}
    </React.Fragment>)}
    </> : sel ? <Card><Empty icon="🗂️" title={`مفيش تاسكات لـ ${selLevel?.title || 'مستواك'} لسه`} hint="تاسكات المستوى هتظهر هنا أول ما تتضاف لمستواك." /></Card> : null}
    {otherTasks.length > 0 && <Card>
      <SectionTitle title="تاسكات تانية" />
      <div className="stack">{otherTasks.map((t) => <div key={t.id} className="row between section-card">
        <div><strong>{t.title}</strong>{t.dueAt && <div className="muted">{fmtDate(t.dueAt)} · {t.kind}</div>}</div>
        {isDone(t) ? <>{statusBadge(t)}{statusOf(t) === 'rejected' && <Button size="sm" variant="ghost" onClick={() => toggle(t)}>حاول تاني</Button>}</> : <Button size="sm" onClick={() => toggle(t)}>تم</Button>}
      </div>)}</div>
    </Card>}
    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what="تاسكات الأسابيع الجاية" />
  </div>;
}

export function NotificationsPage() {
  const { user, data, put } = useApp();
  const [perm, setPerm] = useState(notificationPermission());
  if (!user) return null;
  const list = data.notifications.filter((n) => n.targetId === 'all' || n.targetId === user.id || n.targetId === user.levelId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  async function markRead(n: any) {
    if (n.read) return;
    if (user!.role === 'admin') await put('notifications', { ...n, read: true });
    else await put('notificationReads', { id: `${user!.id}-${n.id}`, studentId: user!.id, notificationId: n.id, read: true });
  }
  return <div className="stack">
    <div><h1>الإشعارات</h1><p className="muted">إشعارات الموقع متاحة دايمًا. إشعارات الجهاز محتاجة إذنك.</p>
      {perm === 'default' && <Button size="sm" style={{ marginTop: '.6rem' }} onClick={async () => setPerm(await requestNotifications())}>فعّل إشعارات الجهاز</Button>}
      {perm === 'granted' && <Badge tone="green">إشعارات الجهاز شغالة</Badge>}
      {perm === 'denied' && <div className="note" style={{ marginTop: '.6rem' }}>إشعارات الجهاز مقفولة من إعدادات المتصفح. فعّلها من هناك لو عايزها.</div>}
      {perm === 'unsupported' && <div className="note" style={{ marginTop: '.6rem' }}>المتصفح ده مش بيدعم إشعارات الجهاز.</div>}
      {perm === 'granted' && <p className="muted" style={{ fontSize: '.8rem' }}>الإشعارات بتظهر وانت فاتح الموقع أو التطبيق. التنبيه والتطبيق مقفول محتاج خدمة push منفصلة.</p>}
    </div>
    <Card>{list.length ? <div className="stack">{list.map((n) => <div key={n.id} className={`section-card ${!n.read ? 'done' : ''}`}>
      <div className="row between"><strong>{n.title}</strong>{!n.read && <Badge tone="green">جديد</Badge>}</div>
      <p className="muted" style={{ margin: '.4rem 0' }}>{n.body}</p>
      <div className="row"><small className="muted">{fmtDate(n.createdAt)}</small>
        <Button size="sm" variant="ghost" onClick={async () => { await markRead(n); if (n.href) go(n.href.replace('#', '')); }}>افتح</Button>
      </div>
    </div>)}</div> : <Empty title="مفيش إشعارات" />}</Card>
  </div>;
}

export function LeaderboardPage() {
  const { user, data } = useApp();
  const [period, setPeriod] = useState('weekly');
  if (!user) return null;
  const board = leaderboard(data);
  const mine = board.findIndex((b) => b.id === user.id) + 1;
  return <div className="stack">
    <div><h1>أبطال Speakozy</h1><p className="muted">الترتيب بالنقاط. الأسماء مختصرة حسب إعداد الخصوصية، ومفيش بيانات خاصة بتظهر.</p></div>
    {!isSubscribed(user) && <Card className="shadow-inline" dir="rtl"><div className="stack" style={{ textAlign: 'center' }}>
      <strong>الأبطال دول مشتركين معانا — ابعتلنا وابدأ خطوتك وكون جزء منهم 🚀</strong>
      <div className="row" style={{ justifyContent: 'center' }}><SubscribeButtons /></div>
    </div></Card>}
    <Tabs tabs={[{ id: 'weekly', label: 'أسبوعي' }, { id: 'monthly', label: 'شهري' }, { id: 'total', label: 'كل الوقت' }]} active={period} onChange={setPeriod} />
    {!data.settings.leaderboard.enabled ? <Card><Empty icon="🔒" title="لوحة الأبطال متوقفة حاليًا" hint="الأدمن قرر يخفيها مؤقتًا." /></Card> : <Card>
      {board.length ? <div className="stack">{board.map((b, i) => <div key={b.id} className={`row between section-card ${b.id === user.id ? 'done' : ''}`}>
        <div className="row"><span className="node-num">{i + 1}</span><span className="champ-avatar">{b.avatar || '🧑‍🎓'}</span><strong>{b.name}</strong><span className="verified-badge" title="طالب مشترك">✓</span>{b.id === user.id && <Badge tone="green">أنت</Badge>}</div>
        <strong className="green">{b.points} points</strong>
      </div>)}</div> : <Empty title="مفيش مشاركين لسه" />}
    </Card>}
    {mine > 0 && <div className="note">Your current rank: #{mine}. Changes from the previous period will appear when comparison history is available.</div>}
  </div>;
}

export const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐬','🦅','🐺','🦖','🐙','🦋','🐢','🦜','🐝','🦩','🐳','🦈','🐸','🦉','🌟','🚀','🎯','⚡','🌈','🎧','⚽','📚','🏀','🎮','🎸','🎨','🏆','🥇','🎓','✏️','🧠','💡','🔥','💎','🌙','☀️','🌊','🍀','🌵','🍕','🍩','🧋','🦸','🧑‍🚀','🧑‍🎤','🧑‍💻','🥷','🤖','👑','🎩','🕶️','🧢','👟','🛹','🚲','✈️','🗺️','🧭','⛰️','🏝️','🎪','🎢','🪁','🎲','🧩','🪄'];

function PushCard() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { void pushEnabled().then(setOn); }, []);
  const ios = isIos() && !isStandalone();
  async function toggle() {
    setBusy(true); setMsg('');
    if (on) { await disablePush(); setOn(false); }
    else {
      const r = await enablePush();
      if (r === 'ok') { setOn(true); setMsg('✓ الإشعارات اتفعّلت على الجهاز ده'); }
      else if (r === 'denied') setMsg('الإذن اترفض. فعّله من إعدادات المتصفح للموقع ده وجرّب تاني.');
      else if (r === 'unsupported') setMsg('المتصفح ده مش بيدعم الإشعارات.');
      else setMsg('حصلت مشكلة، جرّب تاني.');
    }
    setBusy(false);
  }
  return <Card>
    <SectionTitle title="إشعارات على جهازك" />
    <p className="muted" style={{ marginTop: 0 }}>هيجيلك إشعار بالكلمات المستحقة للمراجعة وتنبيه قبل انتهاء اشتراكك، حتى لو التطبيق مقفول.</p>
    {!pushSupported() || ios
      ? <div className="muted">{ios ? 'على الآيفون: ضيف التطبيق للشاشة الرئيسية الأول (زرار المشاركة ← Add to Home Screen) وافتحه منها.' : 'المتصفح ده مش بيدعم الإشعارات.'}</div>
      : <div className="row"><Button onClick={toggle} disabled={busy}>{busy ? '…' : on ? 'إيقاف الإشعارات' : 'فعّل الإشعارات'}</Button>{on && <Badge tone="green">شغّالة</Badge>}</div>}
    {msg && <div className="muted" style={{ marginTop: '.4rem' }}>{msg}</div>}
  </Card>;
}

export function ProfilePage() {
  const { user, data, resetDemo, demo, saveProfile, changePassword } = useApp();
  const [savingAvatar, setSavingAvatar] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  if (!user) return null;
  const level = data.levels.find((l) => l.id === user.levelId);
  const certs = data.certificates.filter((c) => c.studentId === user.id && c.status === 'active');
  const recent = data.scores.filter((s) => s.studentId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  async function pickAvatar(a: string) {
    setSavingAvatar(a);
    try { await saveProfile({ avatar: a }); } finally { setSavingAvatar(''); }
  }
  async function saveName() {
    const clean = name.trim();
    if (clean.length < 2) { setNameMsg('الاسم لازم يكون حرفين على الأقل'); return; }
    setSavingName(true); setNameMsg('');
    try { await saveProfile({ name: clean }); setNameMsg('✓ الاسم اتحفظ'); }
    catch { setNameMsg('مش قادرين نحفظ الاسم، جرّب تاني'); }
    finally { setSavingName(false); }
  }
  async function savePassword() {
    if (pw1.length < 6) { setPwMsg('الباسورد لازم يكون 6 حروف على الأقل'); return; }
    if (pw1 !== pw2) { setPwMsg('الباسورد مش متطابق'); return; }
    setSavingPw(true); setPwMsg('');
    try { await changePassword(pw1); setPw1(''); setPw2(''); setPwMsg('✓ الباسورد اتغير'); }
    catch { setPwMsg('مش قادرين نغيّر الباسورد، جرّب تاني'); }
    finally { setSavingPw(false); }
  }
  return <div className="stack">
    <div><h1>بروفايلي</h1></div>
    <Card className="row" style={{ gap: '1rem' }}><span className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{user.avatar || '🧑‍🎓'}</span>
      <div><h2>{user.name}</h2><div className="muted">{user.email}</div><div className="row" style={{ marginTop: '.4rem' }}><Badge tone="green">{level?.title || '—'}</Badge><Badge>آخر مستوى: {data.levels.find((l) => l.id === user.maxLevelId)?.title || '—'}</Badge></div></div>
    </Card>
    {user.subscriptionEnd && (() => {
      const left = subscriptionDaysLeft(user.subscriptionEnd);
      const expired = left !== null && left < 0;
      const soon = left !== null && left >= 0 && left <= 7;
      return <Card style={{ borderColor: expired ? 'var(--red, #ef4444)' : soon ? 'var(--amber, #f59e0b)' : undefined }}>
        <strong>{expired ? `اشتراكك انتهى يوم ${arabicDate(user.subscriptionEnd)}` : `اشتراكك هينتهي يوم ${arabicDate(user.subscriptionEnd)}`}</strong>
        {!expired && left !== null && <div className="muted">{left === 0 ? 'النهارده آخر يوم' : left === 1 ? 'فاضل يوم واحد' : `فاضل ${left} يوم`}</div>}
        {(expired || soon) && <div className="muted" style={{ marginTop: '.3rem' }}>تواصل معانا على واتساب علشان تجدّد.</div>}
      </Card>;
    })()}
    <PushCard />
    <Card>
      <SectionTitle title="اسمك" />
      <div className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اكتب اسمك" style={{ maxWidth: 320 }} />
        <Button onClick={saveName} disabled={savingName || name.trim() === user.name}>{savingName ? 'بنحفظ…' : 'احفظ الاسم'}</Button>
      </div>
      {nameMsg && <p className="field-hint" style={{ marginTop: '.5rem' }}>{nameMsg}</p>}
    </Card>
    <Card>
      <SectionTitle title="تغيير الباسورد" />
      <div className="grid g2">
        <label className="field"><span>الباسورد الجديد</span><input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="6 حروف على الأقل" autoComplete="new-password" /></label>
        <label className="field"><span>تأكيد الباسورد</span><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="اكتبه تاني" autoComplete="new-password" /></label>
      </div>
      <div className="row" style={{ marginTop: '.7rem' }}>
        <Button onClick={savePassword} disabled={savingPw || !pw1 || !pw2}>{savingPw ? 'بنحفظ…' : 'غيّر الباسورد'}</Button>
        {pwMsg && <span className="field-hint">{pwMsg}</span>}
      </div>
    </Card>
    <Card>
      <SectionTitle title="اختار الأفاتار بتاعك" action={savingAvatar ? <span className="muted">بنحفظ…</span> : <Badge tone="blue">{AVATARS.length} اختيار</Badge>} />
      <div className="avatar-grid">
        {AVATARS.map((a) => <button key={a} className={`avatar-pick ${user.avatar === a ? 'is-on' : ''}`} onClick={() => pickAvatar(a)} aria-label={`أفاتار ${a}`}>{a}</button>)}
      </div>
    </Card>
    <div className="grid g3"><Stat label="إجمالي النقاط" value={totalScore(data, user.id)} tone="green" /><Stat label="الشهادات" value={certs.length} /><Stat label="الكلمات المحفوظة" value={data.savedWords.filter((w) => w.studentId === user.id).length} /></div>
    <Card><SectionTitle title="سجل النقاط" />
      {recent.length ? <div className="stack">{recent.map((s) => <div key={s.id} className="row between"><span>{s.source}</span><span className="row"><strong>+{s.points}</strong><small className="muted">{fmtDate(s.createdAt)}</small></span></div>)}</div> : <Empty title="مفيش نقاط لسه" />}
    </Card>
    {demo && <Card className="danger-zone"><SectionTitle title="بيانات تجريبية" />
      <p className="muted">لو بتستخدم نسخة قديمة من البيانات، اعمل إعادة ضبط عشان تحمّل المنهج الجديد كامل.</p>
      <Button variant="danger" onClick={() => { resetDemo(); go('/'); }}>إعادة ضبط البيانات التجريبية</Button>
    </Card>}
    <Card><SectionTitle title="شهاداتي" />
      {certs.length ? certs.map((c) => <div key={c.id} className="row between"><span>{c.levelIds.join(', ')}</span><Badge tone="green">{c.number}</Badge></div>) : <Empty title="مفيش شهادة لسه" hint="الشهادة بتطلع بعد ما الأدمن يعتمد إكمال المستوى." />}
    </Card>
  </div>;
}

export function MaterialsPage() {
  const { user, data } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  const [selected, setSelected] = useState('');
  if (!user) return null;
  const admin = user.role === 'admin';
  const current = data.levels.find((l) => l.id === user.levelId) || levels[0];
  const levelId = selected;
  const level = data.levels.find((l) => l.id === levelId);
  const sessions = data.sessions.filter((s) => !!level && s.levelId === level.id).sort((a, b) => a.order - b.order);
  const partial = level ? (!admin && !levelFullyOpen(user, level, data.levels)) : false;
  const en = true;
  const L = en ? { title:'Materials', hint:'Pick a level from the list. All levels are available for browsing.', level:'Level', words:'words', ready:'Ready', locked:'Locked', open:'Open lesson', none:'No materials in this level', noneHint:'Materials will appear here once lessons are added.', lesson:'Lesson', pdf:'Open PDF', dl:'Download' } :
    { title:'الماتيريال', hint:'اختار مستوى من القائمة — كل المستويات متاحة للتصفح.', level:'المستوى', words:'كلمة', ready:'جاهز', locked:'مقفول', open:'افتح الدرس', none:'مفيش ماتيريال في المستوى ده', noneHint:'الماتيريال هتظهر هنا أول ما الدروس تتضاف.', lesson:'الدرس', pdf:'افتح PDF ↗', dl:'نزّل PDF ⬇' };
  return <div className="stack" dir={en ? 'ltr' : undefined}>
    <div><h1>{L.title}</h1><p className="muted">{L.hint}</p></div>
    <Card>
      <Field label={L.level}><select value={levelId} onChange={(e) => setSelected(e.target.value)}>
        <option value="">{en ? '— Pick your level —' : '— اختار الليفل بتاعك —'}</option>
        {levels.map((l) => {
          const full = admin || levelFullyOpen(user, l, data.levels);
          return <option key={l.id} value={l.id}>{levelLabel(l)}</option>;
        })}
      </select></Field>
      {level && <div className="row" style={{ marginTop: '.2rem' }}><Badge tone={partial ? 'muted' : 'green'}>{levelLabel(level)}</Badge><Badge tone="blue">{sessions.length} {en ? 'lessons' : 'دروس'}</Badge></div>}
    </Card>
    {!level && <div className="note" dir="rtl">اختار الليفل بتاعك علشان تبدأ.</div>}
    {level && sessions.length ? <div className="grid g2">{sessions.map((s) => {
      const sessionLocked = !admin && !sessionOpen(user, s, data.levels);
      const wordCount = data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id)).length;
      const grammarTitle = (s.sections.find((x) => /grammar/i.test(x.title))?.title || (en ? 'Grammar' : 'الجرامر')).replace(/^Grammar\s*[—-]\s*/i, '');
      return <Card key={s.id} className="material-card">
        <div className="brief-kicker">{L.lesson} {s.order}</div>
        <h3>{s.title}</h3>
        <p className="muted" style={{ marginBottom: '.7rem' }}>{s.topic}</p>
        <div className="row" style={{ marginBottom: '.8rem' }}>
          <Badge tone="blue">{wordCount} {L.words}</Badge>
          <Badge>{grammarTitle.slice(0, 42)}</Badge>
        </div>
        <div className="row">
          <PdfActions s={s} stop />
          <Button size="sm" disabled={sessionLocked} onClick={() => go(`/session/${s.id}`)}>{sessionLocked ? L.locked : L.open}</Button>
        </div>
      </Card>;
    })}</div> : level ? <Empty icon="📂" title={L.none} hint={L.noneHint} /> : null}
  </div>;
}

export function LevelExamPage({ levelId }: any) {
  const { user, data, put, grantScore, log } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  if (!user) return null;
  const level = data.levels.find((l) => l.id === levelId);
  const qs = data.questions.filter((q) => q.levelId === levelId && !q.admin);
  const locked = level ? !levelFullyOpen(user, level, data.levels) : false;
  const prior = priorFor(data, user.id, qs as any, (q) => [`exam:${levelId}:${q.id}`]);

  async function submit() {
    if (prior) return;
    let auto = 0, max = 0, pending = 0;
    const jobs: Promise<any>[] = [];
    const marks: Record<string, boolean> = {};
    for (const q of qs) {
      const ans = answers[q.id] || '';
      const g = gradeQuestion(q, ans);
      auto += g.score; max += q.points;
      if (!g.auto) pending++;
      await put('attempts', { id: uid(), studentId: user!.id, sessionId: '', questionId: `exam:${levelId}:${q.id}`, answer: ans, autoScore: g.score, maxScore: q.points, status: g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending', createdAt: today() });
    }
    await grantScore(user!.id, 'levelQuiz', auto, `exam-${levelId}-${user!.id}`);
    await log('level-exam', `${level?.title || levelId} · ${auto}/${max}`);
    setResult({ auto, max, pending, marks: Object.fromEntries(qs.map((q) => [q.id, gradeQuestion(q, answers[q.id] || '').score > 0])), answers: { ...answers }, pend: Object.fromEntries(qs.map((q) => [q.id, !gradeQuestion(q, answers[q.id] || '').auto])) });
  }

  const view = result || (prior ? { auto: prior.score, max: prior.max, pending: Object.values(prior.pending).filter(Boolean).length, marks: prior.marks, answers: prior.answers, pend: prior.pending } : null);
  if (view) return <div className="stack">
    <Card className="stack">
      <h2>{result ? 'اختبار المستوى خلص' : 'مراجعة اختبار المستوى'}</h2>
      <div className={view.pending ? 'note' : 'result-good'}><strong>Score: {view.auto} out of {view.max}</strong>{view.pending > 0 && <div>{view.pending} written answers are waiting for admin review.</div>}</div>
      {!result && <div className="note" dir="rtl">الاختبار ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.</div>}
      <div className="row"><Button onClick={() => go('/roadmap')}>رجوع للخريطة</Button></div>
    </Card>
    {qs.map((q, i) => {
      const waiting = !!view.pend?.[q.id];
      const ok = view.marks[q.id];
      return <Card key={q.id}>
        <div className="between"><strong>{i + 1}. {q.prompt}</strong>{waiting ? <Badge tone="amber">بانتظار المراجعة</Badge> : <Badge tone={ok ? 'green' : 'red'}>{ok ? '✓ Correct' : '✗ Wrong'}</Badge>}</div>
        <div className="why-box" dir="rtl" style={{ marginTop: '.6rem' }}>{`إجابتك: ${view.answers[q.id] || '—'}`}{!waiting && !ok ? `\nالإجابة الصح: ${correctText(q as any)}` : ''}</div>
      </Card>;
    })}
  </div>;

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => go('/roadmap')}>→ الخريطة</button></div>
    <Card><h1>Level test: {level?.title || levelId}</h1><p className="muted">Multiple choice and writing questions from all {data.sessions.filter((s) => s.levelId === levelId).length} sessions. Written answers need admin approval.</p></Card>
    {locked && <div className="note">🔒 المستوى ده مقفول. اطلب من الأدمن يفتحه قبل ما تمتحن.</div>}
    {qs.map((q, i) => <Card key={q.id}>
      <div className="row between"><strong>{i + 1}. {q.prompt}</strong><Badge>{q.points} pts</Badge></div>
      {(q.type === 'mcq' || q.type === 'truefalse') && <div style={{ marginTop: '.7rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${answers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>}
      {(q.type === 'short' || q.type === 'fill') && <textarea style={{ marginTop: '.7rem' }} value={answers[q.id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="اكتب إجابتك بالإنجليزي…" disabled={locked} />}
    </Card>)}
    <Card><div className="between"><span className="muted">{qs.length} questions</span><Button onClick={submit} disabled={locked || !qs.length}>سلّم الاختبار</Button></div></Card>
  </div>;
}

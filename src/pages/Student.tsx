import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, Progress, Stat, SectionTitle, Empty, Tabs, Field, Modal, fmtDate, fmtDay, isLate } from '../components/UI';
import { sessionStatus, levelProgress, engagementProgress, sessionOpen, levelFullyOpen, wordProgressId, practiceId, totalScore, leaderboard, gradeQuestion, uid, today, levelLabel, cefrOf } from '../lib/domain';
import { go } from '../App';
import { lookupWord, allCached, type LookupEntry } from '../lib/dictionaryProvider';
import { WORD_MEANINGS } from '../lib/wordMeanings';
import { grammarFor } from '../lib/grammar/index.ts';
import { overviewOutline, sourceTranscript, letsTalk, voicePrompts } from '../lib/lessonBrief';
import { wordQuizItems, sessionQuizItems } from '../lib/sessionQuizzes';
import { grammarQuestions } from '../lib/grammarQuiz.ts';
import { YOUGLISH_ACCENTS } from '../lib/youglish';
import { YouGlishDock } from '../components/YouGlishDock';
import { Play, Volume2, Star, Check, BookOpen, X } from 'lucide-react';

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
          <span className="champ-avatar">{b.avatar || b.name.charAt(0)}</span>
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
          <a className="btn btn-primary btn-sm" href="https://wa.me/201091060951?text=%D8%B9%D8%A7%D9%88%D8%B2%20%D8%A3%D8%A8%D8%AF%D8%A3%20%D8%A7%D9%84%D8%B4%D8%A7%D8%AF%D9%88%D9%8A%D9%86%D8%AC" target="_blank" rel="noreferrer">واتساب</a></div></Card></>}
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
              <div className="muted" style={{ fontSize: '.8rem' }}>{approved} من {sessions.length} سيشن معتمدة · {pct}% مكتمل</div>
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
  const qs = data.questions.filter((q) => q.sessionId === s.id);
  const grammarQs = qs.filter((q) => q.scope === 'grammar');
  const st = sessionStatus(data, s, user.id);
  const words = data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id));
  const wordDone = (w: string) => done.includes(wordProgressId(w));
  const totalParts = s.sections.length + words.length;
  const pct = totalParts ? Math.round(done.filter((d) => d.startsWith(`${s.id}-`) || d.startsWith('word:')).length / totalParts * 100) : 0;
  const customNotes = (data.grammarNotes || []).filter((n) => n.sessionId === s.id).sort((a, b) => a.order - b.order)
    .map((n) => ({ title: n.title, rule: n.rule, examples: n.examples, detail: n.detail || '' }));
  const topics = grammarFor(s.id);
  const slides: any[] = [...topics.map((t) => ({ title: t.title, rule: t.formula, detail: t.ar, examples: t.examples, mistakes: t.mistakes })), ...customNotes];
  const outline = overviewOutline(s);
  const talk = letsTalk(s);
  const voices = voicePrompts(s);
  const transcript = sourceTranscript(s);
  const generatedWordQs = wordQuizItems(words, s.id, data.dictionary).filter((q) => !qs.some((x) => x.prompt === q.prompt));
  const wordQs = generatedWordQs;
  const generatedGrammarQs = grammarQuestions(s.id, topics, 5);
  const grammarAll = generatedGrammarQs.length ? generatedGrammarQs : grammarQs;
  const quizNine = sessionQuizItems(words, topics, s.id, data.dictionary);
  const allWordsStudied = words.length > 0 && words.every((w) => wordDone(w.word));
  const writingLines = writing.split(/\n/).map((x) => x.trim()).filter(Boolean).length;
  const tabs = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'vocabulary', label: `الكلمات${words.length ? ` (${words.length})` : ''}` },
    { id: 'grammar', label: 'الجرامر' },
    { id: 'practice', label: 'الممارسة' },
    { id: 'quiz', label: 'كويز (9)' },
  ];
  async function mark(sectionId: string) {
    if (locked || done.includes(sectionId)) return;
    await put('progress', { studentId: user!.id, sessionId: s!.id, sectionId, completedAt: today() });
    await grantScore(user!.id, 'study', data.settings.scoreRules.study, `section-${sectionId}`);
    await log('study-section', `${s!.title} / ${sectionId}`);
  }
  async function markWord(w: string) {
    if (locked || wordDone(w)) return;
    await put('progress', { studentId: user!.id, sessionId: s!.id, sectionId: wordProgressId(w), completedAt: today() });
    await grantScore(user!.id, 'word', data.settings.scoreRules.wordQuiz || 5, `word-${s!.id}-${w.toLowerCase()}`);
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
    if (locked || !grammarAll.length) return;
    let score = 0, max = 0;
    const marks: Record<string, boolean> = {};
    for (const q of grammarAll) {
      const g = gradeQuestion(q as any, grammarAnswers[q.id] || '');
      marks[q.id] = g.score > 0;
      score += g.score; max += q.points;
      await put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: practiceId('grammar', s!.id, Number(String(q.id).split('-').pop()) || 1), answer: grammarAnswers[q.id] || '', autoScore: g.score, maxScore: q.points, status: g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending', createdAt: today() });
    }
    await grantScore(user!.id, 'grammar', data.settings.scoreRules.grammarQuiz || 10, `grammar-${s!.id}-${user!.id}`);
    await log('grammar-quiz', `${s!.title} · ${score}/${max}`);
    setGrammarResult({ marks, score, max });
  }
  async function submitWordQuiz() {
    if (locked || !wordQs.length) return;
    let score = 0, max = 0;
    const marks: Record<string, boolean> = {};
    for (const q of wordQs) {
      const g = gradeQuestion(q as any, wordAnswers[q.id] || '');
      marks[q.id] = g.score > 0;
      score += g.score; max += q.points;
      await put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: `wordquiz:${s!.id}:${q.id}`, answer: wordAnswers[q.id] || '', autoScore: g.score, maxScore: q.points, status: g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending', createdAt: today() });
    }
    await grantScore(user!.id, 'word', data.settings.scoreRules.wordQuiz || 10, `wordquiz-${s!.id}-${user!.id}`);
    await log('word-quiz', `${s!.title} · ${score}/${max}`);
    setWordResult({ marks, score, max });
  }
  async function savePractice(kind: string, text: string, n: number) {
    if (locked || !text.trim()) return;
    const id = practiceId(kind, s!.id, n);
    const wordsUsed = text.trim().split(/\s+/).length;
    await put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: id, answer: text, autoScore: Math.min(20, Math.max(5, wordsUsed * 2)), maxScore: 20, status: 'pending', createdAt: today() });
    await grantScore(user!.id, 'exercise', 5, `practice-${id}-${user!.id}`);
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
    <Card className="between">
      <div><div className="muted">Session {s.order} · {data.levels.find((l) => l.id === s.levelId)?.title}</div><h1>{s.title}</h1><p className="muted">{s.topic} · {fmtDate(s.dueAt)}</p></div>
      <Badge tone={locked ? 'muted' : statusTone[st.key]}>{locked ? '🔒 مقفول' : st.label}</Badge>
    </Card>
    {locked && <div className="note">🔒 تقدر تقرأ كل حاجة في السيشن دي، بس هي مقفولة لحسابك.
        {user.subscribed === false && <div className="row" style={{ marginTop: '.6rem' }}><a className="btn btn-primary btn-sm" href="https://wa.me/201091060951?text=%D8%B9%D8%A7%D9%88%D8%B2%20%D8%A3%D8%B3%D8%AC%D9%84%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%83%D9%88%D8%B1%D8%B3%20%D8%B9%D8%B4%D8%A7%D9%86%20%D8%A3%D9%83%D9%85%D9%84%20%D9%85%D8%B9%D8%A7%D9%83%D9%85" target="_blank" rel="noreferrer">سجّل في الكورس</a></div>}
      </div>}
    <Card className="study-progress sticky-progress-session">
      <div className="between"><span className="muted">تقدم السيشن · {done.filter((d) => d.startsWith(`${s.id}-`) || d.startsWith('word:')).length} من {totalParts} جزء خلص</span><strong>{pct}%</strong></div>
      <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
    </Card>
    {materialPdf(s) && <Card>
      <SectionTitle title="ملخص العرض للمراجعة" />
      <p className="muted">نسخة PDF من كل سلايدات العرض، للمشاهدة والمراجعة بعد السيشن.</p>
      <div className="row"><a className="btn btn-primary btn-sm" href={materialPdf(s)} target="_blank" rel="noreferrer">افتح PDF ↗</a><a className="btn btn-ghost btn-sm" href={materialPdf(s)} download>نزّل PDF ⬇</a>
        {s.driveUrl && <a className="btn btn-ghost btn-sm" href={s.driveUrl} target="_blank" rel="noreferrer">PDF من الدرايف ↗</a>}</div>
    </Card>}
    {s.driveUrl && <Card>
      <SectionTitle title="مصدر إضافي للمشاهدة" />
      <p className="muted">للمشاهدة بس. لو ما فتحش، يمكن صلاحيات الملف غلط — المحتوى المكتوب هنا كامل.</p>
      <a className="btn btn-ghost btn-sm" href={s.driveUrl} target="_blank" rel="noreferrer">افتح الملف ↗</a>
    </Card>}
    <div className="lesson-tabs">{tabs.map((t) => <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    {user.subscribed === false && <Card className="shadow-inline">
      <div className="row between"><span>🎧 {tab === 'vocabulary' ? 'عرف كلمات أكتر واستخدمها في كلامك.' : tab === 'grammar' ? 'كمّل وتخلي الجرامر أسهل وميبقاش عقدة.' : tab === 'practice' ? 'تاسكات يومية هتخليك تتكلم إنجليزي كل يوم وتوصل لهدفك أسرع.' : tab === 'quiz' ? 'راجع الكلمات والجرامر قبل الكويز.' : 'اسمع السيشن وردّد ورا المتحدث.'}</span>
        <a className="btn btn-primary btn-sm" href="https://wa.me/201091060951?text=%D8%B9%D8%A7%D9%88%D8%B2%20%D8%A3%D8%A8%D8%AF%D8%A3%20%D8%A7%D9%84%D8%B4%D8%A7%D8%AF%D9%88%D9%8A%D9%86%D8%AC" target="_blank" rel="noreferrer">واتساب</a></div>
    </Card>}
    {tab === 'quiz' ? <Card>
      <div className="between"><div><h3>كويز السيشن</h3><small className="muted">9 أسئلة على الكلمات والجرامر · كمّل الفراغ</small></div>
        <Button onClick={() => go(`/quiz/${s.id}`)} disabled={!quizNine.length || locked}>{quizNine.length ? 'ابدأ الكويز' : 'مفيش أسئلة لسه'}</Button></div>
    </Card> : <>
      {tab === 'vocabulary' && (words.length > 0 ? <div className="stack">
        <div className="vocab-grid">{words.map((w, n) => {
        const def = defs[w.word] || WORD_MEANINGS[w.word?.toLowerCase()?.trim()]?.definition || '';
        const example = (w.examples || [])[0] || '';
        const known = wordDone(w.word);
        return <article key={w.id} className={`vocab-card ${known ? 'is-done' : ''}`}>
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
          {!enMaterial && <div className="vocab-meaning" dir="rtl">{w.arabic || w.meaning}</div>}
          {def && <div className="vocab-def en" dir="ltr">{def}</div>}
          {example && <div className="vocab-example en" dir="ltr">“{example}”</div>}
          <div className="youglish-row">
            <span className="youglish-label">اسمعها في الاستخدام</span>
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
        {allWordsStudied && wordQs.length > 0 && <Card className="grammar-training">
          <div className="between"><div><h3>كويز الكلمات</h3><small className="muted">راجع الكلمات الجديدة بتاعة السيشن دي.</small></div><Badge tone="green">{wordQs.length} questions</Badge></div>
          <div className="stack" style={{ marginTop: '.8rem' }}>{wordQs.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{wordResult && <Badge tone={wordResult.marks[q.id] ? 'green' : 'red'}>{wordResult.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            {q.options.length ? <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${wordAnswers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={wordAnswers[q.id] === o} onChange={() => setWordAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
              : <input value={wordAnswers[q.id] || ''} onChange={(e) => setWordAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="اكتب الكلمة الناقصة…" disabled={locked} dir="ltr" />}
          </div>)}</div>
          <Button style={{ marginTop: '.8rem' }} onClick={submitWordQuiz} disabled={locked || !wordQs.every((q) => (wordAnswers[q.id] || '').trim())}>صحح إجابات الكلمات</Button>
          {wordResult && <div className="result-good" style={{ marginTop: '.6rem' }}>Word score: {wordResult.score} / {wordResult.max}</div>}
        </Card>}
      </div> : <Empty title="مفيش كلمات في السيشن دي" hint="الكلمات هتظهر هنا أول ما تتضاف للديكشنري." />)}
      {tab === 'grammar' && <>
        {slides.length ? <div className="stack">{slides.map((t: any, i: number) => <Card key={`${s.id}-${i}`} className="grammar-topic">
          <div className="grammar-kicker">GRAMMAR · {i + 1} / {slides.length}</div>
          <h2 className="en" dir="ltr">{t.title}</h2>
          {t.rule && <div className="grammar-formula en" dir="ltr">{t.rule}</div>}
          {t.detail && <p className="grammar-explain" dir="rtl">{t.detail}</p>}
          {t.examples?.length > 0 && <div className="grammar-examples">
            <div className="grammar-label">أمثلة</div>
            {t.examples.map((ex: string, k: number) => <button key={k} type="button" className="grammar-example en" dir="ltr" onClick={() => speak(ex)} title="استمع"><Volume2 size={16} aria-hidden="true" /><span>{ex}</span></button>)}
          </div>}
          {t.mistakes?.length > 0 && <div className="grammar-mistakes">
            <div className="grammar-label">أخطاء شائعة</div>
            {t.mistakes.map(([wrong, right]: [string, string], k: number) => <div key={k} className="grammar-mistake en" dir="ltr">
              <div className="gm-wrong"><X size={15} aria-hidden="true" /><s>{wrong}</s></div>
              <div className="gm-right"><Check size={15} aria-hidden="true" /><span>{right}</span></div>
            </div>)}
          </div>}
        </Card>)}</div> : <Empty title="مفيش جرامر لسه" hint="ملاحظات الجرامر للسيشن دي هتظهر هنا." />}
        {grammarAll.length > 0 && <Card className="grammar-training">
          <div className="between"><div><h3>تدريب الجرامر</h3><small className="muted">الممارسة بعد الشرح.</small></div><Badge tone="green">{grammarAll.length} questions</Badge></div>
          <div className="stack" style={{ marginTop: '.8rem' }}>{grammarAll.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{grammarResult && <Badge tone={grammarResult.marks[q.id] ? 'green' : 'red'}>{grammarResult.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${grammarAnswers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={grammarAnswers[q.id] === o} onChange={() => setGrammarAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
          </div>)}</div>
          <Button style={{ marginTop: '.8rem' }} onClick={submitGrammar} disabled={locked || !grammarAll.every((q) => grammarAnswers[q.id])}>صحح إجابات الجرامر</Button>
          {grammarResult && <div className="result-good" style={{ marginTop: '.6rem' }}>Grammar score: {grammarResult.score} / {grammarResult.max}</div>}
        </Card>}
      </>}
      {tab === 'practice' && <div className="stack">
        <Card className="activity-card">
          <SectionTitle title="يلا نتكلم" action={<Badge tone="blue">{talk.length || voices.length}</Badge>} />
          {(talk.length ? talk : ['اتكلم عن الدرس ده باستخدام الكلمات الجديدة.']).map((q, i) => <div key={i} className="req-item" style={{ marginTop: '.5rem' }}><span className="req-check">{i + 1}</span><span dir="ltr" className="en">{q}</span></div>)}
        </Card>
        <Card className="activity-card">
          <SectionTitle title="فويس نوتس" action={<Badge>WhatsApp</Badge>} />
          <p className="muted">جاوب على السؤالين دول بفويس نوتس على واتساب.</p>
          {voices.slice(0, 2).map((q, i) => <div key={i} className="section-card" style={{ marginTop: '.7rem' }}>
            <strong>{i + 1}. <span className="en" dir="ltr">{q}</span></strong>
            <div className="row" style={{ marginTop: '.6rem' }}>
              <a className="btn btn-primary btn-sm" href={`https://wa.me/201091060951?text=${encodeURIComponent('فويس نوت Speakozy — ' + q)}`}>ابعت فويس نوت</a>
            </div>
          </div>)}
        </Card>
        <Card>
          <SectionTitle title="كتابة" />
          <p className="muted">لخّص اللي فهمته من الدرس ده في 6 سطور على الأقل.</p>
          <textarea value={writing} onChange={(e) => setWriting(e.target.value)} placeholder={'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'} disabled={locked} />
          <div className="row" style={{ marginTop: '.6rem' }}>
            <span className="muted">{writingLines} / 6 lines</span>
            <Button size="sm" onClick={() => savePractice('writing', writing, 1)} disabled={locked || writingLines < 6}>احفظ الملخص</Button>
          </div>
        </Card>
      </div>}
      {tab === 'overview' && <div className="stack" dir={enMaterial ? 'ltr' : undefined}>
        <Card className="brief-card">
          <div className="brief-kicker">الدرس</div>
          <h2 className="en" dir="ltr">{outline.title}</h2>
          {outline.topic && <p className="muted en" dir="ltr">{outline.topic}</p>}
        </Card>
        <article className="brief-card">
          <div className="brief-kicker">الأهداف</div>
          <h3>الأهداف</h3>
          <ul className="brief-list">{outline.objectives.map((item, i) => <li key={i} className="en" dir="ltr">{item}</li>)}</ul>
        </article>
        <article className="brief-card">
          <div className="brief-kicker">الكلمات</div>
          <h3>الكلمات</h3>
          <p className="brief-summary en" dir="ltr">{outline.wordsAbout}</p>
          <button className="brief-jump" style={{ marginTop: '.7rem' }} onClick={() => setTab('vocabulary')}>افتح الكلمات</button>
        </article>
        <article className="brief-card">
          <div className="brief-kicker">الجرامر</div>
          <h3>الجرامر</h3>
          <p className="brief-summary en" dir="ltr">{outline.grammarAbout}</p>
          <button className="brief-jump" style={{ marginTop: '.7rem' }} onClick={() => setTab('grammar')}>افتح الجرامر</button>
        </article>
        <Card className="brief-card kind-summary">
          <div className="brief-kicker">الملخص</div>
          <p className="brief-summary en" dir="ltr">{outline.summary}</p>
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
  const qs = s ? sessionQuizItems(words, grammarFor(s.id), s.id, data.dictionary) : [];
  if (!user) return null;
  if (!s) return <Empty title="السيشن مش موجودة" />;
  if (!qs.length) return <Empty title="مفيش أسئلة للسيشن دي" hint="راجع خريطة المستويات." />;

  async function submit() {
    let auto = 0, max = 0, pending = 0;
    for (const q of qs) {
      const ans = answers[q.id] || '';
      const g = gradeQuestion(q as any, ans);
      max += q.points; auto += g.score;
      const status = g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending';
      if (!g.auto) pending++;
      await put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: q.id, answer: ans, autoScore: g.score, maxScore: q.points, status, createdAt: today() });
      if (g.auto && g.score > 0) await grantScore(user!.id, 'quiz', g.score, `answer-${q.id}-${user!.id}`);
    }
    await log('quiz-submit', s!.title);
    setResult({ auto, max, pending });
  }

  if (result) return <Card className="stack">
    <h2>الكويز خلص</h2>
    <div className={result.pending ? 'note' : 'result-good'}>
      <strong>Automated score: {result.auto} out of {result.max}</strong>
      {result.pending > 0 && <div>There are {result.pending} written answers to be reviewed by the admin. Final approval isn't immediate.</div>}
    </div>
    <div className="row"><Button onClick={() => go(`/session/${s.id}`)}>رجوع للسيشن</Button><Button variant="ghost" onClick={() => go('/roadmap')}>الخريطة</Button></div>
  </Card>;

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => go(`/session/${s.id}`)}>→ السيشن</button></div>
    <Card><h1>كويز: <span className="en" dir="ltr">{s.title}</span></h1><p className="muted">9 أسئلة. كمّل كل جملة بالكلمة الصح.</p></Card>
    {qs.map((q, i) => <Card key={q.id}>
      <div className="row between"><strong dir="ltr" className="en" style={{textAlign:"left"}}>{i + 1}. {q.prompt}</strong><Badge>{q.points} نقاط</Badge></div>
      <div style={{ marginTop: '.8rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${answers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} style={{ width: 'auto' }} /> <span className="en" dir="ltr">{o}</span></label>)}</div>
    </Card>)}
    <Card><div className="between"><span className="muted">الإجابات الكتابية بتتحفظ للمراجعة.</span><Button onClick={submit}>سلّم الإجابات</Button></div></Card>
  </div>;
}

export function DictionaryPage() {
  const { user, data, put, remove, demo } = useApp();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [tab, setTab] = useState('search');
  const [detail, setDetail] = useState<LookupEntry | null>(null);
  const [looking, setLooking] = useState(false);
  const [manual, setManual] = useState<any>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [globalHit, setGlobalHit] = useState<LookupEntry | null>(null);
  const [globalTick, setGlobalTick] = useState(0);
  const [yg, setYg] = useState<{ word: string; accent: string } | null>(null);
  if (!user) return null;

  const all = data.dictionary;
  const saved = data.savedWords.filter((w) => w.studentId === user.id);
  const globalEntries = allCached();
  const matches = (d: any) => {
    const matchesType = type === 'all' || d.type === type;
    const hay = (d.word + ' ' + d.meaning + ' ' + d.arabic + ' ' + (d.examples || []).join(' ')).toLowerCase();
    return matchesType && (!q || hay.includes(q.trim().toLowerCase()));
  };
  const seen = new Set<string>();
  const localResults = [...all, ...globalEntries].filter((d: any) => {
    const key = d.word.toLowerCase();
    if (seen.has(key) || !matches(d)) return false;
    seen.add(key); return true;
  }).slice(0, 120);
  const savedResults = saved.filter((d) => !q || (d.word + d.meaning).toLowerCase().includes(q.toLowerCase()));
  const types = ['all', ...Array.from(new Set(all.map((d) => d.type)))];
  const suggestions = q.trim().length >= 1
    ? all.filter((d) => d.word.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];
  const wordOfDay = all[(new Date().getDate() * 7) % all.length];
  const reviewList = saved.filter((w) => w.review);
  const reviewCard = reviewList[reviewIdx % Math.max(1, reviewList.length)];

  useEffect(() => {
    let alive = true;
    const term = q.trim();
    setGlobalHit(null);
    if (term.length < 2) return;
    const timer = setTimeout(async () => {
      const entry = await lookupWord(term, all);
      if (alive && entry && entry.source !== 'local') setGlobalHit(entry);
    }, 700);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, globalTick]);

  function isSaved(word: string) { return saved.some((w) => w.word.toLowerCase() === word.toLowerCase()); }

  async function showWord(word: string) {
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
    const next = new Date(Date.now() + (known ? 3 : 1) * 86400000).toISOString();
    await put('savedWords', { ...w, review: !known, nextReview: next });
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
      <div className="row"><span style={{ fontSize: '1.4rem' }}>🔎</span><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) showWord(q); }} placeholder="اكتب أي كلمة... مثال: serendipity" aria-label="دوّر في الديكشنري" /></div>
      {suggestions.length > 0 && <div className="dict-suggest">{suggestions.map((d) => <button key={d.id} type="button" className="dict-suggest-item en" dir="ltr" onClick={() => { setQ(d.word); showWord(d.word); }}>{d.word}</button>)}</div>}
      <div className="row" style={{ marginTop: '.7rem', justifyContent: 'space-between' }}>
        <div className="row">{types.map((t) => <button key={t} className={`tab ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t === 'all' ? 'الكل' : t}</button>)}</div>
        <div className="row"><Button size="sm" variant="ghost" onClick={() => setManual({ word: q.trim(), meaning: '', type: 'noun', examples: '' })}>+ ضيف كلمة</Button><Button size="sm" onClick={() => q.trim() && showWord(q)} disabled={!q.trim() || looking}>{looking ? 'بندوّر...' : 'دوّر عالميًا'}</Button></div>
      </div>
      {q.trim() && !looking && <div className="muted" style={{ marginTop: '.5rem', fontSize: '.82rem' }}>
        نتايج محلية: {localResults.length} · <button className="icon-btn" onClick={() => showWord(q)}>دوّر عالميًا عن "{q}" ←</button>
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
        <div className="row"><Button variant="ghost" onClick={() => speak(wordOfDay.word)}>🔊</Button><Button onClick={() => showWord(wordOfDay.word)}>افتح الكارت</Button></div>
      </div>
    </Card>}

    <Tabs tabs={[{ id: 'search', label: 'بحث' }, { id: 'saved', label: `كلماتي (${saved.length})` }, { id: 'review', label: `مراجعة (${reviewList.length})` }]} active={tab} onChange={setTab} />

    {tab === 'search' && <div className="grid g2">
      <Card>
        <SectionTitle title={q ? `Results (${localResults.length})` : `All words (${localResults.length})`} />
        {localResults.length ? <div className="stack">{localResults.map((d) => <div key={d.id} className="word-row">
          <button className="icon-btn" onClick={() => setDetail({ ...d, source: d.source || 'local' })}><strong className="en">{d.word}</strong></button>
          <span className="muted" dir="rtl">{d.meaning}</span>
          <div className="row"><Badge>{d.type}</Badge><button className="icon-btn" onClick={() => pronounce(d)}>🔊</button><Button size="sm" variant={isSaved(d.word) ? 'ghost' : 'primary'} onClick={() => toggle(d)}>{isSaved(d.word) ? '✓' : 'حفظ'}</Button></div>
        </div>)}</div> : <Empty icon="🔍" title="مفيش نتايج محلية" hint="هنجرّب المصدر العالمي تلقائيًا، أو تقدر تضيف الكلمة بنفسك." />}
      </Card>
      <Card><SectionTitle title="ملاحظات" />
        <div className="note">البحث بيشمل الكلمة والمعنى والشرح والأمثلة. لو الكلمة مش موجودة، المصدر العالمي هيجيب تعريفها، ولو مفيش نت تقدر تضيفها يدويًا.</div>
        <div className="stack" style={{ marginTop: '1rem' }}>{saved.slice(0, 6).map((w) => <div key={w.id} className="row between"><strong className="en">{w.word}</strong><span className="muted" dir="rtl">{w.meaning}</span></div>)}</div>
      </Card>
    </div>}

    {tab === 'saved' && <Card>
      <SectionTitle title={`الكلمات المحفوظة (${savedResults.length})`} action={<Badge tone="blue">{saved.filter((w) => w.review).length} محتاجة مراجعة</Badge>} />
      {savedResults.length ? <div className="saved-grid">{savedResults.map((w) => <div key={w.id} className={`saved-card ${w.review ? 'needs-review' : ''}`}>
        <div className="saved-word en" dir="ltr">{w.word}</div>
        {w.transcript && <div className="saved-transcript en" dir="ltr">{w.transcript}</div>}
        <div className="saved-meaning" dir="rtl">{w.meaning}</div>
        <div className="saved-actions">
          <button className={`icon-btn ${w.review ? '' : 'is-on'}`} title={w.review ? 'علّم إنها اتذاكرت' : 'علّم إنها محتاجة مراجعة'} onClick={() => markReview(w, w.review)}>{w.review ? '✓' : '↺'}</button>
          <button className="icon-btn" title="اسمع النطق" onClick={() => pronounce(w)}>🔊</button>
          <button className="icon-btn danger" title="حذف" onClick={() => remove('savedWords', w.id)}>🗑</button>
        </div>
      </div>)}</div> : <Empty title="لسه ما حفظتش أي كلمات" hint="احفظ أي كلمة من البحث أو من السيشنات." />}
    </Card>}

    {tab === 'review' && <Card>
      <SectionTitle title="مراجعة سريعة" />
      {reviewList.length ? <div className="flashcard">
        <div className="muted">كلمة للمراجعة ({reviewIdx % reviewList.length + 1} من {reviewList.length})</div>
        <h2 dir="ltr" className="en">{reviewCard?.word}</h2>
        {showMeaning ? <div className="result-good" dir="rtl">{reviewCard?.meaning}</div> : <Button variant="ghost" onClick={() => setShowMeaning(true)}>وريني المعنى</Button>}
        {showMeaning && <div className="row" style={{ marginTop: '1rem' }}><Button onClick={() => markReview(reviewCard, true)}>عرفتها ✓</Button><Button variant="danger" onClick={() => markReview(reviewCard, false)}>محتاجة تدريب أكتر</Button></div>}
      </div> : <Empty icon="🎴" title="كل الكلمات محفوظة تمام" hint="علامة «محتاجة تدريب أكتر» هتخلي الكلمة تظهر هنا." />}
    </Card>}

    <Modal open={!!detail} title="كارت الكلمة" onClose={() => setDetail(null)}>
      {detail && <div className="stack">
        <div className="between"><div><h2 dir="ltr" className="en" style={{ fontSize: '1.9rem' }}>{detail.word}</h2>
          <div className="row"><Badge tone="green">{detail.type}</Badge>{detail.phonetic && <span className="muted" dir="ltr">{phon(detail.phonetic)}</span>}<Badge tone={detail.source === 'global' ? 'blue' : 'muted'}>{detail.source === 'global' ? 'الديكشنري العالمي' : detail.source === 'manual' ? 'إضافة يدوية' : 'من المنهج'}</Badge></div></div>
          <Button variant="ghost" onClick={() => pronounce(detail)}>🔊 اسمع النطق</Button></div>
        <div className="section-card"><h3>المعنى</h3><p className="en" dir="ltr">{detail.meaning}</p>
          {detail.arabic && <p dir="rtl">{detail.arabic}</p>}
          {detail.definitions && <div className="stack" style={{ marginTop: '.5rem' }}>{detail.definitions.map((d, i) => <div key={i} className="muted en" dir="ltr">• {d}</div>)}</div>}
        </div>
        {detail.phonetic && <div className="section-card"><h3>النطق المكتوب</h3><p className="en" dir="ltr">{phon(detail.phonetic)}</p></div>}
        <div className="section-card"><h3>اسمعها في الاستخدام</h3>
          <div className="youglish-btns">{YOUGLISH_ACCENTS.map((a) => <button key={a.code} type="button" className="yg-btn en" onClick={() => setYg({ word: detail.word, accent: a.code })}>{a.label}</button>)}</div>
        </div>
        {detail.synonyms && detail.synonyms.length > 0 && <div className="section-card"><h3>المرادفات</h3><div className="row">{detail.synonyms.map((x) => <span key={x} className="word-chip en">{x}</span>)}</div></div>}
        <div className="section-card"><h3>أمثلة</h3>{detail.examples.length ? detail.examples.map((ex, i) => <div key={i} className="en" dir="ltr" style={{ textAlign: 'left', lineHeight: 1.9 }}>{ex}</div>) : <p className="muted">مفيش أمثلة متاحة.</p>}</div>
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

export function TasksPage() {
  const { user, data, put, remove } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!user) return null;
  const mine = data.tasks.filter((t) => t.active && (t.targetType === 'all' || (t.targetType === 'student' && t.targetId === user.id) || (t.targetType === 'level' && t.targetId === user.levelId)));
  const doneIds = data.taskCompletions.filter((c) => c.studentId === user.id).map((c) => c.taskId);
  const isDone = (t: any) => doneIds.includes(t.id);
  const levelTasks = mine.filter((t) => (t.instructions || []).length > 0).sort((a, b) => (a.order || 0) - (b.order || 0));
  const otherTasks = mine.filter((t) => !(t.instructions || []).length);
  const weeks = [...new Set(levelTasks.map((t) => t.week || 1))].sort((a, b) => a - b);
  const level = data.levels.find((l) => l.id === user.levelId);
  const taskLocked = (t: any) => user.subscribed === false && (t.week || 1) > 1;
  async function toggle(t: any) {
    if (taskLocked(t)) return;
    const existing = data.taskCompletions.find((c) => c.studentId === user!.id && c.taskId === t.id);
    if (existing) await remove('taskCompletions', existing.id);
    else await put('taskCompletions', { taskId: t.id, studentId: user!.id, completedAt: today() });
  }
  return <div className="stack">
    <div><h1>تاسكاتي اليومية</h1><p className="muted">دي تاسكات يوميه علشان تتكلم كل يوم. هتسجّل ريكورد بتقرا أو بتجاوب على السؤال في تاسك اليوم وتبعته على جروب الواتساب.</p>
      <a className="btn btn-primary btn-sm" style={{ marginTop: '.6rem' }} href="https://wa.me/201091060951?text=%D8%A8%D8%B9%D8%AA%20%D8%AA%D8%A7%D8%B3%D9%83%20%D8%A7%D9%84%D9%8A%D9%88%D9%85" target="_blank" rel="noreferrer">واتساب</a></div>
    <div className="grid g3">
      <Stat label="إجمالي التاسكات" value={mine.length} />
      <Stat label="خلصت" value={mine.filter(isDone).length} tone="green" />
      <Stat label="الباقي" value={mine.filter((t) => !isDone(t)).length} />
    </div>
    {levelTasks.length ? <>
      <Card className="row between" style={{ gap: '1rem' }}>
        <div><strong>{level?.title || 'مستواك'} · Level tasks</strong><div className="muted">{levelTasks.filter(isDone).length} / {levelTasks.length} completed</div></div>
        <div className="progress-track" style={{ flex: 1, maxWidth: 260, marginTop: 0 }}><span style={{ width: `${levelTasks.length ? Math.round((levelTasks.filter(isDone).length / levelTasks.length) * 100) : 0}%` }} /></div>
      </Card>
      {weeks.map((w) => {
        const list = levelTasks.filter((t) => (t.week || 1) === w);
        const first = list[0];
        return <Card key={w}>
          <SectionTitle title={`أسبوع ${w} — ${first?.topic || ''}`} action={<Badge tone="blue">{list.filter(isDone).length}/{list.length}</Badge>} />
          {first?.grammar && <div className="muted" style={{ fontSize: '.82rem', marginBottom: '.6rem' }} dir="ltr">{first.grammar}</div>}
          <div className="stack">
            {list.map((t) => {
              const done = isDone(t);
              const open = expanded === t.id;
              return <div key={t.id} className={`task-item ${done ? 'is-done' : ''}`}>
                <div className="task-item-head">
                  <button className={`task-check ${done ? 'checked' : ''}`} onClick={() => toggle(t)} disabled={taskLocked(t)} aria-label={done ? 'علّم إنها ما خلصتش' : 'علّم إنها خلصت'}>{done ? '✓' : ''}</button>
                  <button className="task-item-title" onClick={() => setExpanded(open ? null : t.id)}>
                    <span className="task-badge">{t.badge || t.kind}</span>
                    <strong>{t.title}</strong>
                    <span className="task-caret">{open ? '⌃' : '⌄'}</span>
                  </button>
                </div>
                {open && <div className="task-instructions" dir="ltr">
                  {(t.instructions || []).map((ins, i) => <div key={i} className="task-ins"><span className="task-ins-num">{i + 1}.</span><span>{ins}</span></div>)}
                </div>}
              </div>;
            })}
          </div>
        </Card>;
      })}
    </> : <Card><Empty icon="🗂️" title={`مفيش تاسكات لـ ${level?.title || 'مستواك'} لسه`} hint="تاسكات المستوى هتظهر هنا أول ما تتضاف لمستواك." /></Card>}
    {otherTasks.length > 0 && <Card>
      <SectionTitle title="تاسكات تانية" />
      <div className="stack">{otherTasks.map((t) => <div key={t.id} className="row between section-card">
        <div><strong>{t.title}</strong>{t.dueAt && <div className="muted">{fmtDate(t.dueAt)} · {t.kind}</div>}</div>
        {isDone(t) ? <Badge tone="green">خلصت</Badge> : <Button size="sm" onClick={() => toggle(t)} disabled={taskLocked(t)}>تم</Button>}
      </div>)}</div>
    </Card>}
  </div>;
}

export function NotificationsPage() {
  const { user, data, put } = useApp();
  if (!user) return null;
  const list = data.notifications.filter((n) => n.targetId === 'all' || n.targetId === user.id || n.targetId === user.levelId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  async function markRead(n: any) {
    if (n.read) return;
    if (user!.role === 'admin') await put('notifications', { ...n, read: true });
    else await put('notificationReads', { id: `${user!.id}-${n.id}`, studentId: user!.id, notificationId: n.id, read: true });
  }
  return <div className="stack">
    <div><h1>الإشعارات</h1><p className="muted">إشعارات الموقع متاحة دايمًا. إشعارات الجهاز محتاجة إذنك.</p></div>
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
    <Tabs tabs={[{ id: 'weekly', label: 'أسبوعي' }, { id: 'monthly', label: 'شهري' }, { id: 'total', label: 'كل الوقت' }]} active={period} onChange={setPeriod} />
    {!data.settings.leaderboard.enabled ? <Card><Empty icon="🔒" title="لوحة الأبطال متوقفة حاليًا" hint="الأدمن قرر يخفيها مؤقتًا." /></Card> : <Card>
      {board.length ? <div className="stack">{board.map((b, i) => <div key={b.id} className={`row between section-card ${b.id === user.id ? 'done' : ''}`}>
        <div className="row"><span className="node-num">{i + 1}</span><span className="champ-avatar">{b.avatar || b.name.charAt(0)}</span><strong>{b.name}</strong>{b.id === user.id && <Badge tone="green">أنت</Badge>}</div>
        <strong className="green">{b.points} points</strong>
      </div>)}</div> : <Empty title="مفيش مشاركين لسه" />}
    </Card>}
    {mine > 0 && <div className="note">Your current rank: #{mine}. Changes from the previous period will appear when comparison history is available.</div>}
  </div>;
}

export const AVATARS = ['🦁','🐯','🦊','🐼','🐨','🦄','🐬','🦅','🐺','🦖','🐙','🦋','🐢','🦜','🐝','🦩','🐳','🦈','🐸','🦉','🌟','🚀','🎯','⚡','🌈','🎧','⚽','📚','🏀','🎮','🎸','🎨','🏆','🥇','🎓','✏️','🧠','💡','🔥','💎','🌙','☀️','🌊','🍀','🌵','🍕','🍩','🧋','🦸','🧑‍🚀','🧑‍🎤','🧑‍💻','🥷','🤖','👑','🎩','🕶️','🧢','👟','🛹','🚲','✈️','🗺️','🧭','⛰️','🏝️','🎪','🎢','🪁','🎲','🧩','🪄'];

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
    <Card className="row" style={{ gap: '1rem' }}><span className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{user.avatar || user.name.charAt(0)}</span>
      <div><h2>{user.name}</h2><div className="muted">{user.email}</div><div className="row" style={{ marginTop: '.4rem' }}><Badge tone="green">{level?.title || '—'}</Badge><Badge>آخر مستوى: {data.levels.find((l) => l.id === user.maxLevelId)?.title || '—'}</Badge></div></div>
    </Card>
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
  const levelId = selected || user.levelId || levels[0]?.id;
  const level = data.levels.find((l) => l.id === levelId) || current;
  const sessions = data.sessions.filter((s) => s.levelId === level?.id).sort((a, b) => a.order - b.order);
  const partial = level ? (!admin && !levelFullyOpen(user, level, data.levels)) : false;
  const en = true;
  const L = en ? { title:'Materials', hint:'Pick a level from the list. All levels are available for browsing.', level:'Level', words:'words', ready:'Ready', locked:'Locked', open:'Open lesson', none:'No materials in this level', noneHint:'Materials will appear here once lessons are added.', lesson:'Lesson', pdf:'Open PDF', dl:'Download' } :
    { title:'الماتيريال', hint:'اختار مستوى من القائمة — كل المستويات متاحة للتصفح.', level:'المستوى', words:'كلمة', ready:'جاهز', locked:'مقفول', open:'افتح الدرس', none:'مفيش ماتيريال في المستوى ده', noneHint:'الماتيريال هتظهر هنا أول ما الدروس تتضاف.', lesson:'الدرس', pdf:'افتح PDF ↗', dl:'نزّل PDF ⬇' };
  return <div className="stack" dir={en ? 'ltr' : undefined}>
    <div><h1>{L.title}</h1><p className="muted">{L.hint}</p></div>
    <Card>
      <Field label={L.level}><select value={levelId} onChange={(e) => setSelected(e.target.value)}>
        {levels.map((l) => {
          const full = admin || levelFullyOpen(user, l, data.levels);
          return <option key={l.id} value={l.id}>{levelLabel(l)}</option>;
        })}
      </select></Field>
      {level && <div className="row" style={{ marginTop: '.2rem' }}><Badge tone={partial ? 'muted' : 'green'}>{levelLabel(level)}</Badge><Badge tone="blue">{sessions.length} {en ? 'lessons' : 'دروس'}</Badge></div>}
    </Card>
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
          {materialPdf(s) && <><a className="btn btn-primary btn-sm" href={materialPdf(s)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{L.pdf}</a><a className="btn btn-ghost btn-sm" href={materialPdf(s)} download onClick={(e) => e.stopPropagation()}>{L.dl}</a></>}
          <Button size="sm" disabled={sessionLocked} onClick={() => go(`/session/${s.id}`)}>{sessionLocked ? L.locked : L.open}</Button>
        </div>
      </Card>;
    })}</div> : <Empty icon="📂" title={L.none} hint={L.noneHint} />}
  </div>;
}

export function LevelExamPage({ levelId }: any) {
  const { user, data, put, grantScore, log } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  if (!user) return null;
  const level = data.levels.find((l) => l.id === levelId);
  const qs = data.questions.filter((q) => q.levelId === levelId);
  const locked = level ? !levelFullyOpen(user, level, data.levels) : false;

  async function submit() {
    let auto = 0, max = 0, pending = 0;
    for (const q of qs) {
      const ans = answers[q.id] || '';
      const g = gradeQuestion(q, ans);
      auto += g.score; max += q.points;
      if (!g.auto) pending++;
      await put('attempts', { id: uid(), studentId: user!.id, sessionId: '', questionId: `exam:${levelId}:${q.id}`, answer: ans, autoScore: g.score, maxScore: q.points, status: g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending', createdAt: today() });
    }
    await grantScore(user!.id, 'levelQuiz', auto, `exam-${levelId}-${user!.id}`);
    await log('level-exam', `${level?.title || levelId} · ${auto}/${max}`);
    setResult({ auto, max, pending });
  }

  if (result) return <Card className="stack">
    <h2>اختبار المستوى خلص</h2>
    <div className={result.pending ? 'note' : 'result-good'}><strong>Score: {result.auto} out of {result.max}</strong>{result.pending > 0 && <div>{result.pending} written answers are waiting for admin review.</div>}</div>
    <div className="row"><Button onClick={() => go('/roadmap')}>رجوع للخريطة</Button></div>
  </Card>;

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

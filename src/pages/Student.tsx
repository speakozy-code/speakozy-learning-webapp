import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, Progress, Stat, SectionTitle, Empty, Tabs, Field, Modal, fmtDate, fmtDay, isLate } from '../components/UI';
import { sessionStatus, levelProgress, engagementProgress, sessionOpen, levelFullyOpen, wordProgressId, practiceId, totalScore, leaderboard, gradeQuestion, uid, today } from '../lib/domain';
import { go } from '../App';
import { lookupWord, allCached, type LookupEntry } from '../lib/dictionaryProvider';
import { grammarSlides } from '../lib/lessonContent';
import { overviewOutline, sourceTranscript, letsTalk, voicePrompts } from '../lib/lessonBrief';
import { wordQuizItems, grammarQuizItems, sessionQuizItems } from '../lib/sessionQuizzes';
import { YOUGLISH_ACCENTS } from '../lib/youglish';
import { YouGlishDock } from '../components/YouGlishDock';
import { Play, Volume2, Star, Check, BookOpen } from 'lucide-react';

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
  return s?.pdfUrl || MATERIAL_PDF[s?.id] || (s?.id === 'l7-s8' ? './travel-b1-handout.pdf' : '');
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
        <div><div className="muted" style={{ color: '#9fb0c9' }}>Hi {user.name} 👋</div><h1 style={{ marginTop: '.35rem' }}>Ready to pick up where you left off?</h1>
          <div className="row" style={{ marginTop: '.8rem' }}>
            <Badge tone="green">{level?.title || 'No level'}</Badge>
            <span style={{ color: '#b8c4d6', fontSize: '.85rem' }}>{user.subscribed === false ? 'First session of every level is open · subscribe to unlock full levels' : `Full access: ${data.levels.filter((l) => levelFullyOpen(user, l, data.levels)).length} of ${data.levels.length} levels · other levels open their first session only`}</span>
          </div>
        </div>
        <Button onClick={() => go(next ? `/session/${next.id}` : '/roadmap')}>{next ? 'Continue studying' : 'Open roadmap'}</Button>
      </div>
    </Card>

    <Card>
      <SectionTitle title="Speakozy Champs" action={<span className="muted" style={{ fontSize: '.8rem' }}>Top scorers</span>} />
      {leaderboard(data).length ? <div className="champs-strip">
        {leaderboard(data).slice(0, 10).map((b, i) => <div key={b.id} className={`champ-chip ${b.id === user.id ? 'is-me' : ''}`}>
          <span className="champ-rank">{i + 1}</span>
          <span className="champ-avatar">{b.avatar || b.name.charAt(0)}</span>
          <span className="champ-name">{b.name}{b.id === user.id ? ' (You)' : ''}</span>
          <strong className="champ-points">{b.points} pts</strong>
        </div>)}
      </div> : <Empty title="No ranked students yet" />}
    </Card>

    <div className="grid g4">
      <Stat label="Level progress" value={`${pct}%`} sub={level?.title} tone="green" />
      <Stat label="Total points" value={totalScore(data, user.id)} sub="From all sources" />
      <Stat label="Approved quizzes" value={approved} sub={pending ? `and ${pending} awaiting review` : 'Nothing pending'} />
      <Stat label="Late tasks" value={late.length} sub={late.length ? 'Review them today' : 'Everything is on track'} tone={late.length ? 'danger' : ''} />
    </div>

    <Card>
      <div className="between"><div><h3>Your progress in {level?.title || 'the level'}</h3><small className="muted">{sessions.filter((s) => sessionStatus(data, s, user.id).key === 'approved').length} of {sessions.length} approved sessions</small></div></div>
      <div style={{ marginTop: '.8rem' }}><Progress value={pct} /></div>
    </Card>

    <div className="grid g2">
      <Card>
        <SectionTitle title="Upcoming session" action={<button className="icon-btn" onClick={() => go('/roadmap')}>View all ←</button>} />
        {next ? <div className="stack">
          <div className="row between"><strong>{next.title}</strong><Badge tone={statusTone[sessionStatus(data, next, user.id).key]}>{sessionStatus(data, next, user.id).label}</Badge></div>
          <small className="muted">{next.topic} · {fmtDay(next.dueAt)}</small>
          <Button variant="ghost" onClick={() => go(`/session/${next.id}`)}>Open session</Button>
        </div> : <Empty title="No sessions available right now" hint="They'll appear here once your admin opens a new session for you." />}
      </Card>
      <Card>
        <SectionTitle title="Latest notifications" action={<button className="icon-btn" onClick={() => go('/notifications')}>All ←</button>} />
        {notes.length ? <div className="stack">{notes.map((n) => <div key={n.id} className="row between" style={{ alignItems: 'flex-start' }}>
          <div><strong style={{ fontSize: '.9rem' }}>{n.title}</strong><div className="muted" style={{ fontSize: '.82rem' }}>{n.body}</div></div>
          {!n.read && <span className="badge badge-green">New</span>}
        </div>)}</div> : <Empty title="No notifications" />}
      </Card>
    </div>

    {late.length > 0 && <Card className="danger-zone">
      <SectionTitle title="Late tasks" />
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
    <div><h1>LEVEL ROADMAP</h1><p className="muted">Two views in one place: your sessions first, then the full level path. Both are for reading — study from the dashboard or materials.</p></div>
    <Card className="roadmap-card">
      <SectionTitle title={`Sessions · ${currentLevel?.title || '—'}`} action={<Badge tone="blue">{levelSessions.length} sessions</Badge>} />
      <div className="roadmap-map session-map">
        {levelSessions.map((s, i) => {
          const st = sessionStatus(data, s, user.id);
          const open = sessionOpen(user, s, data.levels);
          return <div key={s.id} className={`rm-level ${open ? 'is-open' : 'is-locked'} ${i % 2 ? 'rm-right' : 'rm-left'}`}>
            <div className="rm-marker">{open ? i + 1 : '🔒'}</div>
            <div className="rm-body">
              <div className="between"><strong>{s.title}</strong><Badge tone={statusTone[st.key]}>{st.key === 'locked' ? 'Not started' : st.label}</Badge></div>
              <p className="muted" style={{ margin: '.3rem 0' }}>{s.topic} · {fmtDay(s.dueAt)}</p>
              <div className="muted" style={{ fontSize: '.8rem' }}>{data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id)).length} words · {s.sections.length} parts</div>
            </div>
          </div>;
        })}
      </div>
    </Card>
    <Card className="roadmap-card">
      <SectionTitle title="Levels" action={<Badge tone="blue">{levels.length} levels</Badge>} />
      <div className="roadmap-map">
        {levels.map((l, i) => {
          const sessions = data.sessions.filter((s) => s.levelId === l.id).sort((a, b) => a.order - b.order);
          const full = levelFullyOpen(user, l, data.levels);
          const pct = engagementProgress(data, l.id, user.id);
          const approved = sessions.filter((s) => sessionStatus(data, s, user.id).key === 'approved').length;
          return <div key={l.id} className={`rm-level is-open ${i % 2 ? 'rm-right' : 'rm-left'}`}>
            <div className="rm-marker">{i + 1}</div>
            <div className="rm-body">
              <div className="between"><strong>{l.title}</strong><Badge tone={full ? 'green' : 'muted'}>{full ? 'Full access' : 'First session only'}</Badge></div>
              <p className="muted" style={{ margin: '.3rem 0' }}>{l.description}</p>
              <div className="rm-dots">{sessions.map((s) => { const st = sessionStatus(data, s, user.id).key; return <span key={s.id} className={`rm-dot ${st === 'approved' ? 'done' : st === 'progress' || st === 'review' || st === 'done' ? 'active' : ''}`} title={s.title} />; })}</div>
              <div className="muted" style={{ fontSize: '.8rem' }}>{approved} of {sessions.length} sessions approved · {pct}% complete</div>
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
          const en = hit?.definitions?.[0] || (hit?.meaning && /^[A-Za-z]/.test(hit.meaning) ? hit.meaning : '');
          if (en) setDefs((d) => ({ ...d, [w.word]: en }));
        } catch {}
      }
    })();
    return () => { alive = false; };
  }, [tab, sessionId]);
  const s = data.sessions.find((x: any) => x.id === sessionId);
  if (!user) return null;
  if (!s) return <Empty title="Session not found" hint="It may have been removed or the link is wrong." />;
  const locked = !sessionOpen(user, s, data.levels);
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
  const slides = [...grammarSlides(s), ...customNotes];
  const outline = overviewOutline(s);
  const talk = letsTalk(s);
  const voices = voicePrompts(s);
  const transcript = sourceTranscript(s);
  const generatedWordQs = wordQuizItems(words, s.id, transcript).filter((q) => !qs.some((x) => x.prompt === q.prompt));
  const wordQs = generatedWordQs;
  const generatedGrammarQs = grammarQuizItems(slides, s.id, grammarQs.map((q) => q.prompt)).filter((q) => q.type === 'mcq');
  const grammarAll = generatedGrammarQs.length ? generatedGrammarQs : grammarQs;
  const quizNine = sessionQuizItems(words, slides, s.id, transcript);
  const allWordsStudied = words.length > 0 && words.every((w) => wordDone(w.word));
  const writingLines = writing.split(/\n/).map((x) => x.trim()).filter(Boolean).length;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'vocabulary', label: `Vocabulary${words.length ? ` (${words.length})` : ''}` },
    { id: 'grammar', label: 'Grammar' },
    { id: 'practice', label: 'Practice' },
    { id: 'quiz', label: 'Quiz (9)' },
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
    <div className="row"><button className="icon-btn" onClick={() => go('/roadmap')}>← Roadmap</button></div>
    <Card className="between">
      <div><div className="muted">Session {s.order} · {data.levels.find((l) => l.id === s.levelId)?.title}</div><h1>{s.title}</h1><p className="muted">{s.topic} · {fmtDate(s.dueAt)}</p></div>
      <Badge tone={locked ? 'muted' : statusTone[st.key]}>{locked ? '🔒 Locked' : st.label}</Badge>
    </Card>
    {locked && <div className="note">🔒 You can read everything in this session, but it is locked for your account. Ask your admin to unlock the level to study and save progress.</div>}
    <Card className="study-progress">
      <div className="between"><span className="muted">Session progress · {done.filter((d) => d.startsWith(`${s.id}-`) || d.startsWith('word:')).length} of {totalParts} parts done</span><strong>{pct}%</strong></div>
      <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
    </Card>
    {materialPdf(s) && <Card>
      <SectionTitle title="Presentation summary for review" />
      <p className="muted">A PDF copy of all presentation slides, for viewing and review after the session.</p>
      <a className="btn btn-ghost btn-sm" href={materialPdf(s)} target="_blank" rel="noreferrer">Open PDF ↗</a>
    </Card>}
    {s.driveUrl && <Card>
      <SectionTitle title="Additional resource to watch" />
      <p className="muted">Viewing only. If it doesn't open, the file permissions may be wrong — the written content here is complete.</p>
      <a className="btn btn-ghost btn-sm" href={s.driveUrl} target="_blank" rel="noreferrer">Open file ↗</a>
    </Card>}
    <div className="lesson-tabs">{tabs.map((t) => <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
    {tab === 'quiz' ? <Card>
      <div className="between"><div><h3>Session quiz</h3><small className="muted">9 questions on words and grammar · fill in the blank</small></div>
        <Button onClick={() => go(`/quiz/${s.id}`)} disabled={!quizNine.length || locked}>{quizNine.length ? 'Start quiz' : 'No questions yet'}</Button></div>
    </Card> : <>
      {tab === 'vocabulary' && (words.length > 0 ? <div className="stack">
        <div className="vocab-grid">{words.map((w, n) => {
        const def = defs[w.word] || w.definitions?.[0] || '';
        const example = (w.examples || [])[0] || '';
        const known = wordDone(w.word);
        return <article key={w.id} className={`vocab-card ${known ? 'is-done' : ''}`}>
          <div className="vocab-top">
            <span className="vocab-index">{String(n + 1).padStart(2, '0')}</span>
            <Badge tone="blue">{w.type || 'word'}</Badge>
            <span className="vocab-tools">
              <button className="icon-btn play-btn" title="Hear this word in real speech" onClick={() => openYouglish(w.word)}><Play size={16} /></button>
              <button className="icon-btn" title="Play native pronunciation" onClick={() => pronounce(w)}><Volume2 size={16} /></button>
              <button className="icon-btn" title={savedWord(w.word) ? 'Remove from my words' : 'Save word'} onClick={() => toggleSave(w)} disabled={locked}>{savedWord(w.word) ? <Star size={16} /> : <Star size={16} strokeWidth={1.5} />}</button>
            </span>
          </div>
          <div className="vocab-word en" dir="ltr">{w.word}</div>
          {w.phonetic && <div className="vocab-phonetic en" dir="ltr">/{w.phonetic}/</div>}
          <div className="vocab-meaning" dir="rtl">{w.arabic || w.meaning}</div>
          {def && <div className="vocab-def en" dir="ltr">{def}</div>}
          {example && <div className="vocab-example en" dir="ltr">“{example}”</div>}
          <div className="youglish-row">
            <span className="youglish-label">Hear it in use</span>
            <span className="youglish-btns">
              {YOUGLISH_ACCENTS.map((a) => <button key={a.code} type="button" className="yg-btn en"
                onClick={() => openYouglish(w.word, a.code)}
                title={`Hear “${w.word}” in ${a.label} English`}>{a.label}</button>)}
            </span>
          </div>
          <button className={`btn vocab-known ${known ? 'btn-ghost' : 'btn-primary'}`} onClick={() => markWord(w.word)} disabled={locked || known}>
            {known ? '✓ Studied' : 'I know this word'}
          </button>
        </article>;
      })}</div>
        {!allWordsStudied && words.length > 0 && <div className="note">Mark every word as studied to open the word quiz.</div>}
        {allWordsStudied && wordQs.length > 0 && <Card className="grammar-training">
          <div className="between"><div><h3>Word quiz</h3><small className="muted">Check the new words from this session.</small></div><Badge tone="green">{wordQs.length} questions</Badge></div>
          <div className="stack" style={{ marginTop: '.8rem' }}>{wordQs.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{wordResult && <Badge tone={wordResult.marks[q.id] ? 'green' : 'red'}>{wordResult.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            {q.options.length ? <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${wordAnswers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={wordAnswers[q.id] === o} onChange={() => setWordAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
              : <input value={wordAnswers[q.id] || ''} onChange={(e) => setWordAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="Type the missing word…" disabled={locked} dir="ltr" />}
          </div>)}</div>
          <Button style={{ marginTop: '.8rem' }} onClick={submitWordQuiz} disabled={locked || !wordQs.every((q) => (wordAnswers[q.id] || '').trim())}>Check word answers</Button>
          {wordResult && <div className="result-good" style={{ marginTop: '.6rem' }}>Word score: {wordResult.score} / {wordResult.max}</div>}
        </Card>}
      </div> : <Empty title="No words in this session" hint="Words will appear here once they are added to the dictionary." />)}
      {tab === 'grammar' && <>
        {slides.length ? <Card className="slides-card">
          <div className="between"><div><h3>Grammar slides</h3><small className="muted">One idea at a time — use the arrows to move through the lesson.</small></div><Badge tone="blue">{slideIdx + 1} / {slides.length}</Badge></div>
          <div className="slide-stage" key={`${s.id}-${slideIdx}`}>
            <div className="slide-kicker">GRAMMAR · {slideIdx + 1}</div>
            <h2>{slides[slideIdx].title}</h2>
            {slides[slideIdx].rule && <p className="slide-rule" dir="auto">{slides[slideIdx].rule}</p>}
            {slides[slideIdx].detail && <p className="slide-detail" dir="rtl">{slides[slideIdx].detail}</p>}
            {slides[slideIdx].examples.length > 0 && <div className="slide-examples">
              <div className="slide-examples-label">Examples</div>
              {slides[slideIdx].examples.map((ex, i) => <div key={i} className="slide-example en" dir="ltr">{ex}</div>)}
            </div>}
          </div>
          <div className="slides-nav">
            <Button variant="ghost" size="sm" onClick={() => setSlideIdx((i) => Math.max(0, i - 1))} disabled={slideIdx === 0}>← Previous</Button>
            <div className="slide-dots">{slides.map((_, i) => <button key={i} className={`slide-dot ${i === slideIdx ? 'active' : ''}`} onClick={() => setSlideIdx(i)} aria-label={`Slide ${i + 1}`} />)}</div>
            <Button size="sm" onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))} disabled={slideIdx === slides.length - 1}>Next →</Button>
          </div>
        </Card> : <Empty title="No grammar slides yet" hint="The grammar notes for this session will appear here as slides." />}
        {grammarAll.length > 0 && <Card className="grammar-training">
          <div className="between"><div><h3>Grammar training</h3><small className="muted">Practice comes after the slides.</small></div><Badge tone="green">{grammarAll.length} questions</Badge></div>
          <div className="stack" style={{ marginTop: '.8rem' }}>{grammarAll.map((q, i) => <div key={q.id} className="exercise-item">
            <div className="between"><strong>{i + 1}. {q.prompt}</strong>{grammarResult && <Badge tone={grammarResult.marks[q.id] ? 'green' : 'red'}>{grammarResult.marks[q.id] ? '✓ Correct' : `✗ ${String(q.correct)}`}</Badge>}</div>
            <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${grammarAnswers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={grammarAnswers[q.id] === o} onChange={() => setGrammarAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>
          </div>)}</div>
          <Button style={{ marginTop: '.8rem' }} onClick={submitGrammar} disabled={locked || !grammarAll.every((q) => grammarAnswers[q.id])}>Check grammar answers</Button>
          {grammarResult && <div className="result-good" style={{ marginTop: '.6rem' }}>Grammar score: {grammarResult.score} / {grammarResult.max}</div>}
        </Card>}
      </>}
      {tab === 'practice' && <div className="stack">
        <Card className="activity-card">
          <SectionTitle title="Let's talk" action={<Badge tone="blue">{talk.length || voices.length}</Badge>} />
          {(talk.length ? talk : ['Talk about this lesson using the new words.']).map((q, i) => <div key={i} className="req-item" style={{ marginTop: '.5rem' }}><span className="req-check">{i + 1}</span><span dir="ltr" className="en">{q}</span></div>)}
        </Card>
        <Card className="activity-card">
          <SectionTitle title="Voice notes" action={<Badge>WhatsApp</Badge>} />
          <p className="muted">Answer these two questions as voice notes on WhatsApp.</p>
          {voices.slice(0, 2).map((q, i) => <div key={i} className="section-card" style={{ marginTop: '.7rem' }}>
            <strong>{i + 1}. <span className="en" dir="ltr">{q}</span></strong>
            <div className="row" style={{ marginTop: '.6rem' }}>
              <a className="btn btn-primary btn-sm" href={`https://wa.me/201091060951?text=${encodeURIComponent('Speakozy voice note — ' + q)}`}>Send voice note</a>
            </div>
          </div>)}
        </Card>
        <Card>
          <SectionTitle title="Writing" />
          <p className="muted">Summarise what you understood from this lesson in at least 6 lines.</p>
          <textarea value={writing} onChange={(e) => setWriting(e.target.value)} placeholder={'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'} disabled={locked} />
          <div className="row" style={{ marginTop: '.6rem' }}>
            <span className="muted">{writingLines} / 6 lines</span>
            <Button size="sm" onClick={() => savePractice('writing', writing, 1)} disabled={locked || writingLines < 6}>Save summary</Button>
          </div>
        </Card>
      </div>}
      {tab === 'overview' && <div className="stack">
        <Card className="brief-card">
          <div className="brief-kicker">Lesson</div>
          <h2>{outline.title}</h2>
          {outline.topic && <p className="muted">{outline.topic}</p>}
        </Card>
        <article className="brief-card">
          <div className="brief-kicker">Objectives</div>
          <h3>Objectives</h3>
          <ul className="brief-list">{outline.objectives.map((item, i) => <li key={i} className="en" dir="ltr">{item}</li>)}</ul>
        </article>
        <article className="brief-card">
          <div className="brief-kicker">Words</div>
          <h3>Words</h3>
          <p className="brief-summary en" dir="ltr">{outline.wordsAbout}</p>
          <button className="brief-jump" style={{ marginTop: '.7rem' }} onClick={() => setTab('vocabulary')}>Open words</button>
        </article>
        <article className="brief-card">
          <div className="brief-kicker">Grammar</div>
          <h3>Grammar</h3>
          <p className="brief-summary en" dir="ltr">{outline.grammarAbout}</p>
          <button className="brief-jump" style={{ marginTop: '.7rem' }} onClick={() => setTab('grammar')}>Open grammar</button>
        </article>
        <Card className="brief-card kind-summary">
          <div className="brief-kicker">Summary</div>
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
  const qs = s ? sessionQuizItems(words, grammarSlides(s), s.id, (s.sections || []).map((x: any) => x.body || '').join('\n')) : [];
  if (!user) return null;
  if (!s) return <Empty title="Session not found" />;
  if (!qs.length) return <Empty title="There are no questions for this session" hint="Check the roadmap." />;

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
    <h2>Quiz complete</h2>
    <div className={result.pending ? 'note' : 'result-good'}>
      <strong>Automated score: {result.auto} out of {result.max}</strong>
      {result.pending > 0 && <div>There are {result.pending} written answers to be reviewed by the admin. Final approval isn't immediate.</div>}
    </div>
    <div className="row"><Button onClick={() => go(`/session/${s.id}`)}>Back to session</Button><Button variant="ghost" onClick={() => go('/roadmap')}>Roadmap</Button></div>
  </Card>;

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => go(`/session/${s.id}`)}>← Session</button></div>
    <Card><h1>Quiz: {s.title}</h1><p className="muted">9 questions. Complete each sentence with the right word.</p></Card>
    {qs.map((q, i) => <Card key={q.id}>
      <div className="row between"><strong>{i + 1}. {q.prompt}</strong><Badge>{q.points} points</Badge></div>
      <div style={{ marginTop: '.8rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${answers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} style={{ width: 'auto' }} /> <span className="en" dir="ltr">{o}</span></label>)}</div>
    </Card>)}
    <Card><div className="between"><span className="muted">Written answers are saved for review.</span><Button onClick={submit}>Submit answers</Button></div></Card>
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
    <div><h1>Dictionary</h1><p className="muted">The dictionary is global: search {all.length} ready-made words, or type any English word and we'll fetch its definition from the global source automatically. You can save any word.</p></div>

    <Card className="search-hero">
      <div className="row"><span style={{ fontSize: '1.4rem' }}>🔎</span><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) showWord(q); }} placeholder="Type any word... e.g. serendipity" aria-label="Search the dictionary" /></div>
      {suggestions.length > 0 && <div className="dict-suggest">{suggestions.map((d) => <button key={d.id} type="button" className="dict-suggest-item en" dir="ltr" onClick={() => { setQ(d.word); showWord(d.word); }}>{d.word}</button>)}</div>}
      <div className="row" style={{ marginTop: '.7rem', justifyContent: 'space-between' }}>
        <div className="row">{types.map((t) => <button key={t} className={`tab ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t === 'all' ? 'All' : t}</button>)}</div>
        <div className="row"><Button size="sm" variant="ghost" onClick={() => setManual({ word: q.trim(), meaning: '', type: 'noun', examples: '' })}>+ Add word</Button><Button size="sm" onClick={() => q.trim() && showWord(q)} disabled={!q.trim() || looking}>{looking ? 'Searching...' : 'Search globally'}</Button></div>
      </div>
      {q.trim() && !looking && <div className="muted" style={{ marginTop: '.5rem', fontSize: '.82rem' }}>
        Local results: {localResults.length} · <button className="icon-btn" onClick={() => showWord(q)}>Search globally for "{q}" ←</button>
      </div>}
      {globalHit && <div className="global-hit">
        <div className="row between"><div><small className="muted">Global dictionary</small>
          <div className="row"><strong className="en" style={{ fontSize: '1.1rem' }}>{globalHit.word}</strong><Badge tone="blue">{globalHit.type}</Badge>{globalHit.phonetic && <span className="en muted" dir="ltr">{phon(globalHit.phonetic)}</span>}</div>
          <div className="en" dir="ltr">{globalHit.meaning}</div>
          {!!(globalHit.synonyms || []).length && <div className="row" style={{ marginTop: '.4rem' }}>{globalHit.synonyms!.slice(0, 6).map((x) => <span key={x} className="word-chip en">{x}</span>)}</div>}
        </div>
          <div className="row">
            <Button size="sm" variant="ghost" onClick={() => pronounce(globalHit)}>Listen</Button>
            <Button size="sm" variant="ghost" onClick={() => setYg({ word: globalHit.word, accent: 'us' })}>YouGlish</Button>
            <Button size="sm" onClick={() => toggle(globalHit)}>{isSaved(globalHit.word) ? 'Saved' : 'Add to my words'}</Button>
          </div>
        </div>
      </div>}
    </Card>

    {wordOfDay && <Card className="word-day">
      <div className="between"><div><div className="muted">Word of the day</div><h2 dir="ltr" className="en" style={{ fontSize: '1.7rem' }}>{wordOfDay.word}</h2><div>{wordOfDay.meaning} · {wordOfDay.type}</div></div>
        <div className="row"><Button variant="ghost" onClick={() => speak(wordOfDay.word)}>🔊</Button><Button onClick={() => showWord(wordOfDay.word)}>Open card</Button></div>
      </div>
    </Card>}

    <Tabs tabs={[{ id: 'search', label: 'Search' }, { id: 'saved', label: `My words (${saved.length})` }, { id: 'review', label: `Review (${reviewList.length})` }]} active={tab} onChange={setTab} />

    {tab === 'search' && <div className="grid g2">
      <Card>
        <SectionTitle title={q ? `Results (${localResults.length})` : `All words (${localResults.length})`} />
        {localResults.length ? <div className="stack">{localResults.map((d) => <div key={d.id} className="word-row">
          <button className="icon-btn" onClick={() => setDetail({ ...d, source: d.source || 'local' })}><strong className="en">{d.word}</strong></button>
          <span className="muted" dir="rtl">{d.meaning}</span>
          <div className="row"><Badge>{d.type}</Badge><button className="icon-btn" onClick={() => pronounce(d)}>🔊</button><Button size="sm" variant={isSaved(d.word) ? 'ghost' : 'primary'} onClick={() => toggle(d)}>{isSaved(d.word) ? '✓' : 'Save'}</Button></div>
        </div>)}</div> : <Empty icon="🔍" title="No local results" hint="We'll try the global source automatically, or you can add the word yourself." />}
      </Card>
      <Card><SectionTitle title="Notes" />
        <div className="note">Search includes the word, meaning, explanation, and examples. If a word isn't found, the global source will fetch its definition, and if you're offline you can add it manually.</div>
        <div className="stack" style={{ marginTop: '1rem' }}>{saved.slice(0, 6).map((w) => <div key={w.id} className="row between"><strong className="en">{w.word}</strong><span className="muted" dir="rtl">{w.meaning}</span></div>)}</div>
      </Card>
    </div>}

    {tab === 'saved' && <Card>
      <SectionTitle title={`Saved words (${savedResults.length})`} />
      {savedResults.length ? <div className="stack">{savedResults.map((w) => <div key={w.id} className="word-row">
        <div><strong className="en">{w.word}</strong><div className="muted" dir="rtl">{w.meaning}</div></div>
        <div className="row"><Button size="sm" variant="ghost" onClick={() => markReview(w, w.review)}>{w.review ? 'Reviewed' : 'Needs review'}</Button><Button size="sm" variant="danger" onClick={() => remove('savedWords', w.id)}>Delete</Button></div>
      </div>)}</div> : <Empty title="You haven't saved any words yet" hint="Save any word from search or from sessions." />}
    </Card>}

    {tab === 'review' && <Card>
      <SectionTitle title="Quick review" />
      {reviewList.length ? <div className="flashcard">
        <div className="muted">Word to review ({reviewIdx % reviewList.length + 1} of {reviewList.length})</div>
        <h2 dir="ltr" className="en">{reviewCard?.word}</h2>
        {showMeaning ? <div className="result-good" dir="rtl">{reviewCard?.meaning}</div> : <Button variant="ghost" onClick={() => setShowMeaning(true)}>Show meaning</Button>}
        {showMeaning && <div className="row" style={{ marginTop: '1rem' }}><Button onClick={() => markReview(reviewCard, true)}>I knew it ✓</Button><Button variant="danger" onClick={() => markReview(reviewCard, false)}>Needs more practice</Button></div>}
      </div> : <Empty icon="🎴" title="All words are well saved" hint="The &quot;Needs more practice&quot; mark will make the word appear here." />}
    </Card>}

    <Modal open={!!detail} title="Word card" onClose={() => setDetail(null)}>
      {detail && <div className="stack">
        <div className="between"><div><h2 dir="ltr" className="en" style={{ fontSize: '1.9rem' }}>{detail.word}</h2>
          <div className="row"><Badge tone="green">{detail.type}</Badge>{detail.phonetic && <span className="muted" dir="ltr">{phon(detail.phonetic)}</span>}<Badge tone={detail.source === 'global' ? 'blue' : 'muted'}>{detail.source === 'global' ? 'Global dictionary' : detail.source === 'manual' ? 'Manual entry' : 'From the curriculum'}</Badge></div></div>
          <Button variant="ghost" onClick={() => pronounce(detail)}>🔊 Listen to pronunciation</Button></div>
        <div className="section-card"><h3>Meaning</h3><p className="en" dir="ltr">{detail.meaning}</p>
          {detail.arabic && <p dir="rtl">{detail.arabic}</p>}
          {detail.definitions && <div className="stack" style={{ marginTop: '.5rem' }}>{detail.definitions.map((d, i) => <div key={i} className="muted en" dir="ltr">• {d}</div>)}</div>}
        </div>
        {detail.phonetic && <div className="section-card"><h3>Transcript</h3><p className="en" dir="ltr">{phon(detail.phonetic)}</p></div>}
        <div className="section-card"><h3>Hear it in use</h3>
          <div className="youglish-btns">{YOUGLISH_ACCENTS.map((a) => <button key={a.code} type="button" className="yg-btn en" onClick={() => setYg({ word: detail.word, accent: a.code })}>{a.label}</button>)}</div>
        </div>
        {detail.synonyms && detail.synonyms.length > 0 && <div className="section-card"><h3>Synonyms</h3><div className="row">{detail.synonyms.map((x) => <span key={x} className="word-chip en">{x}</span>)}</div></div>}
        <div className="section-card"><h3>Examples</h3>{detail.examples.length ? detail.examples.map((ex, i) => <div key={i} className="en" dir="ltr" style={{ textAlign: 'left', lineHeight: 1.9 }}>{ex}</div>) : <p className="muted">No examples available.</p>}</div>
        {(detail.sessionIds || []).length > 0 && <div className="section-card"><h3>Appears in sessions</h3>{detail.sessionIds!.map((sid) => { const sess = data.sessions.find((x) => x.id === sid); return sess ? <div key={sid}><button className="icon-btn" onClick={() => { setDetail(null); go(`/session/${sid}`); }}>{sess.title} ←</button></div> : null; })}</div>}
        <Button onClick={() => toggle(detail)}>{isSaved(detail.word) ? 'Remove from saved' : 'Add to my words'}</Button>
      </div>}
    </Modal>
    {yg && <YouGlishDock word={yg.word} accent={yg.accent} onAccent={(accent) => setYg({ word: yg.word, accent })} onClose={() => setYg(null)} />}

    <Modal open={!!manual} title="Add a word yourself" onClose={() => setManual(null)}>
      <Field label="Word"><input dir="ltr" value={manual?.word || ''} onChange={(e) => setManual({ ...manual, word: e.target.value })} /></Field>
      <Field label="Meaning in Arabic"><input value={manual?.meaning || ''} onChange={(e) => setManual({ ...manual, meaning: e.target.value })} /></Field>
      <Field label="Type"><select value={manual?.type || 'noun'} onChange={(e) => setManual({ ...manual, type: e.target.value })}>{['noun','verb','adjective','adverb','phrase','preposition'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Examples (one per line)"><textarea dir="ltr" value={manual?.examples || ''} onChange={(e) => setManual({ ...manual, examples: e.target.value })} /></Field>
      <Button onClick={saveManual} disabled={!manual?.word?.trim() || !manual?.meaning?.trim()}>Save word</Button>
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
  async function toggle(t: any) {
    const existing = data.taskCompletions.find((c) => c.studentId === user!.id && c.taskId === t.id);
    if (existing) await remove('taskCompletions', existing.id);
    else await put('taskCompletions', { taskId: t.id, studentId: user!.id, completedAt: today() });
  }
  return <div className="stack">
    <div><h1>My tasks</h1><p className="muted">Speaking tasks for your level. Record your voice and send it on the group, then mark the task done.</p></div>
    <div className="grid g3">
      <Stat label="Total tasks" value={mine.length} />
      <Stat label="Completed" value={mine.filter(isDone).length} tone="green" />
      <Stat label="Remaining" value={mine.filter((t) => !isDone(t)).length} />
    </div>
    {levelTasks.length ? <>
      <Card className="row between" style={{ gap: '1rem' }}>
        <div><strong>{level?.title || 'Your level'} · Level tasks</strong><div className="muted">{levelTasks.filter(isDone).length} / {levelTasks.length} completed</div></div>
        <div className="progress-track" style={{ flex: 1, maxWidth: 260, marginTop: 0 }}><span style={{ width: `${levelTasks.length ? Math.round((levelTasks.filter(isDone).length / levelTasks.length) * 100) : 0}%` }} /></div>
      </Card>
      {weeks.map((w) => {
        const list = levelTasks.filter((t) => (t.week || 1) === w);
        const first = list[0];
        return <Card key={w}>
          <SectionTitle title={`Week ${w} — ${first?.topic || ''}`} action={<Badge tone="blue">{list.filter(isDone).length}/{list.length}</Badge>} />
          {first?.grammar && <div className="muted" style={{ fontSize: '.82rem', marginBottom: '.6rem' }} dir="ltr">{first.grammar}</div>}
          <div className="stack">
            {list.map((t) => {
              const done = isDone(t);
              const open = expanded === t.id;
              return <div key={t.id} className={`task-item ${done ? 'is-done' : ''}`}>
                <div className="task-item-head">
                  <button className={`task-check ${done ? 'checked' : ''}`} onClick={() => toggle(t)} aria-label={done ? 'Mark as not done' : 'Mark as done'}>{done ? '✓' : ''}</button>
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
    </> : <Card><Empty icon="🗂️" title={`No tasks for ${level?.title || 'your level'} yet`} hint="Level tasks appear here as soon as they are added for your level." /></Card>}
    {otherTasks.length > 0 && <Card>
      <SectionTitle title="Other tasks" />
      <div className="stack">{otherTasks.map((t) => <div key={t.id} className="row between section-card">
        <div><strong>{t.title}</strong>{t.dueAt && <div className="muted">{fmtDate(t.dueAt)} · {t.kind}</div>}</div>
        {isDone(t) ? <Badge tone="green">Completed</Badge> : <Button size="sm" onClick={() => toggle(t)}>Done</Button>}
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
    <div><h1>Notifications</h1><p className="muted">Notifications on the site are always available. Device notifications need your permission.</p></div>
    <Card>{list.length ? <div className="stack">{list.map((n) => <div key={n.id} className={`section-card ${!n.read ? 'done' : ''}`}>
      <div className="row between"><strong>{n.title}</strong>{!n.read && <Badge tone="green">New</Badge>}</div>
      <p className="muted" style={{ margin: '.4rem 0' }}>{n.body}</p>
      <div className="row"><small className="muted">{fmtDate(n.createdAt)}</small>
        <Button size="sm" variant="ghost" onClick={async () => { await markRead(n); if (n.href) go(n.href.replace('#', '')); }}>Open</Button>
      </div>
    </div>)}</div> : <Empty title="No notifications" />}</Card>
  </div>;
}

export function LeaderboardPage() {
  const { user, data } = useApp();
  const [period, setPeriod] = useState('weekly');
  if (!user) return null;
  const board = leaderboard(data);
  const mine = board.findIndex((b) => b.id === user.id) + 1;
  return <div className="stack">
    <div><h1>Speakozy Champs</h1><p className="muted">Ranked by score. Names are abbreviated per the privacy setting, and no private data is shown.</p></div>
    <Tabs tabs={[{ id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }, { id: 'total', label: 'All time' }]} active={period} onChange={setPeriod} />
    {!data.settings.leaderboard.enabled ? <Card><Empty icon="🔒" title="The leaderboard is currently disabled" hint="The admin decided to hide it temporarily." /></Card> : <Card>
      {board.length ? <div className="stack">{board.map((b, i) => <div key={b.id} className={`row between section-card ${b.id === user.id ? 'done' : ''}`}>
        <div className="row"><span className="node-num">{i + 1}</span><span className="champ-avatar">{b.avatar || b.name.charAt(0)}</span><strong>{b.name}</strong>{b.id === user.id && <Badge tone="green">You</Badge>}</div>
        <strong className="green">{b.points} points</strong>
      </div>)}</div> : <Empty title="No participants yet" />}
    </Card>}
    {mine > 0 && <div className="note">Your current rank: #{mine}. Changes from the previous period will appear when comparison history is available.</div>}
  </div>;
}

export const AVATARS = ['🦁', '🐯', '🦊', '🐼', '🐨', '🦄', '🐬', '🦅', '🌟', '🚀', '🎯', '⚡', '🌈', '🎧', '⚽', '📚'];

export function ProfilePage() {
  const { user, data, resetDemo, demo, saveProfile } = useApp();
  const [savingAvatar, setSavingAvatar] = useState('');
  if (!user) return null;
  const level = data.levels.find((l) => l.id === user.levelId);
  const certs = data.certificates.filter((c) => c.studentId === user.id && c.status === 'active');
  const recent = data.scores.filter((s) => s.studentId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  async function pickAvatar(a: string) {
    setSavingAvatar(a);
    try { await saveProfile({ avatar: a }); } finally { setSavingAvatar(''); }
  }
  return <div className="stack">
    <div><h1>My profile</h1></div>
    <Card className="row" style={{ gap: '1rem' }}><span className="avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{user.avatar || user.name.charAt(0)}</span>
      <div><h2>{user.name}</h2><div className="muted">{user.email}</div><div className="row" style={{ marginTop: '.4rem' }}><Badge tone="green">{level?.title || '—'}</Badge><Badge>Max: {data.levels.find((l) => l.id === user.maxLevelId)?.title || '—'}</Badge></div></div>
    </Card>
    <Card>
      <SectionTitle title="Choose your avatar" action={savingAvatar ? <span className="muted">Saving…</span> : undefined} />
      <div className="avatar-grid">
        {AVATARS.map((a) => <button key={a} className={`avatar-pick ${user.avatar === a ? 'is-on' : ''}`} onClick={() => pickAvatar(a)} aria-label={`Avatar ${a}`}>{a}</button>)}
      </div>
    </Card>
    <div className="grid g3"><Stat label="Total points" value={totalScore(data, user.id)} tone="green" /><Stat label="Certificates" value={certs.length} /><Stat label="Saved words" value={data.savedWords.filter((w) => w.studentId === user.id).length} /></div>
    <Card><SectionTitle title="Score history" />
      {recent.length ? <div className="stack">{recent.map((s) => <div key={s.id} className="row between"><span>{s.source}</span><span className="row"><strong>+{s.points}</strong><small className="muted">{fmtDate(s.createdAt)}</small></span></div>)}</div> : <Empty title="No points yet" />}
    </Card>
    {demo && <Card className="danger-zone"><SectionTitle title="Demo data" />
      <p className="muted">If you're using an old version of the data, reset to load the full new curriculum.</p>
      <Button variant="danger" onClick={() => { resetDemo(); go('/'); }}>Reset demo data</Button>
    </Card>}
    <Card><SectionTitle title="My certificates" />
      {certs.length ? certs.map((c) => <div key={c.id} className="row between"><span>{c.levelIds.join(', ')}</span><Badge tone="green">{c.number}</Badge></div>) : <Empty title="No certificate yet" hint="A certificate is issued after the admin approves level completion." />}
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
  return <div className="stack">
    <div><h1>MATERIALS</h1><p className="muted">Choose a level from the list. Levels inside your allowed range open fully; other levels open their first session only.</p></div>
    <Card>
      <Field label="Level"><select value={levelId} onChange={(e) => setSelected(e.target.value)}>
        {levels.map((l) => {
          const full = admin || levelFullyOpen(user, l, data.levels);
          return <option key={l.id} value={l.id}>{l.title}{full ? '' : ' · first session only'}</option>;
        })}
      </select></Field>
      {level && <div className="row" style={{ marginTop: '.2rem' }}><Badge tone={partial ? 'muted' : 'green'}>{partial ? 'First session only' : 'Full access'}</Badge><Badge tone="blue">{sessions.length} lessons</Badge></div>}
    </Card>
    {partial && <div className="note">This level is outside your allowed range, so only its first session is open. Contact us to unlock the full level.</div>}
    {level && sessions.length ? <div className="grid g2">{sessions.map((s) => {
      const sessionLocked = !admin && !sessionOpen(user, s, data.levels);
      const wordCount = data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id)).length;
      const grammarTitle = (s.sections.find((x) => /grammar/i.test(x.title))?.title || 'Grammar').replace(/^Grammar\s*[—-]\s*/i, '');
      return <Card key={s.id} className="material-card">
        <div className="brief-kicker">Lesson {s.order}</div>
        <h3>{s.title}</h3>
        <p className="muted" style={{ marginBottom: '.7rem' }}>{s.topic}</p>
        <div className="row" style={{ marginBottom: '.8rem' }}>
          <Badge tone="blue">{wordCount} words</Badge>
          <Badge>{grammarTitle.slice(0, 42)}</Badge>
        </div>
        <div className="row">
          <Badge tone={sessionLocked ? 'muted' : 'green'}>{sessionLocked ? '🔒 Locked' : 'Ready'}</Badge>
          {materialPdf(s) && <a className="btn btn-ghost btn-sm" href={materialPdf(s)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>PDF</a>}
          <Button size="sm" disabled={sessionLocked} onClick={() => go(`/session/${s.id}`)}>{sessionLocked ? 'Locked' : 'Open lesson'}</Button>
        </div>
      </Card>;
    })}</div> : <Empty icon="📂" title="No materials in this level" hint="Materials appear here once lessons are added." />}
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
    <h2>Level test complete</h2>
    <div className={result.pending ? 'note' : 'result-good'}><strong>Score: {result.auto} out of {result.max}</strong>{result.pending > 0 && <div>{result.pending} written answers are waiting for admin review.</div>}</div>
    <div className="row"><Button onClick={() => go('/roadmap')}>Back to roadmap</Button></div>
  </Card>;

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => go('/roadmap')}>← Roadmap</button></div>
    <Card><h1>Level test: {level?.title || levelId}</h1><p className="muted">Multiple choice and writing questions from all {data.sessions.filter((s) => s.levelId === levelId).length} sessions. Written answers need admin approval.</p></Card>
    {locked && <div className="note">🔒 This level is locked. Ask your admin to unlock it before taking the test.</div>}
    {qs.map((q, i) => <Card key={q.id}>
      <div className="row between"><strong>{i + 1}. {q.prompt}</strong><Badge>{q.points} pts</Badge></div>
      {(q.type === 'mcq' || q.type === 'truefalse') && <div style={{ marginTop: '.7rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${answers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>}
      {(q.type === 'short' || q.type === 'fill') && <textarea style={{ marginTop: '.7rem' }} value={answers[q.id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="Write your answer in English…" disabled={locked} />}
    </Card>)}
    <Card><div className="between"><span className="muted">{qs.length} questions</span><Button onClick={submit} disabled={locked || !qs.length}>Submit test</Button></div></Card>
  </div>;
}

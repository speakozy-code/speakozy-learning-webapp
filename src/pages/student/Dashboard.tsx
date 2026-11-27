import React from 'react';
import { BookOpen, ListChecks, Brain, ChevronLeft, Check } from 'lucide-react';
import { useApp } from '../../lib/store';
import { go } from '../../App';
import { PageTour } from '../../components/Tour';
import { CurrentLevelPicker } from '../../components/CurrentLevelPicker';
import { Card, Badge, Empty, SectionTitle, Progress, fmtDate, fmtDay, isLate } from '../../components/UI';
import { sessionStatus, engagementProgress, sessionOpen, totalScore, leaderboard } from '../../lib/domain';
import { dueWords } from '../../lib/srs';
import { statusTone } from './shared';

interface PlanItem { key: string; icon: React.ReactNode; title: React.ReactNode; detail: string; to: string; primary?: boolean; done?: boolean }

function PlanCard({ item }: { item: PlanItem }) {
  return <button className={`plan-card${item.primary ? ' is-primary' : ''}${item.done ? ' is-done' : ''}`} onClick={() => go(item.to)}>
    <span className="plan-mark">{item.done ? <Check size={18} strokeWidth={3} /> : <span className="plan-dot" />}</span>
    <span className="plan-ic">{item.icon}</span>
    <span className="plan-text"><strong>{item.title}</strong><small>{item.detail}</small></span>
    {item.primary ? <span className="plan-go">ابدأ</span> : <ChevronLeft size={18} className="plan-chev" />}
  </button>;
}

function Tile({ value, label, tone }: { value: React.ReactNode; label: string; tone?: string }) {
  return <div className={`tile ${tone || ''}`}><b>{value}</b><span>{label}</span></div>;
}

export function StudentDashboard() {
  const { user, data } = useApp();
  if (!user) return null;
  const level = data.levels.find((l) => l.id === user.levelId) || data.levels[0];
  const sessions = data.sessions.filter((s) => s.levelId === user.levelId).sort((a, b) => a.order - b.order);
  const next = sessions.find((s) => sessionOpen(user, s, data.levels) && sessionStatus(data, s, user.id).key !== 'approved');
  const myTasks = data.tasks.filter((t) => t.active && (t.targetType === 'all' || (t.targetType === 'student' && t.targetId === user.id)));
  const doneTaskIds = data.taskCompletions.filter((c) => c.studentId === user.id).map((c) => c.taskId);
  const openTasks = myTasks.filter((t) => !doneTaskIds.includes(t.id));
  const late = openTasks.filter((t) => isLate(t.dueAt));
  const notes = data.notifications.filter((n) => n.targetId === 'all' || n.targetId === user.id || n.targetId === user.levelId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const approved = data.attempts.filter((a) => a.studentId === user.id && a.status === 'approved').length;
  const pending = data.attempts.filter((a) => a.studentId === user.id && a.status === 'pending').length;
  const pct = level ? engagementProgress(data, level.id, user.id) : 0;
  const approvedSessions = sessions.filter((s) => sessionStatus(data, s, user.id).key === 'approved').length;
  const dueCount = dueWords(data.savedWords.filter((w) => w.studentId === user.id), new Date().toISOString()).length;
  const board = leaderboard(data);
  const firstName = user.name.split(' ')[0];

  const plan: PlanItem[] = [
    next
      ? { key: 'session', icon: <BookOpen size={22} />, title: <>كمّل <bdi dir="ltr">{next.title}</bdi></>, detail: next.topic ? `${next.topic} · ${fmtDay(next.dueAt)}` : fmtDay(next.dueAt), to: `/session/${next.id}`, primary: true }
      : { key: 'session', icon: <BookOpen size={22} />, title: 'افتح خريطة المستويات', detail: 'مفيش سيشن مفتوحة دلوقتي', to: '/roadmap', primary: true },
    { key: 'tasks', icon: <ListChecks size={22} />, title: 'التاسكات اليومية', detail: openTasks.length ? `${openTasks.length} مفتوحة${late.length ? ` · ${late.length} متأخرة` : ''}` : 'خلّصت كل التاسكات', to: '/tasks', done: openTasks.length === 0 },
    { key: 'words', icon: <Brain size={22} />, title: 'مراجعة الكلمات', detail: dueCount ? `${dueCount} كلمة مستنياك` : 'مفيش كلمات مستحقة', to: '/words', done: dueCount === 0 },
  ];

  return <div className="stack">
    <PageTour id="dashboard" />
    <div className="home-grid">
      <section className="home-plan">
        <p className="home-hello">أهلًا يا {firstName}</p>
        <h1 className="home-title">خطتك النهارده<br />خلّص 3 حاجات بس</h1>
        <div className="plan-list">{plan.map((p) => <PlanCard key={p.key} item={p} />)}</div>
      </section>

      <aside className="home-side">
        <div className="tiles">
          <Tile value={`${pct}%`} label={level?.title || 'المستوى'} tone="accent" />
          <Tile value={totalScore(data, user.id)} label="نقطة" />
          <Tile value={approved} label={pending ? `كويز معتمد · ${pending} مستني مراجعة` : 'كويز معتمد'} />
          <Tile value={late.length} label="تاسك متأخر" tone={late.length ? 'warn' : ''} />
        </div>
        <Card>
          <div className="between"><h3>تقدمك في {level?.title || 'المستوى'}</h3><small className="muted">{approvedSessions} من {sessions.length} سيشن</small></div>
          <div style={{ margin: '.8rem 0' }}><Progress value={pct} /></div>
          <CurrentLevelPicker />
        </Card>
      </aside>
    </div>

    <div className="grid g2">
      <Card>
        <SectionTitle title="السيشن الجاية" action={<button className="icon-btn" onClick={() => go('/roadmap')}>شوف الكل ←</button>} />
        {next ? <div className="stack">
          <div className="row between"><strong>{next.title}</strong><Badge tone={statusTone[sessionStatus(data, next, user.id).key]}>{sessionStatus(data, next, user.id).label}</Badge></div>
          <small className="muted">{next.topic} · {fmtDay(next.dueAt)}</small>
        </div> : <Empty title="مفيش سيشنات متاحة دلوقتي" hint="هتظهر هنا أول ما الأدمن يفتحلك سيشن جديدة." />}
      </Card>
      <Card>
        <SectionTitle title="آخر الإشعارات" action={<button className="icon-btn" onClick={() => go('/notifications')}>الكل ←</button>} />
        {notes.length ? <div className="stack">{notes.map((n) => <div key={n.id} className="row between" style={{ alignItems: 'flex-start' }}>
          <div><strong style={{ fontSize: '.9rem' }}>{n.title}</strong><div className="muted" style={{ fontSize: '.82rem' }}>{n.body}</div></div>
          {!n.read && <span className="badge badge-green">جديد</span>}
        </div>)}</div> : <Empty title="مفيش إشعارات" />}
      </Card>
    </div>

    <Card>
      <SectionTitle title="أبطال Speakozy" action={<span className="muted" style={{ fontSize: '.8rem' }}>أعلى النقاط</span>} />
      {board.length ? <div className="champs-strip">
        {board.slice(0, 10).map((b, i) => <div key={b.id} className={`champ-chip ${b.id === user.id ? 'is-me' : ''}`}>
          <span className="champ-rank">{i + 1}</span>
          <span className="champ-avatar">{b.avatar || '🧑‍🎓'}</span>
          <span className="champ-name">{b.name}{b.id === user.id ? ' (You)' : ''}</span>
          <strong className="champ-points">{b.points} pts</strong>
        </div>)}
      </div> : <Empty title="مفيش طلاب في الترتيب لسه" />}
    </Card>

    {late.length > 0 && <Card className="danger-zone">
      <SectionTitle title="تاسكات متأخرة" />
      <div className="stack">{late.map((t) => <div key={t.id} className="row between"><span>{t.title}</span><small className="muted">{fmtDate(t.dueAt)}</small></div>)}</div>
    </Card>}
  </div>;
}

import { PageTour } from '../../components/Tour';
import React, { useEffect, useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, Stat, SectionTitle, Empty, Field, fmtDate } from '../../components/UI';
import { levelFullyOpen, scoreRule, today, levelLabel } from '../../lib/domain';
import { UpsellModal } from '../../components/Upsell';
import { isSubscribed, FREE_TASK_WEEKS } from '../../lib/subscription';
import { tr, uiDir } from '../../lib/i18n';

export function TasksPage() {
  const { user, data, put, remove, grantScore } = useApp();
  if (!user) return null;
  // levels opened for this student (from the first to the last allowed level); everyone else: their own level only
  const allLevels = [...data.levels].sort((a, b) => a.order - b.order);
  const [sel, setSel] = useState(user.levelId);
  useEffect(() => { setSel(user.levelId); }, [user.levelId]);
  const selLevel = allLevels.find((l) => l.id === sel);
  const selOpen = !!selLevel && (user.role === 'admin' || levelFullyOpen(user, selLevel, data.levels));
  const mine = data.tasks.filter((t) => t.active && (t.targetType === 'all' || (t.targetType === 'student' && t.targetId === user.id) || (t.targetType === 'level' && (!sel || t.targetId === sel))));
  const doneIds = data.taskCompletions.filter((c) => c.studentId === user.id).map((c) => c.taskId);
  const isDone = (t: any) => doneIds.includes(t.id);
  const statusOf = (t: any) => data.taskCompletions.find((c) => c.studentId === user.id && c.taskId === t.id)?.status || (isDone(t) ? 'approved' : '');
  const statusBadge = (t: any) => { const st = statusOf(t); return st === 'pending' ? <Badge tone="amber">{tr('بانتظار المدرّس')}</Badge> : st === 'rejected' ? <Badge tone="red">{tr('اتردّ — جرّب تاني')}</Badge> : st === 'approved' ? <Badge tone="green">{tr('معتمد')}</Badge> : null; };
  const levelTasks = mine.filter((t) => (t.instructions || []).length > 0).sort((a, b) => (a.order || 0) - (b.order || 0));
  const otherTasks = mine.filter((t) => !(t.instructions || []).length);
  const groups = selLevel ? [{ l: selLevel, tasks: levelTasks.filter((t) => (t.targetId || user.levelId) === selLevel.id) }].filter((g) => g.tasks.length) : [];
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
    <PageTour id="tasks" />
    <div><h1>{tr('تاسكاتي اليومية')}</h1><p className="muted">{tr('دي تاسكات يوميه علشان تتكلم كل يوم. هتسجّل ريكورد بتقرا أو بتجاوب على السؤال في تاسك اليوم وتبعته على جروب الواتساب.')}</p>
      <a className="btn btn-primary btn-sm" style={{ marginTop: '.6rem' }} href="https://wa.me/201091060951?text=%D8%A8%D8%B9%D8%AA%20%D8%AA%D8%A7%D8%B3%D9%83%20%D8%A7%D9%84%D9%8A%D9%88%D9%85" target="_blank" rel="noreferrer">{tr('واتساب')}</a></div>
    <Card>
      <Field label={tr('الليفل بتاعك')} hint={tr('اختار الليفل بتاعك من القايمة علشان تظهرلك تاسكاته.')}><select value={sel} onChange={(e) => setSel(e.target.value)}>
        <option value="">{tr('— اختار الليفل بتاعك —')}</option>
        {allLevels.map((l) => <option key={l.id} value={l.id}>{levelLabel(l)}</option>)}
      </select></Field>
    </Card>
    {!sel && <div className="note" dir={uiDir()}>{tr('اختار الليفل بتاعك من القايمة اللي فوق علشان تظهرلك التاسكات اليومية بتاعته.')}</div>}
    <div className="grid g3">
      <Stat label={tr('إجمالي التاسكات')} value={sel ? mine.length : 0} />
      <Stat label={tr('خلصت')} value={sel ? mine.filter(isDone).length : 0} tone="green" />
      <Stat label={tr('الباقي')} value={sel ? mine.filter((t) => !isDone(t)).length : 0} />
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
                      <button className={`task-check ${done ? 'checked' : ''}`} onClick={() => toggle(t)} aria-label={done ? tr('علّم إنها ما خلصتش') : tr('علّم إنها خلصت')}>{done ? '✓' : ''}</button>
                      <div className="task-item-title" style={{ cursor: 'default' }}>
                        <span className="task-badge">{t.badge || t.kind}</span>
                        <strong>{t.title}</strong>
                        <span dir="rtl">{statusBadge(t)}</span>
                      </div>
                    </div>
                    {taskLocked(t) ? <div className="lock-cover" dir={uiDir()}>{tr('🔒 اشترك معانا علشان تكمل')}</div> : <div className="task-instructions" dir="ltr">
                      {(t.instructions || []).map((ins, i) => <div key={i} className="task-ins"><span>{ins}</span></div>)}
                      {t.source === 'generated' && <div className="muted" dir={uiDir()} style={{ fontSize: '.78rem', marginTop: '.4rem', textAlign: 'right' }}>{tr('سؤال عام على موضوع السيشن — ملف السيشن مفيهوش سؤال محادثة لده.')}</div>}
                    </div>}
                  </div>;
                })}
              </div>;
            })}
          </div>
        </Card>;
      })}
    </React.Fragment>)}
    </> : sel ? <Card><Empty icon="🗂️" title={tr('مفيش تاسكات لـ {0} لسه', [selLevel?.title || 'مستواك'])} hint={tr('تاسكات المستوى هتظهر هنا أول ما تتضاف لمستواك.')} /></Card> : null}
    {otherTasks.length > 0 && <Card>
      <SectionTitle title={tr('تاسكات تانية')} />
      <div className="stack">{otherTasks.map((t) => <div key={t.id} className="row between section-card">
        <div><strong>{t.title}</strong>{t.dueAt && <div className="muted">{fmtDate(t.dueAt)} · {t.kind}</div>}</div>
        {isDone(t) ? <>{statusBadge(t)}{statusOf(t) === 'rejected' && <Button size="sm" variant="ghost" onClick={() => toggle(t)}>{tr('حاول تاني')}</Button>}</> : <Button size="sm" onClick={() => toggle(t)}>{tr('تم')}</Button>}
      </div>)}</div>
    </Card>}
    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what={tr('تاسكات الأسابيع الجاية')} />
  </div>;
}

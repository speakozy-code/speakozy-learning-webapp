import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, Stat, SectionTitle, Empty, Tabs, Field, Modal, Table, fmtDate, fmtDay, isLate } from '../components/UI';
import { uid, today, totalScore, levelProgress, needsReview, buildStudentAccount } from '../lib/domain';
import { grammarSlides } from '../lib/lessonContent';
import { go } from '../App';

export function AdminDashboard() {
  const { data } = useApp();
  const students = data.users.filter((u) => u.role === 'student');
  const pending = needsReview(data.attempts);
  const late = data.tasks.filter((t) => t.active && isLate(t.dueAt)).length;
  return <div className="stack">
    <div><h1>Dashboard</h1><p className="muted">Edit quizzes, words, grammar slides and lesson content from here.</p></div>
    <div className="grid g4">
      <Card><h3>Quizzes</h3><p className="muted">Add or edit any question.</p><Button size="sm" onClick={() => go('/admin/quizzes')}>Open quizzes</Button></Card>
      <Card><h3>Words</h3><p className="muted">Add or edit dictionary entries.</p><Button size="sm" onClick={() => go('/admin/words')}>Open words</Button></Card>
      <Card><h3>Grammar</h3><p className="muted">Write slides and grammar questions.</p><Button size="sm" onClick={() => go('/admin/grammar')}>Open grammar</Button></Card>
      <Card><h3>Lessons</h3><p className="muted">Edit session text.</p><Button size="sm" onClick={() => go('/admin/content')}>Open content</Button></Card>
    </div>
    <div className="grid g4">
      <Stat label="Active students" value={students.filter((u) => u.active).length} tone="green" />
      <Stat label="Disabled students" value={students.filter((u) => !u.active).length} />
      <Stat label="Results awaiting review" value={pending} tone={pending ? 'danger' : ''} />
      <Stat label="Overdue tasks" value={late} />
    </div>
    <div className="grid g2">
      <Card><SectionTitle title="Student distribution by level" />
        {data.levels.map((l) => <div key={l.id} className="row between" style={{ padding: '.45rem 0' }}><span>{l.title}</span><Badge>{students.filter((u) => u.levelId === l.id).length}</Badge></div>)}
      </Card>
      <Card><SectionTitle title="Recent administrative actions" />
        {data.logs.length ? data.logs.slice(-5).reverse().map((l) => <div key={l.id} className="row between" style={{ padding: '.4rem 0' }}><span>{l.action}</span><small className="muted">{fmtDate(l.createdAt)}</small></div>) : <Empty title="No actions recorded" />}
      </Card>
    </div>
  </div>;
}

export function StudentsPage() {
  const { data, put, log } = useApp();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ email: string } | null>(null);
  const rows = data.users.filter((u) => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()));

  function openEdit(u?: any) {
    setError('');
    setCreated(null);
    setEditing(u || { id: uid(), role: 'student', active: true, subscribed: false, createdAt: today(), levelId: data.levels[0]?.id, maxLevelId: data.levels[0]?.id, plan: 'starter' });
    setForm(u ? { ...u } : { name: '', email: '', role: 'student', active: true, subscribed: false, levelId: data.levels[0]?.id, maxLevelId: data.levels[0]?.id, plan: 'starter', createdAt: today() });
  }
  async function save() {
    try {
      const account = buildStudentAccount({
        ...form,
        id: editing.id,
        createdAt: data.users.some((u) => u.id === editing.id) ? (data.users.find((u) => u.id === editing.id)?.createdAt || form.createdAt) : today(),
      });
      await put('users', account);
      await log(data.users.some((u) => u.id === editing.id) ? 'edit-student' : 'create-student', account.email);
      setCreated({ email: account.email });
      setEditing(null);
    } catch (e: any) {
      setError(e?.message || 'Could not save account');
    }
  }
  async function toggle(u: any) {
    await put('users', { ...u, active: !u.active });
    await log(u.active ? 'disable-student' : 'enable-student', u.email);
  }
  async function copyEmail(u: any) {
    try { await navigator.clipboard.writeText(u.email); } catch {}
  }

  return <div className="stack">
    <div className="between"><div><h1>Student Management</h1><p className="muted">Grant access by email and control which levels the student can open. The student sets their own password from the Create account page.</p></div><Button onClick={() => openEdit()}>+ New account</Button></div>
    {created && <div className="result-good">Access granted to {created.email}. The student signs up with this email and chooses their own password.</div>}
    <Card><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email..." /></Card>
    <Card><Table head={['Student', 'First level', 'Last level', 'Points', 'Status', 'Actions']}>
      {rows.map((u) => <tr key={u.id}>
        <td><strong>{u.name}</strong><div className="muted">{u.email}</div></td>
        <td>{data.levels.find((l) => l.id === u.levelId)?.title || '—'}</td>
        <td>{data.levels.find((l) => l.id === u.maxLevelId)?.title || '—'}</td>
        <td>{totalScore(data, u.id)}</td>
        <td><Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Disabled'}</Badge></td>
        <td><div className="row"><Button size="sm" variant="ghost" onClick={() => copyEmail(u)}>Copy email</Button><Button size="sm" variant="ghost" onClick={() => openEdit(u)}>Edit</Button><Button size="sm" variant={u.active ? 'danger' : 'ghost'} onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</Button></div></td>
      </tr>)}
    </Table></Card>
    <Modal open={!!editing} title={data.users.some((u) => u.id === editing?.id) ? 'Edit account' : 'New account'} onClose={() => setEditing(null)}>
      <Field label="Name"><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Email (login)" hint="The student signs up with this email and sets their own password. No password is needed here."><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <div className="grid g2">
        <Field label="Role"><select value={form.role || 'student'} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="student">Student</option><option value="admin">Admin</option></select></Field>
        <Field label="Access"><select value={form.active === false ? '0' : '1'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}><option value="1">Active — can sign in</option><option value="0">Disabled — blocked</option></select></Field>
        <Field label="Course subscription (banner only)"><select value={form.subscribed === false ? '0' : '1'} onChange={(e) => setForm({ ...form, subscribed: e.target.value === '1' })}><option value="0">Not subscribed — shows the contact banner</option><option value="1">Subscribed — hides the banner</option></select></Field>
        <Field label="First allowed level" hint="Levels from this one to the last allowed level open fully."><select value={form.levelId || ''} onChange={(e) => setForm({ ...form, levelId: e.target.value })}>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
        <Field label="Last allowed level" hint="Outside this range, only the first session of each level opens."><select value={form.maxLevelId || ''} onChange={(e) => setForm({ ...form, maxLevelId: e.target.value })}>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
      </div>
      {error && <div className="note">{error}</div>}
      <div className="row between"><Button onClick={save}>Save account</Button><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
    </Modal>
  </div>;
}

export function CurriculumPage() {
  const { data, put, log } = useApp();
  const [levelForm, setLevelForm] = useState<any>(null);
  const [sessionForm, setSessionForm] = useState<any>(null);
  const [tab, setTab] = useState(data.levels[0]?.id);
  const level = data.levels.find((l) => l.id === tab);
  const sessions = data.sessions.filter((s) => s.levelId === tab).sort((a, b) => a.order - b.order);

  async function saveLevel() { await put('levels', { ...levelForm, id: levelForm.id || uid() }); await log('save-level', levelForm.title); setLevelForm(null); }
  async function saveSession() {
    await put('sessions', { ...sessionForm, id: sessionForm.id || uid(), sections: sessionForm.sections || [] });
    await log('save-session', sessionForm.title); setSessionForm(null);
  }

  return <div className="stack">
    <div className="between"><div><h1>Levels and Sessions</h1><p className="muted">Duplicate sessions and adjust dates. Content and quizzes are linked to the session.</p></div><Button onClick={() => setLevelForm({ id: '', title: '', order: data.levels.length + 1, description: '', active: true })}>+ Level</Button></div>
    <Tabs tabs={data.levels.map((l) => ({ id: l.id, label: l.title }))} active={tab} onChange={setTab} />
    {level && <Card>
      <div className="between"><div><h2>{level.title}</h2><p className="muted">{level.description}</p></div><div className="row"><Button size="sm" variant="ghost" onClick={() => setLevelForm({ ...level })}>Edit level</Button><Button size="sm" onClick={() => setSessionForm({ levelId: level.id, order: sessions.length + 1, title: '', topic: '', dueAt: '', sections: [] })}>+ Session</Button></div></div>
      <div style={{ marginTop: '1rem' }}>{sessions.length ? <Table head={['#', 'Title', 'Topic', 'Date', 'Content sections', '']}>
        {sessions.map((s) => <tr key={s.id}><td>{s.order}</td><td>{s.title}</td><td>{s.topic}</td><td>{fmtDay(s.dueAt)}</td><td>{s.sections.length}</td>
          <td><Button size="sm" variant="ghost" onClick={() => setSessionForm({ ...s })}>Edit</Button></td></tr>)}
      </Table> : <Empty title="No sessions" />}</div>
    </Card>}
    <Modal open={!!levelForm} title="Level" onClose={() => setLevelForm(null)}>
      <Field label="Title"><input value={levelForm?.title || ''} onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })} /></Field>
      <Field label="Description"><textarea value={levelForm?.description || ''} onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })} /></Field>
      <div className="grid g2"><Field label="Order"><input type="number" value={levelForm?.order || 1} onChange={(e) => setLevelForm({ ...levelForm, order: Number(e.target.value) })} /></Field>
        <Field label="Enabled"><select value={levelForm?.active ? '1' : '0'} onChange={(e) => setLevelForm({ ...levelForm, active: e.target.value === '1' })}><option value="1">Yes</option><option value="0">No</option></select></Field></div>
      <Button onClick={saveLevel}>Save</Button>
    </Modal>
    <Modal open={!!sessionForm} title="Session" onClose={() => setSessionForm(null)}>
      <div className="grid g2"><Field label="Title"><input value={sessionForm?.title || ''} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} /></Field>
        <Field label="Topic"><input value={sessionForm?.topic || ''} onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })} /></Field></div>
      <div className="grid g2"><Field label="Order"><input type="number" value={sessionForm?.order || 1} onChange={(e) => setSessionForm({ ...sessionForm, order: Number(e.target.value) })} /></Field>
        <Field label="Date"><input type="datetime-local" value={sessionForm?.dueAt ? sessionForm.dueAt.slice(0, 16) : ''} onChange={(e) => setSessionForm({ ...sessionForm, dueAt: new Date(e.target.value).toISOString() })} /></Field></div>
      <Field label="External file link (optional, for display only)"><input value={sessionForm?.driveUrl || ''} onChange={(e) => setSessionForm({ ...sessionForm, driveUrl: e.target.value })} /></Field>
      <Button onClick={saveSession}>Save session</Button>
    </Modal>
  </div>;
}

export function ContentPage() {
  const { data, put, log } = useApp();
  const [sessionId, setSessionId] = useState(data.sessions[0]?.id);
  const [edit, setEdit] = useState<any>(null);
  const s = data.sessions.find((x) => x.id === sessionId);

  async function saveSection() {
    if (!s) return;
    const sections = edit.id ? s.sections.map((x) => x.id === edit.id ? edit : x) : [...s.sections, { ...edit, id: uid() }];
    await put('sessions', { ...s, sections });
    await log('save-content', s.title);
    setEdit(null);
  }

  return <div className="stack">
    <div><h1>Content Management</h1><p className="muted">Write content here. Edit from the interface without changing the code.</p></div>
    <Card><Field label="Session"><select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>{data.sessions.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></Field></Card>
    {s && <Card>
      <SectionTitle title={`Sections: ${s.title}`} action={<Button size="sm" onClick={() => setEdit({ id: '', title: '', body: '' })}>+ Section</Button>} />
      {s.sections.length ? <div className="stack">{s.sections.map((sec) => <div key={sec.id} className="section-card">
        <div className="between"><h3>{sec.title}</h3><Button size="sm" variant="ghost" onClick={() => setEdit({ ...sec })}>Edit</Button></div>
        <div className="section-body" dir="auto">{sec.body}</div>
      </div>)}</div> : <Empty title="No sections" />}
    </Card>}
    <Modal open={!!edit} title="Content section" onClose={() => setEdit(null)}>
      <Field label="Title"><input value={edit?.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
      <Field label="Text (English + Arabic explanation)"><textarea value={edit?.body || ''} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field>
      <Button onClick={saveSection}>Save section</Button>
    </Modal>
  </div>;
}

export function QuizzesPage() {
  const { data, put, remove, log } = useApp();
  const [edit, setEdit] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const qs = data.questions.filter((q) => !filter || q.sessionId === filter);
  async function save() {
    await put('questions', { ...edit, id: edit.id || uid() });
    await log('save-question', edit.prompt);
    setEdit(null);
  }
  return <div className="stack">
    <div className="between"><div><h1>Question Bank</h1><p className="muted">A question is linked to a session, level, and content source.</p></div>
      <div className="row"><select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All sessions</option>{data.sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <Button onClick={() => setEdit({ sessionId: filter || data.sessions[0]?.id, levelId: data.levels[0]?.id, scope: 'session', type: 'mcq', prompt: '', options: [], correct: '', points: 10 })}>+ Question</Button></div>
    </div>
    <Card><Table head={['Question', 'Type', 'Source', 'Points', '']}>
      {qs.map((q) => <tr key={q.id}><td>{q.prompt}</td><td>{q.type}</td><td>{q.scope}</td><td>{q.points}</td>
        <td><div className="row"><Button size="sm" variant="ghost" onClick={() => setEdit({ ...q })}>Edit</Button><Button size="sm" variant="danger" onClick={() => remove('questions', q.id)}>Delete</Button></div></td></tr>)}
    </Table></Card>
    <Modal open={!!edit} title="Question" onClose={() => setEdit(null)}>
      <div className="grid g2">
        <Field label="Session"><select value={edit?.sessionId || ''} onChange={(e) => setEdit({ ...edit, sessionId: e.target.value })}>{data.sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>
        <Field label="Source"><select value={edit?.scope || 'session'} onChange={(e) => setEdit({ ...edit, scope: e.target.value })}>{['word','grammar','topic','session','level'].map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
        <Field label="Type"><select value={edit?.type || 'mcq'} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>{['mcq','truefalse','fill','match','short','order'].map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
        <Field label="Points"><input type="number" value={edit?.points || 10} onChange={(e) => setEdit({ ...edit, points: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Question text"><textarea value={edit?.prompt || ''} onChange={(e) => setEdit({ ...edit, prompt: e.target.value })} /></Field>
      <Field label="Options (separate with |)"><input value={(edit?.options || []).join('|')} onChange={(e) => setEdit({ ...edit, options: e.target.value.split('|').filter(Boolean) })} /></Field>
      <Field label="Correct answer (for multiple-choice/Match separate with |)"><input value={Array.isArray(edit?.correct) ? edit.correct.join('|') : (edit?.correct || '')} onChange={(e) => { const v = e.target.value; setEdit({ ...edit, correct: v.includes('|') ? v.split('|') : v }); }} /></Field>
      <Button onClick={save}>Save question</Button>
    </Modal>
  </div>;
}

export function ReviewsPage() {
  const { data, put, log } = useApp();
  const [tab, setTab] = useState('pending');
  const pending = data.attempts.filter((a) => a.status === 'pending');
  const reviewed = data.attempts.filter((a) => a.status !== 'pending');
  const list = tab === 'pending' ? pending : reviewed;
  async function decide(a: any, status: string) {
    await put('attempts', { ...a, status, reviewedBy: 'admin', reviewedAt: today() });
    await log(status === 'approved' ? 'approve-attempt' : 'reject-attempt', a.id);
  }
  return <div className="stack">
    <div><h1>Review Results</h1><p className="muted">Taking a quiz is not an automatic pass. Final approval happens here.</p></div>
    <Tabs tabs={[{ id: 'pending', label: `Awaiting review (${pending.length})` }, { id: 'done', label: 'Reviewed' }]} active={tab} onChange={setTab} />
    <Card>{list.length ? <Table head={['Student', 'Session', 'Question', 'Answer', 'Result', 'Action']}>
      {list.map((a) => {
        const st = data.users.find((u) => u.id === a.studentId);
        const q = data.questions.find((x) => x.id === a.questionId);
        const s = data.sessions.find((x) => x.id === a.sessionId);
        return <tr key={a.id}><td>{st?.name || '—'}</td><td>{s?.title || '—'}</td><td>{q?.prompt || '—'}</td><td dir="auto">{a.answer}</td>
          <td>{a.autoScore}/{a.maxScore}</td><td>{a.status === 'pending' ? <div className="row"><Button size="sm" onClick={() => decide(a, 'approved')}>Approve</Button><Button size="sm" variant="danger" onClick={() => decide(a, 'rejected')}>Reject</Button></div> : <Badge tone={a.status === 'approved' ? 'green' : 'red'}>{a.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>}</td></tr>;
      })}
    </Table> : <Empty title="No results here" />}</Card>
  </div>;
}

export function OperationsPage() {
  const { data, put, log } = useApp();
  const [tab, setTab] = useState('tasks');
  const [task, setTask] = useState<any>(null);
  const [note, setNote] = useState<any>(null);
  async function saveTask() { await put('tasks', { ...task, id: task.id || uid() }); await log('save-task', task.title); setTask(null); }
  async function sendNote() {
    await put('notifications', { ...note, id: uid(), read: false, createdAt: today() });
    await log('send-notification', note.title); setNote(null);
  }
  return <div className="stack">
    <div><h1>Tasks and Notifications</h1><p className="muted">Link to a student, level, or everyone. Reminders are configured in settings.</p></div>
    <Tabs tabs={[{ id: 'tasks', label: 'Tasks' }, { id: 'notes', label: 'Send notification' }]} active={tab} onChange={setTab} />
    {tab === 'tasks' ? <Card>
      <SectionTitle title="Current tasks" action={<Button size="sm" onClick={() => setTask({ title: '', kind: 'study', dueAt: '', targetType: 'all', active: true })}>+ Task</Button>} />
      <Table head={['Task', 'Type', 'Due', 'Audience', '']}>
        {data.tasks.map((t) => <tr key={t.id}><td>{t.title}</td><td>{t.kind}</td><td>{fmtDate(t.dueAt)}</td><td>{t.targetType}{t.targetId ? `: ${t.targetId}` : ''}</td>
          <td><Button size="sm" variant="ghost" onClick={() => setTask({ ...t })}>Edit</Button></td></tr>)}
      </Table>
      <Modal open={!!task} title="Task" onClose={() => setTask(null)}>
        <Field label="Title"><input value={task?.title || ''} onChange={(e) => setTask({ ...task, title: e.target.value })} /></Field>
        <div className="grid g2"><Field label="Type"><select value={task?.kind || 'study'} onChange={(e) => setTask({ ...task, kind: e.target.value })}>{['study','words','quiz','weekly'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Audience"><select value={task?.targetType || 'all'} onChange={(e) => setTask({ ...task, targetType: e.target.value })}><option value="all">All</option><option value="level">Level</option><option value="student">Student</option></select></Field></div>
        <Field label="Date"><input type="datetime-local" value={task?.dueAt ? task.dueAt.slice(0, 16) : ''} onChange={(e) => setTask({ ...task, dueAt: new Date(e.target.value).toISOString() })} /></Field>
        {task?.kind === 'weekly' && <Field label="Session IDs (comma separated)"><input value={(task?.sessionIds || []).join(',')} onChange={(e) => setTask({ ...task, sessionIds: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} /></Field>}
        <Button onClick={saveTask}>Save</Button>
      </Modal>
    </Card> : <Card>
      <SectionTitle title="Send internal notification" />
      <Field label="Title"><input value={note?.title || ''} onChange={(e) => setNote({ ...note, title: e.target.value })} /></Field>
      <Field label="Text"><textarea value={note?.body || ''} onChange={(e) => setNote({ ...note, body: e.target.value })} /></Field>
      <div className="grid g2"><Field label="To"><select value={note?.targetId || 'all'} onChange={(e) => setNote({ ...note, targetId: e.target.value })}><option value="all">All</option>{data.users.filter((u) => u.role === 'student').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Link"><input value={note?.href || ''} onChange={(e) => setNote({ ...note, href: e.target.value })} placeholder="#/roadmap" /></Field></div>
      <Button onClick={sendNote}>Send</Button>
    </Card>}
  </div>;
}

export function AdminSettingsPage() {
  const { data, putSettings, log } = useApp();
  const s = data.settings;
  async function save() { await putSettings(s); await log('update-settings', 'settings'); alert('Settings saved'); }
  return <div className="stack">
    <div><h1>Settings</h1><p className="muted">Point rules, privacy, and quiz settings.</p></div>
    <Card><SectionTitle title="Point Calculation Rules" />
      <div className="grid g3">{Object.keys(s.scoreRules).map((k) => <Field key={k} label={k}><input type="number" value={(s.scoreRules as any)[k]} onChange={(e) => putSettings({ ...s, scoreRules: { ...s.scoreRules, [k]: Number(e.target.value) } })} /></Field>)}</div>
      <p className="muted">Every point has a source and time record. Points do not determine academic success.</p>
    </Card>
    <Card><SectionTitle title="Quizzes" />
      <div className="grid g3"><Field label="Number of attempts"><input type="number" value={s.quizDefaults.attempts} onChange={(e) => putSettings({ ...s, quizDefaults: { ...s.quizDefaults, attempts: Number(e.target.value) } })} /></Field>
        <Field label="Suggested passing score"><input type="number" value={s.quizDefaults.passScore} onChange={(e) => putSettings({ ...s, quizDefaults: { ...s.quizDefaults, passScore: Number(e.target.value) } })} /></Field>
        <Field label="Duration (minutes)"><input type="number" value={s.quizDefaults.durationMin} onChange={(e) => putSettings({ ...s, quizDefaults: { ...s.quizDefaults, durationMin: Number(e.target.value) } })} /></Field></div>
    </Card>
    <Card><SectionTitle title="Leaderboard and Privacy" />
      <div className="grid g3"><Field label="Enabled"><select value={s.leaderboard.enabled ? '1' : '0'} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, enabled: e.target.value === '1' } })}><option value="1">Yes</option><option value="0">No</option></select></Field>
        <Field label="Name display"><select value={s.leaderboard.nameMode} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, nameMode: e.target.value as any } })}><option value="first">First name</option><option value="short">Abbreviated</option></select></Field>
        <Field label="Period"><select value={s.leaderboard.period} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, period: e.target.value as any } })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="total">Total</option></select></Field></div>
      <Field label="Hidden students (comma-separated IDs)"><input value={s.leaderboard.hidden.join(',')} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, hidden: e.target.value.split(',').filter(Boolean) } })} /></Field>
    </Card>
    <Card><SectionTitle title="Reminders" />
      <div className="grid g2"><Field label="Inactivity alert (days)"><input type="number" value={s.reminders.inactivityDays} onChange={(e) => putSettings({ ...s, reminders: { ...s.reminders, inactivityDays: Number(e.target.value) } })} /></Field>
        <Field label="Reminder before due date (hours)"><input type="number" value={s.reminders.reminderHours} onChange={(e) => putSettings({ ...s, reminders: { ...s.reminders, reminderHours: Number(e.target.value) } })} /></Field></div>
    </Card>
    <div><Button onClick={save}>Save all settings</Button></div>
  </div>;
}

export function CertificatesPage() {
  const { data, put, log } = useApp();
  const [issue, setIssue] = useState<any>(null);
  const students = data.users.filter((u) => u.role === 'student');
  async function save() {
    const number = `SPK-${Date.now().toString(36).toUpperCase()}`;
    await put('certificates', { id: uid(), studentId: issue.studentId, levelIds: issue.levelIds, number, issuedAt: today(), status: 'active' });
    await log('issue-certificate', number);
    await put('notifications', { id: uid(), targetId: issue.studentId, title: 'Certificate issued', body: `A certificate has been issued to you with number ${number}`, href: '#/profile', read: false, createdAt: today() });
    setIssue(null);
  }
  async function revoke(c: any) {
    await put('certificates', { ...c, status: 'revoked', reason: 'Revoked by administration' });
    await log('revoke-certificate', c.number);
  }
  return <div className="stack">
    <div className="between"><div><h1>Certificates</h1><p className="muted">Issued only after the level is approved by the administration.</p></div>
      <Button onClick={() => setIssue({ studentId: students[0]?.id, levelIds: [] })}>+ Issue certificate</Button></div>
    <Card>{data.certificates.length ? <Table head={['Number', 'Student', 'Levels', 'Date', 'Status', '']}>
      {data.certificates.map((c) => <tr key={c.id}><td>{c.number}</td><td>{data.users.find((u) => u.id === c.studentId)?.name || '—'}</td>
        <td>{c.levelIds.join(', ')}</td><td>{fmtDate(c.issuedAt)}</td><td><Badge tone={c.status === 'active' ? 'green' : 'red'}>{c.status === 'active' ? 'Active' : 'Revoked'}</Badge></td>
        <td>{c.status === 'active' && <Button size="sm" variant="danger" onClick={() => revoke(c)}>Cancel</Button>}</td></tr>)}
    </Table> : <Empty title="No certificates" />}</Card>
    <Modal open={!!issue} title="Issue certificate" onClose={() => setIssue(null)}>
      <Field label="Student"><select value={issue?.studentId || ''} onChange={(e) => setIssue({ ...issue, studentId: e.target.value })}>{students.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
      <Field label="Completed levels"><select multiple value={issue?.levelIds || []} onChange={(e) => setIssue({ ...issue, levelIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
      <div className="note">The certificate is generated with a unique number. The verification page shows only the number and level, without private data.</div>
      <Button onClick={save}>Issue</Button>
    </Modal>
  </div>;
}


export function GrammarStudioPage() {
  const { data, put, remove, log } = useApp();
  const [sessionId, setSessionId] = useState(data.sessions[0]?.id);
  const [note, setNote] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const s = data.sessions.find((x) => x.id === sessionId);
  const base = s ? grammarSlides(s) : [];
  const custom = (data.grammarNotes || []).filter((n) => n.sessionId === sessionId).sort((a, b) => a.order - b.order);

  function openNote(n?: any) {
    setNote(n ? { ...n, examplesText: (n.examples || []).join('\n') } : { id: '', title: '', rule: '', detail: '', examplesText: '', order: custom.length + 1 });
  }
  async function saveNote() {
    if (!note || !note.title?.trim()) return;
    const examples = String(note.examplesText || '').split('\n').map((x: string) => x.trim()).filter(Boolean);
    await put('grammarNotes', {
      id: note.id || uid(), sessionId, order: Number(note.order) || custom.length + 1,
      title: note.title.trim(), rule: (note.rule || '').trim(), detail: (note.detail || '').trim(), examples,
    });
    await log('save-grammar-slide', `${s?.title || ''}: ${note.title}`);
    setNote(null);
  }
  async function saveQuestion() {
    if (!question || !question.prompt?.trim() || !s) return;
    await put('questions', {
      id: uid(), sessionId, levelId: s.levelId, scope: 'grammar',
      type: question.type || 'mcq', prompt: question.prompt.trim(),
      options: String(question.options || '').split('|').map((x: string) => x.trim()).filter(Boolean),
      correct: String(question.correct || '').trim(), points: Number(question.points) || 10,
    });
    await log('save-grammar-question', question.prompt);
    setQuestion(null);
  }

  return <div className="stack">
    <div><h1>Grammar Studio</h1><p className="muted">Expand a lesson's grammar, add your own slides and explanations, and write grammar questions that appear right after the slides.</p></div>
    <Card><Field label="Session"><select value={sessionId} onChange={(e) => { setSessionId(e.target.value); setNote(null); setQuestion(null); }}>
      {data.sessions.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
    </select></Field></Card>

    {s && <Card>
      <SectionTitle title={`Lesson slides · ${s.title}`} action={<Badge tone="blue">{base.length + custom.length} slides</Badge>} />
      {base.length || custom.length ? <div className="stack">{base.map((g, i) => <div key={`b-${i}`} className="section-card">
        <div className="row between"><h3>{i + 1}. {g.title}</h3><Badge tone="muted">Generated</Badge></div>
        {g.rule && <div className="section-body" style={{ fontSize: '.88rem' }}>{g.rule}</div>}
        {g.detail && <div className="section-body" dir="rtl" style={{ fontSize: '.88rem' }}>{g.detail}</div>}
        {g.examples.length > 0 && <div className="muted" style={{ fontSize: '.82rem', marginTop: '.4rem' }}>{g.examples.join(' · ')}</div>}
      </div>)}
      {custom.map((n) => <div key={n.id} className="section-card">
        <div className="row between"><h3>{n.order}. {n.title}</h3><div className="row"><Badge tone="green">Yours</Badge><Button size="sm" variant="ghost" onClick={() => openNote(n)}>Edit</Button><Button size="sm" variant="danger" onClick={() => remove('grammarNotes', n.id)}>Delete</Button></div></div>
        {n.rule && <div className="section-body" dir="auto" style={{ fontSize: '.88rem' }}>{n.rule}</div>}
        {n.detail && <div className="section-body" dir="rtl" style={{ fontSize: '.88rem' }}>{n.detail}</div>}
        {n.examples.length > 0 && <div className="muted" style={{ fontSize: '.82rem', marginTop: '.4rem' }}>{n.examples.join(' · ')}</div>}
      </div>)}
      </div> : <Empty title="No grammar slides in this session" />}
      <Button size="sm" style={{ marginTop: '.8rem' }} onClick={() => openNote()}>+ Add your own slide</Button>
    </Card>}

    <Card>
      <SectionTitle title="Grammar questions" action={<Button size="sm" onClick={() => setQuestion({ type: 'mcq', prompt: '', options: '', correct: '', points: 10 })}>+ Add question</Button>} />
      <p className="muted">These appear in the training block after the slides. Written answers go to Review Results.</p>
      <Table head={['Question', 'Type', 'Points', '']}>
        {data.questions.filter((q) => q.sessionId === sessionId && q.scope === 'grammar').map((q) => <tr key={q.id}>
          <td>{q.prompt}</td><td>{q.type}</td><td>{q.points}</td>
          <td><Button size="sm" variant="danger" onClick={() => remove('questions', q.id)}>Delete</Button></td>
        </tr>)}
      </Table>
    </Card>

    <Modal open={!!note} title="Your grammar slide" onClose={() => setNote(null)}>
      <Field label="Slide title"><input value={note?.title || ''} onChange={(e) => setNote({ ...note, title: e.target.value })} /></Field>
      <Field label="Rule (English)"><textarea value={note?.rule || ''} onChange={(e) => setNote({ ...note, rule: e.target.value })} /></Field>
      <Field label="Extra explanation (Arabic)"><textarea value={note?.detail || ''} onChange={(e) => setNote({ ...note, detail: e.target.value })} /></Field>
      <Field label="Examples (one per line)"><textarea value={note?.examplesText || ''} onChange={(e) => setNote({ ...note, examplesText: e.target.value })} /></Field>
      <Button onClick={saveNote}>Save slide</Button>
    </Modal>

    <Modal open={!!question} title="Grammar question" onClose={() => setQuestion(null)}>
      <div className="grid g2">
        <Field label="Type"><select value={question?.type || 'mcq'} onChange={(e) => setQuestion({ ...question, type: e.target.value })}>{['mcq', 'truefalse', 'fill', 'short'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Points"><input type="number" value={question?.points || 10} onChange={(e) => setQuestion({ ...question, points: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Question"><textarea value={question?.prompt || ''} onChange={(e) => setQuestion({ ...question, prompt: e.target.value })} /></Field>
      <Field label="Options (separate with |)"><input value={question?.options || ''} onChange={(e) => setQuestion({ ...question, options: e.target.value })} /></Field>
      <Field label="Correct answer"><input value={question?.correct || ''} onChange={(e) => setQuestion({ ...question, correct: e.target.value })} /></Field>
      <Button onClick={saveQuestion}>Save question</Button>
    </Modal>
  </div>;
}

export function AdminWordsPage() {
  const { data, put, remove, log } = useApp();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<any>(null);
  const list = data.dictionary.filter((w) => !q || (w.word + ' ' + (w.meaning || '')).toLowerCase().includes(q.toLowerCase())).slice(0, 200);
  async function save() {
    if (!edit?.word?.trim()) return;
    const rec = {
      id: edit.id || uid(),
      word: edit.word.trim(),
      meaning: edit.meaning || '',
      type: edit.type || 'word',
      examples: String(edit.examplesText || (edit.examples || []).join('\n')).split('\n').map((x: string) => x.trim()).filter(Boolean),
      arabic: edit.arabic || '',
      phonetic: edit.phonetic || '',
      audioUrl: edit.audioUrl || '',
      synonyms: String(edit.synonymsText || (edit.synonyms || []).join(',')).split(/[,|]/).map((x: string) => x.trim()).filter(Boolean),
      sessionIds: edit.sessionIds || [],
      source: edit.source || 'manual',
    };
    await put('dictionary', rec);
    await log('save-word', rec.word);
    setEdit(null);
  }
  return <div className="stack">
    <div className="between"><div><h1>Words</h1><p className="muted">Add or edit any dictionary word. Changes appear for students.</p></div>
      <Button onClick={() => setEdit({ id: '', word: '', meaning: '', type: 'noun', examplesText: '', arabic: '', phonetic: '', synonymsText: '' })}>+ Word</Button></div>
    <Card><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search words..." /></Card>
    <Card><Table head={['Word', 'Type', 'Meaning', '']}>
      {list.map((w) => <tr key={w.id}><td className="en" dir="ltr">{w.word}</td><td>{w.type}</td><td>{(w.meaning || w.arabic || '').slice(0, 60)}</td>
        <td><div className="row"><Button size="sm" variant="ghost" onClick={() => setEdit({ ...w, examplesText: (w.examples || []).join('\n'), synonymsText: (w.synonyms || []).join(', ') })}>Edit</Button><Button size="sm" variant="danger" onClick={() => remove('dictionary', w.id)}>Delete</Button></div></td></tr>)}
    </Table></Card>
    <Modal open={!!edit} title="Word" onClose={() => setEdit(null)}>
      <div className="grid g2">
        <Field label="Word"><input dir="ltr" value={edit?.word || ''} onChange={(e) => setEdit({ ...edit, word: e.target.value })} /></Field>
        <Field label="Type"><input value={edit?.type || ''} onChange={(e) => setEdit({ ...edit, type: e.target.value })} /></Field>
      </div>
      <Field label="Meaning (English)"><textarea value={edit?.meaning || ''} onChange={(e) => setEdit({ ...edit, meaning: e.target.value })} /></Field>
      <Field label="Arabic meaning"><input value={edit?.arabic || ''} onChange={(e) => setEdit({ ...edit, arabic: e.target.value })} /></Field>
      <Field label="Transcript / phonetic"><input dir="ltr" value={edit?.phonetic || ''} onChange={(e) => setEdit({ ...edit, phonetic: e.target.value })} /></Field>
      <Field label="Synonyms (comma separated)"><input dir="ltr" value={edit?.synonymsText || ''} onChange={(e) => setEdit({ ...edit, synonymsText: e.target.value })} /></Field>
      <Field label="Examples (one per line)"><textarea dir="ltr" value={edit?.examplesText || ''} onChange={(e) => setEdit({ ...edit, examplesText: e.target.value })} /></Field>
      <Button onClick={save}>Save word</Button>
    </Modal>
  </div>;
}

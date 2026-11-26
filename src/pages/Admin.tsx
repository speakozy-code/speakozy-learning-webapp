import { SHADOWING_VIDEOS } from '../lib/videoSlots';
import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, Stat, SectionTitle, Empty, Tabs, Field, Modal, Table, fmtDate, fmtDay, isLate } from '../components/UI';
import { uid, today, totalScore, levelProgress, needsReview, buildStudentAccount, scoreRule, subscriptionExpired, extendEnd, cairoToday, arabicDate } from '../lib/domain';
import { grammarSlides } from '../lib/lessonContent';
import { go } from '../App';

export function AdminDashboard() {
  const { data } = useApp();
  const students = data.users.filter((u) => u.role === 'student');
  const pending = needsReview(data.attempts);
  const late = data.tasks.filter((t) => t.active && isLate(t.dueAt)).length;
  return <div className="stack">
    <div><h1>لوحة التحكم</h1><p className="muted">عدّل الكويزات والكلمات وسلايدات الجرامر ومحتوى الدرس من هنا.</p></div>
    <div className="grid g4">
      <Card><h3>الكويزات</h3><p className="muted">ضيف أو عدّل أي سؤال.</p><Button size="sm" onClick={() => go('/admin/quizzes')}>افتح الكويزات</Button></Card>
      <Card><h3>الكلمات</h3><p className="muted">ضيف أو عدّل مدخلات الديكشنري.</p><Button size="sm" onClick={() => go('/admin/words')}>افتح الكلمات</Button></Card>
      <Card><h3>الجرامر</h3><p className="muted">اكتب سلايدات وأسئلة جرامر.</p><Button size="sm" onClick={() => go('/admin/grammar')}>افتح الجرامر</Button></Card>
      <Card><h3>الدروس</h3><p className="muted">عدّل نص السيشن.</p><Button size="sm" onClick={() => go('/admin/content')}>افتح المحتوى</Button></Card>
    </div>
    <div className="grid g4">
      <Stat label="طلاب نشطين" value={students.filter((u) => u.active).length} tone="green" />
      <Stat label="طلاب موقوفين" value={students.filter((u) => !u.active).length} />
      <Stat label="نتايج منتظرة المراجعة" value={pending} tone={pending ? 'danger' : ''} />
      <Stat label="تاسكات متأخرة" value={late} />
    </div>
    <div className="grid g2">
      <Card><SectionTitle title="توزيع الطلاب على المستويات" />
        {data.levels.map((l) => <div key={l.id} className="row between" style={{ padding: '.45rem 0' }}><span>{l.title}</span><Badge>{students.filter((u) => u.levelId === l.id).length}</Badge></div>)}
      </Card>
      <Card><SectionTitle title="آخر الإجراءات الإدارية" />
        {data.logs.length ? data.logs.slice(-5).reverse().map((l) => <div key={l.id} className="row between" style={{ padding: '.4rem 0' }}><span>{l.action}</span><small className="muted">{fmtDate(l.createdAt)}</small></div>) : <Empty title="مفيش إجراءات مسجلة" />}
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
  const rows = data.users.filter((u) => !q || (u.name + u.email + (u.phone || "")).toLowerCase().includes(q.toLowerCase()));

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
      await notifyActivated(data.users.find((u) => u.id === editing.id), account);
      await log(data.users.some((u) => u.id === editing.id) ? 'edit-student' : 'create-student', account.email);
      setCreated({ email: account.email });
      setEditing(null);
    } catch (e: any) {
      setError(e?.message || 'مش قادرين نحفظ الحساب');
    }
  }
  // Tell the student when his subscription becomes active (or its end date changes).
  async function notifyActivated(prev: any, next: any) {
    if (!next || next.role === 'admin' || next.subscribed === false || subscriptionExpired(next)) return;
    const wasActive = prev && prev.subscribed !== false && !subscriptionExpired(prev);
    if (wasActive && (prev.subscriptionEnd || '') === (next.subscriptionEnd || '')) return;
    const body = next.subscriptionEnd ? `تم تفعيل اشتراكك ✅ وتاريخ انتهاء الاشتراك: ${arabicDate(next.subscriptionEnd)}` : 'تم تفعيل اشتراكك ✅ — اشتراكك مفتوح من غير تاريخ انتهاء';
    await put('notifications', { id: uid(), targetId: next.id, title: 'تم تفعيل اشتراكك', body, href: '#/profile', read: false, createdAt: today() });
  }
  async function toggle(u: any) {
    await put('users', { ...u, active: !u.active });
    await log(u.active ? 'disable-student' : 'enable-student', u.email);
  }
  async function copyEmail(u: any) {
    try { await navigator.clipboard.writeText(u.email); } catch {}
  }

  return <div className="stack">
    <div className="between"><div><h1>إدارة الطلاب</h1><p className="muted">كل طالب بيسجّل بيظهر هنا تلقائي. غيّر حالة الاشتراك بضغطة على الشارة. امنح صلاحية بالإيميل وتحكم في المستويات اللي الطالب يقدر يفتحها. الطالب بيحط الباسورد بنفسه من صفحة إنشاء حساب.</p></div><Button onClick={() => openEdit()}>+ حساب جديد</Button></div>
    {created && <div className="result-good">Access granted to {created.email}. The student signs up with this email and chooses their own password.</div>}
    <Card><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر بالاسم أو الإيميل أو الموبايل..." /></Card>
    <Card><Table head={['طالب', 'أول مستوى', 'آخر مستوى', 'النقاط', 'الاشتراك', 'الحالة', 'إجراءات']}>
      {rows.map((u) => <tr key={u.id}>
        <td><strong>{u.name}</strong><div className="muted">{u.email}</div>{u.phone && <div className="muted" dir="ltr" style={{ textAlign: 'right' }}>📞 {u.phone}</div>}</td>
        <td>{data.levels.find((l) => l.id === u.levelId)?.title || '—'}</td>
        <td>{data.levels.find((l) => l.id === u.maxLevelId)?.title || '—'}</td>
        <td>{totalScore(data, u.id)}</td>
        <td>{u.role === 'admin' ? <Badge tone="blue">أدمن</Badge> : <><button className="icon-btn" title="غيّر حالة الاشتراك" onClick={async () => { const ended = subscriptionExpired(u); const nextU = { ...u, subscribed: ended ? true : u.subscribed === false, ...(ended ? { subscriptionEnd: extendEnd(u.subscriptionEnd, 30) } : {}) }; await put('users', nextU); await notifyActivated(u, nextU); await log(ended ? 'renew-subscription' : 'toggle-subscription', u.email); }}>{u.subscribed === false ? <Badge tone="amber">{subscriptionExpired(u) ? 'انتهى اشتراكه' : 'غير مشترك'}</Badge> : <Badge tone="green">مشترك ✓</Badge>}</button>{u.subscriptionEnd && <div className="muted" style={{ fontSize: '.78rem' }} dir="ltr">{subscriptionExpired(u) ? 'ended' : 'until'} {u.subscriptionEnd}</div>}</>}</td>
        <td><Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'نشط' : 'موقوف'}</Badge></td>
        <td><div className="row"><Button size="sm" variant="ghost" onClick={() => copyEmail(u)}>انسخ الإيميل</Button><Button size="sm" variant="ghost" onClick={() => openEdit(u)}>تعديل</Button><Button size="sm" variant={u.active ? 'danger' : 'ghost'} onClick={() => toggle(u)}>{u.active ? 'إيقاف' : 'تفعيل'}</Button></div></td>
      </tr>)}
    </Table></Card>
    <Modal open={!!editing} title={data.users.some((u) => u.id === editing?.id) ? 'تعديل الحساب' : 'حساب جديد'} onClose={() => setEditing(null)}>
      <Field label="الاسم"><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="الإيميل (الدخول)" hint="الطالب بيسجل بالإيميل ده وبيحط الباسورد بنفسه. مش محتاج باسورد هنا."><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
      <Field label="رقم الموبايل"><input dir="ltr" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx أو +966…" /></Field>
      <div className="grid g2">
        <Field label="الدور"><select value={form.role || 'student'} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="student">طالب</option><option value="admin">أدمن</option></select></Field>
        <Field label="الصلاحية"><select value={form.active === false ? '0' : '1'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}><option value="1">نشط — يقدر يسجل دخول</option><option value="0">موقوف — محظور</option></select></Field>
        <Field label="اشتراك الكورس"><select value={form.subscribed === false ? '0' : '1'} onChange={(e) => setForm({ ...form, subscribed: e.target.value === '1' })}><option value="0">غير مشترك</option><option value="1">مشترك — وصول كامل لنطاق المستويات المسموح</option></select></Field>
        <Field label="تاريخ انتهاء الاشتراك" hint="لما التاريخ يعدّي، الطالب بيبقى «غير مشترك» لوحده. سيبه فاضي لو الاشتراك مفتوح.">
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <input type="date" dir="ltr" value={form.subscriptionEnd || ''} onChange={(e) => setForm({ ...form, subscriptionEnd: e.target.value, ...(e.target.value && e.target.value >= cairoToday() ? { subscribed: true } : {}) })} style={{ maxWidth: 190 }} />
            {[30, 90, 180].map((d) => <Button key={d} size="sm" variant="ghost" type="button" onClick={() => setForm({ ...form, subscribed: true, subscriptionEnd: extendEnd(form.subscriptionEnd, d) })}>+{d} يوم</Button>)}
            {form.subscriptionEnd && <Button size="sm" variant="ghost" type="button" onClick={() => setForm({ ...form, subscriptionEnd: '' })}>مفتوح</Button>}
          </div>
        </Field>
        <Field label="من ليفل (أول مستوى)" hint="كل المستويات من ده لحد «إلى ليفل» بتفتح كاملة للطالب المشترك: سيشنات، تاسكات، PDF، شادوينج…"><select value={form.levelId || ''} onChange={(e) => setForm({ ...form, levelId: e.target.value })}>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
        <Field label="إلى ليفل (آخر مستوى)" hint="مثال: من E1 إلى Upper 1 = كل اللي بينهم مفتوح. اللي بره النطاق: أول سيشن/فيديو بس."><select value={form.maxLevelId || ''} onChange={(e) => setForm({ ...form, maxLevelId: e.target.value })}>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
      </div>
      {error && <div className="note">{error}</div>}
      <div className="row between"><Button onClick={save}>احفظ الحساب</Button><Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button></div>
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
    <div className="between"><div><h1>المستويات والجلسات</h1><p className="muted">كرر السيشنات وعدّل التواريخ. المحتوى والكويزات مرتبطين بالسيشن.</p></div><Button onClick={() => setLevelForm({ id: '', title: '', order: data.levels.length + 1, description: '', active: true })}>+ مستوى</Button></div>
    <Tabs tabs={data.levels.map((l) => ({ id: l.id, label: l.title }))} active={tab} onChange={setTab} />
    {level && <Card>
      <div className="between"><div><h2>{level.title}</h2><p className="muted">{level.description}</p></div><div className="row"><Button size="sm" variant="ghost" onClick={() => setLevelForm({ ...level })}>تعديل مستوى</Button><Button size="sm" onClick={() => setSessionForm({ levelId: level.id, order: sessions.length + 1, title: '', topic: '', dueAt: '', sections: [] })}>+ سيشن</Button></div></div>
      <div style={{ marginTop: '1rem' }}>{sessions.length ? <Table head={['#', 'العنوان', 'الموضوع', 'التاريخ', 'أقسام المحتوى', '']}>
        {sessions.map((s) => <tr key={s.id}><td>{s.order}</td><td>{s.title}</td><td>{s.topic}</td><td>{fmtDay(s.dueAt)}</td><td>{s.sections.length}</td>
          <td><Button size="sm" variant="ghost" onClick={() => setSessionForm({ ...s })}>تعديل</Button></td></tr>)}
      </Table> : <Empty title="مفيش سيشنات" />}</div>
    </Card>}
    <Modal open={!!levelForm} title="المستوى" onClose={() => setLevelForm(null)}>
      <Field label="العنوان"><input value={levelForm?.title || ''} onChange={(e) => setLevelForm({ ...levelForm, title: e.target.value })} /></Field>
      <Field label="الوصف"><textarea value={levelForm?.description || ''} onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })} /></Field>
      <div className="grid g2"><Field label="الترتيب"><input type="number" value={levelForm?.order || 1} onChange={(e) => setLevelForm({ ...levelForm, order: Number(e.target.value) })} /></Field>
        <Field label="مفعّل"><select value={levelForm?.active ? '1' : '0'} onChange={(e) => setLevelForm({ ...levelForm, active: e.target.value === '1' })}><option value="1">نعم</option><option value="0">لأ</option></select></Field></div>
      <Button onClick={saveLevel}>حفظ</Button>
    </Modal>
    <Modal open={!!sessionForm} title="السيشن" onClose={() => setSessionForm(null)}>
      <div className="grid g2"><Field label="العنوان"><input value={sessionForm?.title || ''} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} /></Field>
        <Field label="الموضوع"><input value={sessionForm?.topic || ''} onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })} /></Field></div>
      <div className="grid g2"><Field label="الترتيب"><input type="number" value={sessionForm?.order || 1} onChange={(e) => setSessionForm({ ...sessionForm, order: Number(e.target.value) })} /></Field>
        <Field label="التاريخ"><input type="datetime-local" value={sessionForm?.dueAt ? sessionForm.dueAt.slice(0, 16) : ''} onChange={(e) => setSessionForm({ ...sessionForm, dueAt: new Date(e.target.value).toISOString() })} /></Field></div>
      <Field label="رابط ملف خارجي (اختياري، للعرض بس)"><input value={sessionForm?.driveUrl || ''} onChange={(e) => setSessionForm({ ...sessionForm, driveUrl: e.target.value })} /></Field>
      <Button onClick={saveSession}>احفظ السيشن</Button>
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
    <div><h1>إدارة المحتوى</h1><p className="muted">اكتب المحتوى هنا. عدّل من الواجهة من غير ما تغيّر الكود.</p></div>
    <Card><Field label="السيشن"><select value={sessionId} onChange={(e) => setSessionId(e.target.value)}>{data.sessions.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></Field></Card>
    {s && <Card>
      <SectionTitle title={`Sections: ${s.title}`} action={<Button size="sm" onClick={() => setEdit({ id: '', title: '', body: '' })}>+ قسم</Button>} />
      {s.sections.length ? <div className="stack">{s.sections.map((sec) => <div key={sec.id} className="section-card">
        <div className="between"><h3>{sec.title}</h3><Button size="sm" variant="ghost" onClick={() => setEdit({ ...sec })}>تعديل</Button></div>
        <div className="section-body" dir="auto">{sec.body}</div>
      </div>)}</div> : <Empty title="مفيش أقسام" />}
    </Card>}
    <Modal open={!!edit} title="قسم المحتوى" onClose={() => setEdit(null)}>
      <Field label="العنوان"><input value={edit?.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
      <Field label="النص (إنجليزي + شرح عربي)"><textarea value={edit?.body || ''} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field>
      <Button onClick={saveSection}>احفظ القسم</Button>
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
    <div className="between"><div><h1>بنك الأسئلة</h1><p className="muted">السؤال مرتبط بسيشن ومستوى ومصدر محتوى.</p></div>
      <div className="row"><select style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">كل السيشنات</option>{data.sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
        <Button onClick={() => setEdit({ sessionId: filter || data.sessions[0]?.id, levelId: data.levels[0]?.id, scope: 'session', type: 'mcq', prompt: '', options: [], correct: '', points: 10 })}>+ سؤال</Button></div>
    </div>
    <Card><Table head={['السؤال', 'النوع', 'المصدر', 'النقاط', '']}>
      {qs.map((q) => <tr key={q.id}><td>{q.prompt}</td><td>{q.type}</td><td>{q.scope}</td><td>{q.points}</td>
        <td><div className="row"><Button size="sm" variant="ghost" onClick={() => setEdit({ ...q })}>تعديل</Button><Button size="sm" variant="danger" onClick={() => remove('questions', q.id)}>حذف</Button></div></td></tr>)}
    </Table></Card>
    <Modal open={!!edit} title="السؤال" onClose={() => setEdit(null)}>
      <div className="grid g2">
        <Field label="السيشن"><select value={edit?.sessionId || ''} onChange={(e) => setEdit({ ...edit, sessionId: e.target.value })}>{data.sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></Field>
        <Field label="المصدر"><select value={edit?.scope || 'session'} onChange={(e) => setEdit({ ...edit, scope: e.target.value })}>{['word','grammar','topic','session','level'].map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
        <Field label="النوع"><select value={edit?.type || 'mcq'} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>{['mcq','truefalse','fill','match','short','order'].map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
        <Field label="النقاط"><input type="number" value={edit?.points || 10} onChange={(e) => setEdit({ ...edit, points: Number(e.target.value) })} /></Field>
      </div>
      <Field label="نص السؤال"><textarea value={edit?.prompt || ''} onChange={(e) => setEdit({ ...edit, prompt: e.target.value })} /></Field>
      <Field label="الاختيارات (افصل بـ |)"><input value={(edit?.options || []).join('|')} onChange={(e) => setEdit({ ...edit, options: e.target.value.split('|').filter(Boolean) })} /></Field>
      <Field label="الإجابة الصح (للاختيار من متعدد/التوصيل افصل بـ |)"><input value={Array.isArray(edit?.correct) ? edit.correct.join('|') : (edit?.correct || '')} onChange={(e) => { const v = e.target.value; setEdit({ ...edit, correct: v.includes('|') ? v.split('|') : v }); }} /></Field>
      <Button onClick={save}>احفظ السؤال</Button>
    </Modal>
  </div>;
}

export function ReviewsPage() {
  const { data, put, log, grantScore } = useApp();
  const [tab, setTab] = useState('pending');
  const pending = data.attempts.filter((a) => a.status === 'pending');
  const reviewed = data.attempts.filter((a) => a.status !== 'pending');
  const list = tab === 'pending' ? pending : reviewed;
  async function decide(a: any, status: string) {
    await put('attempts', { ...a, status, reviewedBy: 'admin', reviewedAt: today() });
    // Speaking / writing exercises only earn points once the teacher approves them.
    const kind = String(a.questionId || '').split(':')[0];
    if (status === 'approved' && (kind === 'speaking' || kind === 'writing')) {
      await grantScore(a.studentId, 'exercise', scoreRule(data.settings.scoreRules, kind === 'speaking' ? 'speakingExercise' : 'writingExercise'), `approved-${a.questionId}-${a.studentId}`);
    }
    await log(status === 'approved' ? 'approve-attempt' : 'reject-attempt', a.id);
  }
  return <div className="stack">
    <div><h1>مراجعة النتائج</h1><p className="muted">حل الكويز مش نجاح تلقائي. الاعتماد النهائي بيحصل هنا.</p></div>
    <Tabs tabs={[{ id: 'pending', label: `Awaiting review (${pending.length})` }, { id: 'done', label: 'اتراجع' }]} active={tab} onChange={setTab} />
    <Card>{list.length ? <Table head={['الطالب', 'السيشن', 'السؤال', 'الإجابة', 'النتيجة', 'إجراء']}>
      {list.map((a) => {
        const st = data.users.find((u) => u.id === a.studentId);
        const q = data.questions.find((x) => x.id === a.questionId);
        const s = data.sessions.find((x) => x.id === a.sessionId);
        return <tr key={a.id}><td>{st?.name || '—'}</td><td>{s?.title || '—'}</td><td>{q?.prompt || '—'}</td><td dir="auto">{a.answer}</td>
          <td>{a.autoScore}/{a.maxScore}</td><td>{a.status === 'pending' ? <div className="row"><Button size="sm" onClick={() => decide(a, 'approved')}>اعتماد</Button><Button size="sm" variant="danger" onClick={() => decide(a, 'rejected')}>رفض</Button></div> : <Badge tone={a.status === 'approved' ? 'green' : 'red'}>{a.status === 'approved' ? 'معتمد' : 'مرفوض'}</Badge>}</td></tr>;
      })}
    </Table> : <Empty title="مفيش نتايج هنا" />}</Card>
  </div>;
}

const shadowTitle = (taskId: string) => {
  if (!taskId.startsWith('shadow-')) return '';
  const id = taskId.slice(7);
  for (const [lv, list] of Object.entries(SHADOWING_VIDEOS)) { const v = list.find((x) => x.youtubeId === id); if (v) return `🎧 ${v.title}`; }
  return '🎧 Shadowing';
};
export function TaskReviewsPage() {
  const { data, put, remove, log, grantScore } = useApp();
  const [tab, setTab] = useState('pending');
  const [picked, setPicked] = useState<string[]>([]);
  const statusOf = (c: any) => c.status || 'approved';
  const rows = data.taskCompletions.filter((c) => statusOf(c) === tab);
  async function decide(c: any, status: 'approved' | 'rejected') {
    await put('taskCompletions', { ...c, status, reviewedAt: today() });
    if (status === 'approved') await grantScore(c.studentId, 'task', scoreRule(data.settings.scoreRules, 'taskApproved'), `task-approved-${c.taskId}`);
    else {
      // rejected: take back the provisional point so points only come from approval
      const prov = data.scores.find((x) => x.studentId === c.studentId && x.refId === `task-pending-${c.taskId}`);
      if (prov) await remove('scores', prov.id);
    }
    await log(status === 'approved' ? 'approve-task' : 'reject-task', c.id);
  }
  async function approveSelected() {
    for (const c of rows.filter((x) => picked.includes(x.id))) await decide(c, 'approved');
    setPicked([]);
  }
  const pendingCount = data.taskCompletions.filter((c) => statusOf(c) === 'pending').length;
  return <div className="stack">
    <div><h1>مراجعة التاسكات اليومية</h1><p className="muted">الطالب بياخد نقطة مبدئية لما يسلّم، والنقاط الكاملة بتتحسب لما تعتمد التاسك هنا بعد ما تراجعه على الواتساب.</p></div>
    <Tabs tabs={[{ id: 'pending', label: `بانتظار المراجعة (${pendingCount})` }, { id: 'approved', label: 'معتمدة' }, { id: 'rejected', label: 'مرفوضة' }]} active={tab} onChange={(t) => { setTab(t); setPicked([]); }} />
    <Card>
      {tab === 'pending' && rows.length > 0 && <div className="row" style={{ marginBottom: '.8rem' }}>
        <Button size="sm" variant="ghost" onClick={() => setPicked(picked.length === rows.length ? [] : rows.map((r) => r.id))}>{picked.length === rows.length ? 'إلغاء التحديد' : 'تحديد الكل'}</Button>
        <Button size="sm" onClick={approveSelected} disabled={!picked.length}>اعتماد المحدد ({picked.length})</Button>
      </div>}
      {rows.length ? <Table head={tab === 'pending' ? ['', 'الطالب', 'التاسك', 'التاريخ', 'إجراء'] : ['الطالب', 'التاسك', 'التاريخ']}>
        {rows.map((c) => {
          const st = data.users.find((u) => u.id === c.studentId);
          const t = data.tasks.find((x) => x.id === c.taskId);
          return <tr key={c.id}>
            {tab === 'pending' && <td><input type="checkbox" checked={picked.includes(c.id)} onChange={() => setPicked((p) => p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id])} style={{ width: 'auto' }} aria-label="تحديد" /></td>}
            <td>{st?.name || '—'}</td><td dir="auto">{t?.title || shadowTitle(c.taskId) || c.taskId}</td><td>{fmtDate(c.completedAt)}</td>
            {tab === 'pending' && <td><div className="row"><Button size="sm" onClick={() => decide(c, 'approved')}>اعتماد</Button><Button size="sm" variant="danger" onClick={() => decide(c, 'rejected')}>رفض</Button></div></td>}
          </tr>;
        })}
      </Table> : <Empty title="مفيش تاسكات هنا" />}
    </Card>
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
    <div><h1>التاسكات والإشعارات</h1><p className="muted">وجّه الإشعار لطالب أو مستوى أو الكل. التذكيرات بتتظبط في الإعدادات.</p></div>
    <Tabs tabs={[{ id: 'tasks', label: 'التاسكات' }, { id: 'notes', label: 'ابعت الإشعار' }]} active={tab} onChange={setTab} />
    {tab === 'tasks' ? <Card>
      <SectionTitle title="التاسكات الحالية" action={<Button size="sm" onClick={() => setTask({ title: '', kind: 'study', dueAt: '', targetType: 'all', active: true })}>+ تاسك</Button>} />
      <Table head={['التاسك', 'النوع', 'ميعاد التسليم', 'الجمهور', '']}>
        {data.tasks.map((t) => <tr key={t.id}><td>{t.title}</td><td>{t.kind}</td><td>{fmtDate(t.dueAt)}</td><td>{t.targetType}{t.targetId ? `: ${t.targetId}` : ''}</td>
          <td><Button size="sm" variant="ghost" onClick={() => setTask({ ...t })}>تعديل</Button></td></tr>)}
      </Table>
      <Modal open={!!task} title="التاسك" onClose={() => setTask(null)}>
        <Field label="العنوان"><input value={task?.title || ''} onChange={(e) => setTask({ ...task, title: e.target.value })} /></Field>
        <div className="grid g2"><Field label="النوع"><select value={task?.kind || 'study'} onChange={(e) => setTask({ ...task, kind: e.target.value })}>{['study','words','quiz','weekly'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="الجمهور"><select value={task?.targetType || 'all'} onChange={(e) => setTask({ ...task, targetType: e.target.value })}><option value="all">الكل</option><option value="level">المستوى</option><option value="student">طالب</option></select></Field></div>
        <Field label="التاريخ"><input type="datetime-local" value={task?.dueAt ? task.dueAt.slice(0, 16) : ''} onChange={(e) => setTask({ ...task, dueAt: new Date(e.target.value).toISOString() })} /></Field>
        {task?.kind === 'weekly' && <Field label="أرقام السيشنات (مفصولة بفاصلة)"><input value={(task?.sessionIds || []).join(',')} onChange={(e) => setTask({ ...task, sessionIds: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} /></Field>}
        <Button onClick={saveTask}>حفظ</Button>
      </Modal>
    </Card> : <Card>
      <SectionTitle title="ابعت إشعار داخلي" />
      <Field label="العنوان"><input value={note?.title || ''} onChange={(e) => setNote({ ...note, title: e.target.value })} /></Field>
      <Field label="النص"><textarea value={note?.body || ''} onChange={(e) => setNote({ ...note, body: e.target.value })} /></Field>
      <div className="grid g2"><Field label="إلى"><select value={note?.targetId || 'all'} onChange={(e) => setNote({ ...note, targetId: e.target.value })}><option value="all">الكل</option>{data.users.filter((u) => u.role === 'student').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="الرابط"><input value={note?.href || ''} onChange={(e) => setNote({ ...note, href: e.target.value })} placeholder="#/roadmap" /></Field></div>
      <Button onClick={sendNote}>ابعت</Button>
    </Card>}
  </div>;
}

export function AdminSettingsPage() {
  const { data, putSettings, log } = useApp();
  const s = data.settings;
  async function save() { await putSettings(s); await log('update-settings', 'settings'); alert('الإعدادات اتحفظت'); }
  return <div className="stack">
    <div><h1>الإعدادات</h1><p className="muted">قواعد النقاط والخصوصية وإعدادات الكويزات.</p></div>
    <Card><SectionTitle title="قواعد حساب النقاط" />
      <div className="grid g3">{Object.keys(s.scoreRules).map((k) => <Field key={k} label={k}><input type="number" value={(s.scoreRules as any)[k]} onChange={(e) => putSettings({ ...s, scoreRules: { ...s.scoreRules, [k]: Number(e.target.value) } })} /></Field>)}</div>
      <p className="muted">كل نقطة ليها مصدر وسجل وقت. النقاط مش بتحدد النجاح الأكاديمي.</p>
    </Card>
    <Card><SectionTitle title="الكويزات" />
      <div className="grid g3"><Field label="عدد المحاولات"><input type="number" value={s.quizDefaults.attempts} onChange={(e) => putSettings({ ...s, quizDefaults: { ...s.quizDefaults, attempts: Number(e.target.value) } })} /></Field>
        <Field label="درجة النجاح المقترحة"><input type="number" value={s.quizDefaults.passScore} onChange={(e) => putSettings({ ...s, quizDefaults: { ...s.quizDefaults, passScore: Number(e.target.value) } })} /></Field>
        <Field label="المدة (دقائق)"><input type="number" value={s.quizDefaults.durationMin} onChange={(e) => putSettings({ ...s, quizDefaults: { ...s.quizDefaults, durationMin: Number(e.target.value) } })} /></Field></div>
    </Card>
    <Card><SectionTitle title="لوحة الأبطال والخصوصية" />
      <div className="grid g3"><Field label="مفعّل"><select value={s.leaderboard.enabled ? '1' : '0'} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, enabled: e.target.value === '1' } })}><option value="1">نعم</option><option value="0">لأ</option></select></Field>
        <Field label="عرض الأسماء"><select value={s.leaderboard.nameMode} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, nameMode: e.target.value as any } })}><option value="first">الاسم الأول</option><option value="short">مختصرة</option></select></Field>
        <Field label="الفترة"><select value={s.leaderboard.period} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, period: e.target.value as any } })}><option value="weekly">أسبوعي</option><option value="monthly">شهري</option><option value="total">الإجمالي</option></select></Field></div>
      <Field label="طلاب مخفيين (أرقام مفصولة بفاصلة)"><input value={s.leaderboard.hidden.join(',')} onChange={(e) => putSettings({ ...s, leaderboard: { ...s.leaderboard, hidden: e.target.value.split(',').filter(Boolean) } })} /></Field>
    </Card>
    <Card><SectionTitle title="التذكيرات" />
      <div className="grid g2"><Field label="تنبيه عدم النشاط (أيام)"><input type="number" value={s.reminders.inactivityDays} onChange={(e) => putSettings({ ...s, reminders: { ...s.reminders, inactivityDays: Number(e.target.value) } })} /></Field>
        <Field label="تذكير قبل ميعاد التسليم (ساعات)"><input type="number" value={s.reminders.reminderHours} onChange={(e) => putSettings({ ...s, reminders: { ...s.reminders, reminderHours: Number(e.target.value) } })} /></Field></div>
    </Card>
    <div><Button onClick={save}>احفظ كل الإعدادات</Button></div>
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
    await put('notifications', { id: uid(), targetId: issue.studentId, title: 'الشهادة اتطلعت', body: `A certificate has been issued to you with number ${number}`, href: '#/profile', read: false, createdAt: today() });
    setIssue(null);
  }
  async function revoke(c: any) {
    await put('certificates', { ...c, status: 'revoked', reason: 'الإدارة لغتها' });
    await log('revoke-certificate', c.number);
  }
  return <div className="stack">
    <div className="between"><div><h1>الشهادات</h1><p className="muted">بتطلع بس بعد ما الإدارة تعتمد المستوى.</p></div>
      <Button onClick={() => setIssue({ studentId: students[0]?.id, levelIds: [] })}>+ إصدار شهادة</Button></div>
    <Card>{data.certificates.length ? <Table head={['الرقم', 'الطالب', 'المستويات', 'التاريخ', 'الحالة', '']}>
      {data.certificates.map((c) => <tr key={c.id}><td>{c.number}</td><td>{data.users.find((u) => u.id === c.studentId)?.name || '—'}</td>
        <td>{c.levelIds.join(', ')}</td><td>{fmtDate(c.issuedAt)}</td><td><Badge tone={c.status === 'active' ? 'green' : 'red'}>{c.status === 'active' ? 'نشط' : 'ملغية'}</Badge></td>
        <td>{c.status === 'active' && <Button size="sm" variant="danger" onClick={() => revoke(c)}>إلغاء</Button>}</td></tr>)}
    </Table> : <Empty title="مفيش شهادات" />}</Card>
    <Modal open={!!issue} title="إصدار شهادة" onClose={() => setIssue(null)}>
      <Field label="طالب"><select value={issue?.studentId || ''} onChange={(e) => setIssue({ ...issue, studentId: e.target.value })}>{students.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
      <Field label="مستويات مكتملة"><select multiple value={issue?.levelIds || []} onChange={(e) => setIssue({ ...issue, levelIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
      <div className="note">الشهادة بتتولد برقم فريد. صفحة التحقق بتعرض الرقم والمستوى بس، من غير بيانات خاصة.</div>
      <Button onClick={save}>إصدار</Button>
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
    <div><h1>استوديو الجرامر</h1><p className="muted">وسّع جرامر الدرس، ضيف سلايدات وشرح بتاعك، واكتب أسئلة جرامر بتظهر بعد السلايدات على طول.</p></div>
    <Card><Field label="السيشن"><select value={sessionId} onChange={(e) => { setSessionId(e.target.value); setNote(null); setQuestion(null); }}>
      {data.sessions.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
    </select></Field></Card>

    {s && <Card>
      <SectionTitle title={`Lesson slides · ${s.title}`} action={<Badge tone="blue">{base.length + custom.length} slides</Badge>} />
      {base.length || custom.length ? <div className="stack">{base.map((g, i) => <div key={`b-${i}`} className="section-card">
        <div className="row between"><h3>{i + 1}. {g.title}</h3><Badge tone="muted">متولدة</Badge></div>
        {g.rule && <div className="section-body" style={{ fontSize: '.88rem' }}>{g.rule}</div>}
        {g.detail && <div className="section-body" dir="rtl" style={{ fontSize: '.88rem' }}>{g.detail}</div>}
        {g.examples.length > 0 && <div className="muted" style={{ fontSize: '.82rem', marginTop: '.4rem' }}>{g.examples.join(' · ')}</div>}
      </div>)}
      {custom.map((n) => <div key={n.id} className="section-card">
        <div className="row between"><h3>{n.order}. {n.title}</h3><div className="row"><Badge tone="green">بتاعك</Badge><Button size="sm" variant="ghost" onClick={() => openNote(n)}>تعديل</Button><Button size="sm" variant="danger" onClick={() => remove('grammarNotes', n.id)}>حذف</Button></div></div>
        {n.rule && <div className="section-body" dir="auto" style={{ fontSize: '.88rem' }}>{n.rule}</div>}
        {n.detail && <div className="section-body" dir="rtl" style={{ fontSize: '.88rem' }}>{n.detail}</div>}
        {n.examples.length > 0 && <div className="muted" style={{ fontSize: '.82rem', marginTop: '.4rem' }}>{n.examples.join(' · ')}</div>}
      </div>)}
      </div> : <Empty title="مفيش سلايدات جرامر في السيشن دي" />}
      <Button size="sm" style={{ marginTop: '.8rem' }} onClick={() => openNote()}>+ ضيف سلايد بتاعك</Button>
    </Card>}

    <Card>
      <SectionTitle title="أسئلة الجرامر" action={<Button size="sm" onClick={() => setQuestion({ type: 'mcq', prompt: '', options: '', correct: '', points: 10 })}>+ Add question</Button>} />
      <p className="muted">دي بتظهر في بلوك التدريب بعد السلايدات. الإجابات الكتابية بتروح لمراجعة النتائج.</p>
      <Table head={['السؤال', 'النوع', 'النقاط', '']}>
        {data.questions.filter((q) => q.sessionId === sessionId && q.scope === 'grammar').map((q) => <tr key={q.id}>
          <td>{q.prompt}</td><td>{q.type}</td><td>{q.points}</td>
          <td><Button size="sm" variant="danger" onClick={() => remove('questions', q.id)}>حذف</Button></td>
        </tr>)}
      </Table>
    </Card>

    <Modal open={!!note} title="سلايد الجرامر بتاعك" onClose={() => setNote(null)}>
      <Field label="عنوان السلايد"><input value={note?.title || ''} onChange={(e) => setNote({ ...note, title: e.target.value })} /></Field>
      <Field label="القاعدة (إنجليزي)"><textarea value={note?.rule || ''} onChange={(e) => setNote({ ...note, rule: e.target.value })} /></Field>
      <Field label="شرح إضافي (عربي)"><textarea value={note?.detail || ''} onChange={(e) => setNote({ ...note, detail: e.target.value })} /></Field>
      <Field label="أمثلة (واحد في كل سطر)"><textarea value={note?.examplesText || ''} onChange={(e) => setNote({ ...note, examplesText: e.target.value })} /></Field>
      <Button onClick={saveNote}>احفظ السلايد</Button>
    </Modal>

    <Modal open={!!question} title="سؤال جرامر" onClose={() => setQuestion(null)}>
      <div className="grid g2">
        <Field label="النوع"><select value={question?.type || 'mcq'} onChange={(e) => setQuestion({ ...question, type: e.target.value })}>{['mcq', 'truefalse', 'fill', 'short'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="النقاط"><input type="number" value={question?.points || 10} onChange={(e) => setQuestion({ ...question, points: Number(e.target.value) })} /></Field>
      </div>
      <Field label="السؤال"><textarea value={question?.prompt || ''} onChange={(e) => setQuestion({ ...question, prompt: e.target.value })} /></Field>
      <Field label="الاختيارات (افصل بـ |)"><input value={question?.options || ''} onChange={(e) => setQuestion({ ...question, options: e.target.value })} /></Field>
      <Field label="الإجابة الصح"><input value={question?.correct || ''} onChange={(e) => setQuestion({ ...question, correct: e.target.value })} /></Field>
      <Button onClick={saveQuestion}>احفظ السؤال</Button>
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
    <div className="between"><div><h1>الكلمات</h1><p className="muted">ضيف أو عدّل أي كلمة في الديكشنري. التغييرات بتظهر للطلاب.</p></div>
      <Button onClick={() => setEdit({ id: '', word: '', meaning: '', type: 'noun', examplesText: '', arabic: '', phonetic: '', synonymsText: '' })}>+ كلمة</Button></div>
    <Card><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر في الكلمات..." /></Card>
    <Card><Table head={['الكلمة', 'النوع', 'المعنى', '']}>
      {list.map((w) => <tr key={w.id}><td className="en" dir="ltr">{w.word}</td><td>{w.type}</td><td>{(w.meaning || w.arabic || '').slice(0, 60)}</td>
        <td><div className="row"><Button size="sm" variant="ghost" onClick={() => setEdit({ ...w, examplesText: (w.examples || []).join('\n'), synonymsText: (w.synonyms || []).join(', ') })}>تعديل</Button><Button size="sm" variant="danger" onClick={() => remove('dictionary', w.id)}>حذف</Button></div></td></tr>)}
    </Table></Card>
    <Modal open={!!edit} title="الكلمة" onClose={() => setEdit(null)}>
      <div className="grid g2">
        <Field label="الكلمة"><input dir="ltr" value={edit?.word || ''} onChange={(e) => setEdit({ ...edit, word: e.target.value })} /></Field>
        <Field label="النوع"><input value={edit?.type || ''} onChange={(e) => setEdit({ ...edit, type: e.target.value })} /></Field>
      </div>
      <Field label="المعنى (إنجليزي)"><textarea value={edit?.meaning || ''} onChange={(e) => setEdit({ ...edit, meaning: e.target.value })} /></Field>
      <Field label="المعنى بالعربي"><input value={edit?.arabic || ''} onChange={(e) => setEdit({ ...edit, arabic: e.target.value })} /></Field>
      <Field label="النطق المكتوب"><input dir="ltr" value={edit?.phonetic || ''} onChange={(e) => setEdit({ ...edit, phonetic: e.target.value })} /></Field>
      <Field label="المرادفات (مفصولة بفاصلة)"><input dir="ltr" value={edit?.synonymsText || ''} onChange={(e) => setEdit({ ...edit, synonymsText: e.target.value })} /></Field>
      <Field label="أمثلة (واحد في كل سطر)"><textarea dir="ltr" value={edit?.examplesText || ''} onChange={(e) => setEdit({ ...edit, examplesText: e.target.value })} /></Field>
      <Button onClick={save}>احفظ الكلمة</Button>
    </Modal>
  </div>;
}

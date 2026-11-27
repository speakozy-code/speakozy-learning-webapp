import { PageTour } from '../../components/Tour';
import { useEffect, useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, Stat, SectionTitle, Empty, fmtDate } from '../../components/UI';
import { totalScore, subscriptionDaysLeft, arabicDate } from '../../lib/domain';
import { go } from '../../App';
import { pushSupported, pushEnabled, enablePush, disablePush } from '../../lib/push';
import { isStandalone, isIos } from '../../lib/pwa';

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
    <PageTour id="profile" />
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

import { PageTour } from '../../components/Tour';
import { useEffect, useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, Stat, SectionTitle, Empty, fmtDate } from '../../components/UI';
import { totalScore, subscriptionDaysLeft, arabicDate } from '../../lib/domain';
import { go } from '../../App';
import { pushSupported, pushEnabled, enablePush, disablePush } from '../../lib/push';
import { isStandalone, isIos } from '../../lib/pwa';
import { tr, localeTag } from '../../lib/i18n';


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
      if (r === 'ok') { setOn(true); setMsg(tr('✓ الإشعارات اتفعّلت على الجهاز ده')); }
      else if (r === 'denied') setMsg(tr('الإذن اترفض. فعّله من إعدادات المتصفح للموقع ده وجرّب تاني.'));
      else if (r === 'unsupported') setMsg(tr('المتصفح ده مش بيدعم الإشعارات.'));
      else setMsg(tr('حصلت مشكلة، جرّب تاني.'));
    }
    setBusy(false);
  }
  return <Card>
    <SectionTitle title={tr('إشعارات على جهازك')} />
    <p className="muted" style={{ marginTop: 0 }}>{tr('هيجيلك إشعار بالكلمات المستحقة للمراجعة وتنبيه قبل انتهاء اشتراكك، حتى لو التطبيق مقفول.')}</p>
    {!pushSupported() || ios
      ? <div className="muted">{ios ? tr('على الآيفون: ضيف التطبيق للشاشة الرئيسية الأول (زرار المشاركة ← Add to Home Screen) وافتحه منها.') : tr('المتصفح ده مش بيدعم الإشعارات.')}</div>
      : <div className="row"><Button onClick={toggle} disabled={busy}>{busy ? '…' : on ? tr('إيقاف الإشعارات') : tr('فعّل الإشعارات')}</Button>{on && <Badge tone="green">{tr('شغّالة')}</Badge>}</div>}
    {msg && <div className="muted" style={{ marginTop: '.4rem' }}>{msg}</div>}
  </Card>;
}

export function ProfilePage() {
  const { user, data, resetDemo, demo, saveProfile, changePassword } = useApp();
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
  async function saveName() {
    const clean = name.trim();
    if (clean.length < 2) { setNameMsg(tr('الاسم لازم يكون حرفين على الأقل')); return; }
    setSavingName(true); setNameMsg('');
    try { await saveProfile({ name: clean }); setNameMsg(tr('✓ الاسم اتحفظ')); }
    catch { setNameMsg(tr('مش قادرين نحفظ الاسم، جرّب تاني')); }
    finally { setSavingName(false); }
  }
  async function savePassword() {
    if (pw1.length < 6) { setPwMsg(tr('الباسورد لازم يكون 6 حروف على الأقل')); return; }
    if (pw1 !== pw2) { setPwMsg(tr('الباسورد مش متطابق')); return; }
    setSavingPw(true); setPwMsg('');
    try { await changePassword(pw1); setPw1(''); setPw2(''); setPwMsg(tr('✓ الباسورد اتغير')); }
    catch { setPwMsg(tr('مش قادرين نغيّر الباسورد، جرّب تاني')); }
    finally { setSavingPw(false); }
  }
  return <div className="stack">
    <PageTour id="profile" />
    <div><h1>{tr('بروفايلي')}</h1></div>
    <Card className="row" style={{ gap: '1rem' }}>
      <div><h2>{user.name}</h2><div className="muted">{user.email}</div><div className="row" style={{ marginTop: '.4rem' }}><Badge tone="green">{level?.title || '—'}</Badge><Badge>{tr('آخر مستوى:')} {data.levels.find((l) => l.id === user.maxLevelId)?.title || '—'}</Badge></div></div>
    </Card>
    {user.subscriptionEnd && (() => {
      const left = subscriptionDaysLeft(user.subscriptionEnd);
      const expired = left !== null && left < 0;
      const soon = left !== null && left >= 0 && left <= 7;
      return <Card style={{ borderColor: expired ? 'var(--red, #ef4444)' : soon ? 'var(--amber, #f59e0b)' : undefined }}>
        <strong>{expired ? tr('اشتراكك انتهى يوم {0}', [arabicDate(user.subscriptionEnd, localeTag())]) : tr('اشتراكك هينتهي يوم {0}', [arabicDate(user.subscriptionEnd, localeTag())])}</strong>
        {!expired && left !== null && <div className="muted">{left === 0 ? tr('النهارده آخر يوم') : left === 1 ? tr('فاضل يوم واحد') : tr('فاضل {0} يوم', [left])}</div>}
        {(expired || soon) && <div className="muted" style={{ marginTop: '.3rem' }}>{tr('تواصل معانا على واتساب علشان تجدّد.')}</div>}
      </Card>;
    })()}
    <PushCard />
    <Card>
      <SectionTitle title={tr('اسمك')} />
      <div className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('اكتب اسمك')} style={{ maxWidth: 320 }} />
        <Button onClick={saveName} disabled={savingName || name.trim() === user.name}>{savingName ? tr('بنحفظ…') : tr('احفظ الاسم')}</Button>
      </div>
      {nameMsg && <p className="field-hint" style={{ marginTop: '.5rem' }}>{nameMsg}</p>}
    </Card>
    <Card>
      <SectionTitle title={tr('تغيير الباسورد')} />
      <div className="grid g2">
        <label className="field"><span>{tr('الباسورد الجديد')}</span><input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder={tr('6 حروف على الأقل')} autoComplete="new-password" /></label>
        <label className="field"><span>{tr('تأكيد الباسورد')}</span><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={tr('اكتبه تاني')} autoComplete="new-password" /></label>
      </div>
      <div className="row" style={{ marginTop: '.7rem' }}>
        <Button onClick={savePassword} disabled={savingPw || !pw1 || !pw2}>{savingPw ? tr('بنحفظ…') : tr('غيّر الباسورد')}</Button>
        {pwMsg && <span className="field-hint">{pwMsg}</span>}
      </div>
    </Card>
    <div className="grid g3"><Stat label={tr('إجمالي النقاط')} value={totalScore(data, user.id)} tone="green" /><Stat label={tr('الشهادات')} value={certs.length} /><Stat label={tr('الكلمات المحفوظة')} value={data.savedWords.filter((w) => w.studentId === user.id).length} /></div>
    <Card><SectionTitle title={tr('سجل النقاط')} />
      {recent.length ? <div className="stack">{recent.map((s) => <div key={s.id} className="row between"><span>{s.source}</span><span className="row"><strong>+{s.points}</strong><small className="muted">{fmtDate(s.createdAt)}</small></span></div>)}</div> : <Empty title={tr('مفيش نقاط لسه')} />}
    </Card>
    {demo && <Card className="danger-zone"><SectionTitle title={tr('بيانات تجريبية')} />
      <p className="muted">{tr('لو بتستخدم نسخة قديمة من البيانات، اعمل إعادة ضبط عشان تحمّل المنهج الجديد كامل.')}</p>
      <Button variant="danger" onClick={() => { resetDemo(); go('/'); }}>{tr('إعادة ضبط البيانات التجريبية')}</Button>
    </Card>}
    <Card><SectionTitle title={tr('شهاداتي')} />
      {certs.length ? certs.map((c) => <div key={c.id} className="row between"><span>{c.levelIds.join(', ')}</span><Badge tone="green">{c.number}</Badge></div>) : <Empty title={tr('مفيش شهادة لسه')} hint={tr('الشهادة بتطلع بعد ما الأدمن يعتمد إكمال المستوى.')} />}
    </Card>
  </div>;
}

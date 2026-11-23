import React, { useState } from 'react';
import { Button, Field } from '../components/UI';
import { sbChangePassword, sbSignOut } from '../lib/supabase';

/** Shown after the student opens the reset link from their email. */
export default function ResetPassword({ onDone }: { onDone: () => void }) {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (pw1.length < 6) { setError('الباسورد لازم يكون 6 حروف على الأقل'); return; }
    if (pw1 !== pw2) { setError('الباسورد مش متطابق'); return; }
    setBusy(true);
    try { await sbChangePassword(pw1); setSaved(true); await sbSignOut(); }
    catch { setError('اللينك خلص أو مش صالح. اطلب لينك جديد من صفحة الدخول.'); }
    finally { setBusy(false); }
  }

  return <div className="auth"><div className="auth-panel"><div className="auth-card">
    <div className="auth-brand" style={{ color: 'var(--ink)' }}><span className="brand-dot" /> SPEAKOZY</div>
    <h2>باسورد جديد</h2>
    {saved ? <>
      <div className="result-good" style={{ margin: '1rem 0' }}>الباسورد اتغيّر. سجّل دخول بالباسورد الجديد.</div>
      <Button style={{ width: '100%' }} onClick={onDone}>تسجيل الدخول</Button>
    </> : <form onSubmit={submit}>
      <Field label="الباسورد الجديد"><input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="6 حروف على الأقل" autoComplete="new-password" required /></Field>
      <Field label="تأكيد الباسورد"><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="اكتبه تاني" autoComplete="new-password" required /></Field>
      {error && <div className="result-bad" style={{ marginBottom: '.8rem' }}>{error}</div>}
      <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'لحظة...' : 'احفظ الباسورد'}</Button>
    </form>}
  </div></div></div>;
}

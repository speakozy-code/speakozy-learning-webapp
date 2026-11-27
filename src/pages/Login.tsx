import { siteUrl } from '../lib/subscription';
import { ThemeToggle } from '../components/ThemeToggle';
import { LangToggle } from '../components/LangToggle';
import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Button, Field, Card } from '../components/UI';
import { go } from '../App';
import { sbSendPasswordReset } from '../lib/supabase';
import { tr } from '../lib/i18n';

const LANDING = siteUrl('/');

export default function Login() {
  const { login, signup, demo } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [info, setInfo] = useState('');

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (name.trim().split(/\s+/).filter(Boolean).length < 2) { setError(tr('اكتب اسمك الكامل (اسم أول واسم تاني)')); return; }
      if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email.trim())) { setError(tr('اكتب إيميل صحيح')); return; }
      if (!/^(01[0125]\d{8}|\+[1-9]\d{7,14})$/.test(phone.replace(/[\s-]/g, ''))) { setError(tr('رقم الموبايل: لو مصري اكتبه 01xxxxxxxxx، ولو من دولة تانية لازم يبدأ بـ + وكود الدولة (مثال: +966501234567)')); return; }
      if (password.length < 6) { setError(tr('الباسورد لازم يكون 6 حروف على الأقل')); return; }
      if (password !== confirm) { setError(tr('الباسورد مش متطابق')); return; }
    }
    setBusy(true);
    try {
      if (mode === 'signup') { const ph = phone.trim().replace(/\s+/g, ' '); localStorage.setItem('speakozy-phone', ph); await signup(name.trim(), email.trim(), password, ph); }
      else await login(email.trim(), password);
      go('/');
    } catch (err: any) {
      setError(err?.message?.includes('auth/') ? tr('إيميل أو باسورد غلط') : (err?.message || tr('مش قادرين نكمل، جرّب تاني')));
    } finally { setBusy(false); }
  }

  async function sendReset(e?: React.FormEvent) {
    e?.preventDefault();
    setError(''); setInfo('');
    if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email.trim())) { setError(tr('اكتب إيميلك الصحيح')); return; }
    setBusy(true);
    try {
      await sbSendPasswordReset(email);
      setInfo(tr('لو الإيميل ده متسجل عندنا، هيوصلك لينك لتغيير الباسورد. راجع الـInbox والـSpam.'));
    } catch (err: any) {
      setError(err?.message?.includes('rate') ? tr('استنى شوية وجرّب تاني') : tr('مش قادرين نبعت الإيميل دلوقتي، جرّب تاني'));
    } finally { setBusy(false); }
  }

  function quick(role: 'admin' | 'student') {
    setMode('signin');
    if (role === 'admin') { setEmail('admin@speakozy.demo'); setPassword('admin123'); }
    else { setEmail('mariem@speakozy.demo'); setPassword('demo123'); }
    setError('');
  }

  const hero = <>
    <div className="auth-brand"><span className="brand-dot" /> SPEAKOZY</div>
    <div>
      <h1 dir="ltr" className="en">Anyone Can Speak English!</h1>
      <p>{tr('اتعلم إنجليزي بالممارسة مش بالحفظ. سيشنات قصيرة، محتوى واضح، وخطة ماشية معاك خطوة بخطوة.')}</p>
    </div>
    <div className="row auth-points">
      <span>{tr('سيشنات لايف ومسجلة')}</span><span>{tr('محتوي مخصص ليك')}</span><span>{tr('مستويات منظمة')}</span><span>{tr('كويزات مرتبطة بالدرس')}</span><span>{tr('تصحيح بإشراف المدرب')}</span>
    </div>
  </>;

  return <div className="auth">
    <div className="auth-hero">{hero}</div>
    <div className="auth-panel">
      <div className="auth-theme"><LangToggle /><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-mobile-hero">{hero}</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError(''); }}>{tr('تسجيل الدخول')}</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>{tr('إنشاء حساب')}</button>
        </div>
        <h2>{mode === 'signin' ? tr('أهلًا بعودتك') : tr('انضم لـ Speakozy')}</h2>
        <p className="muted">{mode === 'signin' ? tr('سجّل دخول عشان تكمل خطة تعلمك.') : tr('اعمل حسابك وابدأ بأول سيشن من أي مستوى.')}</p>
        {demo && <div className="note" style={{ margin: '1rem 0' }}>{tr('وضع تجريبي: الحسابات محفوظة على الجهاز ده. وصّل الخدمة الحقيقية عشان حسابات فعلية.')}</div>}
        {forgot ? <form onSubmit={sendReset}>
          <h2>{tr('نسيت الباسورد؟')}</h2>
          <p className="muted">{tr('اكتب إيميلك وهنبعتلك لينك تعمل بيه باسورد جديد.')}</p>
          <Field label={tr('الإيميل')}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required autoComplete="username" /></Field>
          {error && <div className="result-bad" style={{ marginBottom: '.8rem' }}>{error}</div>}
          {info && <div className="result-good" style={{ marginBottom: '.8rem' }}>{info}</div>}
          <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? tr('لحظة...') : tr('ابعت لينك الاسترجاع')}</Button>
          <button type="button" className="icon-btn" style={{ marginTop: '.8rem' }} onClick={() => { setForgot(false); setError(''); setInfo(''); }}>{tr('← رجوع لتسجيل الدخول')}</button>
        </form> : <form onSubmit={submit}>
          {mode === 'signup' && <Field label={tr('الاسم')}><input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('اسمك')} required autoComplete="name" /></Field>}
          {mode === 'signup' && <Field label={tr('رقم الموبايل')}><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={tr('01xxxxxxxxx أو +966501234567')} required inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: 'right' }} /></Field>}
          <Field label={tr('الإيميل')}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required autoComplete="username" /></Field>
          <Field label={tr('الباسورد')}><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></Field>
          {mode === 'signup' && <Field label={tr('تأكيد الباسورد')}><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required autoComplete="new-password" /></Field>}
          {error && <div className="result-bad" style={{ marginBottom: '.8rem' }}>{error}</div>}
          <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? tr('لحظة...') : (mode === 'signin' ? tr('تسجيل الدخول') : tr('إنشاء حساب'))}</Button>
          {mode === 'signin' && !demo && <button type="button" className="icon-btn" style={{ marginTop: '.8rem' }} onClick={() => { setForgot(true); setError(''); }}>{tr('نسيت الباسورد؟')}</button>}
        </form>}
        <a className="auth-landing" href={LANDING} target="_blank" rel="noreferrer">{tr('الرجوع لصفحة Speakozy')}</a>
        {demo && <div className="demo-box">
          <div className="muted" style={{ fontSize: '.82rem' }}>{tr('حسابات تجريبية جاهزة (اضغط عشان تتملي البيانات):')}</div>
          <div className="demo-row">
            <Button variant="ghost" size="sm" onClick={() => quick('student')}>{tr('طالب تجريبي')}</Button>
            <Button variant="ghost" size="sm" onClick={() => quick('admin')}>{tr('أدمن تجريبي')}</Button>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Button, Field, Card } from '../components/UI';
import { go } from '../App';

const LANDING = 'https://speakozy.com';

export default function Login() {
  const { login, signup, demo } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (password !== confirm) { setError('Passwords do not match'); return; }
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signup(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      go('/');
    } catch (err: any) {
      setError(err?.message?.includes('auth/') ? 'Invalid email or password' : (err?.message || 'Could not continue, please try again'));
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
      <p>Learn English by speaking, not memorizing. Short sessions, clear content, and a plan that follows you step by step.</p>
    </div>
    <div className="row auth-points">
      <span>Organized levels</span><span>Lesson-linked quizzes</span><span>Teacher-supervised grading</span>
    </div>
  </>;

  return <div className="auth">
    <div className="auth-hero">{hero}</div>
    <div className="auth-panel">
      <div className="auth-card">
        <div className="auth-mobile-hero">{hero}</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError(''); }}>Sign In</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>Create account</button>
        </div>
        <h2>{mode === 'signin' ? 'Welcome back' : 'Join Speakozy'}</h2>
        <p className="muted">{mode === 'signin' ? 'Sign in to continue your learning plan.' : 'Create your account and start with the first session of any level.'}</p>
        {demo && <div className="note" style={{ margin: '1rem 0' }}>Demo mode: accounts are stored on this device. Connect the live service for real accounts.</div>}
        <form onSubmit={submit}>
          {mode === 'signup' && <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required autoComplete="name" /></Field>}
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required autoComplete="username" /></Field>
          <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></Field>
          {mode === 'signup' && <Field label="Confirm password"><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required autoComplete="new-password" /></Field>}
          {error && <div className="result-bad" style={{ marginBottom: '.8rem' }}>{error}</div>}
          <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create account')}</Button>
        </form>
        <a className="auth-landing" href={LANDING} target="_blank" rel="noreferrer">Back to Speakozy home</a>
        {demo && <div className="demo-box">
          <div className="muted" style={{ fontSize: '.82rem' }}>Ready demo accounts (click to fill in the details):</div>
          <div className="demo-row">
            <Button variant="ghost" size="sm" onClick={() => quick('student')}>Demo Student</Button>
            <Button variant="ghost" size="sm" onClick={() => quick('admin')}>Demo Admin</Button>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

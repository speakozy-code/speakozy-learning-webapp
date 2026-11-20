import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Button, Field, Card } from '../components/UI';
import { go } from '../App';

export default function Login() {
  const { login, demo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(''); setBusy(true);
    try {
      await login(email.trim(), password);
      go('/');
    } catch (err: any) {
      setError(err?.message?.includes('auth/') ? 'Invalid email or password' : (err?.message || 'Could not sign in, please try again'));
    } finally { setBusy(false); }
  }
  function quick(role: 'admin' | 'student') {
    if (role === 'admin') { setEmail('admin@speakozy.demo'); setPassword('admin123'); }
    else { setEmail('mariem@speakozy.demo'); setPassword('demo123'); }
    setError('');
  }

  return <div className="auth">
    <div className="auth-hero">
      <div className="auth-brand"><span className="brand-dot" /> SPEAKOZY</div>
      <div>
        <h1 dir="ltr" className="en">Anyone Can Speak English!</h1>
        <p>Learn English by speaking, not memorizing. Short sessions, clear content, and a plan that follows you step by step.</p>
      </div>
      <div className="row" style={{ gap: '2rem', color: '#95a5bd', fontSize: '.85rem' }}>
        <span>Organized levels</span><span>Lesson-linked quizzes</span><span>Teacher-supervised grading</span>
      </div>
    </div>
    <div className="auth-panel">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="muted">Sign in to continue your learning plan.</p>
        {demo && <div className="note" style={{ margin: '1rem 0' }}>Demo mode: all data is fictional and stored only on your device, with no connection to the production database.</div>}
        <form onSubmit={submit}>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required autoComplete="username" /></Field>
          <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" /></Field>
          {error && <div className="result-bad" style={{ marginBottom: '.8rem' }}>{error}</div>}
          <Button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Signing in...' : 'Sign In'}</Button>
        </form>
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

import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { go } from '../App';
import { Modal, Button, Badge, fmtDate } from './UI';

const studentNav = [
  { path: '/', label: 'Home', ic: '⌂' },
  { path: '/roadmap', label: 'LEVEL ROADMAP', ic: '▦' },
  { path: '/materials', label: 'MATERIALS', ic: '❏' },
  { path: '/dictionary', label: 'Dictionary', ic: '❖' },
  { path: '/tasks', label: 'Tasks', ic: '✓' },
  { path: '/profile', label: 'Profile', ic: '◉' },
];
const adminNav = [
  { path: '/admin', label: 'Overview', ic: '⌂' },
  { path: '/admin/students', label: 'Students', ic: '◉' },
  { path: '/admin/curriculum', label: 'Levels & Sessions', ic: '▦' },
  { path: '/admin/content', label: 'Content', ic: '☰' },
  { path: '/admin/grammar', label: 'Grammar Studio', ic: '✎' },
  { path: '/admin/quizzes', label: 'Quizzes', ic: '✎' },
  { path: '/admin/reviews', label: 'Review Results', ic: '◔' },
  { path: '/admin/operations', label: 'Tasks & Notifications', ic: '✓' },
  { path: '/admin/certificates', label: 'Certificates', ic: '✦' },
  { path: '/admin/settings', label: 'Settings', ic: '⚙' },
];

export function Layout({ current, children }: { current: string; children: React.ReactNode }) {
  const { user, logout, data, put } = useApp();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  if (!user) return <>{children}</>;
  const admin = user.role === 'admin';
  const nav = admin ? adminNav : studentNav;
  const notes = data.notifications.filter((n) => n.targetId === 'all' || n.targetId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = notes.filter((n) => !n.read).length;
  const active = (p: string) => p === '/' ? current === '/' : current.startsWith(p);

  const bellButton = <button className="icon-btn bell" onClick={() => setBell(true)} aria-label="Notifications" title="Notifications">
    🔔{unread > 0 && <span className="badge badge-red bell-count">{unread}</span>}
  </button>;

  const side = <aside className={`side ${open ? 'open' : ''}`}>
    <div className="brand"><span className="brand-dot" /> SPEAKOZY</div>
    <div className="nav-group">{admin ? 'Admin Dashboard' : 'Student Space'}</div>
    <nav className="nav" onClick={() => setOpen(false)}>
      {nav.map((n) => <a key={n.path} href={'#' + n.path} className={active(n.path) ? 'active' : ''}>
        <span className="ic">{n.ic}</span>{n.label}
      </a>)}
    </nav>
    <div className="side-foot">
      <div className="who"><span className="avatar">{user.name.charAt(0)}</span><span>{user.name}<br /><small>{admin ? 'Academy Manager' : 'Student'}</small></span></div>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { logout(); go('/'); }}>Log Out</button>
    </div>
  </aside>;

  const mobile = <nav className="mobile-nav">
    {nav.slice(0, 5).map((n) => <a key={n.path} href={'#' + n.path} className={active(n.path) ? 'active' : ''}>
      <span style={{ fontSize: '1.1rem' }}>{n.ic}</span><span>{n.label.split(' ')[0]}</span>
    </a>)}
    <button onClick={() => setOpen(true)}><span style={{ fontSize: '1.1rem' }}>☰</span><span>More</span></button>
  </nav>;

  return <>
    <div className="topbar">
      <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
      <div className="auth-brand" style={{ color: 'var(--ink)' }}><span className="brand-dot" /> SPEAKOZY</div>
      <span className="avatar">{user.name.charAt(0)}</span>
    </div>
    <div className="shell">{side}<main className="main"><div className="content-bar"><span className="muted">{admin ? 'Admin Dashboard' : 'Student Space'}</span>{bellButton}</div>{children}</main></div>
    {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 75 }} />}
    {mobile}
    <Modal open={bell} title="Notifications" onClose={() => setBell(false)}>
      {notes.length ? <div className="stack">{notes.map((n) => <div key={n.id} className="section-card">
        <div className="row between"><strong>{n.title}</strong>{!n.read && <Badge tone="green">New</Badge>}</div>
        <p className="muted" style={{ margin: '.4rem 0' }}>{n.body}</p>
        <div className="row"><small className="muted">{fmtDate(n.createdAt)}</small>
          <Button size="sm" variant="ghost" onClick={() => { if (!n.read) put('notifications', { ...n, read: true }); if (n.href) { setBell(false); go(n.href.replace('#', '')); } }}>Open</Button>
        </div>
      </div>)}</div> : <div className="empty">No notifications</div>}
    </Modal>
  </>;
}

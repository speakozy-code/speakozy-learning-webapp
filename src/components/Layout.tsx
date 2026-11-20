import React, { useState } from 'react';
import {
  Home, Map, FolderOpen, BookOpen, ListChecks, User,
  LayoutDashboard, Users, Layers, FileText, PenLine, ClipboardList,
  Inbox, Bell, Award, Settings, LogOut, Menu,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { go } from '../App';
import { Modal, Button, Badge, fmtDate } from './UI';

const studentNav = [
  { path: '/', label: 'Home', ic: Home },
  { path: '/roadmap', label: 'LEVEL ROADMAP', ic: Map },
  { path: '/materials', label: 'MATERIALS', ic: FolderOpen },
  { path: '/dictionary', label: 'Dictionary', ic: BookOpen },
  { path: '/tasks', label: 'Tasks', ic: ListChecks },
  { path: '/profile', label: 'Profile', ic: User },
];
const adminNav = [
  { path: '/admin', label: 'Overview', ic: LayoutDashboard },
  { path: '/admin/students', label: 'Students', ic: Users },
  { path: '/admin/curriculum', label: 'Levels & Sessions', ic: Layers },
  { path: '/admin/content', label: 'Content', ic: FileText },
  { path: '/admin/grammar', label: 'Grammar Studio', ic: PenLine },
  { path: '/admin/quizzes', label: 'Quizzes', ic: ClipboardList },
  { path: '/admin/reviews', label: 'Review Results', ic: Inbox },
  { path: '/admin/operations', label: 'Tasks & Notifications', ic: ListChecks },
  { path: '/admin/certificates', label: 'Certificates', ic: Award },
  { path: '/admin/settings', label: 'Settings', ic: Settings },
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
    <Bell size={18} />{unread > 0 && <span className="badge badge-red bell-count">{unread}</span>}
  </button>;

  const side = <aside className={`side ${open ? 'open' : ''}`}>
    <div className="brand"><span className="brand-dot" /> SPEAKOZY</div>
    <div className="nav-group">{admin ? 'Admin Dashboard' : 'Student Space'}</div>
    <nav className="nav" onClick={() => setOpen(false)}>
      {nav.map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={active(n.path) ? 'active' : ''}>
        <span className="ic"><Icon size={18} strokeWidth={2} /></span>{n.label}
      </a>; })}
    </nav>
    <div className="side-foot">
      <div className="who"><span className="avatar">{user.name.charAt(0)}</span><span>{user.name}<br /><small>{admin ? 'Academy Manager' : 'Student'}</small></span></div>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { logout(); go('/'); }}><LogOut size={14} /> Log Out</button>
    </div>
  </aside>;

  const mobile = <nav className="mobile-nav">
    {nav.slice(0, 5).map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={active(n.path) ? 'active' : ''}>
      <Icon size={18} /><span>{n.label.split(' ')[0]}</span>
    </a>; })}
    <button onClick={() => setOpen(true)}><Menu size={18} /><span>More</span></button>
  </nav>;

  return <>
    <div className="topbar">
      <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={18} /></button>
      <div className="auth-brand" style={{ color: 'var(--ink)' }}><span className="brand-dot" /> SPEAKOZY</div>
      <span className="avatar">{user.name.charAt(0)}</span>
    </div>
    <div className="shell">{side}<main className="main"><div className="content-bar"><span className="muted">{admin ? 'Admin Dashboard' : 'Student Space'}</span>{bellButton}</div>{children}</main></div>
    {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 75 }} />}
    {mobile}
    <button className="to-top" onClick={() => { const main = document.querySelector('.main'); if (main) main.scrollTo({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Back to top">↑</button>
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

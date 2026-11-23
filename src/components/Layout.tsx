import React, { useEffect, useState } from 'react';
import {
  Home, Map, FolderOpen, BookOpen, ListChecks, User,
  LayoutDashboard, Users, Layers, FileText, PenLine, ClipboardList,
  Inbox, Bell, Award, Settings, LogOut, Menu, Headphones, Gift, MessageSquareHeart, MessageCircle, Layers2, Mic2, Gamepad2, Library,
} from 'lucide-react';
import { useApp } from '../lib/store';
import { go } from '../App';
import { Modal, Button, Badge, fmtDate } from './UI';
import { engagementProgress, totalScore } from '../lib/domain';
import { canInstall, isStandalone, isIos, onInstallChange, promptInstall, showBrowserNotification, notificationPermission, requestNotifications } from '../lib/pwa';
import { SubscribeButtons } from './Upsell';
import { isSubscribed, PRICING_URL } from '../lib/subscription';
import { usePullToRefresh } from '../lib/pullToRefresh';

const WA_LINK = 'https://wa.me/201091060951?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D9%83%D9%88%D8%B1%D8%B3%20%D8%B3%D8%A8%D9%8A%D9%83%D9%88%D8%B2%D9%8A';

const studentNav = [
  { path: '/', label: 'الرئيسية', ic: Home },
  { path: '/roadmap', label: 'خريطة المستويات', ic: Map },
  { path: '/materials', label: 'الماتيريال', ic: FolderOpen },
  { path: '/dictionary', label: 'الديكشنري', ic: BookOpen },
  { path: '/words', label: 'الكلمات', ic: Layers2 },
  { path: '/yalla-netkellem', label: 'يلا نتكلم', ic: Mic2 },
  { path: '/tasks', label: 'التاسكات اليومية', ic: ListChecks },
  { path: '/shadowing', label: 'الشادوينج', ic: Headphones },
  { path: '/play', label: 'العب واتعلم', ic: Gamepad2 },
  { path: '/resources', label: 'المصادر', ic: Library },
  { path: '/trial', label: 'تجربة مجانية', ic: Gift },
  { path: '/testimonials', label: 'آراء طلابنا', ic: MessageSquareHeart },
  { path: '/profile', label: 'البروفايل', ic: User },
];
const adminNav = [
  { path: '/admin', label: 'نظرة عامة', ic: LayoutDashboard },
  { path: '/admin/students', label: 'الطلاب', ic: Users },
  { path: '/admin/curriculum', label: 'المستويات والجلسات', ic: Layers },
  { path: '/admin/content', label: 'المحتوى', ic: FileText },
  { path: '/admin/lesson', label: 'تعديل السيشنات', ic: PenLine },
  { path: '/admin/reviews', label: 'مراجعة النتائج', ic: Inbox },
  { path: '/admin/task-reviews', label: 'مراجعة التاسكات', ic: ListChecks },
  { path: '/admin/operations', label: 'التاسكات والإشعارات', ic: ListChecks },
  { path: '/admin/certificates', label: 'الشهادات', ic: Award },
  { path: '/admin/settings', label: 'الإعدادات', ic: Settings },
];

export function Layout({ current, children }: { current: string; children: React.ReactNode }) {
  const { user, logout, data, put } = useApp();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [perm, setPerm] = useState(notificationPermission());
  const pull = usePullToRefresh();
  const [, setTick] = useState(0);
  useEffect(() => onInstallChange(() => setTick((t) => t + 1)), []);
  if (!user) return <>{children}</>;
  const admin = user.role === 'admin';
  const nav = admin ? adminNav : studentNav;
  const notes = data.notifications.filter((n) => n.targetId === 'all' || n.targetId === user.id || n.targetId === user.levelId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = notes.filter((n) => !n.read).length;
  const unreadKey = notes.filter((n) => !n.read).map((n) => n.id).join('|');
  useEffect(() => { notes.filter((n) => !n.read).slice(0, 3).forEach((n) => { void showBrowserNotification({ id: n.id, title: n.title, body: n.body, href: n.href }); }); }, [unreadKey]);
  const level = data.levels.find((l) => l.id === user.levelId) || data.levels[0];
  const pct = !admin && level ? engagementProgress(data, level.id, user.id) : 0;
  const points = admin ? 0 : totalScore(data, user.id);
  const active = (p: string) => p === '/' ? current === '/' : current.startsWith(p);

  const bellButton = <button className="icon-btn bell" onClick={() => setBell(true)} aria-label="الإشعارات" title="الإشعارات">
    <Bell size={18} />{unread > 0 && <span className="badge badge-red bell-count">{unread}</span>}
  </button>;

  const side = <aside className={`side ${open ? 'open' : ''}`}>
    <div className="brand"><img className="brand-logo" src="./logo-on-dark.png" alt="Speakozy" /></div>
    <div className="nav-group">{admin ? 'لوحة الأدمن' : 'مساحة الطالب'}</div>
    <nav className="nav" onClick={() => setOpen(false)}>
      {nav.map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={active(n.path) ? 'active' : ''}>
        <span className="ic"><Icon size={18} strokeWidth={2} /></span>{n.label}
      </a>; })}
    </nav>
    <div className="side-foot">
      <div className="who"><span className="avatar">{user.avatar || (user.role === 'admin' ? '🧑‍💼' : '🧑‍🎓')}</span><span>{user.name}<br /><small>{admin ? 'مدير الأكاديمية' : 'طالب'}</small></span></div>
      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { logout(); go('/'); }}><LogOut size={14} /> تسجيل الخروج</button>
    </div>
  </aside>;

  const shortLabel = (l: string) => ({ 'خريطة المستويات': 'المستويات', 'تجربة مجانية': 'تجربة', 'آراء طلابنا': 'آراء', 'المستويات والجلسات': 'المستويات', 'استوديو الجرامر': 'الجرامر', 'تعديل السيشنات': 'السيشنات', 'مراجعة النتائج': 'المراجعة', 'التاسكات والإشعارات': 'التاسكات', 'التاسكات اليومية': 'التاسكات', 'يلا نتكلم': 'نتكلم', 'العب واتعلم': 'العب' } as Record<string, string>)[l] || l.split(' ')[0];
  const mobile = <nav className="mobile-nav">
    {nav.slice(0, 5).map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={active(n.path) ? 'active' : ''}>
      <Icon size={18} /><span>{shortLabel(n.label)}</span>
    </a>; })}
    <button onClick={() => setOpen(true)}><Menu size={18} /><span>المزيد</span></button>
  </nav>;

  return <>
    {pull.active && <div className="ptr"><span>{pull.ready ? 'سيب للتحديث ↻' : 'اسحب للتحديث ↓'}</span></div>}
    <div className="topbar">
      <button className="icon-btn" onClick={() => setOpen(true)} aria-label="القائمة"><Menu size={18} /></button>
      <div className="auth-brand"><img className="brand-logo" src="./logo-on-dark.png" alt="Speakozy" /></div>
    </div>
    <div className="shell">{side}<main className="main" id="app-main"><div className="content-bar">
      <div className="content-bar-row">
        {profileMenu && <div className="profile-menu">
          <button onClick={() => { setProfileMenu(false); go('/profile'); }}>تعديل الملف الشخصي</button>
          <button onClick={() => { setProfileMenu(false); go('/trial'); }}>تفاصيل الكورس</button>
          {!isStandalone() && canInstall() && <button onClick={() => { setProfileMenu(false); void promptInstall(); }}>تثبيت التطبيق على الموبايل</button>}
          {!isStandalone() && !canInstall() && isIos() && <button onClick={() => { setProfileMenu(false); alert('على الآيفون: اضغط زرار المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».'); }}>تثبيت التطبيق على الموبايل</button>}
          <button onClick={() => { setProfileMenu(false); logout(); go('/'); }}>تسجيل الخروج / دخول حساب تاني</button>
        </div>}
        <div className="sticky-progress">
          {!admin && <><span className="sticky-level">{level?.title || 'المستوى'}</span><div className="progress-track sticky-track"><span style={{ width: `${pct}%` }} /></div><strong className="sticky-pct">{pct}%</strong></>}
          {admin && <span className="muted">لوحة الأدمن</span>}
        </div>
        {!admin && <strong className="sticky-points">{points} pts</strong>}
        {bellButton}
        <button className="user-chip" onClick={() => setProfileMenu((m) => !m)} aria-label="الملف الشخصي"><span className="avatar">{user.avatar || (user.role === 'admin' ? '🧑‍💼' : '🧑‍🎓')}</span>{!admin && <span className="user-chip-name">{user.name.split(' ')[0]}{isSubscribed(user) && <span className="verified-badge" title="طالب مشترك">✓</span>}</span>}</button>
      </div>
      {!admin && !isSubscribed(user) && <div className="sub-banner" dir="rtl">
        <div className="sub-banner-text"><span className="sub-banner-ic" aria-hidden="true">✨</span><div><strong>انت غير مشترك في الكورس</strong><small>لتفاصيل الاشتراك</small></div></div>
        <SubscribeButtons size="sm" />
      </div>}
      {!admin && perm === 'default' && <div className="sub-notice" dir="rtl">
        <span>🔔 افتح الإشعارات علشان نفكرك بمهامك</span>
        <button className="btn btn-primary btn-sm" onClick={async () => setPerm(await requestNotifications())}>فعّل الإشعارات</button>
      </div>}
      {!admin && perm === 'denied' && <div className="sub-notice" dir="rtl"><span>🔕 الإشعارات مقفولة — فعّلها من إعدادات المتصفح عشان نفكرك بمهامك</span></div>}
    </div>{children}</main></div>
    {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 75 }} />}
    {mobile}
    <div className="float-stack">
      {!admin && !isSubscribed(user) && <a className="float-pricing" href={PRICING_URL} target="_blank" rel="noreferrer">شوف الباقات</a>}
      <a className="float-wa" href={WA_LINK} target="_blank" rel="noreferrer" aria-label="واتساب" title="تواصل معانا على واتساب"><MessageCircle size={20} /></a>
    </div>
    <Modal open={bell} title="الإشعارات" onClose={() => setBell(false)}>
      {notes.length ? <div className="stack">{notes.map((n) => <div key={n.id} className="section-card">
        <div className="row between"><strong>{n.title}</strong>{!n.read && <Badge tone="green">جديد</Badge>}</div>
        <p className="muted" style={{ margin: '.4rem 0' }}>{n.body}</p>
        <div className="row"><small className="muted">{fmtDate(n.createdAt)}</small>
          <Button size="sm" variant="ghost" onClick={async () => { if (!n.read) { if (admin) await put('notifications', { ...n, read: true }); else await put('notificationReads', { id: `${user.id}-${n.id}`, studentId: user.id, notificationId: n.id, read: true }); } if (n.href) { setBell(false); go(n.href.replace('#', '')); } }}>افتح</Button>
        </div>
      </div>)}</div> : <div className="empty">مفيش إشعارات</div>}
    </Modal>
  </>;
}

import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { go } from '../App';
import { isSubscribed } from '../lib/subscription';
import { usePullToRefresh } from '../lib/pullToRefresh';
import { ThemeToggle } from './ThemeToggle';
import { Menu } from 'lucide-react';
import { adminNav, studentNav } from './layout/nav';
import { useNotifications } from './layout/useNotifications';
import { usePushPrompt } from './layout/usePushPrompt';
import { Sidebar } from './layout/Sidebar';
import { StudentHeader } from './layout/StudentHeader';
import { AdminBar } from './layout/AdminBar';
import { MobileNav } from './layout/MobileNav';
import { Notices } from './layout/Notices';
import { FloatingActions } from './layout/FloatingActions';
import { NotificationsModal } from './layout/NotificationsModal';
import { tr, setStaffMode } from '../lib/i18n';

/** App chrome. Students get a top header; admins keep the sidebar. */
export function Layout({ current, children }: { current: string; children: React.ReactNode }) {
  const { user } = useApp();
  setStaffMode(user?.role === 'admin');
  if (!user) return <>{children}</>;
  return <AuthedLayout current={current}>{children}</AuthedLayout>;
}

function AuthedLayout({ current, children }: { current: string; children: React.ReactNode }) {
  const { user: u, logout, data, put } = useApp();
  const user = u!;
  const admin = user.role === 'admin';
  const nav = admin ? adminNav : studentNav;
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const pull = usePullToRefresh();
  const { notes, unread } = useNotifications(user, data);
  const push = usePushPrompt(!admin);
  const unsubscribed = !admin && !isSubscribed(user);
  const doLogout = () => { logout(); go('/'); };
  const notices = !admin && <Notices showSubscribe={unsubscribed} push={push} />;

  return <>
    {pull.active && <div className="ptr"><span>{pull.ready ? tr('سيب للتحديث ↻') : tr('اسحب للتحديث ↓')}</span></div>}
    {admin && <div className="topbar">
      <button className="icon-btn" onClick={() => setDrawer(true)} aria-label={tr('القائمة')}><Menu size={18} /></button>
      <div className="auth-brand"><img className="brand-logo logo-for-dark" src="./logo-on-dark.png" alt="Speakozy" /><img className="brand-logo logo-for-light" src="./logo-on-light.png" alt="Speakozy" /></div>
      <ThemeToggle />
    </div>}
    {!admin && <StudentHeader user={user} data={data} current={current} unread={unread} onBell={() => setBell(true)} onMenu={() => setDrawer(true)} onLogout={doLogout} />}
    <div className={`shell ${admin ? 'is-admin' : 'is-student'}`}>
      <Sidebar nav={nav} current={current} admin={admin} user={user} open={drawer} onClose={() => setDrawer(false)} onLogout={doLogout} />
      <main className="main" id="app-main">
        {admin && <AdminBar user={user} unread={unread} onBell={() => setBell(true)} onLogout={doLogout} />}
        {!admin && <div className="notices">{notices}</div>}
        {children}
      </main>
    </div>
    {drawer && <div className="drawer-scrim" onClick={() => setDrawer(false)} />}
    <MobileNav nav={nav} current={current} onMore={() => setDrawer(true)} admin={admin} />
    <FloatingActions showPricing={unsubscribed} />
    <NotificationsModal open={bell} onClose={() => setBell(false)} notes={notes} admin={admin} user={user} put={put} />
  </>;
}

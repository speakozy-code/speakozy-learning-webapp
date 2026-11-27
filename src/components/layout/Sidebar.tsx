import { LogOut } from 'lucide-react';
import { NavItem, isActivePath } from './nav';
import { siteUrl } from '../../lib/subscription';
import { ThemeToggle } from '../ThemeToggle';

/** Admin sidebar on desktop; slide-in drawer for everyone on mobile. */
export function Sidebar({ nav, current, admin, user, open, onClose, onLogout }: { nav: NavItem[]; current: string; admin: boolean; user: any; open: boolean; onClose: () => void; onLogout: () => void }) {
  const avatar = user.avatar || (admin ? '🧑‍💼' : '🧑‍🎓');
  return <aside className={`side ${open ? 'open' : ''}`}>
    <div className="brand"><a href={siteUrl('/')} title="موقع Speakozy"><img className="brand-logo" src="./logo-on-dark.png" alt="Speakozy" /></a></div>
    <div className="nav-group">{admin ? 'لوحة الأدمن' : 'مساحة الطالب'}</div>
    <nav className="nav" onClick={onClose}>
      {nav.map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={isActivePath(current, n.path) ? 'active' : ''}>
        <span className="ic"><Icon size={18} strokeWidth={2} /></span>{n.label}
      </a>; })}
    </nav>
    <div className="side-foot">
      <div className="who"><span className="avatar">{avatar}</span><span>{user.name}<br /><small>{admin ? 'مدير الأكاديمية' : 'طالب'}</small></span></div>
      <ThemeToggle label className="btn btn-ghost btn-sm" />
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '.4rem' }} onClick={onLogout}><LogOut size={14} /> تسجيل الخروج</button>
    </div>
  </aside>;
}

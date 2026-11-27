import { LogOut } from 'lucide-react';
import { NavItem, isActivePath } from './nav';
import { siteUrl } from '../../lib/subscription';
import { ThemeToggle } from '../ThemeToggle';
import { LangToggle } from '../LangToggle';
import { tr } from '../../lib/i18n';

/** Admin sidebar on desktop; slide-in drawer for everyone on mobile. */
export function Sidebar({ nav, current, admin, user, open, onClose, onLogout }: { nav: NavItem[]; current: string; admin: boolean; user: any; open: boolean; onClose: () => void; onLogout: () => void }) {
  const avatar = user.avatar || (admin ? '🧑‍💼' : '🧑‍🎓');
  return <aside className={`side ${open ? 'open' : ''}`}>
    <div className="brand"><a href={siteUrl('/')} title={tr('موقع Speakozy')}><img className="brand-logo" src="./logo-on-dark.png" alt="Speakozy" /></a></div>
    <div className="nav-group">{admin ? tr('لوحة الأدمن') : tr('مساحة الطالب')}</div>
    <nav className="nav" onClick={onClose}>
      {nav.map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={isActivePath(current, n.path) ? 'active' : ''}>
        <span className="ic"><Icon size={18} strokeWidth={2} /></span>{tr(n.label)}
      </a>; })}
    </nav>
    <div className="side-foot">
      <div className="who"><span className="avatar">{avatar}</span><span>{user.name}<br /><small>{admin ? tr('مدير الأكاديمية') : tr('طالب')}</small></span></div>
      {!admin && <LangToggle className="btn btn-ghost btn-sm" />}
      <ThemeToggle label className="btn btn-ghost btn-sm" />
      <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '.4rem' }} onClick={onLogout}><LogOut size={14} /> {tr('تسجيل الخروج')}</button>
    </div>
  </aside>;
}

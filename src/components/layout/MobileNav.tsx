import { Menu } from 'lucide-react';
import { NavItem, STUDENT_MOBILE, isActivePath, shortLabel } from './nav';
import { tr } from '../../lib/i18n';

export function MobileNav({ nav, current, onMore, admin }: { nav: NavItem[]; current: string; onMore: () => void; admin?: boolean }) {
  const items = admin ? nav.slice(0, 5) : STUDENT_MOBILE.map((p) => nav.find((n) => n.path === p)).filter(Boolean) as NavItem[];
  return <nav className="mobile-nav">
    {items.map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={isActivePath(current, n.path) ? 'active' : ''}>
      <Icon size={18} /><span>{shortLabel(n.label)}</span>
    </a>; })}
    <button onClick={onMore}><Menu size={18} /><span>{tr('المزيد')}</span></button>
  </nav>;
}

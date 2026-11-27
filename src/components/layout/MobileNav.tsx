import { Menu } from 'lucide-react';
import { NavItem, isActivePath, shortLabel } from './nav';
import { tr } from '../../lib/i18n';

export function MobileNav({ nav, current, onMore }: { nav: NavItem[]; current: string; onMore: () => void }) {
  return <nav className="mobile-nav">
    {nav.slice(0, 5).map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={isActivePath(current, n.path) ? 'active' : ''}>
      <Icon size={18} /><span>{shortLabel(n.label)}</span>
    </a>; })}
    <button onClick={onMore}><Menu size={18} /><span>{tr('المزيد')}</span></button>
  </nav>;
}

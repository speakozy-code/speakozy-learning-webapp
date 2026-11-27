import { useState } from 'react';
import { Bell, Menu, ChevronDown } from 'lucide-react';
import { engagementProgress, levelScore } from '../../lib/domain';
import { isSubscribed, siteUrl } from '../../lib/subscription';
import { ThemeToggle } from '../ThemeToggle';
import { LangToggle } from '../LangToggle';
import { ProfileMenu } from './ProfileMenu';
import { studentNav, STUDENT_PRIMARY, shortLabel, isActivePath } from './nav';
import { tr } from '../../lib/i18n';

interface Props { user: any; data: any; current: string; unread: number; onBell: () => void; onMenu: () => void; onLogout: () => void }

/** Student header (desktop: logo + pill navigation + stats; mobile: logo + stats + menu button). */
export function StudentHeader({ user, data, current, unread, onBell, onMenu, onLogout }: Props) {
  const [more, setMore] = useState(false);
  const [profile, setProfile] = useState(false);
  const level = data.levels.find((l: any) => l.id === user.levelId) || data.levels[0];
  const pct = level ? engagementProgress(data, level.id, user.id) : 0;
  const points = level ? levelScore(data, user.id, level.id) : 0;
  const primary = studentNav.filter((n) => STUDENT_PRIMARY.includes(n.path));
  const rest = studentNav.filter((n) => !STUDENT_PRIMARY.includes(n.path));
  const moreActive = rest.some((n) => isActivePath(current, n.path));
  const pillLabel = (n: { label: string }) => (n.label === 'خريطة المستويات' ? tr('المسار') : n.label === 'التاسكات اليومية' ? tr('التاسكات') : tr(n.label));

  return <header className="tnav">
    <button className="tnav-icon tnav-menu" onClick={onMenu} aria-label={tr('القائمة')}><Menu size={20} /></button>
    <a className="tnav-brand" href={siteUrl('/')} title={tr('موقع Speakozy')}>
      <img className="brand-logo logo-for-dark" src="./logo-on-dark.png" alt="Speakozy" />
      <img className="brand-logo logo-for-light" src="./logo-on-light.png" alt="Speakozy" />
    </a>
    <nav className="tnav-pills" aria-label={tr('التنقل الرئيسي')}>
      {primary.map((n) => <a key={n.path} href={'#' + n.path} className={isActivePath(current, n.path) ? 'active' : ''}>{pillLabel(n)}</a>)}
      <div className="tnav-more">
        <button className={moreActive ? 'active' : ''} onClick={() => setMore((m) => !m)} aria-expanded={more}>{tr('المزيد')} <ChevronDown size={15} /></button>
        {more && <div className="tnav-pop" onClick={() => setMore(false)}>
          {rest.map((n) => { const Icon = n.ic; return <a key={n.path} href={'#' + n.path} className={isActivePath(current, n.path) ? 'active' : ''}><Icon size={17} />{tr(n.label)}</a>; })}
        </div>}
      </div>
    </nav>
    <div className="tnav-stats">
      <span className="tnav-chip tnav-level" title={tr('تقدمك في المستوى')}><b>{level?.title || tr('المستوى')}</b><span className="tnav-bar"><i style={{ width: `${pct}%` }} /></span><b dir="ltr">{pct}%</b></span>
      <span className="tnav-chip tnav-points" dir="ltr">{points} pts</span>
      <LangToggle />
      <ThemeToggle />
      <button className="tnav-icon tnav-bell" onClick={onBell} aria-label={tr('الإشعارات')} title={tr('الإشعارات')}><Bell size={18} />{unread > 0 && <span className="tnav-badge">{unread}</span>}</button>
      <div className="tnav-user">
        <button className="tnav-avatar" onClick={() => setProfile((p) => !p)} aria-label={tr('الملف الشخصي')}><span className="avatar">{user.avatar || '🧑‍🎓'}</span>{isSubscribed(user) && <span className="verified-badge" title={tr('طالب مشترك')}>✓</span>}</button>
        {profile && <ProfileMenu onClose={() => setProfile(false)} onLogout={onLogout} />}
      </div>
    </div>
  </header>;
}

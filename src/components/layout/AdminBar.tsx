import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { ProfileMenu } from './ProfileMenu';

/** Slim bar at the top of every admin page: notifications + account menu. */
export function AdminBar({ user, unread, onBell, onLogout, children }: { user: any; unread: number; onBell: () => void; onLogout: () => void; children?: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  return <div className="content-bar">
    <div className="content-bar-row">
      {menu && <ProfileMenu user={user} onClose={() => setMenu(false)} onLogout={onLogout} />}
      <div className="sticky-progress"><span className="muted">لوحة الأدمن</span></div>
      <button className="icon-btn bell" onClick={onBell} aria-label="الإشعارات" title="الإشعارات">
        <Bell size={18} />{unread > 0 && <span className="badge badge-red bell-count">{unread}</span>}
      </button>
      <button className="user-chip" onClick={() => setMenu((m) => !m)} aria-label="الملف الشخصي"><span className="user-chip-name">{user.name}</span></button>
    </div>
    {children}
  </div>;
}

import { Modal, fmtDate } from '../UI';
import { go } from '../../App';
import { tr } from '../../lib/i18n';

export function NotificationsModal({ open, onClose, notes, admin, user, put }: { open: boolean; onClose: () => void; notes: any[]; admin: boolean; user: any; put: (k: any, v: any) => Promise<any> }) {
  async function openNote(n: any) {
    if (!n.read) {
      if (admin) await put('notifications', { ...n, read: true });
      else await put('notificationReads', { id: `${user.id}-${n.id}`, studentId: user.id, notificationId: n.id, read: true });
    }
    if (n.href) { onClose(); go(n.href.replace('#', '')); }
  }
  return <Modal open={open} title={tr('الإشعارات')} onClose={onClose}>
    {notes.length ? <div className="notif-list">{notes.map((n) => <div key={n.id} role="button" tabIndex={0} className={`notif-item${n.read ? '' : ' unread'}`} onClick={() => openNote(n)}>
      <div className="notif-main"><strong>{tr(n.title)}</strong><span className="muted"> — {tr(n.body)}</span></div>
      <div className="row between"><small className="muted">{fmtDate(n.createdAt)}</small>{!n.read && <span className="notif-dot" />}</div>
    </div>)}</div> : <div className="empty">{tr('مفيش إشعارات')}</div>}
  </Modal>;
}

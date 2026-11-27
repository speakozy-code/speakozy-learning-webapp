import { Modal, fmtDate } from '../UI';
import { go } from '../../App';

export function NotificationsModal({ open, onClose, notes, admin, user, put }: { open: boolean; onClose: () => void; notes: any[]; admin: boolean; user: any; put: (k: any, v: any) => Promise<any> }) {
  async function openNote(n: any) {
    if (!n.read) {
      if (admin) await put('notifications', { ...n, read: true });
      else await put('notificationReads', { id: `${user.id}-${n.id}`, studentId: user.id, notificationId: n.id, read: true });
    }
    if (n.href) { onClose(); go(n.href.replace('#', '')); }
  }
  return <Modal open={open} title="الإشعارات" onClose={onClose}>
    {notes.length ? <div className="notif-list">{notes.map((n) => <div key={n.id} role="button" tabIndex={0} className={`notif-item${n.read ? '' : ' unread'}`} onClick={() => openNote(n)}>
      <div className="notif-main"><strong>{n.title}</strong><span className="muted"> — {n.body}</span></div>
      <div className="row between"><small className="muted">{fmtDate(n.createdAt)}</small>{!n.read && <span className="notif-dot" />}</div>
    </div>)}</div> : <div className="empty">مفيش إشعارات</div>}
  </Modal>;
}

import { useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, Empty, fmtDate } from '../../components/UI';
import { go } from '../../App';
import { notificationPermission, requestNotifications } from '../../lib/pwa';

export function NotificationsPage() {
  const { user, data, put } = useApp();
  const [perm, setPerm] = useState(notificationPermission());
  if (!user) return null;
  const readSet = new Set((data.notificationReads || []).filter((r) => r.studentId === user.id && r.read).map((r) => r.notificationId));
  const list = data.notifications.filter((n) => n.targetId === 'all' || n.targetId === user.id || n.targetId === user.levelId).map((n) => ({ ...n, read: n.read || readSet.has(n.id) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  async function markRead(n: any) {
    if (n.read) return;
    if (user!.role === 'admin') await put('notifications', { ...n, read: true });
    else await put('notificationReads', { id: `${user!.id}-${n.id}`, studentId: user!.id, notificationId: n.id, read: true });
  }
  return <div className="stack">
    <div><h1>الإشعارات</h1><p className="muted">إشعارات الموقع متاحة دايمًا. إشعارات الجهاز محتاجة إذنك.</p>
      {perm === 'default' && <Button size="sm" style={{ marginTop: '.6rem' }} onClick={async () => setPerm(await requestNotifications())}>فعّل إشعارات الجهاز</Button>}
      {perm === 'granted' && <Badge tone="green">إشعارات الجهاز شغالة</Badge>}
      {perm === 'denied' && <div className="note" style={{ marginTop: '.6rem' }}>إشعارات الجهاز مقفولة من إعدادات المتصفح. فعّلها من هناك لو عايزها.</div>}
      {perm === 'unsupported' && <div className="note" style={{ marginTop: '.6rem' }}>المتصفح ده مش بيدعم إشعارات الجهاز.</div>}
      {perm === 'granted' && <p className="muted" style={{ fontSize: '.8rem' }}>الإشعارات بتظهر وانت فاتح الموقع أو التطبيق. التنبيه والتطبيق مقفول محتاج خدمة push منفصلة.</p>}
    </div>
    <Card>{list.length ? <div className="stack">{list.map((n) => <div key={n.id} className={`section-card ${!n.read ? 'done' : ''}`}>
      <div className="row between"><strong>{n.title}</strong>{!n.read && <Badge tone="green">جديد</Badge>}</div>
      <p className="muted" style={{ margin: '.4rem 0' }}>{n.body}</p>
      <div className="row"><small className="muted">{fmtDate(n.createdAt)}</small>
        <Button size="sm" variant="ghost" onClick={async () => { await markRead(n); if (n.href) go(n.href.replace('#', '')); }}>افتح</Button>
      </div>
    </div>)}</div> : <Empty title="مفيش إشعارات" />}</Card>
  </div>;
}

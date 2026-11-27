import { useEffect, useMemo } from 'react';
import { showBrowserNotification } from '../../lib/pwa';

/** Notifications addressed to this user (everyone, the user, or their level), newest first, with a per-user read flag. */
export function useNotifications(user: any, data: any) {
  const notes = useMemo(() => {
    const readSet = new Set((data.notificationReads || []).filter((r: any) => r.studentId === user.id && r.read).map((r: any) => r.notificationId));
    return data.notifications
      .filter((n: any) => n.targetId === 'all' || n.targetId === user.id || n.targetId === user.levelId)
      .map((n: any) => ({ ...n, read: n.read || readSet.has(n.id) }))
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  }, [data.notifications, data.notificationReads, user.id, user.levelId]);
  const fresh = notes.filter((n: any) => !n.read);
  const unreadKey = fresh.map((n: any) => n.id).join('|');

  // never burst several system notifications at once (Chrome flags that as spam): one notification, or one daily summary
  useEffect(() => {
    if (fresh.length === 1) void showBrowserNotification({ id: fresh[0].id, title: fresh[0].title, body: fresh[0].body, href: fresh[0].href });
    else if (fresh.length > 1) void showBrowserNotification({ id: `summary-${user.id}-${new Date().toISOString().slice(0, 10)}`, title: 'Speakozy', body: `عندك ${fresh.length} إشعارات جديدة`, href: '#/notifications' });
  }, [unreadKey]);

  return { notes, unread: fresh.length };
}

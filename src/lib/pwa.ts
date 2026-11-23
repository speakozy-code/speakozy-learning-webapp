// PWA install prompt + browser notifications (local notifications only: no push server is involved).
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; notify(); });
}

export const canInstall = () => deferred !== null;
export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
export const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
export function onInstallChange(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null; notify();
  return choice.outcome === 'accepted';
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const notificationPermission = (): NotificationPermission | 'unsupported' => notificationsSupported() ? Notification.permission : 'unsupported';
export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

const SEEN_KEY = 'speakozy-notified';
const seen = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; } };

/** Shows a system notification once per notification id (only while the app is open or in the background). */
export async function showBrowserNotification(n: { id: string; title: string; body: string; href?: string }) {
  if (notificationPermission() !== 'granted') return;
  const done = seen();
  if (done.includes(n.id)) return;
  localStorage.setItem(SEEN_KEY, JSON.stringify([...done, n.id].slice(-200)));
  const opts = { body: n.body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', dir: 'rtl' as const, lang: 'ar', tag: n.id, data: { href: n.href ? `./${n.href}` : './' } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(n.title, opts); else new Notification(n.title, opts);
  } catch { /* notifications are best-effort */ }
}

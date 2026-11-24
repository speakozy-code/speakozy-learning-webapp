import { sb } from './supabase';

// Public VAPID key (safe to ship); the private key lives only in the Supabase function secrets.
const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string) || 'BEFEbAgIihwuLtDJKkwLembCdLmntiMvptmrFLMjuccCHStQzOS9RbMaYugWmrSCW8T4QymQ-r-Xpz581s88824';

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const toKey = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready);
}

export async function pushEnabled(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  try { return !!(await (await registration()).pushManager.getSubscription()); } catch { return false; }
}

export async function enablePush(): Promise<'ok' | 'denied' | 'unsupported' | 'failed'> {
  if (!pushSupported() || !sb) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  try {
    const reg = await registration();
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC_KEY) }));
    const j = sub.toJSON() as any;
    const { error } = await sb.rpc('save_push_subscription', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
    if (error) throw error;
    return 'ok';
  } catch (e) { console.error('push subscribe failed', e); return 'failed'; }
}

export async function disablePush(): Promise<void> {
  if (!pushSupported() || !sb) return;
  try {
    const sub = await (await registration()).pushManager.getSubscription();
    if (sub) { await sb.rpc('delete_push_subscription', { p_endpoint: sub.endpoint }); await sub.unsubscribe(); }
  } catch { /* best effort */ }
}

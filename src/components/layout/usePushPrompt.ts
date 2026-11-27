import { useEffect, useState } from 'react';
import { pushSupported, pushEnabled, enablePush } from '../../lib/push';
import { isStandalone, isIos, notificationPermission } from '../../lib/pwa';

/** State for the "turn on notifications" card shown to students. */
export function usePushPrompt(enabledForUser: boolean) {
  const [perm, setPerm] = useState(notificationPermission());
  const [pushOn, setPushOn] = useState<boolean | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { if (enabledForUser) void pushEnabled().then(setPushOn); }, [enabledForUser, perm]);
  const show = enabledForUser && pushSupported() && pushOn === false && perm !== 'denied' && !(isIos() && !isStandalone());
  async function enable() {
    const r = await enablePush();
    setPerm(notificationPermission());
    if (r === 'ok') setPushOn(true); else setMsg(r === 'denied' ? '' : 'حصلت مشكلة، جرّب تاني');
  }
  return { show, denied: enabledForUser && perm === 'denied', enable, msg };
}

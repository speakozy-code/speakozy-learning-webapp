const KEY = 'spk-analytics-consent';
const GA_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;

export type Consent = 'granted' | 'denied' | null;
export const getConsent = (): Consent => { try { return (localStorage.getItem(KEY) as Consent) || null; } catch { return null; } };
export const setConsent = (v: 'granted' | 'denied') => { try { localStorage.setItem(KEY, v); } catch {} if (v === 'granted') loadAnalytics(); };

let loaded = false;
/** Google Analytics 4 is only loaded after the visitor agrees. No names, emails or message text are sent. */
export function loadAnalytics() {
  if (loaded || !GA_ID || getConsent() !== 'granted') return;
  loaded = true;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag('js', new Date());
  w.gtag('config', GA_ID, { anonymize_ip: true, send_page_view: false });
  const sc = document.createElement('script'); sc.async = true; sc.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`; document.head.appendChild(sc);
  const view = () => w.gtag('event', 'page_view', { page_path: window.location.hash.replace('#', '') || '/' });
  window.addEventListener('hashchange', view); view();
}

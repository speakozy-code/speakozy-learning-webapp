import { SubscribeButtons } from '../Upsell';
import { tr, uiDir } from '../../lib/i18n';

/** Subscription + push-permission banners shown under the header. */
export function Notices({ showSubscribe, push }: { showSubscribe: boolean; push: { show: boolean; denied: boolean; enable: () => void; msg: string } }) {
  return <>
    {showSubscribe && <div className="sub-banner" dir={uiDir()}>
      <div className="sub-banner-text"><span className="sub-banner-ic" aria-hidden="true">✨</span><div><strong>{tr('انت غير مشترك في الكورس')}</strong><small>{tr('لتفاصيل الاشتراك')}</small></div></div>
      <SubscribeButtons size="sm" />
    </div>}
    {push.show && <div className="sub-notice" dir={uiDir()}>
      <span>{tr('🔔 فعّل الإشعارات علشان نفكرك باللي فاتك: كلمات المراجعة، المهام، وانتهاء الاشتراك — حتى لو التطبيق مقفول')}</span>
      <button className="btn btn-primary btn-sm" onClick={push.enable}>{tr('فعّل الإشعارات')}</button>
      {push.msg && <small>{push.msg}</small>}
    </div>}
    {push.denied && <div className="sub-notice" dir={uiDir()}><span>{tr('🔕 الإشعارات مقفولة — فعّلها من إعدادات المتصفح عشان نفكرك بمهامك')}</span></div>}
  </>;
}

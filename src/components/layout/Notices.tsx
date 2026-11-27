import { SubscribeButtons } from '../Upsell';

/** Subscription + push-permission banners shown under the header. */
export function Notices({ showSubscribe, push }: { showSubscribe: boolean; push: { show: boolean; denied: boolean; enable: () => void; msg: string } }) {
  return <>
    {showSubscribe && <div className="sub-banner" dir="rtl">
      <div className="sub-banner-text"><span className="sub-banner-ic" aria-hidden="true">✨</span><div><strong>انت غير مشترك في الكورس</strong><small>لتفاصيل الاشتراك</small></div></div>
      <SubscribeButtons size="sm" />
    </div>}
    {push.show && <div className="sub-notice" dir="rtl">
      <span>🔔 فعّل الإشعارات علشان نفكرك باللي فاتك: كلمات المراجعة، المهام، وانتهاء الاشتراك — حتى لو التطبيق مقفول</span>
      <button className="btn btn-primary btn-sm" onClick={push.enable}>فعّل الإشعارات</button>
      {push.msg && <small>{push.msg}</small>}
    </div>}
    {push.denied && <div className="sub-notice" dir="rtl"><span>🔕 الإشعارات مقفولة — فعّلها من إعدادات المتصفح عشان نفكرك بمهامك</span></div>}
  </>;
}

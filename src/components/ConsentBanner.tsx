import React, { useEffect, useState } from 'react';
import { getConsent, setConsent, loadAnalytics } from '../lib/analytics';
import { tr, uiDir } from '../lib/i18n';

export function ConsentBanner() {
  const [c, setC] = useState(getConsent());
  useEffect(() => { loadAnalytics(); }, []);
  if (c) return null;
  const choose = (v: 'granted' | 'denied') => { setConsent(v); setC(v); };
  return <div className="consent" dir={uiDir()} role="dialog" aria-label={tr('قياس الزيارات')}>
    <strong>{tr('قياس الزيارات')}</strong>
    <p>{tr('نستخدم Google Analytics 4 لفهم استخدام الموقع وتحسينه. لن يُحمَّل قبل موافقتك، ولا نرسل إليه بيانات التسجيل الشخصية أو نصوص الرسائل.')}</p>
    <div className="row">
      <button className="btn btn-primary btn-sm" onClick={() => choose('granted')}>{tr('موافق')}</button>
      <button className="btn btn-ghost btn-sm" onClick={() => choose('denied')}>{tr('لا، شكرًا')}</button>
      <a href="https://meilenstein-institut.com/privacy#analytics-consent" target="_blank" rel="noreferrer">{tr('اقرأ سياسة الخصوصية')}</a>
    </div>
  </div>;
}

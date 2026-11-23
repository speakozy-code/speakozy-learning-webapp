import React, { useEffect, useState } from 'react';
import { getConsent, setConsent, loadAnalytics } from '../lib/analytics';

export function ConsentBanner() {
  const [c, setC] = useState(getConsent());
  useEffect(() => { loadAnalytics(); }, []);
  if (c) return null;
  const choose = (v: 'granted' | 'denied') => { setConsent(v); setC(v); };
  return <div className="consent" dir="rtl" role="dialog" aria-label="قياس الزيارات">
    <strong>قياس الزيارات</strong>
    <p>نستخدم Google Analytics 4 لفهم استخدام الموقع وتحسينه. لن يُحمَّل قبل موافقتك، ولا نرسل إليه بيانات التسجيل الشخصية أو نصوص الرسائل.</p>
    <div className="row">
      <button className="btn btn-primary btn-sm" onClick={() => choose('granted')}>موافق</button>
      <button className="btn btn-ghost btn-sm" onClick={() => choose('denied')}>لا، شكرًا</button>
      <a href="https://meilenstein-institut.com/privacy#analytics-consent" target="_blank" rel="noreferrer">اقرأ سياسة الخصوصية</a>
    </div>
  </div>;
}

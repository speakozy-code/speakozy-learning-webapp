import { Settings, MessageCircle, Compass, LogOut, Smartphone, BookOpen } from 'lucide-react';
import { go } from '../../App';
import { canInstall, isStandalone, isIos, promptInstall } from '../../lib/pwa';
import { openHelp } from '../../lib/help';
import { WA_LINK } from './nav';
import { isSubscribed } from '../../lib/subscription';
import { tr } from '../../lib/i18n';

export function ProfileMenu({ user, onClose, onLogout }: { user: any; onClose: () => void; onLogout: () => void }) {
  const nav = (path: string) => () => { onClose(); go(path); };
  return <div className="profile-menu">
    <div className="pm-head">
      <span className="pm-who"><b>{user.name}{isSubscribed(user) && <span className="verified-badge" title={tr('طالب مشترك')}>✓</span>}</b><small dir="ltr">{user.email}</small></span>
    </div>
    <button onClick={nav('/profile')}><Settings size={17} />{tr('الحساب والإعدادات')}</button>
    <button onClick={nav('/trial')}><BookOpen size={17} />{tr('تفاصيل الكورس')}</button>
    <a href={WA_LINK.split('?')[0] + '?text=' + encodeURIComponent(tr('عندي اقتراح أو مشكلة في موقع Speakozy:'))} target="_blank" rel="noreferrer" onClick={onClose}><MessageCircle size={17} />{tr('اقتراح أو مشكلة؟')}</a>
    <button onClick={() => { onClose(); openHelp('guide'); }}><Compass size={17} />{tr('تعليمات الموقع')}</button>
    {!isStandalone() && canInstall() && <button onClick={() => { onClose(); void promptInstall(); }}><Smartphone size={17} />{tr('تثبيت التطبيق على الموبايل')}</button>}
    {!isStandalone() && !canInstall() && isIos() && <button onClick={() => { onClose(); alert(tr('على الآيفون: اضغط زرار المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».')); }}><Smartphone size={17} />{tr('تثبيت التطبيق على الموبايل')}</button>}
    <button className="pm-danger" onClick={() => { onClose(); onLogout(); }}><LogOut size={17} />{tr('تسجيل الخروج')}</button>
  </div>;
}

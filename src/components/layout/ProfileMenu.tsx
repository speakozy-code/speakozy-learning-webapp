import { go } from '../../App';
import { canInstall, isStandalone, isIos, promptInstall } from '../../lib/pwa';

export function ProfileMenu({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const nav = (path: string) => () => { onClose(); go(path); };
  return <div className="profile-menu">
    <button onClick={nav('/profile')}>تعديل الملف الشخصي</button>
    <button onClick={nav('/trial')}>تفاصيل الكورس</button>
    {!isStandalone() && canInstall() && <button onClick={() => { onClose(); void promptInstall(); }}>تثبيت التطبيق على الموبايل</button>}
    {!isStandalone() && !canInstall() && isIos() && <button onClick={() => { onClose(); alert('على الآيفون: اضغط زرار المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».'); }}>تثبيت التطبيق على الموبايل</button>}
    <button onClick={() => { onClose(); onLogout(); }}>تسجيل الخروج / دخول حساب تاني</button>
  </div>;
}

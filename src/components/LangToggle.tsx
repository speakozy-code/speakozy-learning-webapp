import { Languages } from 'lucide-react';
import { toggleLang, isEnglish, tr } from '../lib/i18n';

/** Arabic / English switch, shown next to the theme toggle. Re-rendered by the app root on change. */
export function LangToggle({ className = 'icon-btn' }: { className?: string }) {
  const en = isEnglish();
  return <button type="button" className={`${className} lang-toggle`} onClick={toggleLang} aria-label={tr('تغيير اللغة')} title={tr('تغيير اللغة')}>
    <Languages size={16} /><span className="lang-toggle-text">{en ? 'عربي' : 'EN'}</span>
  </button>;
}

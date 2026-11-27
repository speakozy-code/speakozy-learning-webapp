import { ArrowUp, MessageCircle } from 'lucide-react';
import { PRICING_URL } from '../../lib/subscription';
import { WA_LINK } from './nav';
import { tr } from '../../lib/i18n';

export function FloatingActions({ showPricing }: { showPricing: boolean }) {
  const toTop = () => { document.getElementById('app-main')?.scrollTo({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <div className={`float-stack${showPricing ? ' split' : ''}`}>
    <button className="to-top-btn" aria-label={tr('طلوع لأول الصفحة')} title={tr('طلوع لأول الصفحة')} onClick={toTop}><ArrowUp size={18} /></button>
    {showPricing && <a className="float-pricing" href={PRICING_URL} target="_blank" rel="noreferrer">{tr('شوف الباقات')}</a>}
    <a className="float-wa" href={WA_LINK} target="_blank" rel="noreferrer" aria-label={tr('واتساب')} title={tr('تواصل معانا على واتساب')}><MessageCircle size={20} /></a>
  </div>;
}

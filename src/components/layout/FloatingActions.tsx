import { ArrowUp, MessageCircle } from 'lucide-react';
import { PRICING_URL } from '../../lib/subscription';
import { WA_LINK } from './nav';

export function FloatingActions({ showPricing }: { showPricing: boolean }) {
  const toTop = () => { document.getElementById('app-main')?.scrollTo({ top: 0, behavior: 'smooth' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <div className={`float-stack${showPricing ? ' split' : ''}`}>
    <button className="to-top-btn" aria-label="طلوع لأول الصفحة" title="طلوع لأول الصفحة" onClick={toTop}><ArrowUp size={18} /></button>
    {showPricing && <a className="float-pricing" href={PRICING_URL} target="_blank" rel="noreferrer">شوف الباقات</a>}
    <a className="float-wa" href={WA_LINK} target="_blank" rel="noreferrer" aria-label="واتساب" title="تواصل معانا على واتساب"><MessageCircle size={20} /></a>
  </div>;
}

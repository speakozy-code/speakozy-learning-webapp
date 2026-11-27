import { useEffect, useRef, useState } from 'react';
import { X, Compass, MessageCircle, ChevronDown, ChevronLeft, Sparkles, ArrowRight } from 'lucide-react';
import { WA_LINK } from './nav';
import { FAQ, FAQ_PREVIEW, onHelp, type HelpView } from '../../lib/help';
import { TOURS } from '../../lib/tours';
import { tr, uiDir, isEnglish } from '../../lib/i18n';

/** Floating assistant: round button + help panel (FAQ and "site instructions"). Replaces the old floating WhatsApp button. */
export function HelpAssistant() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<HelpView>('faq');
  const [all, setAll] = useState(false);
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [openTour, setOpenTour] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => onHelp((v) => { setView(v); setOpen(true); }), []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const away = (e: Event) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('keydown', k);
    document.addEventListener('pointerdown', away);
    return () => { window.removeEventListener('keydown', k); document.removeEventListener('pointerdown', away); };
  }, [open]);
  const faq = all ? FAQ : FAQ.slice(0, FAQ_PREVIEW);
  const tours = Object.entries(TOURS);
  const dir = uiDir();
  return <div className="assist" ref={wrap}>
    <button type="button" className={`assist-fab${open ? ' is-open' : ''}`} onClick={() => { setView('faq'); setOpen((o) => !o); }} aria-label={tr('المساعدة')} title={tr('محتاج مساعدة؟')}>
      {open ? <X size={22} /> : <span className="assist-fab-face"><Sparkles size={22} /></span>}
    </button>
    {open && <section className="assist-panel" dir={dir} role="dialog" aria-label={tr('المساعدة')}>
      <header className="assist-head">
        <button type="button" className="assist-x" onClick={() => setOpen(false)} aria-label={tr('إغلاق')}><X size={18} /></button>
        <div className="assist-title"><strong>{view === 'guide' ? tr('تعليمات الموقع') : tr('اسأل Speakozy')}</strong><small>{view === 'guide' ? tr('شرح سريع لكل جزء في الموقع') : tr('إجابات قصيرة عن استخدام الموقع')}</small></div>
        <span className="assist-face"><Sparkles size={20} /></span>
      </header>
      <div className="assist-body">
        {view === 'faq' ? <>
          <div className="assist-kicker">{tr('أسئلة شائعة')}</div>
          {faq.map((f, i) => <div key={f.q} className={`assist-q${openQ === i ? ' on' : ''}`}>
            <button type="button" onClick={() => setOpenQ(openQ === i ? null : i)} aria-expanded={openQ === i}><span>{tr(f.q)}</span><ChevronDown size={16} /></button>
            {openQ === i && <p>{tr(f.a)}</p>}
          </div>)}
          {!all && FAQ.length > FAQ_PREVIEW && <button type="button" className="assist-all" onClick={() => setAll(true)}>{tr('كل الأسئلة')} {isEnglish() ? <ArrowRight size={14} /> : <ChevronLeft size={14} />}</button>}
        </> : <>
          <button type="button" className="assist-all assist-back" onClick={() => setView('faq')}>{isEnglish() ? <ChevronLeft size={14} /> : <ArrowRight size={14} />} {tr('رجوع للأسئلة')}</button>
          {tours.map(([id, t]) => <div key={id} className={`assist-q${openTour === id ? ' on' : ''}`}>
            <button type="button" onClick={() => setOpenTour(openTour === id ? null : id)} aria-expanded={openTour === id}><span>{tr(t.name)}</span><ChevronDown size={16} /></button>
            {openTour === id && <ol className="assist-steps">{t.steps.map((s, k) => <li key={k}><b>{tr(s.title)}</b><span>{tr(s.body)}</span></li>)}</ol>}
          </div>)}
        </>}
      </div>
      <footer className="assist-foot">
        <button type="button" className="assist-btn" onClick={() => setView('guide')}><Compass size={16} />{tr('تعليمات الموقع')}</button>
        <a className="assist-btn" href={WA_LINK} target="_blank" rel="noreferrer"><MessageCircle size={16} />{tr('راسلنا على واتساب')}</a>
      </footer>
    </section>}
  </div>;
}

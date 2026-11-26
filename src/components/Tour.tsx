import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { useApp } from '../lib/store';
import { TOURS } from '../lib/tours';

const seenKey = (uid: string, id: string) => `speakozy:tour:${uid}:${id}`;
const wasSeen = (uid: string, id: string) => { try { return localStorage.getItem(seenKey(uid, id)) === '1'; } catch { return true; } };
const markSeen = (uid: string, id: string) => { try { localStorage.setItem(seenKey(uid, id), '1'); } catch {} };

/** Shows a step-by-step intro the first time a student opens this page, plus a "جولة" button to replay it. */
export function PageTour({ id }: { id: string }) {
  const { user } = useApp();
  const tour = TOURS[id];
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    setOpen(false); setI(0);
    if (!user || user.role === 'admin' || !tour || wasSeen(user.id, id)) return;
    const t = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(t);
  }, [id, user?.id]);
  if (!user || user.role === 'admin' || !tour) return null;
  const close = () => { markSeen(user.id, id); setOpen(false); };
  const step = tour.steps[i];
  const last = i === tour.steps.length - 1;
  return <>
    <button type="button" className="tour-btn" onClick={() => { setI(0); setOpen(true); }} aria-label="جولة تعريفية"><Compass size={14} /> جولة تعريفية</button>
    {open && <div className="tour-card" role="dialog" aria-live="polite" dir="rtl">
      <div className="tour-top"><span className="tour-kicker">{tour.name} · {i + 1} من {tour.steps.length}</span><button type="button" className="tour-skip" onClick={close}>تخطَّ الجولة</button></div>
      <h3 className="tour-title">{step.title}</h3>
      <p className="tour-body">{step.body}</p>
      <div className="tour-dots">{tour.steps.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
      <div className="tour-actions">
        <button type="button" className="btn btn-primary" onClick={() => (last ? close() : setI(i + 1))}>{last ? 'تمام، يلا نبدأ' : 'التالي'}</button>
        {i > 0 && <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}>السابق</button>}
      </div>
    </div>}
  </>;
}

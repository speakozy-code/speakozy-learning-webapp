import React, { useEffect, useState } from 'react';
import { useApp } from '../lib/store';
import { TOURS } from '../lib/tours';
import { tr, uiDir } from '../lib/i18n';
import { onStartTour } from '../lib/help';

const seenKey = (uid: string, id: string) => `speakozy:tour:${uid}:${id}`;
const wasSeen = (uid: string, id: string) => { try { return localStorage.getItem(seenKey(uid, id)) === '1'; } catch { return true; } };
const markSeen = (uid: string, id: string) => { try { localStorage.setItem(seenKey(uid, id), '1'); } catch {} };

/** Shows a step-by-step intro the first time a student opens this page; replay it from the account menu ("جولة تعريفية"). */
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
  useEffect(() => (tour ? onStartTour(() => { setI(0); setOpen(true); }) : undefined), [id, !!tour]);
  if (!user || user.role === 'admin' || !tour) return null;
  const close = () => { markSeen(user.id, id); setOpen(false); };
  const step = tour.steps[i];
  const last = i === tour.steps.length - 1;
  return <>
    {open && <div className="tour-card" role="dialog" aria-live="polite" dir={uiDir()}>
      <div className="tour-top"><span className="tour-kicker">{tr(tour.name)} · {i + 1} {tr('من')} {tour.steps.length}</span><button type="button" className="tour-skip" onClick={close}>{tr('تخطَّ الجولة')}</button></div>
      <h3 className="tour-title">{tr(step.title)}</h3>
      <p className="tour-body">{tr(step.body)}</p>
      <div className="tour-dots">{tour.steps.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
      <div className="tour-actions">
        <button type="button" className="btn btn-primary" onClick={() => (last ? close() : setI(i + 1))}>{last ? tr('تمام، يلا نبدأ') : tr('التالي')}</button>
        {i > 0 && <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}>{tr('السابق')}</button>}
      </div>
    </div>}
  </>;
}

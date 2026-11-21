import React, { useEffect, useId, useState } from 'react';
import { X, Play } from 'lucide-react';
import { youglishWidgetQuery, YOUGLISH_ACCENTS } from '../lib/youglish';

function loadWidget(): Promise<void> {
  const w = window as any;
  if (w.YG) return Promise.resolve();
  if (w.__ygLoader) return w.__ygLoader;
  w.__ygLoader = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://youglish.com/public/emb/widget.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('youglish-widget'));
    document.body.appendChild(s);
  });
  return w.__ygLoader;
}

export function YouGlishDock({
  word, accent, onAccent, onClose,
}: { word: string; accent: string; onAccent: (code: string) => void; onClose: () => void }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hostId = `yghost${rawId}`;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    const q = youglishWidgetQuery(word, accent);
    let dead = false;
    setStatus('loading');
    document.body.classList.add('yg-open');
    (async () => {
      try {
        await loadWidget();
        if (dead || !(window as any).YG) throw new Error('no-yg');
        const el = document.getElementById(hostId);
        if (!el) return;
        el.innerHTML = '';
        const frame = el.parentElement;
        const fw = frame?.clientWidth || el.clientWidth || 640;
        const fh = frame?.clientHeight || el.clientHeight || 360;
        // الفيديو 16:9 — نصغّر عرض الودجيت لو الارتفاع مش كافي عشان الكنترولات ما تتقصش
        const w = Math.max(280, Math.min(fw, Math.floor((fh - 130) * 16 / 9)));
        const widget = new (window as any).YG.Widget(hostId, {
          width: w,
          height: Math.max(240, fh),
          components: 88,
          autoStart: 1,
        });
        widget.fetch(q.word, q.lang, q.accent);
        if (!dead) setStatus('ready');
      } catch {
        if (!dead) {
          setStatus('error');
          try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
        }
      }
    })();
    return () => { dead = true; document.body.classList.remove('yg-open'); };
  }, [word, accent, hostId]);
  return (
    <div className="yg-dock" role="dialog" aria-label={`اسمع كلمة ${word} على YouGlish`}>
      <div className="yg-dock-head">
        <div className="yg-dock-title">
          <Play size={16} />
          <strong className="en" dir="ltr">{word}</strong>
          <span className="muted">في كلام حقيقي</span>
        </div>
        <div className="yg-dock-accents">
          {YOUGLISH_ACCENTS.map((a) => (
            <button key={a.code} className={`yg-btn ${accent === a.code ? 'is-on' : ''}`} onClick={() => onAccent(a.code)}>{a.label}</button>
          ))}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="إغلاق النطق"><X size={18} /></button>
      </div>
      <div className="yg-frame"><div id={hostId} className="yg-host" /></div>
      {status === 'loading' && <p className="muted" style={{ padding: '0 1rem .8rem' }}>بنحمّل YouGlish…</p>}
      {status === 'error' && <p className="note" style={{ margin: '.6rem 1rem 1rem' }}>YouGlish ما اشتغلش في اللوحة دي. اتنطقت الكلمة في الصفحة بدلًا منه.</p>}
    </div>
  );
}

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
    (async () => {
      try {
        await loadWidget();
        if (dead || !(window as any).YG) throw new Error('no-yg');
        const el = document.getElementById(hostId);
        if (!el) return;
        el.innerHTML = '';
        const widget = new (window as any).YG.Widget(hostId, { width: Math.max(280, el.clientWidth || 640), components: 255, autoStart: 1 });
        widget.fetch(q.word, q.lang, q.accent);
        if (!dead) setStatus('ready');
      } catch {
        if (!dead) {
          setStatus('error');
          try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
        }
      }
    })();
    return () => { dead = true; };
  }, [word, accent, hostId]);
  return (
    <div className="yg-dock" role="dialog" aria-label={`Hear ${word} on YouGlish`}>
      <div className="yg-dock-head">
        <div className="yg-dock-title">
          <Play size={16} />
          <strong className="en" dir="ltr">{word}</strong>
          <span className="muted">in real speech</span>
        </div>
        <div className="yg-dock-accents">
          {YOUGLISH_ACCENTS.map((a) => (
            <button key={a.code} className={`yg-btn ${accent === a.code ? 'is-on' : ''}`} onClick={() => onAccent(a.code)}>{a.label}</button>
          ))}
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close pronunciation"><X size={18} /></button>
      </div>
      <div id={hostId} className="yg-frame" />
      {status === 'loading' && <p className="muted" style={{ padding: '0 1rem .8rem' }}>Loading YouGlish…</p>}
      {status === 'error' && <p className="note" style={{ margin: '.6rem 1rem 1rem' }}>YouGlish could not load in this panel. The word was spoken on this page instead.</p>}
    </div>
  );
}

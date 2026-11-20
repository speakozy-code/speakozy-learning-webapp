import React from 'react';
import { X, Play } from 'lucide-react';
import { youglishEmbedUrl, YOUGLISH_ACCENTS } from '../lib/youglish';

export function YouGlishDock({
  word, accent, onAccent, onClose,
}: { word: string; accent: string; onAccent: (code: string) => void; onClose: () => void }) {
  const src = youglishEmbedUrl(word, accent);
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
      <iframe className="yg-frame" title={`YouGlish ${word}`} src={src} allow="autoplay; fullscreen" />
    </div>
  );
}

import React, { useEffect, useState } from 'react';

export function Card({ children, className = '', ...rest }: any) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}
export function Button({ children, variant = 'primary', size = 'md', className = '', ...rest }: any) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>{children}</button>;
}
export function Badge({ children, tone = 'muted', ...rest }: any) {
  return <span className={`badge badge-${tone}`} {...rest}>{children}</span>;
}
export function Progress({ value }: { value: number }) {
  return <div className="progress"><div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
export function Stat({ label, value, sub, tone }: any) {
  return <Card className="stat"><div className="stat-label">{label}</div><div className={`stat-value ${tone || ''}`}>{value}</div>{sub && <div className="stat-sub">{sub}</div>}</Card>;
}
export function SectionTitle({ title, action }: any) {
  return <div className="section-title"><h2>{title}</h2>{action}</div>;
}
export function Empty({ icon = '📭', title, hint }: any) {
  return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>;
}
export function Loading({ label = 'Loading...' }: any) {
  return <div className="loading"><span className="spinner" /> {label}</div>;
}
export function Tabs({ tabs, active, onChange }: any) {
  return <div className="tabs">{tabs.map((t: any) => <button key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>{t.label}</button>)}</div>;
}
export function Field({ label, hint, children }: any) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
export function Modal({ open, title, onClose, children }: any) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
      <div className="modal-body">{children}</div>
    </div>
  </div>;
}
export function Table({ head, children }: any) {
  return <div className="table-wrap"><table><thead><tr>{head.map((h: string) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function Toast({ message, onDone }: any) {
  useEffect(() => { if (!message) return; const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [message, onDone]);
  if (!message) return null;
  return <div className="toast">{message}</div>;
}
export function useToast() {
  const [message, setMessage] = useState('');
  return { message, show: setMessage, node: <Toast message={message} onDone={() => setMessage('')} /> };
}
export const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const fmtDay = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }) : '—';
export const isLate = (d?: string) => d ? new Date(d).getTime() < Date.now() : false;

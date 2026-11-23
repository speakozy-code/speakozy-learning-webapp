import React from 'react';
import { Modal } from './UI';
import { PRICING_URL, REGISTER_URL } from '../lib/subscription';

export function SubscribeButtons({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <div className="row sub-actions" dir="rtl">
    <a className={`btn btn-primary btn-${size}`} href={REGISTER_URL} target="_blank" rel="noreferrer">اشترك الآن</a>
    <a className={`btn btn-primary btn-${size}`} href={PRICING_URL} target="_blank" rel="noreferrer">شوف الباقات</a>
  </div>;
}

/** Shown when a non-subscribed student taps anything that is locked. */
export function UpsellModal({ open, onClose, what }: { open: boolean; onClose: () => void; what?: string }) {
  return <Modal open={open} title="🔒 المحتوى ده للمشتركين" onClose={onClose}>
    <div className="stack" dir="rtl" style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, lineHeight: 1.9 }}>أنت غير مشترك معانا{what ? ` (${what})` : ''}. ابدأ رحلتك معانا وكمّل كل المحتوى والتاسكات والشادوينج مع المدرّسين.</p>
      <SubscribeButtons />
    </div>
  </Modal>;
}

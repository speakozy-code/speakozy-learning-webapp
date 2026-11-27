import { pdfLinkFor } from '../../lib/pdfLinks';
import React, { useState } from 'react';
import { useApp } from '../../lib/store';
import { Button } from '../../components/UI';
import { pdfAllowed } from '../../lib/domain';
import { UpsellModal } from '../../components/Upsell';
import { tr } from '../../lib/i18n';

const MATERIAL_PDF: Record<string, string> = {
  'l5-s1': './materials/1%20-%20Leisure%20Time.pdf',
  'l5-s2': './materials/2%20-%20Love.pdf',
  'l5-s3': './materials/3%20-%20Education%20and%20University.pdf',
  'l5-s4': './materials/4%20-%20Marriage.pdf',
  'l5-s5': './materials/5_Personality.pdf',
  'l5-s6': './materials/6%20-%20Work.pdf',
  'l5-s7': './materials/7-%20Shopping.pdf',
  'l9-s1': './materials/1%20-%20Leisure%20Time.pdf',
  'l9-s2': './materials/2%20-%20Love.pdf',
  'l9-s3': './materials/3%20-%20Education%20and%20University.pdf',
  'l9-s4': './materials/4%20-%20Marriage.pdf',
  'l9-s5': './materials/5_Personality.pdf',
  'l9-s6': './materials/6%20-%20Work.pdf',
  'l9-s7': './materials/7-%20Shopping.pdf',
};

export function materialPdf(s: any): string {
  return pdfLinkFor(s) || MATERIAL_PDF[s?.id] || '';
}

/** Open / download buttons for a lesson PDF; locked for anyone outside their allowed levels. */

export function PdfActions({ s, stop = false, extra = null }: { s: any; stop?: boolean; extra?: React.ReactNode }) {
  const { user, data } = useApp();
  const [upsell, setUpsell] = useState(false);
  if (!user || !materialPdf(s)) return null;
  const ok = pdfAllowed(user, s, data.levels);
  const st = stop ? { onClick: (e: React.MouseEvent) => e.stopPropagation() } : {};
  if (!ok) return <>
    <Button size="sm" variant="ghost" onClick={(e: any) => { e.stopPropagation(); setUpsell(true); }}>🔒 PDF</Button>
    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what={user.subscribed === false ? tr('ملفات PDF') : tr('PDF المستويات التانية')} />
  </>;
  return <>
    <a className="btn btn-primary btn-sm" href={materialPdf(s)} target="_blank" rel="noreferrer" {...st}>PDF</a>
    {extra}
  </>;
}

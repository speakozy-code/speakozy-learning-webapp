import React, { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty } from '../components/UI';
import { FileText, ExternalLink } from 'lucide-react';
import { pdfLinkFor } from '../lib/pdfLinks';
import type { Session } from '../types';

const DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1MynshnpHik2IrKuLfrq3jPuAgV7stEQF';
const isLink = (v: string) => /^https?:\/\/\S+$/i.test(v.trim());

/** Admin: one link per lesson PDF. Change a file in Drive, paste its link here. */
export function PdfAdminPage() {
  const { data, put } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  const [levelId, setLevelId] = useState(levels[0]?.id || '');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const sessions = useMemo(() => data.sessions.filter((s) => s.levelId === levelId).sort((a, b) => a.order - b.order), [data.sessions, levelId]);
  const current = (s: Session) => pdfLinkFor(s);
  const value = (s: Session) => (s.id in drafts ? drafts[s.id] : current(s));
  const withLink = data.sessions.filter((s) => current(s)).length;

  async function save(s: Session) {
    const v = (drafts[s.id] ?? '').trim();
    if (v && !isLink(v)) return setMsg('اللينك لازم يبدأ بـ https://');
    setMsg('');
    await put('sessions', { ...s, pdfUrl: v || undefined });
    setDrafts((d) => { const n = { ...d }; delete n[s.id]; return n; });
  }

  return <div className="stack">
    <div><h1><FileText size={22} /> ملفات PDF</h1>
      <p className="muted">لينك الـ PDF لكل جلسة (من جوجل درايف). غيّر الملف في درايف، وحط لينكه الجديد هنا. الطالب بيشوف زرار «PDF» واحد بيفتح اللينك.</p>
      <p className="muted"><a href={DRIVE_FOLDER} target="_blank" rel="noreferrer">فولدر الملفات في درايف <ExternalLink size={12} /></a> · لازم الملف يكون مشاركة «أي حد معاه الرابط: مشاهد».</p></div>
    <div className="row" style={{ gap: '.4rem', flexWrap: 'wrap' }}>
      {levels.map((l) => <Button key={l.id} size="sm" variant={l.id === levelId ? 'primary' : 'ghost'} onClick={() => { setLevelId(l.id); setMsg(''); }}>{l.title}</Button>)}
    </div>
    {msg && <p style={{ color: '#b91c1c' }}>{msg}</p>}
    <Card>
      <SectionTitle title={`الجلسات (${sessions.length}) · عليها لينك: ${withLink} من ${data.sessions.length}`} />
      {!sessions.length ? <Empty title="مفيش جلسات في المستوى ده" text="" /> :
        <div className="stack">{sessions.map((s) => {
          const dirty = s.id in drafts && drafts[s.id].trim() !== current(s);
          const has = !!value(s).trim();
          return <div key={s.id} className="row" style={{ gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ minWidth: 190, flex: '0 0 190px' }}>{s.order}. {s.title}</span>
            <input dir="ltr" style={{ flex: 1, minWidth: 220 }} placeholder="https://drive.google.com/file/d/..." value={value(s)} onChange={(e) => setDrafts({ ...drafts, [s.id]: e.target.value })} />
            <Badge tone={has ? 'green' : ''}>{has ? 'فيه لينك' : 'فاضي'}</Badge>
            {dirty && <Button size="sm" onClick={() => save(s)}>احفظ</Button>}
            {has && <a className="btn btn-ghost btn-sm" href={value(s)} target="_blank" rel="noreferrer">جرّب ↗</a>}
          </div>;
        })}</div>}
    </Card>
  </div>;
}

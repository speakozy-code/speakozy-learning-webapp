import { PageTour } from '../components/Tour';
import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Tabs } from '../components/UI';
import { ShadowClipView } from './ListenClips';
import { Headphones } from 'lucide-react';
import { UpsellModal, SubscribeButtons } from '../components/Upsell';
import { isSubscribed } from '../lib/subscription';
import { tr } from '../lib/i18n';


export default function ShadowingPage() {
  const { user, data } = useApp();
  const admin = user?.role === 'admin';
  const allLevels = [...data.levels].sort((a, b) => a.order - b.order);
  // every level is visible to everyone; only the student's own level can be practiced
  const levels = allLevels;
  const [tab, setTab] = useState(user?.levelId || allLevels[0]?.id);
  React.useEffect(() => { if (user?.levelId) setTab(user.levelId); }, [user?.levelId]);
  const [upsell, setUpsell] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!user) return null;
  const subscribed = isSubscribed(user);
  const clips = [...(data.listenClips || [])].filter((c) => c.levelId === tab && (c.active || admin)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const doneLines = (id: string) => data.attempts.filter((a) => a.studentId === user.id && a.questionId.startsWith(`shadowline:${id}:`)).length;
  const level = levels.find((l) => l.id === tab);
  // every level inside the student's allowed range (first → last level) is fully open, not only one level
  const openClip = clips.find((c) => c.id === openId);
  return <div className="stack">
    <PageTour id="shadowing" />
    <div><h1><Headphones size={22} /> {tr('الشادوينج')}</h1>
      <p className="muted">{tr('اتكلم إنجليزي زي المتحدثين الأصليين — اسمع، ردّد، سجّل، وابعت. فيديوهات مختارة لكل مستوى.')}</p></div>

    <Tabs tabs={levels.map((l) => ({ id: l.id, label: l.title }))} active={tab} onChange={setTab} />

    {openClip ? <ShadowClipView clip={openClip} canComplete={subscribed && !admin} onBack={() => setOpenId(null)} /> : <Card>
      <SectionTitle title={tr('كليبات {0}', [level?.title || ''])} action={<Badge tone="blue">{clips.length} {tr('كليب')}</Badge>} />
      {clips.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '.8rem' }}>
        {clips.map((c, k) => {
          const n = doneLines(c.id);
          const full = n > 0 && n === c.lines.length;
          return <button key={c.id} type="button" className="section-card" onClick={() => setOpenId(c.id)} style={{ aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'start', cursor: 'pointer', padding: '.9rem', borderColor: full ? 'var(--green, #16a34a)' : undefined }}>
            <div className="row between" style={{ gap: '.3rem' }}><Badge tone={full ? 'green' : 'blue'}>{k + 1}</Badge>{!c.active && <Badge tone="amber">{tr('مخفي')}</Badge>}</div>
            <div><strong dir="ltr" style={{ display: 'block' }}>{c.title}</strong>
              <div className="muted" style={{ fontSize: '.8rem', marginTop: '.2rem' }}>{Math.round((c.end - c.start) / 60 * 10) / 10} {tr('دقيقة ·')} {c.lines.length} {tr('جملة')}</div></div>
            <div>{full ? <Badge tone="green">✓ {tr('اكتمل')}</Badge> : n > 0 ? <Badge tone="amber">{n} / {c.lines.length}</Badge> : <span style={{ display: 'inline-block', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '.85rem', padding: '.3rem .9rem', borderRadius: '.5rem' }}>{tr('ابدأ')}</span>}</div>
          </button>;
        })}
      </div> : <Empty icon="🎬" title={tr('كليب الشادوينج لمستوى {0} هيضاف قريبًا', [level?.title || ''])} hint={tr('بنجهز كليب لكل مستوى — هيظهر هنا أول ما يتضاف.')} />}
    </Card>}

    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what={tr('الشادوينج')} />
    {!subscribed && <Card className="row between">
      <div><strong>{tr('عايز تبدأ معانا؟')}</strong><div className="muted">{tr('الشادوينج جزء من التاسكات اليومية في الكورس — متابعة يومية وتصحيح مباشر.')}</div></div>
      <SubscribeButtons size="sm" />
    </Card>}
  </div>;
}

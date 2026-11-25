import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Tabs } from '../components/UI';
import { ShadowClipView } from './ListenClips';
import { Headphones, Lock } from 'lucide-react';
import { UpsellModal, SubscribeButtons } from '../components/Upsell';
import { isSubscribed, FREE_SHADOWING_VIDEOS } from '../lib/subscription';
import { scoreRule, levelFullyOpen } from '../lib/domain';


export default function ShadowingPage() {
  const { user, data, put, remove, grantScore } = useApp();
  const admin = user?.role === 'admin';
  const allLevels = [...data.levels].sort((a, b) => a.order - b.order);
  // every level is visible to everyone; only the student's own level can be practiced
  const levels = allLevels;
  const [tab, setTab] = useState(user?.levelId || allLevels[0]?.id);
  const [upsell, setUpsell] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  if (!user) return null;
  const subscribed = isSubscribed(user);
  const clips = [...(data.listenClips || [])].filter((c) => c.levelId === tab && (c.active || admin)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const doneLines = (id: string) => data.attempts.filter((a) => a.studentId === user.id && a.questionId.startsWith(`shadowline:${id}:`)).length;
  const level = levels.find((l) => l.id === tab);
  // every level inside the student's allowed range (first → last level) is fully open, not only one level
  const openClip = clips.find((c) => c.id === openId);
  const ownLevel = admin || (!!level && levelFullyOpen(user, level, allLevels));
  return <div className="stack">
    <div><h1><Headphones size={22} /> الشادوينج</h1>
      <p className="muted">اتكلم إنجليزي زي المتحدثين الأصليين — اسمع، ردّد، سجّل، وابعت. فيديوهات مختارة لكل مستوى.</p></div>

    <Tabs tabs={levels.map((l) => ({ id: l.id, label: l.title }))} active={tab} onChange={setTab} />
    {!admin && <div className="note" dir="rtl">{ownLevel
      ? `ليفل ${level?.title || ''} مفتوح ليك — تقدر تعمل شادوينج وتدوس «تم الإنجاز» على فيديوهاته.`
      : 'اختار الليفل بتاعك علشان تقدر تعمل شادوينج. باقي الليفلات تقدر تشوف فيها أول فيديو بس، والباقي مقفول.'}</div>}

    {openClip ? <ShadowClipView clip={openClip} canComplete={subscribed && ownLevel && !admin} onBack={() => setOpenId(null)} /> : <Card>
      <SectionTitle title={`كليبات ${level?.title || ''}`} action={<Badge tone="blue">{clips.length} كليب</Badge>} />
      {clips.length ? <div className="stack">
        {clips.map((c, i) => {
          const locked = !admin && !(subscribed && ownLevel) && i >= FREE_SHADOWING_VIDEOS;
          const n = doneLines(c.id);
          return <div key={c.id} className={`section-card ${locked ? 'locked-item' : ''}`} onClick={locked && !subscribed ? () => setUpsell(true) : undefined}>
            <div className="row between" style={{ gap: '.5rem' }}>
              <div><strong>{c.title}</strong><div className="muted" style={{ fontSize: '.85rem' }}>{Math.round((c.end - c.start) / 60 * 10) / 10} دقيقة · {c.lines.length} جملة {!c.active && '· مخفي عن الطلبة'}</div></div>
              {locked ? <span className="muted"><Lock size={16} /> {subscribed ? 'مقفول' : 'للمشتركين'}</span> : <div className="row" style={{ gap: '.4rem' }}>
                {n > 0 && <Badge tone={n === c.lines.length ? 'green' : 'amber'}>{n} / {c.lines.length}</Badge>}
                <Button size="sm" onClick={() => setOpenId(c.id)}>{n ? 'كمّل' : 'ابدأ'}</Button></div>}
            </div>
          </div>;
        })}
      </div> : <Empty icon="🎬" title={`كليب الشادوينج لمستوى ${level?.title || ''} هيضاف قريبًا`} hint="بنجهز كليب لكل مستوى — هيظهر هنا أول ما يتضاف." />}
    </Card>}

    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what="الشادوينج" />
    {!subscribed && <Card className="row between">
      <div><strong>عايز تبدأ معانا؟</strong><div className="muted">الشادوينج جزء من التاسكات اليومية في الكورس — متابعة يومية وتصحيح مباشر.</div></div>
      <SubscribeButtons size="sm" />
    </Card>}
  </div>;
}

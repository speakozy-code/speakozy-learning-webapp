import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Tabs } from '../components/UI';
import { SHADOWING_VIDEOS, youtubeEmbed } from '../lib/videoSlots';
import { Headphones, Lock } from 'lucide-react';
import { UpsellModal, SubscribeButtons } from '../components/Upsell';
import { isSubscribed, FREE_SHADOWING_VIDEOS } from '../lib/subscription';
import { scoreRule, levelFullyOpen } from '../lib/domain';


const STEPS = [
  { n: '1', t: 'اسمع', d: 'شغّل الفيديو واسمع المقطع مرة كاملة من غير ما تتكلم — ركّز على النغمة والسرعة.' },
  { n: '2', t: 'ردّد', d: 'اسمع تاني وردّد ورا المتحدث في نفس اللحظة — قلّد النطق والإيقاع بالظبط.' },
  { n: '3', t: 'سجّل', d: 'سجّل صوتك وأنت بتعمل شادوينج للمقطع، واسمع تسجيلك وقارنه بالأصل.' },
  { n: '4', t: 'ابعت', d: 'ابعت التسجيل على الجروب لما تحس إنك جاهز — المدرب بيتابع ويصحح.' },
];

export default function ShadowingPage() {
  const { user, data, put, remove, grantScore } = useApp();
  const admin = user?.role === 'admin';
  const allLevels = [...data.levels].sort((a, b) => a.order - b.order);
  // every level is visible to everyone; only the student's own level can be practiced
  const levels = allLevels;
  const [tab, setTab] = useState(user?.levelId || allLevels[0]?.id);
  const [upsell, setUpsell] = useState(false);
  if (!user) return null;
  const subscribed = isSubscribed(user);
  const sid = (v: { youtubeId: string }) => `shadow-${v.youtubeId}`;
  const mineDone = (v: { youtubeId: string }) => data.taskCompletions.find((c) => c.studentId === user.id && c.taskId === sid(v));
  async function done(v: { youtubeId: string }) {
    if (!subscribed || !ownLevel || mineDone(v)) return;
    await put('taskCompletions', { taskId: sid(v), studentId: user!.id, completedAt: new Date().toISOString().slice(0, 10), status: 'pending' });
    await grantScore(user!.id, 'task', scoreRule(data.settings.scoreRules, 'taskPending'), `task-pending-${sid(v)}`);
  }
  async function undo(v: { youtubeId: string }) {
    const c = mineDone(v);
    if (c && (c.status || 'approved') !== 'approved') await remove('taskCompletions', c.id);
  }
  const videos = SHADOWING_VIDEOS[tab] || [];
  const level = levels.find((l) => l.id === tab);
  // every level inside the student's allowed range (first → last level) is fully open, not only one level
  const ownLevel = admin || (!!level && levelFullyOpen(user, level, allLevels));
  return <div className="stack">
    <div><h1><Headphones size={22} /> الشادوينج</h1>
      <p className="muted">اتكلم إنجليزي زي المتحدثين الأصليين — اسمع، ردّد، سجّل، وابعت. فيديوهات مختارة لكل مستوى.</p></div>

    <Card>
      <SectionTitle title="طريقة الشادوينج" action={<Badge tone="green">4 خطوات</Badge>} />
      <div className="grid g4">
        {STEPS.map((s) => <div key={s.n} className="section-card">
          <div className="row" style={{ marginBottom: '.3rem' }}><span className="node-num">{s.n}</span><strong>{s.t}</strong></div>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7, fontSize: '.85rem' }}>{s.d}</p>
        </div>)}
      </div>
    </Card>

    <Tabs tabs={levels.map((l) => ({ id: l.id, label: l.title }))} active={tab} onChange={setTab} />
    {!admin && <div className="note" dir="rtl">{ownLevel
      ? `ليفل ${level?.title || ''} مفتوح ليك — تقدر تعمل شادوينج وتدوس «تم الإنجاز» على فيديوهاته.`
      : 'اختار الليفل بتاعك علشان تقدر تعمل شادوينج. باقي الليفلات تقدر تشوف فيها أول فيديو بس، والباقي مقفول.'}</div>}

    <Card>
      <SectionTitle title={`فيديوهات ${level?.title || ''}`} action={<Badge tone="blue">{videos.length} فيديو</Badge>} />
      <p className="muted" dir="rtl" style={{ marginTop: 0 }}>لو حاسس إن المحتوى مش مناسب ليك، ممكن تعمل نفس الخطوات دي مع فيلمك المفضل.</p>
      {videos.length ? <div className="grid g2">
        {videos.map((v, i) => {
          // own level: everything for subscribers; any other level (or not subscribed): the first video only
          const locked = !admin && !(subscribed && ownLevel) && i >= FREE_SHADOWING_VIDEOS;
          const c = mineDone(v);
          const st = c ? (c.status || 'approved') : '';
          return <div key={v.youtubeId} className={`section-card ${locked ? 'locked-item' : ''}`} onClick={locked && !subscribed ? () => setUpsell(true) : undefined}>
            {locked ? <div className="lock-cover" style={{ minHeight: 160 }}><Lock size={20} /> {subscribed ? 'مقفول — الليفل ده مش مفتوح ليك' : 'اشترك معانا علشان تكمل'}</div>
              : <div className="video-frame"><iframe referrerPolicy="strict-origin-when-cross-origin" src={youtubeEmbed(v.youtubeId)} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
            <strong style={{ display: 'block', marginTop: '.6rem' }}>{v.title}</strong>
            {!locked && !admin && ownLevel && subscribed && <div className="row" style={{ marginTop: '.5rem' }}>
              {!c && <Button size="sm" onClick={() => done(v)}>تم الإنجاز ✓</Button>}
              {st === 'pending' && <><Badge tone="amber">بانتظار المدرّس</Badge><Button size="sm" variant="ghost" onClick={() => undo(v)}>تراجع</Button></>}
              {st === 'approved' && <Badge tone="green">معتمد</Badge>}
              {st === 'rejected' && <><Badge tone="red">اتردّ — جرّب تاني</Badge><Button size="sm" variant="ghost" onClick={() => undo(v)}>حاول تاني</Button></>}
            </div>}
          </div>;
        })}
      </div> : <Empty icon="🎬" title={`فيديوهات الشادوينج لمستوى ${level?.title || ''} هتضاف قريبًا`} hint="بنجهز فيديوهات مختارة لكل مستوى — هتظهر هنا أول ما تتضاف." />}
    </Card>

    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what="الشادوينج" />
    {!subscribed && <Card className="row between">
      <div><strong>عايز تبدأ معانا؟</strong><div className="muted">الشادوينج جزء من التاسكات اليومية في الكورس — متابعة يومية وتصحيح مباشر.</div></div>
      <SubscribeButtons size="sm" />
    </Card>}
  </div>;
}

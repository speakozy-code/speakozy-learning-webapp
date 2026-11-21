import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Tabs } from '../components/UI';
import { SHADOWING_VIDEOS, youtubeEmbed } from '../lib/videoSlots';
import { Headphones, MessageCircle } from 'lucide-react';

const WA = 'https://wa.me/201091060951?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%83%D9%88%D8%B1%D8%B3';

const STEPS = [
  { n: '1', t: 'اسمع', d: 'شغّل الفيديو واسمع المقطع مرة كاملة من غير ما تتكلم — ركّز على النغمة والسرعة.' },
  { n: '2', t: 'ردّد', d: 'اسمع تاني وردّد ورا المتحدث في نفس اللحظة — قلّد النطق والإيقاع بالظبط.' },
  { n: '3', t: 'سجّل', d: 'سجّل صوتك وأنت بتعمل شادوينج للمقطع، واسمع تسجيلك وقارنه بالأصل.' },
  { n: '4', t: 'ابعت', d: 'ابعت التسجيل على الجروب لما تحس إنك جاهز — المدرب بيتابع ويصحح.' },
];

export default function ShadowingPage() {
  const { user, data } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  const [tab, setTab] = useState(user?.levelId || levels[0]?.id);
  const videos = SHADOWING_VIDEOS[tab] || [];
  const level = levels.find((l) => l.id === tab);
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

    <Card>
      <SectionTitle title={`فيديوهات ${level?.title || ''}`} action={<Badge tone="blue">{videos.length} فيديو</Badge>} />
      {videos.length ? <div className="grid g2">
        {videos.map((v) => <div key={v.youtubeId} className="section-card">
          <div className="video-frame"><iframe src={youtubeEmbed(v.youtubeId)} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
          <strong style={{ display: 'block', marginTop: '.6rem' }}>{v.title}</strong>
        </div>)}
      </div> : <Empty icon="🎬" title={`فيديوهات الشادوينج لمستوى ${level?.title || ''} هتضاف قريبًا`} hint="بنجهز فيديوهات مختارة لكل مستوى — هتظهر هنا أول ما تتضاف." />}
    </Card>

    <Card className="row between">
      <div><strong>عايز تبدأ معانا؟</strong><div className="muted">الشادوينج جزء من التاسكات اليومية في الكورس — متابعة يومية وتصحيح مباشر.</div></div>
      <a className="btn btn-primary btn-sm" href={WA} target="_blank" rel="noreferrer"><MessageCircle size={14} /> واتساب</a>
    </Card>
  </div>;
}

import { siteUrl } from '../lib/subscription';
import { SubscribeButtons } from '../components/Upsell';
import React from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle } from '../components/UI';
import { go } from '../App';
import { TRIAL_VIDEO, youtubeEmbed } from '../lib/videoSlots';
import { Play, MessageCircle, Gift, BookOpen, Headphones, Mic } from 'lucide-react';

const WA = 'https://wa.me/201091060951?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%81%D9%8A%20%D8%A7%D9%84%D9%83%D9%88%D8%B1%D8%B3';
const PRICING = siteUrl('/pricing');
const REGISTER = siteUrl('/register');

const COURSE_FACTS = [
  { icon: '🎥', title: '8 جلسات لايف على زووم', body: 'ساعتين تفاعل مباشر مع المدرب وزملاءك في كل جلسة — السيشن 95% محادثة وتفاعل.' },
  { icon: '🗓️', title: 'خطة 4 أسابيع مركزة', body: '8 جلسات مباشرة منظمة بنتائج حقيقية، مش كورس مفتوح بلا نهاية.' },
  { icon: '👥', title: 'مجموعات صغيرة', body: 'من 4 إلى 8 طلاب بس — كل واحد بياخد اهتمام كافي وقت الكلام.' },
  { icon: '📝', title: 'تاسكات يومية', body: 'شادوينج وتحدث واستماع وقراءة — تمارين يومية بتتحسن بسرعة وبتتبعت على الجروب.' },
  { icon: '📈', title: 'متابعة وتقييم دوري', body: 'المدرب بيتابع تقدمك كل يوم، وبعد كل سيشن بتاخد مصادر وبطاقة تقدم.' },
  { icon: '⏺️', title: 'سيشنات مسجلة', body: 'كل الجلسات متسجلة تقدر ترجعلها في أي وقت.' },
  { icon: '🎯', title: 'تقييم مستوى مجاني', body: 'بنحدد مستواك بدقة قبل ما تبدأ — بدون التزام.' },
  { icon: '🛡️', title: 'بيئة آمنة للكلام', body: 'مساحة دعم تتكلم وتغلط فيها من غير خوف أو قلق — الغلط جزء من التعلم.' },
];

export default function TrialPage() {
  const { user, data } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  return <div className="stack trial-page">
    {!user && <div className="trial-topbar">
      <div className="auth-brand"><span className="brand-dot" /> SPEAKOZY</div>
      <Button size="sm" onClick={() => go('/')}>تسجيل الدخول</Button>
    </div>}

    <Card style={{ background: 'linear-gradient(135deg,#0b1220,#16243c)', color: '#fff', border: 0 }}>
      <div className="brief-kicker"><Gift size={14} /> تجربة مجانية</div>
      <h1 style={{ margin: '.3rem 0 .6rem' }}>جرّب Speakozy قبل ما تشترك</h1>
      <p style={{ color: '#c6d4e8', lineHeight: 1.9, margin: 0 }}>
        تقدر تشوف سيشن واحد من كل ماتيريال كتجربة، وكمان تقدر تشوف التاسكات اليومية اللي منها الشادوينج والتحدث والاستماع،
        وتقدر كمان تشوف السيشن التجريبية اللي هنشرح فيها نظام كل سيشن ونظام الكورس بيكون ماشي إزاي.
      </p>
    </Card>

    <Card>
      <SectionTitle title="السيشن التجريبية" action={<Badge tone="green"><Play size={12} /> فيديو</Badge>} />
      <p className="muted" style={{ marginTop: 0 }}>هنشرح فيها نظام كل سيشن ونظام الكورس بيكون ماشي إزاي.</p>
      {TRIAL_VIDEO.youtubeId ? <div className="video-frame">
        <iframe referrerPolicy="strict-origin-when-cross-origin" src={youtubeEmbed(TRIAL_VIDEO.youtubeId)} title={TRIAL_VIDEO.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div> : <div className="video-placeholder">
        <Play size={34} />
        <strong>السيشن التجريبية هتضاف هنا قريبًا</strong>
        <span className="muted">ابعتلنا على واتساب وهنبعتلك لينك التجربة أول بأول.</span>
        <SubscribeButtons size="sm" />
      </div>}
    </Card>

    <div className="grid g3">
      <Card className="stat"><div className="stat-label">من كل ماتيريال</div><div className="stat-value green">سيشن واحدة</div><div className="stat-sub">تجربة مجانية من كل مستوى — {levels.length} مستويات</div></Card>
      <Card className="stat"><div className="stat-label">تاسكات يومية</div><div className="stat-value green">شادوينج · تحدث · استماع</div><div className="stat-sub">جرّب نظام التاسكات اليومية بنفسك</div></Card>
      <Card className="stat"><div className="stat-label">الديكشنري والنطق</div><div className="stat-value green">YouGlish</div><div className="stat-sub">اسمع أي كلمة من متحدثين حقيقيين</div></Card>
    </div>

    <Card>
      <SectionTitle title="باقي تفاصيل الكورس" />
      <div className="grid g2">
        {COURSE_FACTS.map((f) => <div key={f.title} className="section-card">
          <div className="row" style={{ marginBottom: '.35rem' }}><span style={{ fontSize: '1.2rem' }}>{f.icon}</span><strong>{f.title}</strong></div>
          <p className="muted" style={{ margin: 0, lineHeight: 1.8 }}>{f.body}</p>
        </div>)}
      </div>
    </Card>

    <Card>
      <SectionTitle title="المستويات" action={<Badge tone="blue">{levels.length} مستويات</Badge>} />
      <div className="row">
        {levels.map((l) => <Badge key={l.id} tone="green">{l.title}</Badge>)}
      </div>
      <p className="muted" style={{ lineHeight: 1.8 }}>من E1 لحد Upper 2 — كل مستوى فيه جلسات مباشرة وكلمات وجرامر وتمارين محادثة، وتاسكات يومية على الجروب.</p>
    </Card>

    <Card style={{ textAlign: 'center' }}>
      <h2 style={{ marginTop: 0 }}>جاهز تبدأ؟</h2>
      <p className="muted">احجز تحديد مستوى مجاني، أو شوف الباقات واختار اللي يناسبك.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <a className="btn btn-primary" href={REGISTER} target="_blank" rel="noreferrer">احجز تحديد مستوى مجاني</a>
        <a className="btn btn-ghost" href={PRICING} target="_blank" rel="noreferrer">شوف الباقات</a>
        <a className="btn btn-ghost" href={WA} target="_blank" rel="noreferrer"><MessageCircle size={14} /> واتساب</a>
        {!user && <Button variant="ghost" onClick={() => go('/')}>سجّل دلوقتي</Button>}
      </div>
    </Card>
  </div>;
}

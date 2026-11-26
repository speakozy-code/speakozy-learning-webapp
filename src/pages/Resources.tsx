import { PageTour } from '../components/Tour';
import React from 'react';
import { Card, SectionTitle, Badge } from '../components/UI';
import { Library, Headphones, Mic2 } from 'lucide-react';

// مصادر إضافية: بلاي ليستات شادوينج + قنوات بودكاست.
const SHADOW_PLAYLISTS = [
  'PLA7lNLNvxTzig5dqfGl8DGbLOvUI08yXg',
  'PLL8rrkKVLqeRdeFKmygYujTkwOefatZ6G',
  'PLjFBDcUo70iPQYiWU8vt1KykEEwVzTKqG',
  'PLlpAWCqcstzpkZomfDM5P2gwO4dgP0o_5',
];
const PODCAST_CHANNELS = ['5104992', '5562189', '468568', '574393', '4832025', '1018980', '4956820', '4827692', '4580807', '483309'];
const ENGLISH_PODCASTS = ['1325176', '2046285', '3995961', '2269226', '2918889'];

// أهم قنوات تعلّم الإنجليزي عالميًا (الرابط بحث يوتيوب باسم القناة).
const TOP_CHANNELS: [string, string][] = [
  ['BBC Learning English', 'دروس قصيرة وأخبار مبسّطة بإنجليزي بريطاني'],
  ['English with Lucy', 'جرامر ونطق وتعبيرات بأسلوب ممتع'],
  ["Rachel's English", 'أفضل قناة لتحسين النطق الأمريكي'],
  ['engVid', 'مدرّسين كتير وشرح لكل المستويات'],
  ['Speak English with Mr Duncan', 'من أقدم القنوات — إنجليزي بطيء وواضح'],
  ['Espresso English', 'جرامر وتعبيرات وحوارات قصيرة'],
  ['VOA Learning English', 'أخبار وقصص بإنجليزي مبسّط وسرعة بطيئة'],
  ['English with Jennifer', 'شرح جرامر ومحادثة خطوة بخطوة'],
  ['EnglishClass101', 'دروس مقسّمة بالمستويات ومحادثات جاهزة'],
  ['Real English', 'ناس حقيقية بتتكلم في مواقف يومية'],
];
// مواقع تدريب وأسئلة.
const SITES: [string, string, string][] = [
  ['British Council LearnEnglish', 'https://learnenglish.britishcouncil.org', 'تمارين جرامر وكلمات وتحديد مستوى مجاني'],
  ['UsingEnglish Quizzes', 'https://www.usingenglish.com/quizzes/', 'حوالي 300 كويز جرامر وكلمات بتصحيح فوري'],
  ['BBC Learning English', 'https://www.bbc.co.uk/learningenglish', 'دروس وتمارين وبودكاست قصير'],
  ['Cambridge English', 'https://www.cambridgeenglish.org/learning-english/', 'ألعاب وتمارين وتحضير للاختبارات'],
  ['EnglishClub', 'https://www.englishclub.com', 'دروس جرامر وتعبيرات ومنتدى'],
  ['Easy World of English', 'https://www.easyworldofenglish.com', 'جرامر وكتابة ونطق من البداية للمتقدم'],
  ["Randall's ESL Cyber Listening Lab", 'https://www.esl-lab.com', 'تمارين استماع مع أسئلة'],
  ['WordReference Forums', 'https://forum.wordreference.com', 'اسأل أي سؤال عن معنى أو استخدام كلمة'],
];
const TIPS = [
  'اسمع إنجليزي كل يوم 20 دقيقة على الأقل (بودكاست أو فيديو)، وركّز على اللي بتفهمه بنسبة 70% تقريبًا.',
  'اتكلم بصوت عالي كل يوم: شادوينج، وسجّل صوتك وقارنه بالأصل.',
  'راجع الكلمات بنظام المراجعة المتباعدة بدل ما تحفظها مرة واحدة.',
  'اكتب فقرة قصيرة كل يوم عن يومك وغلّط براحتك — الغلط هو التعلّم.',
  'اتعلم الكلمة في جملة مش لوحدها، وكرّر الجملة بصوتك.',
  'خليك ثابت: 20 دقيقة كل يوم أحسن من ساعتين مرة في الأسبوع.',
];
const searchUrl = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`;
const castboxUrl = (id: string) => `https://castbox.fm/vc/${id}`;

function LinkGrid({ items, label, href }: { items: string[]; label: string; href: (id: string) => string }) {
  return <div className="grid g3">
    {items.map((id, i) => <a key={id} className="section-card" href={href(id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="row between"><strong dir="ltr" className="en">{label} {i + 1}</strong><Badge tone="blue">افتح ↗</Badge></div>
    </a>)}
  </div>;
}

export default function ResourcesPage() {
  return <div className="stack">
    <PageTour id="resources" />
    <div><h1><Library size={22} /> المصادر</h1>
      <p className="muted">مصادر إضافية تساعدك تتدرب بره السيشنات: فيديوهات شادوينج وبودكاست إنجليزي.</p></div>

    <Card>
      <SectionTitle title="مصادر الشادوينج" action={<Badge tone="green"><Headphones size={12} /> شادوينج</Badge>} />
      <p className="muted" style={{ marginBottom: '.4rem' }}>بلاي ليستات شادوينج على يوتيوب:</p>
      <LinkGrid items={SHADOW_PLAYLISTS} label="Playlist" href={playlistUrl} />
    </Card>

    <Card>
      <SectionTitle title="أهم 10 قنوات لتعلّم الإنجليزي" action={<Badge tone="red">يوتيوب</Badge>} />
      <div className="grid g2">{TOP_CHANNELS.map(([name, why], i) => <a key={name} className="section-card" href={searchUrl(name)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between"><strong dir="ltr" className="en">{i + 1}. {name}</strong><Badge tone="blue">افتح ↗</Badge></div>
        <p className="muted" style={{ margin: '.3rem 0 0' }}>{why}</p>
      </a>)}</div>
    </Card>

    <Card>
      <SectionTitle title="مواقع أسئلة وتدريب" action={<Badge tone="green">مجانية</Badge>} />
      <div className="grid g2">{SITES.map(([name, url, why]) => <a key={name} className="section-card" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between"><strong dir="ltr" className="en">{name}</strong><Badge tone="blue">افتح ↗</Badge></div>
        <p className="muted" style={{ margin: '.3rem 0 0' }}>{why}</p>
      </a>)}</div>
    </Card>

    <Card>
      <SectionTitle title="ازاي تطوّر إنجليزيتك" action={<Badge tone="amber">نصايح</Badge>} />
      <ol className="muted" style={{ lineHeight: 2, paddingInlineStart: '1.2rem', margin: 0 }}>{TIPS.map((x) => <li key={x}>{x}</li>)}</ol>
    </Card>

    <Card>
      <SectionTitle title="مصادر بودكاست — Podcast channels" action={<Badge tone="amber"><Mic2 size={12} /> بودكاست</Badge>} />
      <LinkGrid items={PODCAST_CHANNELS} label="Podcast" href={castboxUrl} />
    </Card>

    <Card>
      <SectionTitle title="English Podcast" action={<Badge tone="amber"><Mic2 size={12} /> بودكاست</Badge>} />
      <LinkGrid items={ENGLISH_PODCASTS} label="English Podcast" href={castboxUrl} />
    </Card>
  </div>;
}

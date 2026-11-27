import { PageTour } from '../../components/Tour';
import { useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Tabs } from '../../components/UI';
import { TALK_QUESTIONS } from '../../lib/content/talk';
import { UpsellModal } from '../../components/Upsell';
import { isSubscribed, FREE_YALLA_PER_LEVEL } from '../../lib/subscription';
import { Volume2 } from 'lucide-react';

import { speakWord } from './wordHelpers';

export function YallaNetkellemPage() {
  const { user, data } = useApp();
  const level = data.levels.find((l) => l.id === user?.levelId);
  const band = (level?.cefr || 'A1').slice(0, 2);
  const [pick, setPick] = useState(band in TALK_QUESTIONS ? band : 'A1');
  const [n, setN] = useState(0);
  const [upsell, setUpsell] = useState(false);
  if (!user) return null;
  const subscribed = isSubscribed(user);
  const full = TALK_QUESTIONS[pick] || TALK_QUESTIONS.A1;
  // not subscribed: only the first few questions of every level
  const pool = subscribed ? full : full.slice(0, FREE_YALLA_PER_LEVEL);
  const question = pool[n % pool.length];
  const next = () => { if (!subscribed && n + 1 >= pool.length) { setUpsell(true); return; } setN((x) => subscribed ? x + 1 + Math.floor(Math.random() * Math.max(1, pool.length - 1)) : x + 1); };
  return <div className="stack">
    <PageTour id="yalla-netkellem" />
    <div><h1>يلا نتكلم</h1><p className="muted">اضغط على «سؤال جديد»، سجّل ريكورد بتجاوب فيه بصوتك، وابعته للمدرّس على الواتساب.</p></div>
    <Tabs tabs={Object.keys(TALK_QUESTIONS).map((k) => ({ id: k, label: k }))} active={pick} onChange={(k) => { setPick(k); setN(0); }} />
    <Card className="flashcard">
      <h2 dir="ltr" className="en" style={{ textAlign: 'center', lineHeight: 1.6 }}>{question}</h2>
      <div className="row" style={{ justifyContent: 'center', marginTop: '1rem' }}>
        <Button onClick={next}>سؤال جديد</Button>
        <Button variant="ghost" onClick={() => speakWord(question)}><Volume2 size={16} /> اسمع السؤال</Button>
      </div>
    </Card>
    <UpsellModal open={upsell} onClose={() => setUpsell(false)} what="باقي أسئلة يلا نتكلم" />
  </div>;
}

import { PageTour } from '../../components/Tour';
import { useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Badge, Empty, Tabs } from '../../components/UI';
import { leaderboard } from '../../lib/domain';
import { SubscribeButtons } from '../../components/Upsell';
import { isSubscribed } from '../../lib/subscription';

export function LeaderboardPage() {
  const { user, data } = useApp();
  const [period, setPeriod] = useState('weekly');
  if (!user) return null;
  const board = leaderboard(data);
  const mine = board.findIndex((b) => b.id === user.id) + 1;
  return <div className="stack">
    <PageTour id="leaderboard" />
    <div><h1>أبطال Speakozy</h1><p className="muted">الترتيب بالنقاط. الأسماء مختصرة حسب إعداد الخصوصية، ومفيش بيانات خاصة بتظهر.</p></div>
    {!isSubscribed(user) && <Card className="shadow-inline" dir="rtl"><div className="stack" style={{ textAlign: 'center' }}>
      <strong>الأبطال دول مشتركين معانا — ابعتلنا وابدأ خطوتك وكون جزء منهم 🚀</strong>
      <div className="row" style={{ justifyContent: 'center' }}><SubscribeButtons /></div>
    </div></Card>}
    <Tabs tabs={[{ id: 'weekly', label: 'أسبوعي' }, { id: 'monthly', label: 'شهري' }, { id: 'total', label: 'كل الوقت' }]} active={period} onChange={setPeriod} />
    {!data.settings.leaderboard.enabled ? <Card><Empty icon="🔒" title="لوحة الأبطال متوقفة حاليًا" hint="الأدمن قرر يخفيها مؤقتًا." /></Card> : <Card>
      {board.length ? <div className="stack">{board.map((b, i) => <div key={b.id} className={`row between section-card ${b.id === user.id ? 'done' : ''}`}>
        <div className="row"><span className="node-num">{i + 1}</span><span className="champ-avatar">{b.avatar || '🧑‍🎓'}</span><strong>{b.name}</strong><span className="verified-badge" title="طالب مشترك">✓</span>{b.id === user.id && <Badge tone="green">أنت</Badge>}</div>
        <strong className="green">{b.points} points</strong>
      </div>)}</div> : <Empty title="مفيش مشاركين لسه" />}
    </Card>}
    {mine > 0 && <div className="note">Your current rank: #{mine}. Changes from the previous period will appear when comparison history is available.</div>}
  </div>;
}

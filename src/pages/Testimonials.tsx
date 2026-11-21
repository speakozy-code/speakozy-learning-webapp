import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty } from '../components/UI';
import { go } from '../App';
import { MessageSquareHeart } from 'lucide-react';

export default function TestimonialsPage() {
  const { user, data, put } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [level, setLevel] = useState(user?.levelId || data.levels[0]?.id || '');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  const list = [...(data.testimonials || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !name.trim()) return;
    setSaving(true);
    try {
      await put('testimonials', {
        name: name.trim(), level, date: new Date().toISOString().slice(0, 10), text: text.trim(),
        role: user!.role, studentId: user!.id, rating, createdAt: new Date().toISOString(),
      });
      setText('');
    } finally { setSaving(false); }
  }

  return <div className="stack">
    <div><h1><MessageSquareHeart size={22} /> آراء طلابنا</h1>
      <p className="muted">كلام حقيقي من طلابنا عن تجربتهم مع المحادثة — اقرأ، وشارك رأيك أنت كمان.</p></div>

    <Card>
      <SectionTitle title="شارك رأيك" action={<Badge tone="green">باسمك ومستواك</Badge>} />
      <form onSubmit={submit} className="stack">
        <div className="grid g2">
          <label className="field"><span>الاسم</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" /></label>
          <label className="field"><span>المستوى</span><select value={level} onChange={(e) => setLevel(e.target.value)}>
            {data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}{l.cefr ? ` (${l.cefr})` : ''}</option>)}
          </select></label>
        </div>
        <div className="row" style={{ gap: '.25rem' }}><span>التقييم:</span>{[1,2,3,4,5].map((n) => <button key={n} type="button" className="icon-btn" onClick={() => setRating(n)} aria-label={`${n} stars`} style={{ color: n <= rating ? '#ffc107' : 'var(--muted)', fontSize: '1.4rem' }}>★</button>)}</div>
        <label className="field"><span>رأيك</span><textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="اكتب رأيك عن الكورس والجلسات..." /></label>
        <div><Button type="submit" disabled={saving || !text.trim() || !name.trim()}>{saving ? 'بنحفظ…' : 'انشر رأيك'}</Button></div>
      </form>
    </Card>

    <SectionTitle title={`آراء الطلاب (${list.length})`} />
    {list.length ? <div className="stack">
      {list.map((t) => <Card key={t.id} className="testimonial-card">
        <div className="row between">
          <div className="row"><span className="avatar small">{t.name.charAt(0)}</span><strong>{t.name}</strong></div>
          <Badge tone="blue">{data.levels.find((l) => l.id === t.level)?.title || t.level}{data.levels.find((l) => l.id === t.level)?.cefr ? ` (${data.levels.find((l) => l.id === t.level)?.cefr})` : ''}</Badge>
        </div>
        <p style={{ lineHeight: 1.9, margin: '.8rem 0 .5rem' }}>“{t.text}”</p>
        <div className="row between"><small className="muted">{t.date} · {t.role === 'admin' ? 'إدارة Speakozy' : 'طالب'} · {'★'.repeat(t.rating || 5)}{'☆'.repeat(5 - (t.rating || 5))}</small>
          {(t.studentId === user.id || user.role === 'admin') && <Button size="sm" variant="ghost" onClick={() => { setName(t.name); setLevel(t.level); setText(t.text); setRating(t.rating || 5); }}>تعديل</Button>}</div>
      </Card>)}
    </div> : <Empty icon="💬" title="لسه مفيش آراء" hint="كن أول واحد يشارك رأيه!" />}
  </div>;
}

import { PageTour } from '../../components/Tour';
import { useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Stat, Empty, Tabs, Field, Modal } from '../../components/UI';
import { today } from '../../lib/domain';
import { schedule, previewLabel, dueWords, type Grade } from '../../lib/srs';
import { Volume2, Trash2 } from 'lucide-react';

import { speakWord } from './wordHelpers';
import { tr } from '../../lib/i18n';

export function WordsPage() {
  const { user, data, put, remove } = useApp();
  const [tab, setTab] = useState('review');
  const [flipped, setFlipped] = useState(false);
  const [q, setQ] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const [adding, setAdding] = useState<{ word: string; meaning: string; example: string } | null>(null);
  if (!user) return null;
  const saved = data.savedWords.filter((w) => w.studentId === user.id);
  const now = new Date().toISOString();
  // spaced repetition: a word is due when its next review time has come
  const due = dueWords(saved, now).filter((w) => !skipped.includes(w.id)).sort((a, b) => (a.nextReview || '').localeCompare(b.nextReview || ''));
  const nextUp = saved.map((w) => w.nextReview || '').filter((x) => x > now).sort()[0];
  const card = due[0];
  const list = saved.filter((w) => !q || (w.word + w.meaning).toLowerCase().includes(q.trim().toLowerCase()));
  async function rate(grade: Grade) {
    if (!card) return;
    const s = schedule(card, grade);
    if (grade === 'again') setSkipped((x) => [...x, card.id]);
    await put('savedWords', { ...card, ...s, review: grade === 'again' });
    setFlipped(false);
  }
  async function addOwn() {
    if (!adding || !adding.word.trim() || !adding.meaning.trim()) return;
    const word = adding.word.trim();
    if (saved.some((w) => w.word.toLowerCase() === word.toLowerCase())) { setAdding(null); return; }
    await put('savedWords', { studentId: user!.id, word, meaning: adding.meaning.trim(), transcript: adding.example.trim() || undefined, review: true, createdAt: today(), nextReview: today() });
    setAdding(null);
  }
  return <div className="stack">
    <PageTour id="words" />
    <div><h1>{tr('الكلمات')}</h1><p className="muted">{tr('راجع كلماتك بنظام المراجعة المتباعدة (زي Anki): كل ما تعرف الكلمة أكتر بتتأجل لمدة أطول، والكلمة اللي بتنساها بترجعلك بسرعة. هيجيلك إشعار لما يبقى فيه كلمات مستحقة.')}</p></div>
    <div><Button size="sm" onClick={() => setAdding({ word: '', meaning: '', example: '' })}>{tr('+ ضيف كلمة بنفسك')}</Button></div>
    <Modal open={!!adding} title={tr('ضيف كلمة')} onClose={() => setAdding(null)}>
      <Field label={tr('الكلمة بالإنجليزي')}><input dir="ltr" value={adding?.word || ''} onChange={(e) => setAdding({ ...adding!, word: e.target.value })} placeholder="e.g. reliable" /></Field>
      <Field label={tr('المعنى بالعربي')}><input dir="rtl" value={adding?.meaning || ''} onChange={(e) => setAdding({ ...adding!, meaning: e.target.value })} /></Field>
      <Field label={tr('جملة مثال (اختياري)')}><input dir="ltr" value={adding?.example || ''} onChange={(e) => setAdding({ ...adding!, example: e.target.value })} /></Field>
      <Button onClick={addOwn} disabled={!adding?.word.trim() || !adding?.meaning.trim()}>{tr('ضيف للكروت')}</Button>
    </Modal>
    <div className="grid g3">
      <Stat label={tr('كلمات محفوظة')} value={saved.length} />
      <Stat label={tr('مستحقة للمراجعة')} value={due.length} tone="green" />
      <Stat label={tr('لسه بتنساها')} value={saved.filter((w) => w.review).length} />
    </div>
    <Tabs tabs={[{ id: 'review', label: tr('مراجعة ({0})', [due.length]) }, { id: 'all', label: tr('كل كلماتي ({0})', [saved.length]) }]} active={tab} onChange={setTab} />
    {tab === 'review' && <Card>
      {card ? <div className="flashcard">
        <div className="muted">{tr('باقي')} {due.length} {tr('كلمة للمراجعة')}</div>
        <h2 dir="ltr" className="en" style={{ fontSize: '2rem' }}>{card.word}</h2>
        <Button variant="ghost" onClick={() => speakWord(card.word)}><Volume2 size={16} /> {tr('اسمع')}</Button>
        {flipped
          ? <>
            <div className="result-good" dir="rtl" style={{ margin: '1rem 0' }}>{card.meaning}</div>
            {card.transcript && <div className="muted en" dir="ltr" style={{ marginBottom: '.8rem' }}>{card.transcript}</div>}
            <div className="row" style={{ justifyContent: 'center' }}>
              <Button variant="danger" onClick={() => rate('again')}>{tr('لسه بنساها')}<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'again')}</small></Button>
              <Button variant="ghost" onClick={() => rate('hard')}>{tr('صعبة')}<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'hard')}</small></Button>
              <Button onClick={() => rate('good')}>{tr('كويسة')}<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'good')}</small></Button>
              <Button variant="ghost" onClick={() => rate('easy')}>{tr('سهلة')}<small style={{ display: 'block', opacity: .8 }}>{previewLabel(card, 'easy')}</small></Button>
            </div>
          </>
          : <Button style={{ marginTop: '1rem' }} onClick={() => setFlipped(true)}>{tr('اقلب الكارت')}</Button>}
      </div> : <Empty icon="🎉" title={saved.length ? tr('خلصت مراجعة النهاردة') : tr('لسه ما حفظتش كلمات')} hint={saved.length ? (nextUp ? tr('الكلمة الجاية هتتراجع {0} — هيجيلك إشعار.', [new Date(nextUp).toLocaleString('ar-EG', { weekday: 'long', hour: 'numeric', minute: '2-digit' })]) : tr('ارجع بكرة لباقي الكلمات.')) : tr('احفظ كلمات من الديكشنري أو من السيشنات وهتظهر هنا.')} />}
    </Card>}
    {tab === 'all' && <Card>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('دوّر في كلماتك')} aria-label={tr('دوّر في كلماتك')} style={{ marginBottom: '.8rem' }} />
      {list.length ? <div className="saved-grid">{list.map((w) => <div key={w.id} className={`saved-card ${w.review ? 'needs-review' : ''}`}>
        <div className="saved-word en" dir="ltr">{w.word}</div>
        {w.transcript && <div className="saved-transcript en" dir="ltr">{w.transcript}</div>}
        <div className="saved-meaning" dir="rtl">{w.meaning}</div>
        <div className="saved-actions">
          <button className="icon-btn" title={tr('اسمع النطق')} onClick={() => speakWord(w.word)}><Volume2 size={16} /></button>
          <button className="icon-btn danger" title={tr('حذف')} onClick={() => remove('savedWords', w.id)}><Trash2 size={16} /></button>
        </div>
      </div>)}</div> : <Empty title={tr('مفيش كلمات')} hint={tr('احفظ كلمات من الديكشنري.')} />}
    </Card>}
  </div>;
}

/** يلا نتكلم: سؤال محادثة عشوائي على حسب مستوى الطالب. */

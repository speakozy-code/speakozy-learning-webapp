import { PageTour } from '../../components/Tour';
import { useEffect, useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Field, Modal } from '../../components/UI';
import { today } from '../../lib/domain';
import { go } from '../../App';
import { lookupWord, allCached, isArabicText, normAr, arabicToEnglish, type LookupEntry } from '../../lib/dictionaryProvider';
import { YOUGLISH_ACCENTS } from '../../lib/youglish';
import { YouGlishDock } from '../../components/YouGlishDock';
import { Volume2 } from 'lucide-react';

import { phon, easyExamples } from './wordHelpers';

export function DictionaryPage() {
  const { user, data, put, remove } = useApp();
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<LookupEntry | null>(null);
  const [looking, setLooking] = useState(false);
  const [manual, setManual] = useState<any>(null);
  const [globalHit, setGlobalHit] = useState<LookupEntry | null>(null);
  const [globalTick, setGlobalTick] = useState(0);
  const [arCands, setArCands] = useState<string[]>([]);
  const [yg, setYg] = useState<{ word: string; accent: string } | null>(null);
  if (!user) return null;

  const all = data.dictionary;
  const saved = data.savedWords.filter((w) => w.studentId === user.id);
  const globalEntries = allCached();
  const matches = (d: any) => {
    if (!q) return true;
    const term = q.trim();
    if (isArabicText(term)) return normAr(d.arabic + ' ' + d.meaning).includes(normAr(term));
    const hay = (d.word + ' ' + d.meaning + ' ' + d.arabic + ' ' + (d.examples || []).join(' ')).toLowerCase();
    return hay.includes(term.toLowerCase());
  };
  const seen = new Set<string>();
  const localResults = [...all, ...globalEntries].filter((d: any) => {
    const key = d.word.toLowerCase();
    if (seen.has(key) || !matches(d)) return false;
    seen.add(key); return true;
  }).slice(0, 40);
  const suggestions = q.trim().length >= 1
    ? all.filter((d) => d.word.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
    : [];
  const wordOfDay = all[(new Date().getDate() * 7) % all.length];

  useEffect(() => {
    let alive = true;
    const term = q.trim();
    setGlobalHit(null); setArCands([]);
    if (term.length < 2) return;
    if (isArabicText(term)) {
      const t = setTimeout(async () => { const c = await arabicToEnglish(term); if (alive) setArCands(c); }, 350);
      return () => { alive = false; clearTimeout(t); };
    }
    const timer = setTimeout(async () => {
      const entry = await lookupWord(term, all);
      if (alive && entry && entry.source !== 'local') setGlobalHit(entry);
    }, 700);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, globalTick]);

  function isSaved(word: string) { return saved.some((w) => w.word.toLowerCase() === word.toLowerCase()); }

  async function showWord(word: string) {
    if (isArabicText(word)) {
      // an Arabic query never goes to the English dictionary as-is: translate it, then open the best English word
      setDetail(null); setLooking(true);
      const cands = arCands.length ? arCands : await arabicToEnglish(word);
      setArCands(cands);
      // look the top candidates up in parallel and open the first one that resolves
      const tries = cands.slice(0, 3).map((c) => lookupWord(c, all).then((e) => { if (!e) throw new Error('none'); return e; }));
      const entry = await new Promise<LookupEntry | undefined>((resolve) => {
        let left = tries.length;
        if (!left) resolve(undefined);
        tries.forEach((t) => t.then(resolve, () => { left -= 1; if (left === 0) resolve(undefined); }));
      });
      if (entry) { setLooking(false); setDetail(entry); setGlobalHit(entry.source === 'global' ? entry : null); return; }
      setLooking(false);
      setManual({ word: cands[0] || '', meaning: word.trim(), type: 'noun', examples: '' });
      return;
    }
    setDetail(null); setLooking(true);
    const entry = await lookupWord(word, all);
    setLooking(false);
    if (entry) { setDetail(entry); setGlobalHit(entry.source === 'global' ? entry : null); }
    else setManual({ word, meaning: '', type: 'noun', examples: '' });
  }
  async function toggle(word: LookupEntry | any) {
    if (isSaved(word.word)) {
      const found = saved.find((w) => w.word.toLowerCase() === word.word.toLowerCase());
      if (found) await remove('savedWords', found.id);
    } else {
      await put('dictionary', {
        id: word.id || `saved-${word.word.toLowerCase()}`,
        word: word.word, meaning: word.meaning, type: word.type || 'word',
        examples: word.examples || [], arabic: word.arabic || '',
        phonetic: word.phonetic, audioUrl: word.audioUrl, definitions: word.definitions,
        synonyms: word.synonyms, source: word.source || 'global', sessionIds: word.sessionIds || [],
        addedBy: user!.id,
      });
      await put('savedWords', { studentId: user!.id, word: word.word, meaning: word.meaning, review: false, createdAt: today(), nextReview: today() });
    }
  }
  function pronounce(entry: any) {
    if (entry.audioUrl) { new Audio(entry.audioUrl).play().catch(() => speak(entry.word)); return; }
    speak(entry.word);
  }
  function speak(word: string) {
    try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; u.rate = 0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
  }
  async function saveManual() {
    const entry: any = {
      id: `manual-${manual.word.toLowerCase().replace(/\s+/g, '-')}`,
      word: manual.word.trim(), meaning: manual.meaning.trim(), type: manual.type,
      examples: manual.examples.split('\n').filter((x: string) => x.trim()),
      arabic: manual.meaning.trim(), source: 'manual', sessionIds: [], addedBy: user!.id,
    };
    await put('dictionary', entry);
    await put('savedWords', { studentId: user!.id, word: entry.word, meaning: entry.meaning, review: false, createdAt: today(), nextReview: today() });
    setManual(null); setDetail(null); setGlobalTick((t) => t + 1);
  }

  return <div className="stack">
    <PageTour id="dictionary" />
    <div><h1>الديكشنري</h1><p className="muted">تقدر تحفظ أي كلمة، أو تسمعها من المتحدثين الأصليين على YouGlish. الديكشنري فيه آلاف الكلمات الجاهزة، ولو مش موجودة بنجيب معناها من المصدر العالمي.</p></div>

    <Card className="search-hero">
      <div className="row"><span style={{ fontSize: '1.4rem' }}>🔎</span><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { if (isArabicText(q) && arCands[0]) showWord(arCands[0]); else showWord(q); } }} placeholder="اكتب أي كلمة بالإنجليزي أو العربي... مثال: serendipity" aria-label="دوّر في الديكشنري" /></div>
      {suggestions.length > 0 && <div className="dict-suggest">{suggestions.map((d) => <button key={d.id} type="button" className="dict-suggest-item en" dir="ltr" onClick={() => { setQ(d.word); showWord(d.word); }}>{d.word}</button>)}</div>}
      <div className="row" style={{ marginTop: '.7rem', justifyContent: 'flex-end' }}>
        <div className="row"><Button size="sm" variant="ghost" onClick={() => setManual(isArabicText(q) ? { word: '', meaning: q.trim(), type: 'noun', examples: '' } : { word: q.trim(), meaning: '', type: 'noun', examples: '' })}>+ ضيف كلمة</Button><Button size="sm" onClick={() => q.trim() && showWord(q)} disabled={!q.trim() || looking}>{looking ? 'بندوّر...' : 'دوّر عالميًا'}</Button></div>
      </div>
      {q.trim() && !looking && <div className="muted" style={{ marginTop: '.5rem', fontSize: '.82rem' }}>
        نتايج محلية: {localResults.length} · <button className="icon-btn" onClick={() => showWord(q)}>دوّر عالميًا عن "{q}" ←</button>
      </div>}
      {arCands.length > 0 && <div className="global-hit">
        <small className="muted">معناها بالإنجليزي</small>
        <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{arCands.map((w) => <button key={w} type="button" className="word-chip en" dir="ltr" onClick={() => showWord(w)}>{w}</button>)}</div>
      </div>}
      {globalHit && <div className="global-hit">
        <div className="row between"><div><small className="muted">الديكشنري العالمي</small>
          <div className="row"><strong className="en" style={{ fontSize: '1.1rem' }}>{globalHit.word}</strong><Badge tone="blue">{globalHit.type}</Badge>{globalHit.phonetic && <span className="en muted" dir="ltr">{phon(globalHit.phonetic)}</span>}</div>
          <div className="en" dir="ltr">{globalHit.meaning}</div>
          {!!(globalHit.synonyms || []).length && <div className="row" style={{ marginTop: '.4rem' }}>{globalHit.synonyms!.slice(0, 6).map((x) => <span key={x} className="word-chip en">{x}</span>)}</div>}
        </div>
          <div className="row">
            <Button size="sm" variant="ghost" onClick={() => pronounce(globalHit)}>استماع</Button>
            <Button size="sm" variant="ghost" onClick={() => setYg({ word: globalHit.word, accent: 'us' })}>YouGlish</Button>
            <Button size="sm" onClick={() => toggle(globalHit)}>{isSaved(globalHit.word) ? '✓ محفوظة' : 'ضيفها لكلماتي'}</Button>
          </div>
        </div>
      </div>}
    </Card>

    {wordOfDay && <Card className="word-day">
      <div className="between"><div><div className="muted">كلمة اليوم</div><h2 dir="ltr" className="en" style={{ fontSize: '1.7rem' }}>{wordOfDay.word}</h2><div>{wordOfDay.meaning} · {wordOfDay.type}</div></div>
        <div className="row"><Button variant="ghost" onClick={() => speak(wordOfDay.word)}><Volume2 size={16} /></Button><Button onClick={() => showWord(wordOfDay.word)}>افتح الكارت</Button></div>
      </div>
    </Card>}

    {q.trim() && <Card>
      <SectionTitle title={`Results (${localResults.length})`} />
      {localResults.length ? <div className="stack">{localResults.map((d) => <div key={d.id} className="word-row">
        <button className="icon-btn" onClick={() => setDetail({ ...d, source: d.source || 'local' })}><strong className="en" dir="ltr">{d.word}</strong></button>
        <span className="muted" dir="rtl">{d.meaning}</span>
        <div className="row"><Badge>{d.type}</Badge><button className="icon-btn" onClick={() => pronounce(d)}><Volume2 size={16} /></button><Button size="sm" variant={isSaved(d.word) ? 'ghost' : 'primary'} onClick={() => toggle(d)}>{isSaved(d.word) ? '✓' : 'حفظ'}</Button></div>
      </div>)}</div> : <Empty icon="🔍" title="مفيش نتايج محلية" hint="هنجرّب المصدر العالمي تلقائيًا، أو تقدر تضيف الكلمة بنفسك." />}
    </Card>}

    <Modal open={!!detail} title="كارت الكلمة" onClose={() => setDetail(null)}>
      {detail && <div className="stack">
        <div className="between"><div><h2 dir="ltr" className="en" style={{ fontSize: '1.9rem' }}>{detail.word}</h2>
          <div className="row"><Badge tone="green">{detail.type}</Badge>{detail.phonetic && <span className="muted" dir="ltr">{phon(detail.phonetic)}</span>}<Badge tone={detail.source === 'global' ? 'blue' : 'muted'}>{detail.source === 'global' ? 'الديكشنري العالمي' : detail.source === 'manual' ? 'إضافة يدوية' : 'من المنهج'}</Badge></div></div>
          <Button variant="ghost" onClick={() => pronounce(detail)}><Volume2 size={16} /> اسمع النطق</Button></div>
        {detail.arabic && <div className="section-card"><h3>المعنى بالعربي</h3><p dir="rtl" style={{ fontSize: '1.15rem', margin: 0 }}>{detail.arabic}</p></div>}
        <div className="section-card"><h3>التعريف</h3><p className="en" dir="ltr" style={{ margin: 0 }}>{detail.definitions?.[0] || detail.meaning}</p></div>
        <div className="section-card"><h3>مثالين</h3>{easyExamples(detail).length ? easyExamples(detail).map((ex, i) => <div key={i} className="en" dir="ltr" style={{ textAlign: 'left', lineHeight: 1.9 }}>• {ex}</div>) : <p className="muted">مفيش أمثلة متاحة.</p>}</div>
        {detail.phonetic && <div className="section-card"><h3>النطق المكتوب</h3><p className="en" dir="ltr">{phon(detail.phonetic)}</p></div>}
        <div className="section-card"><h3>اسمعها في الاستخدام</h3>
          <div className="youglish-btns">{YOUGLISH_ACCENTS.map((a) => <button key={a.code} type="button" className="yg-btn en" onClick={() => setYg({ word: detail.word, accent: a.code })}>{a.label}</button>)}</div>
        </div>
        {detail.synonyms && detail.synonyms.length > 0 && <div className="section-card"><h3>المرادفات</h3><div className="row">{detail.synonyms.map((x) => <span key={x} className="word-chip en">{x}</span>)}</div></div>}
        {(detail.sessionIds || []).length > 0 && <div className="section-card"><h3>بتظهر في سيشنات</h3>{detail.sessionIds!.map((sid) => { const sess = data.sessions.find((x) => x.id === sid); return sess ? <div key={sid}><button className="icon-btn" onClick={() => { setDetail(null); go(`/session/${sid}`); }}>{sess.title} ←</button></div> : null; })}</div>}
        <Button onClick={() => toggle(detail)}>{isSaved(detail.word) ? 'شيلها من المحفوظات' : 'ضيفها لكلماتي'}</Button>
      </div>}
    </Modal>
    {yg && <YouGlishDock word={yg.word} accent={yg.accent} onAccent={(accent) => setYg({ word: yg.word, accent })} onClose={() => setYg(null)} />}

    <Modal open={!!manual} title="ضيف كلمة بنفسك" onClose={() => setManual(null)}>
      <Field label="الكلمة"><input dir="ltr" value={manual?.word || ''} onChange={(e) => setManual({ ...manual, word: e.target.value })} /></Field>
      <Field label="المعنى بالعربي"><input value={manual?.meaning || ''} onChange={(e) => setManual({ ...manual, meaning: e.target.value })} /></Field>
      <Field label="النوع"><select value={manual?.type || 'noun'} onChange={(e) => setManual({ ...manual, type: e.target.value })}>{['noun','verb','adjective','adverb','phrase','preposition'].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="أمثلة (واحد في كل سطر)"><textarea dir="ltr" value={manual?.examples || ''} onChange={(e) => setManual({ ...manual, examples: e.target.value })} /></Field>
      <Button onClick={saveManual} disabled={!manual?.word?.trim() || !manual?.meaning?.trim()}>احفظ الكلمة</Button>
    </Modal>
  </div>;
}

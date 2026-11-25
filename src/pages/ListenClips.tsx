import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Field } from '../components/UI';
import { isSubscribed } from '../lib/subscription';
import { uid, today, scoreRule } from '../lib/domain';
import type { ListenClip } from '../types';
import { Headphones, Play, Snail, Bookmark } from 'lucide-react';

const FREE_CLIPS = 3;
const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export function parseYoutubeId(input: string): string {
  const t = input.trim();
  const m = t.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(t) ? t : '';
}

let apiPromise: Promise<any> | null = null;
function loadYT(): Promise<any> {
  const w = window as any;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!apiPromise) apiPromise = new Promise((res) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { prev?.(); res(w.YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  });
  return apiPromise;
}

/** Plays only the [start, end] part of a YouTube video. Controls: play/replay and slow. */
function ClipPlayer({ clip, onBroken }: { clip: Pick<ListenClip, 'youtubeId' | 'start' | 'end'>; onBroken?: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const timer = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false;
    setReady(false);
    loadYT().then((YT) => {
      if (dead || !host.current) return;
      const el = document.createElement('div'); host.current.innerHTML = ''; host.current.appendChild(el);
      player.current = new YT.Player(el, {
        videoId: clip.youtubeId, host: 'https://www.youtube-nocookie.com',
        playerVars: { start: Math.floor(clip.start), end: Math.ceil(clip.end), controls: 0, modestbranding: 1, rel: 0, playsinline: 1, cc_load_policy: 0, disablekb: 1, fs: 0, origin: window.location.origin },
        events: {
          onReady: () => setReady(true),
          onError: () => onBroken?.(),
          onStateChange: (e: any) => { if (e.data === YT.PlayerState.ENDED) { player.current?.seekTo(clip.start, true); player.current?.pauseVideo(); } },
        },
      });
    });
    return () => { dead = true; clearInterval(timer.current); try { player.current?.destroy(); } catch {} player.current = null; };
  }, [clip.youtubeId, clip.start, clip.end]);

  function play(rate: number) {
    const p = player.current; if (!p || !ready) return;
    clearInterval(timer.current);
    p.setPlaybackRate(rate); p.seekTo(clip.start, true); p.playVideo();
    timer.current = setInterval(() => {
      try { if (p.getCurrentTime() >= clip.end - 0.05) { p.pauseVideo(); clearInterval(timer.current); } } catch { clearInterval(timer.current); }
    }, 120);
  }

  return <div className="stack">
    <div ref={host} style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }} />
    <div className="row" style={{ gap: '.5rem', justifyContent: 'center' }}>
      <Button onClick={() => play(1)} disabled={!ready}><Play size={16} /> شغّل / أعد</Button>
      <Button variant="ghost" onClick={() => play(0.6)} disabled={!ready}><Snail size={16} /> بطيء</Button>
    </div>
  </div>;
}

export function ListenPage() {
  const { user, data, put, grantScore, log } = useApp();
  const [picked, setPicked] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [broken, setBroken] = useState<string[]>([]);
  const [savedMsg, setSavedMsg] = useState(false);
  if (!user) return null;

  const subscribed = isSubscribed(user) || user.role === 'admin';
  const all = [...(data.listenClips || [])].filter((c) => c.active && !broken.includes(c.id))
    .filter((c) => !c.levelId || c.levelId === user.levelId || user.role === 'admin')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const done = new Set(data.attempts.filter((a) => a.studentId === user.id && a.questionId.startsWith('listen:')).map((a) => a.questionId.slice(7)));
  const allowed = subscribed ? all : all.slice(0, FREE_CLIPS);
  const todo = allowed.filter((c) => !done.has(c.id) && !skipped.includes(c.id));
  const clip = todo[0];
  const options = useMemo(() => clip ? shuffle([clip.sentence, ...clip.wrong.filter(Boolean)]) : [], [clip?.id]);

  async function choose(opt: string) {
    if (!clip || picked) return;
    setPicked(opt);
    const ok = opt === clip.sentence;
    await put('attempts', { id: uid(), studentId: user!.id, sessionId: 'listen', questionId: `listen:${clip.id}`, answer: opt, autoScore: ok ? 1 : 0, maxScore: 1, status: 'approved', createdAt: today() });
    if (ok) {
      const pts = scoreRule(data.settings.scoreRules, 'listenClip');
      if (pts > 0) await grantScore(user!.id, 'listen', pts, `listen-${clip.id}-${user!.id}`);
    }
  }
  async function saveSentence() {
    if (!clip) return;
    const exists = data.savedWords.some((x) => x.studentId === user!.id && x.word.toLowerCase() === clip.sentence.toLowerCase());
    if (!exists) await put('savedWords', { studentId: user!.id, word: clip.sentence, meaning: clip.translation, review: false, createdAt: today(), nextReview: today() });
    setSavedMsg(true);
  }
  function next() { setPicked(null); setSavedMsg(false); }

  const correctCount = data.attempts.filter((a) => a.studentId === user.id && a.questionId.startsWith('listen:') && a.autoScore > 0).length;

  return <div className="stack">
    <div><h1><Headphones size={22} /> مقاطع الاستماع</h1>
      <p className="muted">اسمع الجملة من المقطع، واختار اللي سمعته. ممكن تعيد أو تسمعها بالبطيء.</p></div>
    <div className="row" style={{ gap: '.5rem' }}><Badge tone="green">صح: {correctCount}</Badge><Badge>خلّصت: {done.size} / {allowed.length}</Badge>
      {!subscribed && all.length > FREE_CLIPS && <Badge tone="danger">باقي المقاطع للمشتركين</Badge>}</div>
    {!clip ? <Card><Empty title={allowed.length ? 'خلّصت كل المقاطع المتاحة 🎉' : 'لسه مفيش مقاطع'} text={allowed.length ? 'هنضيف مقاطع جديدة قريب.' : 'المقاطع هتظهر هنا أول ما تتضاف.'} /></Card> :
      <Card>
        <div className="stack">
          <ClipPlayer key={clip.id} clip={clip} onBroken={() => setBroken((b) => [...b, clip.id])} />
          <div className="stack">
            {options.map((o) => {
              const isRight = o === clip.sentence;
              const style: React.CSSProperties = { textAlign: 'left', justifyContent: 'flex-start' };
              if (picked) { if (isRight) style.background = '#d1fae5'; else if (o === picked) style.background = '#fee2e2'; }
              return <Button key={o} variant="ghost" onClick={() => choose(o)} disabled={!!picked} style={style}><span dir="ltr">{o}</span></Button>;
            })}
          </div>
          {picked && <div className="stack">
            <p><b>{picked === clip.sentence ? '✅ صح!' : '❌ مش دي'}</b></p>
            <p dir="ltr" style={{ fontSize: '1.1rem' }}>{clip.sentence}</p>
            {clip.translation && <p className="muted" dir="rtl">{clip.translation}</p>}
            <div className="row" style={{ gap: '.5rem' }}>
              <Button variant="ghost" onClick={saveSentence} disabled={savedMsg}><Bookmark size={16} /> {savedMsg ? 'اتحفظت في كلماتك' : 'احفظ الجملة'}</Button>
              <Button onClick={next}>التالي ←</Button>
            </div>
          </div>}
          {!picked && <Button variant="ghost" size="sm" onClick={() => setSkipped((s) => [...s, clip.id])}>مقطع تاني</Button>}
        </div>
      </Card>}
  </div>;
}

type Draft = { id: string; url: string; start: string; end: string; sentence: string; w1: string; w2: string; translation: string; levelId: string; active: boolean };
const blank: Draft = { id: '', url: '', start: '0', end: '5', sentence: '', w1: '', w2: '', translation: '', levelId: '', active: true };

export function ListenAdminPage() {
  const { data, put, remove } = useApp();
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState('');
  const clips = [...(data.listenClips || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const ytId = parseYoutubeId(d.url);
  const start = Number(d.start), end = Number(d.end);

  async function save() {
    if (!ytId) return setErr('لينك اليوتيوب مش صحيح');
    if (!(end > start)) return setErr('النهاية لازم تبقى بعد البداية');
    if (!d.sentence.trim() || !d.w1.trim() || !d.w2.trim()) return setErr('اكتب الجملة الصح واختيارين غلط');
    setErr('');
    const rec: ListenClip = { id: d.id || `lc-${uid()}`, youtubeId: ytId, start, end, sentence: d.sentence.trim(), wrong: [d.w1.trim(), d.w2.trim()], translation: d.translation.trim(), levelId: d.levelId, active: d.active, createdAt: clips.find((c) => c.id === d.id)?.createdAt || new Date().toISOString() };
    await put('listenClips', rec);
    setD(blank);
  }
  const edit = (c: ListenClip) => setD({ id: c.id, url: c.youtubeId, start: String(c.start), end: String(c.end), sentence: c.sentence, w1: c.wrong[0] || '', w2: c.wrong[1] || '', translation: c.translation, levelId: c.levelId, active: c.active });

  return <div className="stack">
    <div><h1><Headphones size={22} /> مقاطع الاستماع</h1><p className="muted">حط لينك مقطع يوتيوب (Movieclips مثلًا)، ثواني البداية والنهاية، والجملة الصح مع اختيارين غلط.</p></div>
    <Card>
      <SectionTitle title={d.id ? 'تعديل مقطع' : 'مقطع جديد'} />
      <div className="stack">
        <Field label="لينك اليوتيوب"><input dir="ltr" value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></Field>
        <div className="grid g3">
          <Field label="بداية (ثانية)"><input dir="ltr" type="number" step="0.1" value={d.start} onChange={(e) => setD({ ...d, start: e.target.value })} /></Field>
          <Field label="نهاية (ثانية)"><input dir="ltr" type="number" step="0.1" value={d.end} onChange={(e) => setD({ ...d, end: e.target.value })} /></Field>
          <Field label="المستوى"><select value={d.levelId} onChange={(e) => setD({ ...d, levelId: e.target.value })}><option value="">كل المستويات</option>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
        </div>
        {ytId && end > start && <ClipPlayer clip={{ youtubeId: ytId, start, end }} />}
        <Field label="الجملة الصح"><input dir="ltr" value={d.sentence} onChange={(e) => setD({ ...d, sentence: e.target.value })} /></Field>
        <Field label="اختيار غلط 1"><input dir="ltr" value={d.w1} onChange={(e) => setD({ ...d, w1: e.target.value })} /></Field>
        <Field label="اختيار غلط 2"><input dir="ltr" value={d.w2} onChange={(e) => setD({ ...d, w2: e.target.value })} /></Field>
        <Field label="الترجمة بالعربي"><input dir="rtl" value={d.translation} onChange={(e) => setD({ ...d, translation: e.target.value })} /></Field>
        <label className="row" style={{ gap: '.4rem' }}><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> ظاهر للطلبة</label>
        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}
        <div className="row" style={{ gap: '.5rem' }}><Button onClick={save}>{d.id ? 'احفظ التعديل' : 'ضيف المقطع'}</Button>{d.id && <Button variant="ghost" onClick={() => setD(blank)}>إلغاء</Button>}</div>
      </div>
    </Card>
    <Card>
      <SectionTitle title={`المقاطع (${clips.length})`} />
      {!clips.length ? <Empty title="لسه مفيش مقاطع" text="ضيف أول مقطع من الفورم." /> :
        <div className="stack">{clips.map((c) => <div key={c.id} className="row between" style={{ gap: '.5rem' }}>
          <span dir="ltr" style={{ flex: 1 }}>{c.sentence}</span>
          <Badge tone={c.active ? 'green' : ''}>{c.active ? 'ظاهر' : 'مخفي'}</Badge>
          <Button size="sm" variant="ghost" onClick={() => edit(c)}>تعديل</Button>
          <Button size="sm" variant="ghost" onClick={() => { if (confirm('تمسح المقطع؟')) remove('listenClips', c.id); }}>مسح</Button>
        </div>)}</div>}
    </Card>
  </div>;
}

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Field } from '../components/UI';
import { uid, today, scoreRule } from '../lib/domain';
import { lookupWord, type LookupEntry } from '../lib/dictionaryProvider';
import type { ListenClip, ListenLine } from '../types';
import { Headphones, Play, Snail, Repeat, Bookmark, Volume2, ExternalLink } from 'lucide-react';


export function parseYoutubeId(input: string): string {
  const t = input.trim();
  const m = t.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(t) ? t : '';
}
const fmt = (n: number) => { const m = Math.floor(n / 60); const s = n - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`; };
export function parseLines(text: string): ListenLine[] {
  const out: ListenLine[] = [];
  for (const raw of text.split('\n')) {
    const l = raw.trim(); if (!l) continue;
    const a = l.match(/^(\d+):(\d{1,2}(?:\.\d+)?)\s+(.+)$/);
    const b = l.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    const m = a || b; if (!m) continue;
    const t = a ? Number(a[1]) * 60 + Number(a[2]) : Number(b![1]);
    const [text, say, note] = (m[m.length - 1] as string).split('|').map((x) => x.trim());
    out.push({ t, text, ...(say ? { say } : {}), ...(note ? { note } : {}) });
  }
  return out.sort((x, y) => x.t - y.t);
}
const linesToText = (ls: ListenLine[]) => ls.map((l) => `${fmt(l.t)} ${l.text}${l.say || l.note ? ` | ${l.say || ''} | ${l.note || ''}` : ''}`).join('\n');

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

export type PlayerApi = { playRange: (a: number, b: number, rate?: number, loop?: boolean) => void; pause: () => void; now: () => number };
type PlayerProps = { lock?: boolean; videoId: string; start: number; onTime?: (t: number) => void; onBroken?: () => void; onReady?: () => void };

/** YouTube player that plays only a chosen range (and can loop it or slow it down). */
const ClipPlayer = forwardRef<PlayerApi, PlayerProps>(function ClipPlayer({ lock = true, videoId, start, onTime, onBroken, onReady }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const range = useRef<{ a: number; b: number; loop: boolean } | null>(null);
  const [ready, setReady] = useState(false);
  const cbs = useRef({ onTime, onBroken, onReady }); cbs.current = { onTime, onBroken, onReady };

  useEffect(() => {
    let dead = false; let timer: any;
    setReady(false);
    loadYT().then((YT) => {
      if (dead || !host.current) return;
      const el = document.createElement('div'); host.current.innerHTML = ''; host.current.appendChild(el);
      player.current = new YT.Player(el, {
        videoId, host: 'https://www.youtube-nocookie.com',
        playerVars: { start: Math.floor(start), controls: lock ? 0 : 1, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, playsinline: 1, cc_load_policy: 0, origin: window.location.origin },
        events: { onReady: () => { try { const f = player.current?.getIframe?.(); if (f) { f.style.width = '100%'; f.style.height = '100%'; } } catch {} setReady(true); cbs.current.onReady?.(); }, onError: () => cbs.current.onBroken?.() },
      });
      timer = setInterval(() => {
        const p = player.current; if (!p?.getCurrentTime) return;
        let t = 0; try { t = p.getCurrentTime(); } catch { return; }
        cbs.current.onTime?.(t);
        const r = range.current;
        if (r && t >= r.b - 0.05) {
          if (r.loop) p.seekTo(r.a, true); else { p.pauseVideo(); range.current = null; }
        }
      }, 120);
    });
    return () => { dead = true; clearInterval(timer); try { player.current?.destroy(); } catch {} player.current = null; };
  }, [videoId]);

  useImperativeHandle(ref, () => ({
    playRange(a, b, rate = 1, loop = false) {
      const p = player.current; if (!p?.seekTo) return;
      range.current = { a, b, loop }; p.setPlaybackRate(rate); p.seekTo(a, true); p.playVideo();
    },
    pause() { range.current = null; try { player.current?.pauseVideo(); } catch {} },
    now() { try { return player.current?.getCurrentTime() || 0; } catch { return 0; } },
  }), [ready]);

  return <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
    <div ref={host} style={{ position: 'absolute', inset: 0 }} />
    {lock && <div style={{ position: 'absolute', inset: 0, zIndex: 2 }} />}
  </div>;
});

function speak(word: string) {
  try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; u.rate = 0.85; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {}
}

function WordCard({ word, onClose }: { word: string; onClose: () => void }) {
  const { user, data, put } = useApp();
  const [entry, setEntry] = useState<LookupEntry | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setEntry(undefined); setSaved(false); lookupWord(word, data.dictionary).then((e) => setEntry(e || null)).catch(() => setEntry(null)); }, [word]);
  const meaning = entry ? (entry.arabic || entry.meaning || '') : '';
  function hear() { if (entry?.audioUrl) { try { new Audio(entry.audioUrl).play(); return; } catch {} } speak(word); }
  async function save() {
    if (!user) return;
    const exists = data.savedWords.some((x) => x.studentId === user.id && x.word.toLowerCase() === word.toLowerCase());
    if (!exists) await put('savedWords', { studentId: user.id, word, meaning, review: false, createdAt: today(), nextReview: today() });
    setSaved(true);
  }
  return <Card>
    <div className="row between"><h3 dir="ltr" style={{ margin: 0 }}>{word}</h3><Button size="sm" variant="ghost" onClick={onClose}>✕</Button></div>
    {entry === undefined ? <p className="muted">بنجيب المعنى...</p> : <div className="stack">
      {entry?.phonetic && <p dir="ltr" className="muted">{entry.phonetic}</p>}
      {meaning && <p dir="rtl"><b>{meaning}</b></p>}
      {entry?.definitions?.[0] && <p dir="ltr" className="muted">{entry.definitions[0]}</p>}
      {entry === null && <p className="muted">مالقيناش معنى للكلمة دي، بس تقدر تسمع نطقها.</p>}
      <div className="row" style={{ gap: '.5rem' }}>
        <Button size="sm" onClick={hear}><Volume2 size={16} /> اسمع النطق</Button>
        <Button size="sm" variant="ghost" onClick={save} disabled={saved}><Bookmark size={16} /> {saved ? 'اتحفظت' : 'احفظ الكلمة'}</Button>
      </div>
    </div>}
  </Card>;
}

function Lines({ clip, now, onLine, onWord, sel }: { clip: Pick<ListenClip, 'lines' | 'end'>; now: number; onLine: (i: number) => void; onWord?: (w: string) => void; sel?: number | null }) {
  const active = clip.lines.reduce((acc, l, i) => (l.t <= now + 0.05 ? i : acc), -1);
  return <div className="stack">{clip.lines.map((l, i) => <div key={i} dir="ltr" onClick={() => onLine(i)}
    style={{ textAlign: 'left', padding: '.5rem .7rem', borderRadius: 10, cursor: 'pointer', background: i === active ? '#fef3c7' : 'transparent', border: '1px solid #0001' }}>
    {onWord ? l.text.split(/(\s+)/).map((tok, k) => {
      const w = tok.replace(/[^A-Za-z']/g, '').replace(/^'+|'+$/g, '');
      return /^\s+$/.test(tok) || !w ? <span key={k}>{tok}</span> : <span key={k} onClick={(e) => { e.stopPropagation(); onWord(w); }} style={{ textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{tok}</span>;
    }) : l.text}
    {(i === sel || (sel == null && i === active)) && (l.say || l.note) && <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px dashed #0002' }}>
      {l.say && <div style={{ fontSize: '.95rem', color: '#92400e' }}><b>إزاي تقولها:</b> {l.say}</div>}
      {l.note && <div dir="rtl" className="muted" style={{ textAlign: 'right', marginTop: '.25rem' }}>{l.note}</div>}
    </div>}
  </div>)}</div>;
}

const lineEnd = (c: Pick<ListenClip, 'lines' | 'end'>, i: number) => (i + 1 < c.lines.length ? c.lines[i + 1].t : c.end);
const MIN_PLAYS = 4;

/** Shadowing flow for one big clip: listen to all of it, master it sentence by sentence, then shadow it whole. */
export function ShadowClipView({ clip, canComplete, onBack }: { clip: ListenClip; canComplete: boolean; onBack: () => void }) {
  const { user, data, put, remove, grantScore } = useApp();
  const main = useRef<PlayerApi>(null);
  const card = useRef<PlayerApi>(null);
  const [slow, setSlow] = useState<Record<number, boolean>>({});
  const [loops, setLoops] = useState<Record<number, boolean>>({});
  const pk = `shadowplays:${user?.id}:${clip.id}`;
  const [plays, setPlays] = useState<Record<number, number>>(() => { try { return JSON.parse(localStorage.getItem(pk) || '{}'); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(pk, JSON.stringify(plays)); } catch {} }, [plays]);
  const [word, setWord] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  if (!user) return null;
  const key = (i: number) => `shadowline:${clip.id}:${i}`;
  const mastered = (i: number) => data.attempts.find((a) => a.studentId === user.id && a.questionId === key(i));
  const opened = (i: number) => data.attempts.find((a) => a.studentId === user.id && a.questionId === `shadowopen:${clip.id}:${i}`);
  const doneCount = clip.lines.filter((_, i) => mastered(i)).length;
  const all = clip.lines.length > 0 && doneCount === clip.lines.length;
  const taskId = `shadow-${clip.id}`;
  const comp = data.taskCompletions.find((c) => c.studentId === user.id && c.taskId === taskId);
  const st = comp ? (comp.status || 'approved') : '';
  const range = (i: number): [number, number] => [Math.max(clip.start, clip.lines[i].t - 0.15), lineEnd(clip, i)];

  function playCard(i: number) {
    main.current?.pause();
    setPlays((p) => ({ ...p, [i]: (p[i] || 0) + 1 }));
    if (active !== i) { setActive(i); return; } // the player mounts, then starts by itself (onReady)
    const [a, b] = range(i); card.current?.playRange(a, b, slow[i] ? 0.6 : 1, !!loops[i]);
  }
  function startActive() { if (active === null) return; const [a, b] = range(active); card.current?.playRange(a, b, slow[active] ? 0.6 : 1, !!loops[active]); }
  useEffect(() => { startActive(); }, [slow[active ?? -1], loops[active ?? -1]]);
  function playAll() { card.current?.pause(); setActive(null); main.current?.playRange(clip.start, clip.end, 1, false); }
  async function reveal(i: number) {
    if (opened(i)) return;
    await put('attempts', { id: uid(), studentId: user!.id, sessionId: 'shadow', questionId: `shadowopen:${clip.id}:${i}`, answer: 'open', autoScore: 0, maxScore: 0, status: 'approved', createdAt: today() });
  }
  async function master(i: number) {
    if (mastered(i)) return;
    await put('attempts', { id: uid(), studentId: user!.id, sessionId: 'shadow', questionId: key(i), answer: 'mastered', autoScore: 0, maxScore: 0, status: 'approved', createdAt: today() });
    const pts = scoreRule(data.settings.scoreRules, 'shadowLine');
    if (pts > 0) await grantScore(user!.id, 'shadow', pts, `shadow-line-${clip.id}-${i}-${user!.id}`);
  }
  async function unmaster(i: number) { const a = mastered(i); if (a) await remove('attempts', a.id); }
  async function complete() {
    if (!canComplete || comp) return;
    await put('taskCompletions', { taskId, studentId: user!.id, completedAt: new Date().toISOString().slice(0, 10), status: 'pending' });
    const pts = scoreRule(data.settings.scoreRules, 'shadowDone');
    if (pts > 0) await grantScore(user!.id, 'shadow', pts, `shadow-done-${clip.id}-${user!.id}`);
  }

  return <div className="stack">
    <div className="row"><Button variant="ghost" size="sm" onClick={onBack}>→ كل الكليبات</Button></div>
    <h2 style={{ margin: 0 }}>{clip.title}</h2>
    {broken ? <Card><Empty title="الفيديو مش متاح دلوقتي" hint="هنصلّحه قريب." /></Card> : <>
      <Card><div className="stack" dir="rtl">
        <b>طريقة الشادوينج</b>
        <div><b>1- اسمع الفيديو كامل الأول</b>، من غير ما تتكلم. ركّز على النغمة والسرعة.</div>
        <div><b>2- اتقن كل مقطع صغير لوحده:</b>
          <div className="muted" style={{ lineHeight: 1.9 }}>• اسمع: شغّل المقطع واسمعه {MIN_PLAYS} مرات.<br />• ردّد: اسمع تاني وردّد ورا المتحدث في نفس اللحظة، وقلّد النطق والإيقاع بالظبط.<br />• سجّل: سجّل صوتك وأنت بتعمل شادوينج للمقطع، واسمع تسجيلك وقارنه بالأصل.<br />• ابعت: ابعت التسجيل على الجروب لما تحس إنك جاهز، والمدرب بيتابع ويصحح.</div></div>
        <div><b>3- بعد ما تتقنهم كلهم</b>، ارجع للمقطع الكبير واعمل معاه شادوينج كله.</div>
      </div></Card>
      <Card><div className="stack">
        <b>الفيديو الكامل</b>
        <ClipPlayer ref={main} videoId={clip.youtubeId} start={clip.start} onBroken={() => setBroken(true)} />
        <div><Button onClick={playAll}><Play size={16} /> شغّل الكليب كله</Button></div>
      </div></Card>

      <div dir="rtl"><b>المقاطع الصغيرة</b>
        <p className="muted" style={{ margin: 0 }}>اسمع كل مقطع {MIN_PLAYS} مرات، بعدها ظهّر الجملة وشرح نطقها. ردّدها لحد ما تتقنها، وبعدين دوس «اتقنتها».</p></div>
      <div className="row between"><b>الجمل ({doneCount} / {clip.lines.length})</b><Badge tone={all ? 'green' : ''}>{all ? 'اتقنت الكل' : 'كمّل'}</Badge></div>
      <div style={{ height: 8, background: '#0001', borderRadius: 8, overflow: 'hidden' }}><div style={{ width: `${clip.lines.length ? (100 * doneCount) / clip.lines.length : 0}%`, height: '100%', background: '#16a34a' }} /></div>

      <div className="grid g2">{clip.lines.map((l, i) => {
        const ok = !!mastered(i); const n = plays[i] || 0; const op = !!opened(i); const can = ok || op || n >= MIN_PLAYS; const open = ok || op;
        return <Card key={i}><div className="stack">
          <div className="row between"><b>جملة {i + 1}</b>{ok && <Badge tone="green">اتقنتها ✓</Badge>}</div>
          {active === i
            ? <ClipPlayer key={`c${i}`} ref={card} videoId={clip.youtubeId} start={range(i)[0]} onReady={startActive} onBroken={() => setBroken(true)} />
            : <div onClick={() => playCard(i)} style={{ aspectRatio: '16/9', background: '#111', borderRadius: 12, display: 'grid', placeItems: 'center', color: '#fff', cursor: 'pointer' }}><Play size={36} /></div>}
          <div className="row" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
            <Button size="sm" onClick={() => playCard(i)}><Play size={14} /> اسمع</Button>
            <Button size="sm" variant={slow[i] ? 'primary' : 'ghost'} onClick={() => setSlow({ ...slow, [i]: !slow[i] })}><Snail size={14} /> {slow[i] ? 'بطيء ✓' : 'بطيء'}</Button>
            <Button size="sm" variant={loops[i] ? 'primary' : 'ghost'} onClick={() => setLoops({ ...loops, [i]: !loops[i] })}><Repeat size={14} /> {loops[i] ? 'تكرار ✓' : 'كرّر'}</Button>
            {!open && <><span className="muted">سمعتها {n} / {MIN_PLAYS}</span>
              <Button size="sm" variant="ghost" disabled={!can} onClick={() => reveal(i)}>{can ? 'أظهر الجملة' : `${MIN_PLAYS - n} كمان`}</Button></>}
          </div>
          {open && <div className="stack">
            <div dir="ltr" style={{ textAlign: 'left', fontSize: '1.05rem' }}>{l.text.split(/(\s+)/).map((tok, k) => {
              const w = tok.replace(/[^A-Za-z']/g, '').replace(/^'+|'+$/g, '');
              return /^\s+$/.test(tok) || !w ? <span key={k}>{tok}</span> : <span key={k} onClick={() => setWord(w)} style={{ textDecoration: 'underline dotted', textUnderlineOffset: 3, cursor: 'pointer' }}>{tok}</span>;
            })}</div>
            {l.say && <div dir="ltr" style={{ textAlign: 'left', color: '#92400e' }}><b>How it's said:</b> {l.say}</div>}
            {l.note && <div dir="rtl" className="muted" style={{ textAlign: 'right' }}>{l.note}</div>}
            {!ok ? <Button size="sm" onClick={() => master(i)}>اتقنتها ✓</Button> : <Button size="sm" variant="ghost" onClick={() => unmaster(i)}>ارجع للتدريب</Button>}
          </div>}
        </div></Card>;
      })}</div>
      {word && <WordCard word={word} onClose={() => setWord(null)} />}
      <Card>
        <div className="stack" dir="rtl">
          <b>3- شادو الفيديو الكامل مرة واحدة</b>
          {!all ? <p className="muted" style={{ margin: 0 }}>اتقن كل الجمل الأول ({doneCount} / {clip.lines.length}).</p> : <div className="row" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
            <Button onClick={playAll}><Play size={16} /> شغّل وشادو</Button>
            {canComplete && !comp && <Button onClick={complete}>عملتها ✓</Button>}
            {st === 'pending' && <Badge tone="amber">بانتظار المدرّس</Badge>}
            {st === 'approved' && <Badge tone="green">معتمد</Badge>}
            {st === 'rejected' && <Badge tone="red">اتردّ — جرّب تاني</Badge>}
          </div>}
        </div>
      </Card>
    </>}
  </div>;
}

type Draft = { id: string; url: string; title: string; start: string; end: string; levelId: string; active: boolean; lines: string };
const blank: Draft = { id: '', url: '', title: '', start: '0', end: '90', levelId: '', active: false, lines: '' };

export function ListenAdminPage() {
  const { data, put, remove } = useApp();
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState('');
  const [now, setNow] = useState(0);
  const [broken, setBroken] = useState(false);
  const api = useRef<PlayerApi>(null);
  const clips = [...(data.listenClips || [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const ytId = parseYoutubeId(d.url);
  const start = Number(d.start), end = Number(d.end);
  const parsed = parseLines(d.lines);
  useEffect(() => setBroken(false), [ytId]);

  async function save() {
    if (!ytId) return setErr('لينك اليوتيوب مش صحيح');
    if (!(end > start)) return setErr('النهاية لازم تبقى بعد البداية');
    if (!d.title.trim() || !parsed.length) return setErr('اكتب اسم الكليب وجملة واحدة على الأقل');
    setErr('');
    const old = clips.find((c) => c.id === d.id);
    const rec: ListenClip = { id: d.id || `lc-${uid()}`, youtubeId: ytId, start, end, title: d.title.trim(), lines: parsed, levelId: d.levelId, active: d.active, createdAt: old?.createdAt || new Date().toISOString() };
    await put('listenClips', rec);
    setD(blank);
  }
  const edit = (c: ListenClip) => { setD({ id: c.id, url: c.youtubeId, title: c.title, start: String(c.start), end: String(c.end), levelId: c.levelId, active: c.active, lines: linesToText(c.lines) }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const preview = { lines: parsed, end };

  return <div className="stack">
    <div><h1><Headphones size={22} /> مقاطع الاستماع</h1>
      <p className="muted">كل كليب فيه جمل، وكل جملة سطر: الوقت بالثواني أو دقيقة:ثانية ثم النص، وبعده اختياريًا ‘| إزاي تتقال | شرح بالعربي’. مثال: <span dir="ltr">1:23.5 Hello, my name is Bruce. | HEL-lo, my NAME-is BRUCE | name is بتتوصل</span></p></div>
    <Card>
      <SectionTitle title={d.id ? 'تعديل كليب' : 'كليب جديد'} />
      <div className="stack">
        <Field label="لينك اليوتيوب"><input dir="ltr" value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></Field>
        <div className="grid g3">
          <Field label="اسم الكليب"><input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
          <Field label="بداية (ثانية)"><input dir="ltr" type="number" step="0.5" value={d.start} onChange={(e) => setD({ ...d, start: e.target.value })} /></Field>
          <Field label="نهاية (ثانية)"><input dir="ltr" type="number" step="0.5" value={d.end} onChange={(e) => setD({ ...d, end: e.target.value })} /></Field>
        </div>
        <Field label="المستوى"><select value={d.levelId} onChange={(e) => setD({ ...d, levelId: e.target.value })}><option value="">كل المستويات</option>{data.levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
        {ytId && <>
          {broken && <p style={{ color: '#b91c1c' }}>⚠️ الفيديو ده مش بيشتغل جوه الموقع (التضمين مقفول أو الفيديو اتحذف).</p>}
          <ClipPlayer lock={false} ref={api} videoId={ytId} start={start} onTime={setNow} onBroken={() => setBroken(true)} />
          <div className="row" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
            <Badge>الوقت: {fmt(now)}</Badge>
            <Button size="sm" variant="ghost" onClick={() => api.current?.playRange(start, end)}>شغّل الكليب</Button>
            <Button size="sm" variant="ghost" onClick={() => setD({ ...d, lines: (d.lines ? d.lines + '\n' : '') + fmt(now) + ' ' })}>+ سطر بالوقت الحالي</Button>
          </div>
        </>}
        <Field label="الجمل (سطر لكل جملة)"><textarea dir="ltr" rows={14} value={d.lines} onChange={(e) => setD({ ...d, lines: e.target.value })} /></Field>
        {ytId && parsed.length > 0 && <Lines clip={preview} now={now} onLine={(i) => api.current?.playRange(parsed[i].t - 0.15, i + 1 < parsed.length ? parsed[i + 1].t : end)} />}
        <label className="row" style={{ gap: '.4rem' }}><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> ظاهر للطلبة</label>
        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}
        <div className="row" style={{ gap: '.5rem' }}><Button onClick={save}>{d.id ? 'احفظ التعديل' : 'ضيف الكليب'}</Button>{d.id && <Button variant="ghost" onClick={() => setD(blank)}>إلغاء</Button>}</div>
      </div>
    </Card>
    <Card>
      <SectionTitle title={`الكليبات (${clips.length})`} />
      {!clips.length ? <Empty title="لسه مفيش كليبات" text="ضيف أول كليب من الفورم." /> :
        <div className="stack">{clips.map((c, i) => <div key={c.id} className="row between" style={{ gap: '.5rem' }}>
          <span style={{ flex: 1 }}>{i + 1}. {c.title} <span className="muted">({Math.round(c.end - c.start)}ث · {c.lines.length} جملة)</span></span>
          <Badge tone={c.active ? 'green' : ''}>{c.active ? 'ظاهر' : 'مخفي'}</Badge>
          <Button size="sm" variant="ghost" onClick={() => put('listenClips', { ...c, active: !c.active })}>{c.active ? 'إخفاء' : 'إظهار'}</Button>
          <Button size="sm" variant="ghost" onClick={() => edit(c)}>تعديل</Button>
          <Button size="sm" variant="ghost" onClick={() => { if (confirm('تمسح الكليب؟')) remove('listenClips', c.id); }}>مسح</Button>
        </div>)}</div>}
    </Card>
  </div>;
}

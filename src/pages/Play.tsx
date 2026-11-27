import { PageTour } from '../components/Tour';
import React, { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, Empty, Tabs, SectionTitle } from '../components/UI';
import { waGroupShare } from '../lib/subscription';
import type { AppData } from '../types';
import { Gamepad2, Target, BookOpen, Puzzle, CaseSensitive, Lightbulb, RefreshCw } from 'lucide-react';
import { tr, uiDir } from '../lib/i18n';

type W = AppData['dictionary'][number];
const hasAr = (x: string) => /[؀-ۿ]/.test(x);
const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/** Words of a level, one per spelling, single words only. */
function levelWords(data: AppData, levelId: string): W[] {
  const ids = new Set(data.sessions.filter((s) => s.levelId === levelId).map((s) => s.id));
  const seen = new Set<string>();
  return data.dictionary.filter((w) => {
    const k = w.word.toLowerCase();
    if (seen.has(k) || !/^[A-Za-z][A-Za-z'-]+$/.test(w.word)) return false;
    if (!(w.sessionIds || []).some((id) => ids.has(id))) return false;
    seen.add(k); return true;
  });
}

/** A clear English clue: the shortest definition that does not give the word away. */
function clueOf(w: W): string {
  const base = w.word.toLowerCase().slice(0, Math.max(3, w.word.length - 2));
  const defs = (w.definitions || []).filter((d) => d && !hasAr(d) && !d.toLowerCase().includes(base) && d.length >= 12 && d.length <= 140);
  return defs.sort((a, b) => a.length - b.length)[0] || '';
}
const blankExample = (w: W) => {
  const ex = (w.examples || []).find((e) => !hasAr(e) && e.length <= 110 && new RegExp(`\\b${w.word.replace(/[^A-Za-z]/g, '')}`, 'i').test(e));
  return ex ? ex.replace(new RegExp(`\\b${w.word.replace(/[^A-Za-z]/g, '')}\\w*`, 'ig'), '_____') : '';
};

type Round = { word: W; clue: string; blank: string; options: string[] };
function makeRounds(words: W[], n = 10): Round[] {
  const playable = words.filter((w) => clueOf(w));
  const pick = shuffle(playable).slice(0, n);
  return pick.map((w) => {
    const sameType = shuffle(words.filter((x) => x.word !== w.word && x.type === w.type));
    const others = shuffle(words.filter((x) => x.word !== w.word && x.type !== w.type));
    const distract = [...sameType, ...others].slice(0, 3).map((x) => x.word);
    return { word: w, clue: clueOf(w), blank: blankExample(w), options: shuffle([w.word, ...distract]) };
  });
}

function GuessWord({ words }: { words: W[] }) {
  const [rounds, setRounds] = useState<Round[]>(() => makeRounds(words));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState('');
  const [score, setScore] = useState(0);
  const [hint, setHint] = useState(false);
  if (rounds.length < 4) return <Empty icon="🎲" title={tr('الكلمات في المستوى ده لسه مش كفاية للعبة')} hint={tr('جرّب مستوى تاني أو ارجع بعد ما نضيف كلمات.')} />;
  const finished = i >= rounds.length;
  const restart = () => { setRounds(makeRounds(words)); setI(0); setPicked(''); setScore(0); setHint(false); };
  if (finished) return <Card className="stack" style={{ textAlign: 'center' }}>
    <h2>{tr('خلصت الجولة 🎉')}</h2>
    <div className="result-good" dir="ltr"><strong>{score} / {rounds.length}</strong></div>
    <p className="muted">{score >= rounds.length * 0.8 ? tr('ممتاز! كلماتك قوية.') : tr('كويس — العب تاني وركّز في الكلمات اللي غلطت فيها.')}</p>
    <div className="row" style={{ justifyContent: 'center' }}><Button onClick={restart}>{tr('العب تاني')}</Button></div>
  </Card>;
  const r = rounds[i];
  const answered = !!picked;
  const choose = (o: string) => { if (answered) return; setPicked(o); if (o === r.word.word) setScore((s) => s + 1); };
  const next = () => { setI((x) => x + 1); setPicked(''); setHint(false); };
  return <Card className="stack ltr-scope">
    <div className="between" dir={uiDir()}><Badge tone="blue">{tr('سؤال')} {i + 1} / {rounds.length}</Badge><Badge tone="green">{tr('النتيجة')} {score}</Badge></div>
    <div className="section-card" dir="ltr">
      <div className="muted" style={{ fontSize: '.8rem' }}>Which word matches this definition?</div>
      <h3 className="en" style={{ margin: '.4rem 0', lineHeight: 1.6 }}>{r.clue}</h3>
      {r.blank && <p className="en muted" style={{ margin: '.3rem 0' }}>“{r.blank}”</p>}
    </div>
    {!answered && !hint && <div className="row" dir={uiDir()}><Button size="sm" variant="ghost" onClick={() => setHint(true)}><Lightbulb size={14} /> {tr('تلميح بالعربي')}</Button></div>}
    {(hint || answered) && <div className="note" dir={uiDir()}>{tr('المعنى بالعربي:')} {r.word.arabic || r.word.meaning}</div>}
    <div className="play-opts" dir="ltr">
      {r.options.map((o) => <button key={o} type="button" className={`play-opt en ${answered ? (o === r.word.word ? 'ok' : o === picked ? 'bad' : '') : ''}`} onClick={() => choose(o)}>{o}</button>)}
    </div>
    {answered && <div className="row between" dir={uiDir()}>
      <span className={picked === r.word.word ? 'result-good' : 'result-bad'} style={{ padding: '.3rem .7rem' }}>{picked === r.word.word ? tr('✓ صح!') : tr('✗ الإجابة الصح: {0}', [r.word.word])}</span>
      <Button onClick={next}>{i + 1 >= rounds.length ? tr('شوف النتيجة') : tr('السؤال الجاي')}</Button>
    </div>}
  </Card>;
}

const forms = (w: string) => {
  const b = w.toLowerCase().replace(/[^a-z]/g, '');
  const stems = new Set([b, b.replace(/e$/, ''), b.replace(/y$/, 'i')]);
  return [...stems].map((x) => x).filter((x) => x.length >= 2);
};
const usesWord = (story: string, w: string) => forms(w).some((f) => new RegExp(`\\b${f}(s|es|ed|d|ing|ies|ly|er)?\\b`, 'i').test(story));

function ThreeWords({ words, levelTitle }: { words: W[]; levelTitle: string }) {
  const draw = () => shuffle(words).slice(0, 3);
  const [three, setThree] = useState<W[]>(draw);
  const [story, setStory] = useState('');
  const [checked, setChecked] = useState(false);
  if (words.length < 3) return <Empty icon="📖" title={tr('الكلمات في المستوى ده لسه مش كفاية')} hint={tr('جرّب مستوى تاني.')} />;
  const count = story.trim() ? story.trim().split(/\s+/).length : 0;
  const used = three.map((w) => usesWord(story, w.word));
  const allUsed = used.every(Boolean);
  const long = count >= 20;
  return <Card className="stack">
    <div className="between"><div><h3 style={{ margin: 0 }}>3 Words 1 Story</h3><small className="muted">{tr('اكتب قصة قصيرة بالإنجليزي فيها الـ 3 كلمات دي.')}</small></div>
      <Button size="sm" variant="ghost" onClick={() => { setThree(draw()); setStory(''); setChecked(false); }}><RefreshCw size={14} /> {tr('كلمات جديدة')}</Button></div>
    <div className="play-words" dir="ltr">
      {three.map((w, k) => <span key={w.word} className={`play-word en ${checked && used[k] ? 'used' : ''}`}>{w.word}{checked && (used[k] ? ' ✓' : ' ✗')}</span>)}
    </div>
    <div className="muted" dir="rtl" style={{ textAlign: 'center', fontSize: '.85rem' }}>{three.map((w) => `${w.word} = ${w.arabic || w.meaning}`).join(' · ')}</div>
    <textarea dir="ltr" className="en" rows={7} value={story} onChange={(e) => { setStory(e.target.value); setChecked(false); }} placeholder="Once upon a time..." />
    <div className="between" dir={uiDir()}><small className="muted">{count} {tr('كلمة (المطلوب 20 على الأقل)')}</small>
      <div className="row"><Button onClick={() => setChecked(true)} disabled={!story.trim()}>{tr('تحقق')}</Button>
        <a className={`btn btn-ghost btn-sm ${allUsed && long ? '' : 'disabled'}`} href={allUsed && long ? waGroupShare(tr('قصة Speakozy — {0}\nالكلمات: {1}\n\n{2}', [levelTitle, three.map((w) => w.word).join(', '), story.trim()])) : undefined} target="_blank" rel="noreferrer" aria-disabled={!(allUsed && long)}>{tr('ابعت القصة للمدرّس')}</a></div></div>
    {checked && <div className={allUsed && long ? 'result-good' : 'note'} dir={uiDir()}>
      {allUsed && long ? tr('ممتاز! استخدمت الكلمات التلاتة وقصتك كاملة. ابعتها للمدرّس لو عايز رأيه.')
        : !allUsed ? tr('لسه ناقص: {0}', [three.filter((_, k) => !used[k]).map((w) => w.word).join('، ')]) : tr('القصة قصيرة — كمّلها لحد 20 كلمة على الأقل.')}
    </div>}
  </Card>;
}

const arOf = (w: W) => (w.arabic || w.meaning || '').split(/[،,;/]/)[0].replace(/\(.*?\)/g, '').trim();
const playableAr = (words: W[]) => words.filter((w) => { const a = arOf(w); return hasAr(a) && a.length <= 18; });

/** Match each English word with its Arabic meaning. */
function MatchGame({ words }: { words: W[] }) {
  const deal = () => shuffle(playableAr(words)).slice(0, 6);
  const [pairs, setPairs] = useState<W[]>(deal);
  const [arOrder, setArOrder] = useState<string[]>(() => shuffle(pairs.map((w) => w.word)));
  const [left, setLeft] = useState('');
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState('');
  const [tries, setTries] = useState(0);
  if (playableAr(words).length < 6) return <Empty icon="🧩" title={tr('الكلمات في المستوى ده لسه مش كفاية للعبة')} hint={tr('جرّب مستوى تاني.')} />;
  const restart = () => { const p = deal(); setPairs(p); setArOrder(shuffle(p.map((w) => w.word))); setLeft(''); setDone([]); setWrong(''); setTries(0); };
  const pickRight = (word: string) => {
    if (!left || done.includes(word)) return;
    setTries((n) => n + 1);
    if (left === word) { setDone((d) => [...d, word]); setLeft(''); setWrong(''); }
    else { setWrong(word); setTimeout(() => setWrong(''), 600); }
  };
  const finished = done.length === pairs.length;
  return <Card className="stack">
    <div className="between"><div><h3 style={{ margin: 0 }}>{tr('وصّل الكلمة بمعناها')}</h3><small className="muted">{tr('اضغط كلمة إنجليزي وبعدين معناها بالعربي.')}</small></div>
      <Badge tone="green">{done.length} / {pairs.length}</Badge></div>
    <div className="grid g2">
      <div className="stack" dir="ltr">{pairs.map((w) => <button key={w.word} type="button" disabled={done.includes(w.word)} className={`play-opt en ${done.includes(w.word) ? 'ok' : left === w.word ? 'bad' : ''}`} style={left === w.word ? { outline: '2px solid var(--green, #22c55e)' } : undefined} onClick={() => setLeft(w.word)}>{w.word}</button>)}</div>
      <div className="stack" dir="rtl">{arOrder.map((word) => { const w = pairs.find((x) => x.word === word)!; return <button key={word} type="button" disabled={done.includes(word)} className={`play-opt ${done.includes(word) ? 'ok' : wrong === word ? 'bad' : ''}`} onClick={() => pickRight(word)}>{arOf(w)}</button>; })}</div>
    </div>
    {finished && <div className="result-good" dir={uiDir()}>{tr('ممتاز! وصّلت الكل في')} {tries} {tr('محاولة')} {tries === pairs.length ? tr('— من غير غلطة 🎉') : ''}</div>}
    <div className="row"><Button variant={finished ? 'primary' : 'ghost'} onClick={restart}>{finished ? tr('العب تاني') : tr('كلمات جديدة')}</Button></div>
  </Card>;
}

/** Build the word from its shuffled letters, with the Arabic meaning as the clue. */
function ScrambleGame({ words }: { words: W[] }) {
  const deal = () => shuffle(playableAr(words).filter((w) => w.word.length >= 4 && w.word.length <= 9)).slice(0, 8);
  const mix = (w: string) => { let s = shuffle(w.split('')); for (let k = 0; k < 5 && s.join('') === w; k++) s = shuffle(w.split('')); return s; };
  const [rounds, setRounds] = useState<W[]>(deal);
  const [i, setI] = useState(0);
  const [letters, setLetters] = useState<string[]>(() => rounds[0] ? mix(rounds[0].word) : []);
  const [used, setUsed] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'' | 'ok' | 'bad'>('');
  if (rounds.length < 4) return <Empty icon="🔤" title={tr('الكلمات في المستوى ده لسه مش كفاية للعبة')} hint={tr('جرّب مستوى تاني.')} />;
  const w = rounds[i];
  const answer = used.map((k) => letters[k]).join('');
  const start = (n: number, list = rounds) => { setI(n); setLetters(list[n] ? mix(list[n].word) : []); setUsed([]); setResult(''); };
  const check = () => { const ok = answer.toLowerCase() === w.word.toLowerCase(); setResult(ok ? 'ok' : 'bad'); if (ok) setScore((s) => s + 1); };
  const restart = () => { const r = deal(); setRounds(r); setScore(0); start(0, r); };
  if (i >= rounds.length) return <Card className="stack" style={{ textAlign: 'center' }}>
    <h2>{tr('خلصت الجولة 🎉')}</h2><div className="result-good" dir="ltr"><strong>{score} / {rounds.length}</strong></div>
    <div className="row" style={{ justifyContent: 'center' }}><Button onClick={restart}>{tr('العب تاني')}</Button></div>
  </Card>;
  return <Card className="stack">
    <div className="between"><Badge tone="blue">{tr('كلمة')} {i + 1} / {rounds.length}</Badge><Badge tone="green">{tr('النتيجة')} {score}</Badge></div>
    <div className="section-card" dir={uiDir()} style={{ textAlign: 'center' }}><div className="muted" style={{ fontSize: '.8rem' }}>{tr('رتّب الحروف علشان تكوّن الكلمة اللي معناها:')}</div><h2 style={{ margin: '.3rem 0' }}>{arOf(w)}</h2></div>
    <div dir="ltr" className="row" style={{ justifyContent: 'center', minHeight: '3rem', gap: '.4rem' }}>
      {used.length ? used.map((k, n) => <span key={n} className="play-word en">{letters[k]}</span>) : <span className="muted">{tr('اضغط على الحروف بالترتيب…')}</span>}
    </div>
    <div dir="ltr" className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: '.4rem' }}>
      {letters.map((c, k) => <button key={k} type="button" className="play-opt en" style={{ minWidth: '2.6rem' }} disabled={used.includes(k) || !!result} onClick={() => setUsed((u) => [...u, k])}>{c}</button>)}
    </div>
    {result === 'ok' && <div className="result-good" dir={uiDir()}>{tr('✓ صح!')}</div>}
    {result === 'bad' && <div className="result-bad" dir={uiDir()} style={{ padding: '.4rem .7rem' }}>{tr('✗ الإجابة الصح:')} <span dir="ltr" className="en">{w.word}</span></div>}
    <div className="row between" dir={uiDir()}>
      <div className="row"><Button size="sm" variant="ghost" onClick={() => setUsed([])} disabled={!!result || !used.length}>{tr('مسح')}</Button><Button size="sm" variant="ghost" onClick={() => setUsed((u) => u.slice(0, -1))} disabled={!!result || !used.length}>⌫</Button></div>
      {result ? <Button onClick={() => start(i + 1)}>{i + 1 >= rounds.length ? tr('شوف النتيجة') : tr('الكلمة الجاية')}</Button> : <Button onClick={check} disabled={used.length !== letters.length}>{tr('تحقق')}</Button>}
    </div>
  </Card>;
}

export default function PlayPage() {
  const { user, data } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  const [level, setLevel] = useState(user?.levelId || levels[0]?.id);
  const [game, setGame] = useState<'guess' | 'story' | 'match' | 'scramble'>('guess');
  const words = useMemo(() => levelWords(data, level), [data.dictionary, data.sessions, level]);
  if (!user) return null;
  const lv = levels.find((l) => l.id === level);
  return <div className="stack">
    <PageTour id="play" />
    <div><h1><Gamepad2 size={22} /> {tr('العب واتعلم')}</h1><p className="muted">{tr('العب واتعلم كلمات مستواك — اختار اللعبة والمستوى وابدأ.')}</p></div>
    <Tabs tabs={[{ id: 'guess', label: <span className="tab-ic"><Target size={15} /> {tr('خمّن الكلمة')}</span> }, { id: 'story', label: <span className="tab-ic"><BookOpen size={15} /> 3 Words 1 Story</span> }, { id: 'match', label: <span className="tab-ic"><Puzzle size={15} /> {tr('وصّل الكلمة')}</span> }, { id: 'scramble', label: <span className="tab-ic"><CaseSensitive size={15} /> {tr('رتّب الحروف')}</span> }]} active={game} onChange={(g) => setGame(g as any)} />
    <Card>
      <SectionTitle title={tr('اختار مستواك')} action={<Badge tone="blue">{words.length} {tr('كلمة')}</Badge>} />
      <Tabs tabs={levels.map((l) => ({ id: l.id, label: l.title }))} active={level} onChange={setLevel} />
    </Card>
    {game === 'guess' ? <GuessWord key={`g-${level}`} words={words} /> : game === 'story' ? <ThreeWords key={`s-${level}`} words={words} levelTitle={lv?.title || ''} /> : game === 'match' ? <MatchGame key={`m-${level}`} words={words} /> : <ScrambleGame key={`x-${level}`} words={words} />}
  </div>;
}

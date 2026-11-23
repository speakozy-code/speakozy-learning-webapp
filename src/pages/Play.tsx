import React, { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, Empty, Tabs, SectionTitle } from '../components/UI';
import { waGroupShare } from '../lib/subscription';
import type { AppData } from '../types';

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
  if (rounds.length < 4) return <Empty icon="🎲" title="الكلمات في المستوى ده لسه مش كفاية للعبة" hint="جرّب مستوى تاني أو ارجع بعد ما نضيف كلمات." />;
  const finished = i >= rounds.length;
  const restart = () => { setRounds(makeRounds(words)); setI(0); setPicked(''); setScore(0); setHint(false); };
  if (finished) return <Card className="stack" style={{ textAlign: 'center' }}>
    <h2>خلصت الجولة 🎉</h2>
    <div className="result-good" dir="ltr"><strong>{score} / {rounds.length}</strong></div>
    <p className="muted">{score >= rounds.length * 0.8 ? 'ممتاز! كلماتك قوية.' : 'كويس — العب تاني وركّز في الكلمات اللي غلطت فيها.'}</p>
    <div className="row" style={{ justifyContent: 'center' }}><Button onClick={restart}>العب تاني</Button></div>
  </Card>;
  const r = rounds[i];
  const answered = !!picked;
  const choose = (o: string) => { if (answered) return; setPicked(o); if (o === r.word.word) setScore((s) => s + 1); };
  const next = () => { setI((x) => x + 1); setPicked(''); setHint(false); };
  return <Card className="stack ltr-scope">
    <div className="between" dir="rtl"><Badge tone="blue">سؤال {i + 1} / {rounds.length}</Badge><Badge tone="green">النتيجة {score}</Badge></div>
    <div className="section-card" dir="ltr">
      <div className="muted" style={{ fontSize: '.8rem' }}>Which word matches this definition?</div>
      <h3 className="en" style={{ margin: '.4rem 0', lineHeight: 1.6 }}>{r.clue}</h3>
      {r.blank && <p className="en muted" style={{ margin: '.3rem 0' }}>“{r.blank}”</p>}
    </div>
    {!answered && !hint && <div className="row" dir="rtl"><Button size="sm" variant="ghost" onClick={() => setHint(true)}>💡 تلميح بالعربي</Button></div>}
    {(hint || answered) && <div className="note" dir="rtl">المعنى بالعربي: {r.word.arabic || r.word.meaning}</div>}
    <div className="play-opts" dir="ltr">
      {r.options.map((o) => <button key={o} type="button" className={`play-opt en ${answered ? (o === r.word.word ? 'ok' : o === picked ? 'bad' : '') : ''}`} onClick={() => choose(o)}>{o}</button>)}
    </div>
    {answered && <div className="row between" dir="rtl">
      <span className={picked === r.word.word ? 'result-good' : 'result-bad'} style={{ padding: '.3rem .7rem' }}>{picked === r.word.word ? '✓ صح!' : `✗ الإجابة الصح: ${r.word.word}`}</span>
      <Button onClick={next}>{i + 1 >= rounds.length ? 'شوف النتيجة' : 'السؤال الجاي'}</Button>
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
  if (words.length < 3) return <Empty icon="📖" title="الكلمات في المستوى ده لسه مش كفاية" hint="جرّب مستوى تاني." />;
  const count = story.trim() ? story.trim().split(/\s+/).length : 0;
  const used = three.map((w) => usesWord(story, w.word));
  const allUsed = used.every(Boolean);
  const long = count >= 20;
  return <Card className="stack">
    <div className="between"><div><h3 style={{ margin: 0 }}>3 Words 1 Story</h3><small className="muted">اكتب قصة قصيرة بالإنجليزي فيها الـ 3 كلمات دي.</small></div>
      <Button size="sm" variant="ghost" onClick={() => { setThree(draw()); setStory(''); setChecked(false); }}>🔄 كلمات جديدة</Button></div>
    <div className="play-words" dir="ltr">
      {three.map((w, k) => <span key={w.word} className={`play-word en ${checked && used[k] ? 'used' : ''}`}>{w.word}{checked && (used[k] ? ' ✓' : ' ✗')}</span>)}
    </div>
    <div className="muted" dir="rtl" style={{ textAlign: 'center', fontSize: '.85rem' }}>{three.map((w) => `${w.word} = ${w.arabic || w.meaning}`).join(' · ')}</div>
    <textarea dir="ltr" className="en" rows={7} value={story} onChange={(e) => { setStory(e.target.value); setChecked(false); }} placeholder="Once upon a time..." />
    <div className="between" dir="rtl"><small className="muted">{count} كلمة (المطلوب 20 على الأقل)</small>
      <div className="row"><Button onClick={() => setChecked(true)} disabled={!story.trim()}>تحقق</Button>
        <a className={`btn btn-ghost btn-sm ${allUsed && long ? '' : 'disabled'}`} href={allUsed && long ? waGroupShare(`قصة Speakozy — ${levelTitle}\nالكلمات: ${three.map((w) => w.word).join(', ')}\n\n${story.trim()}`) : undefined} target="_blank" rel="noreferrer" aria-disabled={!(allUsed && long)}>ابعت القصة للمدرّس</a></div></div>
    {checked && <div className={allUsed && long ? 'result-good' : 'note'} dir="rtl">
      {allUsed && long ? 'ممتاز! استخدمت الكلمات التلاتة وقصتك كاملة. ابعتها للمدرّس لو عايز رأيه.'
        : !allUsed ? `لسه ناقص: ${three.filter((_, k) => !used[k]).map((w) => w.word).join('، ')}` : 'القصة قصيرة — كمّلها لحد 20 كلمة على الأقل.'}
    </div>}
  </Card>;
}

export default function PlayPage() {
  const { user, data } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  const [level, setLevel] = useState(user?.levelId || levels[0]?.id);
  const [game, setGame] = useState<'guess' | 'story'>('guess');
  const words = useMemo(() => levelWords(data, level), [data.dictionary, data.sessions, level]);
  if (!user) return null;
  const lv = levels.find((l) => l.id === level);
  return <div className="stack">
    <div><h1>🎮 العب واتعلم</h1><p className="muted">العب واتعلم كلمات مستواك — اختار اللعبة والمستوى وابدأ.</p></div>
    <Tabs tabs={[{ id: 'guess', label: '🎯 خمّن الكلمة' }, { id: 'story', label: '📖 3 Words 1 Story' }]} active={game} onChange={(g) => setGame(g as 'guess' | 'story')} />
    <Card>
      <SectionTitle title="اختار مستواك" action={<Badge tone="blue">{words.length} كلمة</Badge>} />
      <Tabs tabs={levels.map((l) => ({ id: l.id, label: l.title }))} active={level} onChange={setLevel} />
    </Card>
    {game === 'guess' ? <GuessWord key={`g-${level}`} words={words} /> : <ThreeWords key={`s-${level}`} words={words} levelTitle={lv?.title || ''} />}
  </div>;
}

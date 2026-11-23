import React, { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { Card, Button, Badge, SectionTitle, Empty, Tabs, Field, Modal } from '../components/UI';
import { uid } from '../lib/domain';
import { getBank } from '../lib/questionBank';
import { grammarFor, builtInGrammar, hasGrammarOverride } from '../lib/grammar/index';
import type { GrammarNote } from '../types';

type Scope = 'grammar' | 'word' | 'session';
const lines = (t: string) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);

/** Admin: edit everything a student sees inside one session — words, grammar and questions. */
export default function LessonEditor() {
  const { data, put, remove, log } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  const [levelId, setLevelId] = useState(levels[0]?.id);
  const sessions = data.sessions.filter((s) => s.levelId === levelId).sort((a, b) => a.order - b.order);
  const [sessionId, setSessionId] = useState('');
  const sid = sessions.some((s) => s.id === sessionId) ? sessionId : sessions[0]?.id;
  const session = data.sessions.find((s) => s.id === sid);
  const [tab, setTab] = useState('words');
  const [word, setWord] = useState<any>(null);
  const [topic, setTopic] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const words = data.dictionary.filter((w) => (w.sessionIds || []).includes(sid || ''));
  const bank = useMemo(() => (sid ? getBank(data).get(sid) : undefined), [data.levels, data.sessions, data.dictionary, data.questions, data.grammarNotes, sid]);
  const topics = sid ? grammarFor(sid) : [];
  const edited = sid ? hasGrammarOverride(sid) : false;
  const topicNotes = (data.grammarNotes || []).filter((n) => n.sessionId === sid && n.kind === 'topic').sort((a, b) => a.order - b.order);

  // ---------- words ----------
  async function saveWord() {
    if (!word?.word?.trim() || !sid) return;
    const rec = {
      id: word.id || `aw-${uid()}`, word: word.word.trim(), arabic: (word.arabic || '').trim(), meaning: (word.arabic || '').trim(),
      type: (word.type || 'noun').trim(), examples: lines(word.examplesText), definitions: lines(word.definitionsText),
      phonetic: word.phonetic || undefined, audioUrl: word.audioUrl || undefined, source: 'manual' as const,
      sessionIds: word.sessionIds?.length ? word.sessionIds : [sid], admin: true,
    };
    await put('dictionary', rec); await log('lesson-word', `${session?.title}: ${rec.word}`); setWord(null);
  }
  async function deleteWord(w: any) {
    if (!confirm(`حذف الكلمة «${w.word}» من السيشن؟`)) return;
    await put('dictionary', { ...w, hidden: true, admin: true }); await log('lesson-word-delete', `${session?.title}: ${w.word}`);
  }

  // ---------- grammar ----------
  async function startGrammarEdit() {
    if (!sid) return;
    setBusy(true);
    const base = builtInGrammar(sid);
    for (let i = 0; i < base.length; i++) {
      const t = base[i];
      await put('grammarNotes', { id: `gt-${sid}-${uid()}`, sessionId: sid, order: i + 1, kind: 'topic', title: t.title, rule: t.formula, detail: t.ar, examples: t.examples, mistakes: t.mistakes } as GrammarNote);
    }
    if (!base.length) await put('grammarNotes', { id: `gt-${sid}-${uid()}`, sessionId: sid, order: 1, kind: 'topic', title: 'New topic', rule: '', detail: '', examples: [], mistakes: [] } as GrammarNote);
    setBusy(false);
  }
  async function resetGrammar() {
    if (!confirm('ترجيع الجرامر للنسخة الأصلية؟ كل تعديلاتك على جرامر السيشن دي هتتمسح.')) return;
    for (const n of topicNotes) await remove('grammarNotes', n.id);
    await log('lesson-grammar-reset', session?.title || '');
  }
  async function saveTopic() {
    if (!topic?.title?.trim() || !sid) return;
    const mistakes = lines(topic.mistakesText).map((l) => l.split('=>').map((x) => x.trim())).filter((p) => p.length === 2 && p[0] && p[1]) as [string, string][];
    await put('grammarNotes', {
      id: topic.id || `gt-${sid}-${uid()}`, sessionId: sid, order: Number(topic.order) || topicNotes.length + 1, kind: 'topic',
      title: topic.title.trim(), rule: (topic.rule || '').trim(), detail: (topic.detail || '').trim(), examples: lines(topic.examplesText), mistakes,
    } as GrammarNote);
    await log('lesson-grammar', `${session?.title}: ${topic.title}`); setTopic(null);
  }

  // ---------- questions ----------
  const bankList = (scope: Scope) => (scope === 'grammar' ? bank?.grammar : scope === 'word' ? bank?.words : bank?.session) || [];
  function newQuestion(scope: Scope) { setQuestion({ scope, id: '', prompt: '', optionsText: '', correct: '', points: 10, orig: null }); }
  function editQuestion(scope: Scope, q: any) { setQuestion({ scope, id: q.id.startsWith('aq-') ? q.id : '', prompt: q.prompt, optionsText: q.options.join('\n'), correct: String(q.correct), points: q.points || 10, orig: q.id.startsWith('aq-') ? null : q.id }); }
  async function saveQuestion() {
    if (!question || !session) return;
    const options = lines(question.optionsText);
    if (!question.prompt.trim() || options.length < 2 || !options.includes(question.correct)) { alert('اكتب السؤال، واختيارين على الأقل، واختار إجابة صح من الاختيارات.'); return; }
    await put('questions', { id: question.id || `aq-${uid()}`, sessionId: session.id, levelId: session.levelId, scope: question.scope, type: 'mcq', prompt: question.prompt.trim(), options, correct: question.correct, points: Number(question.points) || 10, admin: true });
    if (question.orig) await put('questions', { id: `hide-${question.orig}`, sessionId: session.id, levelId: session.levelId, scope: question.scope, type: 'mcq', prompt: '', options: [], correct: '', points: 0, admin: true, hide: question.orig });
    await log('lesson-question', `${session.title}: ${question.prompt.slice(0, 40)}`); setQuestion(null);
  }
  async function deleteQuestion(scope: Scope, q: any) {
    if (!session || !confirm('حذف السؤال ده؟ هيتبدل بسؤال تاني تلقائي لو متاح.')) return;
    if (q.id.startsWith('aq-')) await remove('questions', q.id);
    else await put('questions', { id: `hide-${q.id}`, sessionId: session.id, levelId: session.levelId, scope, type: 'mcq', prompt: '', options: [], correct: '', points: 0, admin: true, hide: q.id });
    await log('lesson-question-delete', `${session.title}: ${q.prompt.slice(0, 40)}`);
  }

  const qTable = (scope: Scope, title: string, hint: string) => {
    const list = bankList(scope);
    return <Card>
      <SectionTitle title={title} action={<div className="row"><Badge tone="blue">{list.length} سؤال</Badge><Button size="sm" onClick={() => newQuestion(scope)}>+ سؤال</Button></div>} />
      <p className="muted">{hint}</p>
      {list.length ? <div className="stack">{list.map((q, i) => <div key={q.id} className="section-card ltr-scope">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <strong dir="ltr" className="en">{i + 1}. {q.prompt}</strong>
            <div className="row" dir="ltr" style={{ flexWrap: 'wrap', marginTop: '.4rem' }}>{q.options.map((o) => <span key={o} className={`badge ${o === q.correct ? 'badge-green' : ''}`}>{o}</span>)}</div>
          </div>
          <div className="row">{q.id.startsWith('aq-') && <Badge tone="green">بتاعك</Badge>}<Button size="sm" variant="ghost" onClick={() => editQuestion(scope, q)}>تعديل</Button><Button size="sm" variant="danger" onClick={() => deleteQuestion(scope, q)}>حذف</Button></div>
        </div>
      </div>)}</div> : <Empty title="مفيش أسئلة" />}
    </Card>;
  };

  return <div className="stack">
    <div><h1>تعديل محتوى السيشن</h1><p className="muted">اختار السيشن وعدّل كلماتها والجرامر والأسئلة اللي بتظهر للطلاب. التعديل بيظهر فورًا بعد الحفظ.</p></div>
    <Card><div className="grid g2">
      <Field label="المستوى"><select value={levelId} onChange={(e) => { setLevelId(e.target.value); setSessionId(''); }}>{levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
      <Field label="السيشن"><select value={sid || ''} onChange={(e) => setSessionId(e.target.value)}>{sessions.map((s) => <option key={s.id} value={s.id}>{s.order}. {s.title}</option>)}</select></Field>
    </div></Card>
    {!session ? <Empty title="المستوى ده لسه مفيهوش سيشنات" /> : <>
      <Tabs tabs={[{ id: 'words', label: `الكلمات (${words.length})` }, { id: 'grammar', label: 'الجرامر' }, { id: 'qg', label: 'أسئلة الجرامر' }, { id: 'qw', label: 'أسئلة الكلمات' }, { id: 'qs', label: 'كويز السيشن' }]} active={tab} onChange={setTab} />

      {tab === 'words' && <Card>
        <SectionTitle title={`كلمات ${session.title}`} action={<Button size="sm" onClick={() => setWord({ word: '', arabic: '', type: 'noun', examplesText: '', definitionsText: '' })}>+ كلمة</Button>} />
        {words.length ? <div className="stack">{words.map((w) => <div key={w.id} className="section-card">
          <div className="row between"><div><strong className="en" dir="ltr">{w.word}</strong> <span className="muted">— {w.arabic || w.meaning}</span>{w.type && <Badge>{w.type}</Badge>}</div>
            <div className="row"><Button size="sm" variant="ghost" onClick={() => setWord({ ...w, examplesText: (w.examples || []).join('\n'), definitionsText: (w.definitions || []).join('\n') })}>تعديل</Button><Button size="sm" variant="danger" onClick={() => deleteWord(w)}>حذف</Button></div></div>
        </div>)}</div> : <Empty title="مفيش كلمات في السيشن دي" />}
      </Card>}

      {tab === 'grammar' && <Card>
        <SectionTitle title={`جرامر ${session.title}`} action={edited ? <div className="row"><Button size="sm" onClick={() => setTopic({ title: '', rule: '', detail: '', examplesText: '', mistakesText: '', order: topicNotes.length + 1 })}>+ موضوع</Button><Button size="sm" variant="ghost" onClick={resetGrammar}>رجّع الأصلي</Button></div> : <Button size="sm" onClick={startGrammarEdit} disabled={busy}>{busy ? 'لحظة...' : '✏️ ابدأ التعديل'}</Button>} />
        {!edited && <p className="muted">دي النسخة الأصلية. اضغط «ابدأ التعديل» عشان تعدّل أو تحذف أو تضيف مواضيع.</p>}
        {topics.length ? <div className="stack">{(edited ? topicNotes : topics.map((t, i) => ({ id: String(i), order: i + 1, title: t.title, rule: t.formula, detail: t.ar, examples: t.examples, mistakes: t.mistakes }))).map((n: any) => <div key={n.id} className="section-card">
          <div className="row between"><h3 className="en" dir="ltr" style={{ margin: 0 }}>{n.order}. {n.title}</h3>
            {edited && <div className="row"><Button size="sm" variant="ghost" onClick={() => setTopic({ ...n, examplesText: (n.examples || []).join('\n'), mistakesText: (n.mistakes || []).map((m: string[]) => `${m[0]} => ${m[1]}`).join('\n') })}>تعديل</Button><Button size="sm" variant="danger" onClick={() => confirm('حذف الموضوع ده؟') && remove('grammarNotes', n.id)}>حذف</Button></div>}</div>
          {n.rule && <div className="en muted" dir="ltr" style={{ fontSize: '.88rem' }}>{n.rule}</div>}
          {n.detail && <div className="grammar-explain" dir="rtl" style={{ fontSize: '.85rem', marginTop: '.4rem', maxHeight: 160, overflow: 'auto' }}>{n.detail}</div>}
        </div>)}</div> : <Empty title="مفيش جرامر في السيشن دي" />}
      </Card>}

      {tab === 'qg' && qTable('grammar', 'أسئلة تدريب الجرامر', 'دي الأسئلة اللي بتظهر للطالب تحت شرح الجرامر. لو حذفت سؤال بيتبدل بسؤال تاني.')}
      {tab === 'qw' && qTable('word', 'أسئلة الكلمات', 'دي الأسئلة اللي بتظهر بعد قايمة الكلمات.')}
      {tab === 'qs' && qTable('session', 'كويز السيشن', 'دي أسئلة الكويز الكامل للسيشن (حوالي 20 سؤال). الأسئلة اللي بتضيفها هنا بتظهر في أول الكويز.')}
    </>}

    <Modal open={!!word} title="الكلمة" onClose={() => setWord(null)}>
      <div className="grid g2">
        <Field label="الكلمة (إنجليزي)"><input dir="ltr" value={word?.word || ''} onChange={(e) => setWord({ ...word, word: e.target.value })} /></Field>
        <Field label="النوع"><input dir="ltr" value={word?.type || ''} onChange={(e) => setWord({ ...word, type: e.target.value })} placeholder="noun / verb / adjective" /></Field>
      </div>
      <Field label="المعنى بالعربي"><input value={word?.arabic || ''} onChange={(e) => setWord({ ...word, arabic: e.target.value })} /></Field>
      <Field label="تعريف إنجليزي بسيط (اختياري — سطر لكل تعريف)"><textarea dir="ltr" value={word?.definitionsText || ''} onChange={(e) => setWord({ ...word, definitionsText: e.target.value })} /></Field>
      <Field label="أمثلة (سطر لكل مثال)"><textarea dir="ltr" value={word?.examplesText || ''} onChange={(e) => setWord({ ...word, examplesText: e.target.value })} /></Field>
      <Button onClick={saveWord}>احفظ الكلمة</Button>
    </Modal>

    <Modal open={!!topic} title="موضوع الجرامر" onClose={() => setTopic(null)}>
      <Field label="العنوان (إنجليزي)"><input dir="ltr" value={topic?.title || ''} onChange={(e) => setTopic({ ...topic, title: e.target.value })} /></Field>
      <Field label="القاعدة / الصيغة (إنجليزي)"><textarea dir="ltr" value={topic?.rule || ''} onChange={(e) => setTopic({ ...topic, rule: e.target.value })} /></Field>
      <Field label="الشرح بالعربي" hint="الأسطر اللي بتبدأ بـ 📌 هي القاعدة اللي بتظهر كسبب لما الطالب يغلط."><textarea style={{ minHeight: 160 }} value={topic?.detail || ''} onChange={(e) => setTopic({ ...topic, detail: e.target.value })} /></Field>
      <Field label="أمثلة (سطر لكل مثال)"><textarea dir="ltr" value={topic?.examplesText || ''} onChange={(e) => setTopic({ ...topic, examplesText: e.target.value })} /></Field>
      <Field label="أخطاء شائعة (سطر لكل خطأ: الغلط => الصح)"><textarea dir="ltr" value={topic?.mistakesText || ''} onChange={(e) => setTopic({ ...topic, mistakesText: e.target.value })} placeholder="She go to school. => She goes to school." /></Field>
      <Field label="الترتيب"><input type="number" value={topic?.order || 1} onChange={(e) => setTopic({ ...topic, order: Number(e.target.value) })} /></Field>
      <Button onClick={saveTopic}>احفظ الموضوع</Button>
    </Modal>

    <Modal open={!!question} title="السؤال" onClose={() => setQuestion(null)}>
      <Field label="نص السؤال"><textarea dir="ltr" value={question?.prompt || ''} onChange={(e) => setQuestion({ ...question, prompt: e.target.value })} placeholder="She ___ to school every day." /></Field>
      <Field label="الاختيارات (سطر لكل اختيار)"><textarea dir="ltr" value={question?.optionsText || ''} onChange={(e) => setQuestion({ ...question, optionsText: e.target.value })} /></Field>
      <Field label="الإجابة الصح (اكتبها زي ما هي في الاختيارات)"><input dir="ltr" value={question?.correct || ''} onChange={(e) => setQuestion({ ...question, correct: e.target.value })} /></Field>
      <Field label="النقاط"><input type="number" value={question?.points || 10} onChange={(e) => setQuestion({ ...question, points: Number(e.target.value) })} /></Field>
      <Button onClick={saveQuestion}>احفظ السؤال</Button>
    </Modal>
  </div>;
}

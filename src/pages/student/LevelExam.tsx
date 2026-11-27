import { useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge } from '../../components/UI';
import { levelFullyOpen, gradeQuestion, uid, today } from '../../lib/domain';
import { go } from '../../App';
import { priorFor, correctText } from '../../lib/review';
import { tr, uiDir } from '../../lib/i18n';

export function LevelExamPage({ levelId }: any) {
  const { user, data, put, grantScore, log } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  if (!user) return null;
  const level = data.levels.find((l) => l.id === levelId);
  const qs = data.questions.filter((q) => q.levelId === levelId && !q.admin);
  const locked = level ? !levelFullyOpen(user, level, data.levels) : false;
  const prior = priorFor(data, user.id, qs as any, (q) => [`exam:${levelId}:${q.id}`]);

  async function submit() {
    if (prior) return;
    let auto = 0, max = 0, pending = 0;
    for (const q of qs) {
      const ans = answers[q.id] || '';
      const g = gradeQuestion(q, ans);
      auto += g.score; max += q.points;
      if (!g.auto) pending++;
      await put('attempts', { id: uid(), studentId: user!.id, sessionId: '', questionId: `exam:${levelId}:${q.id}`, answer: ans, autoScore: g.score, maxScore: q.points, status: g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending', createdAt: today() });
    }
    await grantScore(user!.id, 'levelQuiz', auto, `exam-${levelId}-${user!.id}`);
    await log('level-exam', `${level?.title || levelId} · ${auto}/${max}`);
    setResult({ auto, max, pending, marks: Object.fromEntries(qs.map((q) => [q.id, gradeQuestion(q, answers[q.id] || '').score > 0])), answers: { ...answers }, pend: Object.fromEntries(qs.map((q) => [q.id, !gradeQuestion(q, answers[q.id] || '').auto])) });
  }

  const view = result || (prior ? { auto: prior.score, max: prior.max, pending: Object.values(prior.pending).filter(Boolean).length, marks: prior.marks, answers: prior.answers, pend: prior.pending } : null);
  if (view) return <div className="stack">
    <Card className="stack">
      <h2>{result ? tr('اختبار المستوى خلص') : tr('مراجعة اختبار المستوى')}</h2>
      <div className={view.pending ? 'note' : 'result-good'}><strong>Score: {view.auto} out of {view.max}</strong>{view.pending > 0 && <div>{view.pending} written answers are waiting for admin review.</div>}</div>
      {!result && <div className="note" dir={uiDir()}>{tr('الاختبار ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.')}</div>}
      <div className="row"><Button onClick={() => go('/roadmap')}>{tr('رجوع للخريطة')}</Button></div>
    </Card>
    {qs.map((q, i) => {
      const waiting = !!view.pend?.[q.id];
      const ok = view.marks[q.id];
      return <Card key={q.id}>
        <div className="between"><strong>{i + 1}. {q.prompt}</strong>{waiting ? <Badge tone="amber">{tr('بانتظار المراجعة')}</Badge> : <Badge tone={ok ? 'green' : 'red'}>{ok ? '✓ Correct' : '✗ Wrong'}</Badge>}</div>
        <div className="why-box" dir={uiDir()} style={{ marginTop: '.6rem' }}>{tr('إجابتك: {0}', [view.answers[q.id] || '—'])}{!waiting && !ok ? tr('\nالإجابة الصح: {0}', [correctText(q as any)]) : ''}</div>
      </Card>;
    })}
  </div>;

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => go('/roadmap')}>{tr('→ الخريطة')}</button></div>
    <Card><h1>Level test: {level?.title || levelId}</h1><p className="muted">Multiple choice and writing questions from all {data.sessions.filter((s) => s.levelId === levelId).length} sessions. Written answers need admin approval.</p></Card>
    {locked && <div className="note">{tr('🔒 المستوى ده مقفول. اطلب من الأدمن يفتحه قبل ما تمتحن.')}</div>}
    {qs.map((q, i) => <Card key={q.id}>
      <div className="row between"><strong>{i + 1}. {q.prompt}</strong><Badge>{q.points} pts</Badge></div>
      {(q.type === 'mcq' || q.type === 'truefalse') && <div style={{ marginTop: '.7rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${answers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} disabled={locked} style={{ width: 'auto' }} /> <span>{o}</span></label>)}</div>}
      {(q.type === 'short' || q.type === 'fill') && <textarea style={{ marginTop: '.7rem' }} value={answers[q.id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder={tr('اكتب إجابتك بالإنجليزي…')} disabled={locked} />}
    </Card>)}
    <Card><div className="between"><span className="muted">{qs.length} questions</span><Button onClick={submit} disabled={locked || !qs.length}>{tr('سلّم الاختبار')}</Button></div></Card>
  </div>;
}

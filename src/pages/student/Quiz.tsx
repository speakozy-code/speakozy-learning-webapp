import { useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, Empty } from '../../components/UI';
import { gradeQuestion, proportionalScore, scoreRule, uid, today } from '../../lib/domain';
import { go } from '../../App';
import { getBank } from '../../lib/questionBank';
import { whyWrong } from '../../lib/reasons';
import { priorFor, correctText } from '../../lib/review';
import { tr, uiDir } from '../../lib/i18n';

export function QuizPage({ sessionId }: any) {
  const { user, data, put, grantScore, log } = useApp();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const s = data.sessions.find((x) => x.id === sessionId);
  const qs = s ? (getBank(data).get(s.id)?.session || []) : [];
  if (!user) return null;
  if (!s) return <Empty title={tr('السيشن مش موجودة')} />;
  if (!qs.length) return <Empty title={tr('مفيش أسئلة للسيشن دي')} hint={tr('راجع خريطة المستويات.')} />;
  // one attempt only: coming back shows the saved answers with the mistakes
  const prior = priorFor(data, user.id, qs as any, (q) => [q.id]);

  async function submit() {
    if (prior) return;
    let auto = 0, max = 0, pending = 0;
    const jobs: Promise<any>[] = [];
    const marks: Record<string, boolean> = {};
    for (const q of qs) {
      const ans = answers[q.id] || '';
      const g = gradeQuestion(q as any, ans);
      max += q.points; auto += g.score;
      const status = g.auto ? (g.score > 0 ? 'approved' : 'rejected') : 'pending';
      if (!g.auto) pending++;
      marks[q.id] = g.score > 0;
      jobs.push(put('attempts', { id: uid(), studentId: user!.id, sessionId: s!.id, questionId: q.id, answer: ans, autoScore: g.score, maxScore: q.points, status, createdAt: today() }));
    }
    setResult({ auto, max, pending, marks, answers: { ...answers } });
    const qPts = proportionalScore(auto, max, scoreRule(data.settings.scoreRules, 'sessionQuiz'));
    if (qPts > 0) jobs.push(grantScore(user!.id, 'quiz', qPts, `sessionquiz-${s!.id}-${user!.id}`));
    jobs.push(log('quiz-submit', s!.title));
    await Promise.allSettled(jobs);
  }

  const view = result || (prior ? { auto: prior.score, max: prior.max, pending: Object.values(prior.pending).filter(Boolean).length, marks: prior.marks, answers: prior.answers } : null);
  if (view) return <div className="stack">
    <Card className="stack">
      <h2 dir="ltr">{result ? 'Quiz Complete' : 'Your Quiz Review'}</h2>
      <div className={view.pending ? 'note' : 'result-good'}>
        <strong>Score: {view.auto} out of {view.max}</strong>
        {view.pending > 0 && <div>There are {view.pending} written answers to be reviewed by the admin.</div>}
      </div>
      {!result && <div className="note" dir={uiDir()}>{tr('الكويز ده اتحل قبل كده (محاولة واحدة) — دي إجاباتك والغلطات متعلّم عليها.')}</div>}
      <div className="row"><Button onClick={() => go(`/session/${s.id}`)}>{tr('رجوع للسيشن')}</Button><Button variant="ghost" onClick={() => go('/roadmap')}>{tr('الخريطة')}</Button></div>
    </Card>
    {qs.map((q, i) => {
      const ok = view.marks[q.id];
      return <Card key={q.id} className="ltr-scope">
        <div className="between"><strong dir="ltr" className="en" style={{ textAlign: 'left' }}>{i + 1}. {q.prompt}</strong><Badge tone={ok ? 'green' : 'red'}>{ok ? '✓ Correct' : '✗ Wrong'}</Badge></div>
        <div style={{ marginTop: '.6rem' }}>{q.options.map((o) => {
          const mine = view.answers[q.id] === o;
          const right = correctText(q as any).toLowerCase() === o.toLowerCase();
          return <div key={o} className={`quiz-opt ${mine ? 'selected' : ''}`} style={{ borderColor: right ? 'var(--green, #22c55e)' : mine ? 'var(--red, #ef4444)' : undefined }}>
            <span className="en" dir="ltr">{o}</span>{right && ' ✓'}{mine && !right && tr(' ✗ (إجابتك)')}{mine && right && tr(' (إجابتك)')}
          </div>;
        })}</div>
        {!ok && <div className="why-box" dir={uiDir()}>{tr('إجابتك: {0}\n{1}', [view.answers[q.id] || '—', whyWrong(q as any, s.id, data.dictionary)])}</div>}
      </Card>;
    })}
  </div>;

  return <div className="stack">
    <div className="row"><button className="icon-btn" onClick={() => go(`/session/${s.id}`)}>{tr('→ السيشن')}</button></div>
    <Card><h1 dir="ltr">Session Quiz: <span className="en" dir="ltr">{s.title}</span></h1><p className="muted">{qs.length} {tr('سؤال على الكلمات والجرامر. النقاط على قد درجتك.')}</p></Card>
    {qs.map((q, i) => <Card key={q.id} className="ltr-scope">
      <div className="row between"><strong dir="ltr" className="en" style={{textAlign:"left"}}>{i + 1}. {q.prompt}</strong><Badge>{q.points} {tr('نقاط')}</Badge></div>
      <div style={{ marginTop: '.8rem' }}>{q.options.map((o) => <label key={o} className={`quiz-opt ${answers[q.id] === o ? 'selected' : ''}`}><input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} style={{ width: 'auto' }} /> <span className="en" dir="ltr">{o}</span></label>)}</div>
    </Card>)}
    <Card><div className="between"><span className="muted">{tr('الإجابات الكتابية بتتحفظ للمراجعة.')}</span><Button onClick={submit}>{tr('سلّم الإجابات')}</Button></div></Card>
  </div>;
}

/** Two short, simple examples that really contain the searched word. */

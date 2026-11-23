import type { AppData, Question } from '../types';

/** What a student answered the last time they took a quiz (one attempt only: later visits show this review). */
export type Prior = {
  answers: Record<string, string>;
  marks: Record<string, boolean>;
  pending: Record<string, boolean>;
  score: number;
  max: number;
};

/**
 * Finds the student's saved attempt for every question. `keys(q)` lists the attempt question-ids to look for
 * (newest format first, older formats after). Returns null when the student never took this quiz.
 */
export function priorFor(data: AppData, studentId: string, qs: Question[], keys: (q: Question) => string[]): Prior | null {
  const mine = data.attempts.filter((a) => a.studentId === studentId);
  if (!mine.length || !qs.length) return null;
  const answers: Record<string, string> = {};
  const marks: Record<string, boolean> = {};
  const pending: Record<string, boolean> = {};
  let hit = 0, score = 0, max = 0;
  for (const q of qs) {
    let found;
    for (const k of keys(q)) {
      for (let i = mine.length - 1; i >= 0; i--) if (mine[i].questionId === k) { found = mine[i]; break; }
      if (found) break;
    }
    max += q.points;
    if (!found) { answers[q.id] = ''; marks[q.id] = false; continue; }
    hit++;
    answers[q.id] = found.answer || '';
    marks[q.id] = found.autoScore > 0;
    pending[q.id] = found.status === 'pending';
    score += found.autoScore;
  }
  return hit ? { answers, marks, pending, score, max } : null;
}

export const correctText = (q: Pick<Question, 'correct'>) => (Array.isArray(q.correct) ? q.correct.join(' | ') : String(q.correct));

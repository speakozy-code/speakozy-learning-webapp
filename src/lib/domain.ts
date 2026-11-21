import type { AppData, Attempt, Question, Session, User } from '../types';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const today = () => new Date().toISOString();

export function gradeQuestion(q: Question, answer: string): { score: number; auto: boolean } {
  const a = (answer || '').trim().toLowerCase();
  if (q.type === 'short') return { score: 0, auto: false };
  if (q.type === 'match' || q.type === 'order') {
    const expected = Array.isArray(q.correct) ? q.correct.join('|') : String(q.correct);
    const got = a.split(/[|،,]/).map((s) => s.trim()).filter(Boolean).join('|');
    return { score: got === expected.toLowerCase() ? q.points : 0, auto: true };
  }
  const correct = Array.isArray(q.correct) ? q.correct[0] : q.correct;
  return { score: a === String(correct).trim().toLowerCase() ? q.points : 0, auto: true };
}

export function sessionStatus(data: AppData, session: Session, studentId: string) {
  const prog = data.progress.filter((p) => p.studentId === studentId && p.sessionId === session.id);
  const attempts = data.attempts.filter((a) => a.studentId === studentId && a.sessionId === session.id);
  if (!prog.length && !attempts.length) return { key: 'locked', label: 'Not started' };
  if (prog.length < session.sections.length && !attempts.length) return { key: 'progress', label: 'In progress' };
  if (attempts.some((a) => a.status === 'approved')) return { key: 'approved', label: 'Approved' };
  if (attempts.some((a) => a.status === 'pending')) return { key: 'review', label: 'Awaiting review' };
  if (attempts.length) return { key: 'done', label: 'Quiz done' };
  return { key: 'available', label: 'Available' };
}

export function levelProgress(data: AppData, levelId: string, studentId: string) {
  const sessions = data.sessions.filter((s) => s.levelId === levelId);
  if (!sessions.length) return 0;
  const approved = sessions.filter((s) => sessionStatus(data, s, studentId).key === 'approved').length;
  return Math.round((approved / sessions.length) * 100);
}

export const PLANS: Record<string, { label: string; levels: number }> = {
  starter: { label: 'Starter', levels: 3 },
  growth: { label: 'Growth', levels: 7 },
  pro: { label: 'Pro', levels: 15 },
};

export function allowedLevelCount(user: User) {
  return PLANS[user.plan || 'starter']?.levels || 1;
}

// نطاق المستويات المفتوحة بالكامل: من أول مستوى (levelId) لآخر مستوى (maxLevelId) شاملًا.
export function levelRange(user: User, levels: { id: string; order: number }[]) {
  const first = levels.find((l) => l.id === user.levelId)?.order ?? 1;
  const last = levels.find((l) => l.id === user.maxLevelId)?.order ?? first;
  return { first: Math.min(first, last), last: Math.max(first, last) };
}

export function levelFullyOpen(user: User, level: { id: string; order: number }, levels: { id: string; order: number }[]) {
  if (user.role === 'admin') return true;
  const { first, last } = levelRange(user, levels);
  return level.order >= first && level.order <= last;
}

// كل المستويات ظاهرة؛ اللي بره النطاق بيفتح أول سيشن بس.
export function canOpenLevel(_user: User, _level: { id: string; order: number }, _levels: { id: string; order: number }[]) {
  return true;
}

export function sessionOpen(user: User, session: { levelId: string; order: number }, levels: { id: string; order: number }[]) {
  const level = levels.find((l) => l.id === session.levelId);
  if (!level) return false;
  if (user.role === 'admin') return true;
  if (levelFullyOpen(user, level, levels)) return true;
  return session.order === 1;
}

export const wordProgressId = (word: string) => `word:${word.toLowerCase()}`;
export const practiceId = (kind: string, sessionId: string, n: number) => `${kind}:${sessionId}:${n}`;

// Engagement progress covers words, grammar quiz, session quiz, speaking, writing, listening and the level test.
export function engagementProgress(data: AppData, levelId: string, studentId: string) {
  const sessions = data.sessions.filter((s) => s.levelId === levelId);
  const words = [...new Set(data.dictionary
    .filter((d) => (d.sessionIds || []).some((id) => sessions.some((s) => s.id === id)))
    .map((d) => d.word.toLowerCase()))];
  const total = words.length + sessions.length * 5 + 1;
  if (!total) return 0;
  const mine = (p: any) => p.studentId === studentId;
  let done = 0;
  done += words.filter((w) => data.progress.some((p) => mine(p) && p.sectionId === wordProgressId(w))).length;
  for (const s of sessions) {
    if (data.attempts.some((a) => mine(a) && a.questionId.startsWith(`grammar:${s.id}:`) && a.status === 'approved')) done++;
    if (data.attempts.some((a) => mine(a) && a.sessionId === s.id && !a.questionId.includes(':'))) done++;
    for (const kind of ['speaking', 'writing', 'listening']) {
      if (data.attempts.some((a) => mine(a) && a.questionId.startsWith(`${kind}:${s.id}:`))) done++;
    }
  }
  if (data.attempts.some((a) => mine(a) && a.questionId.startsWith(`exam:${levelId}:`))) done++;
  return Math.min(100, Math.round((done / total) * 100));
}

export function totalScore(data: AppData, studentId: string) {
  return data.scores.filter((s) => s.studentId === studentId).reduce((sum, s) => sum + s.points, 0);
}

export function leaderboard(data: AppData) {
  if (!data.settings.leaderboard.enabled) return [];
  return data.users
    .filter((u) => u.role === 'student' && u.active && !data.settings.leaderboard.hidden.includes(u.id))
    .map((u) => {
      const parts = u.name.trim().split(/\s+/);
      const name = data.settings.leaderboard.nameMode === 'first' ? parts[0] : parts[0] + ' ' + (parts[1] || '').charAt(0) + '.';
      return { id: u.id, name, points: totalScore(data, u.id), level: u.levelId, avatar: u.avatar };
    })
    .sort((a, b) => b.points - a.points);
}

export function addScoreOnce(data: AppData, score: { studentId: string; source: string; points: number; refId: string }) {
  if (data.scores.some((s) => s.refId === score.refId && s.studentId === score.studentId)) return false;
  data.scores.push({ ...score, id: uid(), createdAt: today() });
  return true;
}

export function needsReview(attempts: Attempt[]) {
  return attempts.filter((a) => a.status === 'pending').length;
}

export function buildStudentAccount(input: {
  id?: string; name?: string; email?: string; demoPassword?: string;
  role?: User['role']; active?: boolean; plan?: User['plan'];
  levelId: string; maxLevelId: string; createdAt?: string; avatar?: string; subscribed?: boolean;
}): User {
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const demoPassword = String(input.demoPassword || '').trim();
  if (!name) throw new Error('Name is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid email is required');
  return {
    id: input.id || uid(),
    name,
    email,
    ...(demoPassword ? { demoPassword } : {}),
    role: input.role === 'admin' ? 'admin' : 'student',
    active: input.active !== false,
    plan: input.plan || 'starter',
    subscribed: input.subscribed ?? false,
    levelId: input.levelId,
    maxLevelId: input.maxLevelId || input.levelId,
    createdAt: input.createdAt || today(),
    avatar: input.avatar,
  };
}

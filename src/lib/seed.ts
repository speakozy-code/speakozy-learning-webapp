import type { AppData } from '../types';
import { DRIVE_CURRICULUM as D } from './driveCurriculum.ts';

// Full curriculum imported from the Speakozy Google Drive decks (E1 → Upper 1).
// Seven levels, ordered from level 1 upwards; every session carries its original
// presentation text, generated exercises, quiz questions, grammar slides and a
// word list enriched with definition, part of speech, IPA and audio.
const LEVELS = (D as any).levels as AppData['levels'];
const SESSIONS = (D as any).sessions as AppData['sessions'];
const QUESTIONS = (D as any).questions as AppData['questions'];
const DICTIONARY = (D as any).dictionary as AppData['dictionary'];
const NOTES = (D as any).grammarNotes as AppData['grammarNotes'];

// Two sessions per week per level. A week is complete when both sessions are approved.
const WEEKLY_TASKS = LEVELS.flatMap((level) => {
  const list = SESSIONS.filter((s) => s.levelId === level.id).sort((a, b) => a.order - b.order);
  const out: any[] = [];
  for (let i = 0; i < list.length; i += 2) {
    const group = list.slice(i, i + 2);
    out.push({
      id: `week-${level.id}-${i / 2 + 1}`,
      title: `${level.title} · Week ${i / 2 + 1} — sessions ${group.map((g) => g.order).join(' & ')}`,
      kind: 'weekly',
      dueAt: group[0].dueAt,
      targetType: 'level',
      targetId: level.id,
      sessionIds: group.map((g) => g.id),
      active: true,
    });
  }
  return out;
});

export function seedData(): AppData {
  return {
    users: [
      { id: 'admin-1', name: 'Academy Manager', email: 'admin@speakozy.demo', role: 'admin', active: true, subscribed: true, levelId: 'l1', maxLevelId: 'l11', createdAt: '2026-01-01T00:00:00.000Z', demoPassword: 'admin123' },
      { id: 'stu-1', name: 'Mariem Ahmed', email: 'mariem@speakozy.demo', plan: 'pro', role: 'student', active: true, subscribed: true, levelId: 'l1', maxLevelId: 'l1', createdAt: '2026-02-01T00:00:00.000Z', demoPassword: 'demo123' },
      { id: 'stu-2', name: 'Yousef Mostafa', email: 'youssef@speakozy.demo', plan: 'growth', role: 'student', active: true, subscribed: true, levelId: 'l1', maxLevelId: 'l1', createdAt: '2026-02-04T00:00:00.000Z', demoPassword: 'demo123' },
      { id: 'stu-3', name: 'Nour Ali', email: 'noor@speakozy.demo', plan: 'starter', role: 'student', active: false, subscribed: true, levelId: 'l2', maxLevelId: 'l2', createdAt: '2026-02-08T00:00:00.000Z', demoPassword: 'demo123' },
    ],
    levels: LEVELS,
    sessions: SESSIONS,
    questions: QUESTIONS,
    dictionary: DICTIONARY,
    attempts: [
      { id: 'a1', studentId: 'stu-2', sessionId: 'l1-s1', questionId: 'q-l1-s1-1', answer: '', autoScore: 10, maxScore: 10, status: 'approved', createdAt: '2026-11-15T10:00:00.000Z' },
    ],
    progress: [
      { id: 'p1', studentId: 'stu-1', sessionId: 'l1-s1', sectionId: 'l1-s1-a', completedAt: '2026-11-16T10:00:00.000Z' },
      { id: 'p2', studentId: 'stu-1', sessionId: 'l1-s1', sectionId: 'l1-s1-b', completedAt: '2026-11-16T10:10:00.000Z' },
    ],
    tasks: [
      ...WEEKLY_TASKS,
      { id: 't1', title: 'Study the vocabulary of session 1', kind: 'study', dueAt: '2026-11-20T20:00:00.000Z', targetType: 'all', active: true },
      { id: 't2', title: 'Review five saved words', kind: 'words', dueAt: '2026-11-21T20:00:00.000Z', targetType: 'student', targetId: 'stu-1', active: true },
    ],
    taskCompletions: [{ id: 'tc1', taskId: 't1', studentId: 'stu-2', completedAt: '2026-11-19T09:00:00.000Z' }],
    notifications: [
      { id: 'n1', targetId: 'stu-1', title: 'A task is due', body: 'Review today’s words before the next session.', href: '#/tasks', read: false, createdAt: '2026-11-19T08:00:00.000Z' },
      { id: 'n2', targetId: 'all', title: 'The new path is ready', body: `${LEVELS.length} levels and ${SESSIONS.length} sessions from the lesson decks.`, href: '#/roadmap', read: false, createdAt: '2026-11-18T14:00:00.000Z' },
    ],
    scores: [
      { id: 'sc1', studentId: 'stu-1', source: 'study', points: 20, refId: 'progress-l1-s1', createdAt: '2026-11-16T10:10:00.000Z' },
    ],
    savedWords: [
      { id: 'w1', studentId: 'stu-1', word: 'coffee', meaning: 'قهوة', review: false, createdAt: '2026-11-16T10:00:00.000Z' },
    ],
    certificates: [],
    grammarNotes: NOTES,
    logs: [
      { id: 'lg1', actorId: 'admin-1', action: 'load-curriculum', target: `${LEVELS.length} levels / ${SESSIONS.length} sessions / ${DICTIONARY.length} words`, createdAt: '2026-11-18T09:00:00.000Z' },
    ],
    settings: {
      scoreRules: { study: 10, exercise: 5, wordQuiz: 10, grammarQuiz: 10, sessionQuiz: 30, levelQuiz: 50 },
      leaderboard: { enabled: true, nameMode: 'first', period: 'weekly', hidden: [] },
      quizDefaults: { attempts: 2, passScore: 70, durationMin: 10 },
      reminders: { inactivityDays: 3, reminderHours: 24 },
    },
  };
}

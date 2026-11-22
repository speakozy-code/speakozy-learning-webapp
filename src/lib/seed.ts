import type { AppData } from '../types';
import { DRIVE_CURRICULUM as D } from './driveCurriculum.ts';
import { SOURCE_SESSION_REPAIRS, SOURCE_WORDS_BY_SESSION, replaceSessionSections } from './sourceSessionRepairs.ts';
import { LEVEL_TASKS } from './levelTasks.ts';

// Full curriculum imported from the Speakozy Google Drive decks (E1 → Upper 1).
// Seven levels, ordered from level 1 upwards; every session carries its original
// presentation text, generated exercises, quiz questions, grammar slides and a
// word list enriched with definition, part of speech, IPA and audio.
const LEVELS = (D as any).levels as AppData['levels'];
const SESSIONS = ((D as any).sessions as AppData['sessions']).map((session) => {
  const repair = SOURCE_SESSION_REPAIRS[session.id];
  const sections = replaceSessionSections(session.id, session.sections);
  return { ...session, ...(repair ? { title: repair.title, topic: repair.topic } : {}), ...(sections ? { sections } : {}) };
});
const QUESTIONS = (D as any).questions as AppData['questions'];
const repairedIds = new Set(Object.keys(SOURCE_WORDS_BY_SESSION));
const DICTIONARY = [
  ...((D as any).dictionary as AppData['dictionary']).flatMap((word) => {
    const remaining = (word.sessionIds || []).filter((id) => !repairedIds.has(id));
    return remaining.length ? [{ ...word, sessionIds: remaining }] : (word.sessionIds || []).some((id) => repairedIds.has(id)) ? [] : [word];
  }),
  ...Object.entries(SOURCE_WORDS_BY_SESSION).flatMap(([sessionId, words]) => words.map((word, index) => ({
    id: `drive-reviewed-${sessionId}-${index + 1}`, word: word.word, meaning: word.arabic, arabic: word.arabic,
    type: word.type, definitions: word.definitions, examples: word.examples, source: 'manual', sessionIds: [sessionId],
  } as AppData['dictionary'][number]))),
];
const NOTES = (D as any).grammarNotes as AppData['grammarNotes'];

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
      ...LEVEL_TASKS,
    ],
    taskCompletions: [{ id: 'tc1', taskId: 'e2-t1', studentId: 'stu-2', completedAt: '2026-11-19T09:00:00.000Z' }],
    notifications: [
      { id: 'n1', targetId: 'stu-1', title: 'A task is due', body: 'Review today’s words before the next session.', href: '#/tasks', read: false, createdAt: '2026-11-19T08:00:00.000Z' },
      { id: 'n2', targetId: 'all', title: 'The new path is ready', body: `${LEVELS.length} levels and ${SESSIONS.length} sessions from the lesson decks.`, href: '#/roadmap', read: false, createdAt: '2026-11-18T14:00:00.000Z' },
      { id: 'n3', targetId: 'l2', title: 'E2 tasks are ready', body: '16 speaking tasks across 4 weeks: reading aloud, questions and personal speaking. Record your voice and send it on the group.', href: '#/tasks', read: false, createdAt: '2026-11-21T12:00:00.000Z' },
    ],
    scores: [
      { id: 'sc1', studentId: 'stu-1', source: 'study', points: 20, refId: 'progress-l1-s1', createdAt: '2026-11-16T10:10:00.000Z' },
    ],
    savedWords: [
      { id: 'w1', studentId: 'stu-1', word: 'coffee', meaning: 'قهوة', review: false, createdAt: '2026-11-16T10:00:00.000Z' },
    ],
    certificates: [],
    testimonials: [
      { id: 'tst1', name: 'Mariem A.', level: 'E1', date: '2026-11-10', text: 'The sessions are short and I can actually speak now. I loved the group — nobody laughs when I make mistakes.', role: 'student', createdAt: '2026-11-10T10:00:00.000Z' },
      { id: 'tst2', name: 'Yousef M.', level: 'E2', date: '2026-11-14', text: 'The daily tasks made me practise every day. The teacher explains grammar in a simple way.', role: 'student', createdAt: '2026-11-14T10:00:00.000Z' },
    ],
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

export type Role = 'student' | 'admin';

export interface User {
  id: string; name: string; email: string; role: Role; active: boolean;
  levelId: string; maxLevelId: string; plan?: 'starter'|'growth'|'pro'; avatar?: string; createdAt: string;
  demoPassword?: string; subscribed?: boolean;
}

export interface Section {
  id: string; title: string; body: string; finishedBy?: string[];
}

export interface Level {
  id: string; title: string; order: number; description: string; active: boolean;
}

export interface Session {
  id: string; levelId: string; order: number; title: string; topic: string;
  dueAt: string; driveUrl?: string; pdfUrl?: string; videoUrl?: string; sections: Section[];
}

export type QuestionType = 'mcq' | 'truefalse' | 'fill' | 'match' | 'short' | 'order';
export interface Question {
  id: string; sessionId: string; levelId: string; scope: 'word' | 'grammar' | 'topic' | 'session' | 'level';
  type: QuestionType; prompt: string; options: string[]; correct: string | string[];
  points: number; explanation?: string;
}

export type AttemptStatus = 'pending' | 'approved' | 'rejected';
export interface Attempt {
  id: string; studentId: string; sessionId: string; questionId: string;
  answer: string; autoScore: number; maxScore: number; status: AttemptStatus;
  createdAt: string; reviewedBy?: string; reviewedAt?: string; note?: string;
}

export interface Progress { id: string; studentId: string; sessionId: string; sectionId: string; completedAt: string; }
export interface GrammarNote { id: string; sessionId: string; order: number; title: string; rule: string; examples: string[]; detail?: string; }
export interface Task { id: string; title: string; kind: string; dueAt: string; targetType: 'all'|'level'|'student'; targetId?: string; sessionIds?: string[]; active: boolean; }
export interface TaskCompletion { id: string; taskId: string; studentId: string; completedAt: string; }
export interface AppNotification { id: string; targetId: string; title: string; body: string; href: string; read: boolean; createdAt: string; }
export interface Score { id: string; studentId: string; source: string; points: number; refId: string; createdAt: string; }
export interface SavedWord { id: string; studentId: string; word: string; meaning: string; review: boolean; createdAt: string; }
export interface DictionaryEntry { id: string; word: string; meaning: string; type: string; examples: string[]; arabic: string; audio?: string; sessionIds?: string[]; source?: 'local'|'global'|'manual'; phonetic?: string; audioUrl?: string; definitions?: string[]; synonyms?: string[]; nextReview?: string; addedBy?: string; }
export interface Certificate { id: string; studentId: string; levelIds: string[]; number: string; issuedAt: string; status: 'active'|'revoked'; reason?: string; }
export interface AuditLog { id: string; actorId: string; action: string; target: string; createdAt: string; }
export interface Settings {
  scoreRules: Record<string, number>;
  leaderboard: { enabled: boolean; nameMode: 'first'|'short'; period: 'weekly'|'monthly'|'total'; hidden: string[] };
  quizDefaults: { attempts: number; passScore: number; durationMin: number };
  reminders: { inactivityDays: number; reminderHours: number };
}

export interface AppData {
  users: User[]; levels: Level[]; sessions: Session[]; questions: Question[];
  attempts: Attempt[]; progress: Progress[]; tasks: Task[]; taskCompletions: TaskCompletion[];
  notifications: AppNotification[]; scores: Score[]; savedWords: SavedWord[];
  dictionary: DictionaryEntry[]; certificates: Certificate[]; logs: AuditLog[]; settings: Settings; grammarNotes: GrammarNote[];
}

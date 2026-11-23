import type { AppData, Task } from '../types';
import { TASK_QUESTIONS } from './content/taskQuestions.ts';
import { grammarFor } from './grammar/index.ts';

export const TASKS_PER_WEEK = 4;
export const TOPICS_PER_WEEK = 2;
export const QUESTIONS_PER_TOPIC = 2;

const cleanTitle = (s: { title?: string; topic?: string; id: string }) =>
  String(s.title || s.topic || s.id).replace(/^\s*session\s+\d+\s*[|—:-]\s*/i, '').replace(/^\d+\.\s*/, '').trim();

/** Used only when the lesson deck has no usable question for a topic. Always flagged as generic in the UI. */
function genericQuestion(topic: string, n: number): string {
  const t = topic.toLowerCase();
  const pool = [
    `Talk about "${t}". What did you learn in this lesson?`,
    `Tell me about a time when "${t}" was part of your day.`,
    `What do you find easy or hard about "${t}" in English? Why?`,
    `Give some advice to a friend about "${t}".`,
  ];
  return pool[n % pool.length];
}

/**
 * Daily tasks, built from the level's own topics (sessions) in their order:
 * 4 tasks per week = the next 2 topics x 2 questions each.
 * Questions are authored per lesson (src/lib/content/taskQuestions.ts) and never reused in Practice/Quiz; if a topic has fewer than 2, the gap is filled with a
 * clearly flagged generic question about that same topic. No topics are invented.
 */
export function buildDailyTasks(levels: AppData['levels'], sessions: AppData['sessions']): Task[] {
  const out: Task[] = [];
  for (const level of [...levels].sort((a, b) => a.order - b.order)) {
    const topics = sessions.filter((s) => s.levelId === level.id).sort((a, b) => a.order - b.order);
    topics.forEach((s, i) => {
      const week = Math.floor(i / TOPICS_PER_WEEK) + 1;
      const topic = cleanTitle(s);
      const deck = TASK_QUESTIONS[s.id] || [];
      const grammar = grammarFor(s.id)[0]?.title || '';
      for (let n = 0; n < QUESTIONS_PER_TOPIC; n++) {
        const fromDeck = deck[n];
        out.push({
          id: `dt-${s.id}-${n + 1}`,
          title: `${topic} — Question ${n + 1}`,
          kind: 'speaking',
          dueAt: '',
          targetType: 'level',
          targetId: level.id,
          sessionIds: [s.id],
          active: true,
          week,
          topic,
          grammar,
          badge: fromDeck ? '✍️ Lesson question' : '🧩 General question',
          instructions: [fromDeck || genericQuestion(topic, n)],
          order: (week - 1) * TASKS_PER_WEEK + (i % TOPICS_PER_WEEK) * QUESTIONS_PER_TOPIC + n + 1,
          source: fromDeck ? 'authored' : 'generated',
        });
      }
    });
  }
  return out;
}

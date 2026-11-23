import { GRAMMAR_E } from './e.ts';
import { GRAMMAR_PRE } from './pre.ts';
import { GRAMMAR_INTER } from './inter.ts';
import { GRAMMAR_UPPER } from './upper.ts';
import { DEEP } from './deep.ts';
import type { GrammarMap, GrammarTopic } from './types.ts';

export type { GrammarTopic } from './types.ts';
const BASE: GrammarMap = { ...GRAMMAR_E, ...GRAMMAR_PRE, ...GRAMMAR_INTER, ...GRAMMAR_UPPER };
/** The detailed explanation replaces the short one for every topic that has one. */
export const GRAMMAR: GrammarMap = Object.fromEntries(
  Object.entries(BASE).map(([id, topics]) => [id, topics.map((t, i) => ({ ...t, ar: DEEP[id]?.[i] || t.ar }))]),
);
export const grammarFor = (sessionId: string): GrammarTopic[] => GRAMMAR[sessionId] || [];

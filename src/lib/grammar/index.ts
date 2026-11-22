import { GRAMMAR_E } from './e.ts';
import { GRAMMAR_PRE } from './pre.ts';
import { GRAMMAR_INTER } from './inter.ts';
import { GRAMMAR_UPPER } from './upper.ts';
import type { GrammarMap, GrammarTopic } from './types.ts';

export type { GrammarTopic } from './types.ts';
export const GRAMMAR: GrammarMap = { ...GRAMMAR_E, ...GRAMMAR_PRE, ...GRAMMAR_INTER, ...GRAMMAR_UPPER };
export const grammarFor = (sessionId: string): GrammarTopic[] => GRAMMAR[sessionId] || [];

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
// Topics edited in the admin lesson editor replace the built-in ones for that session.
let OVERRIDES: Record<string, GrammarTopic[]> = {};
export function setGrammarOverrides(notes: { sessionId: string; order: number; kind?: string; title: string; rule: string; detail?: string; examples: string[]; mistakes?: [string, string][] }[] = []) {
  const out: Record<string, GrammarTopic[]> = {};
  for (const n of [...notes].filter((x) => x.kind === 'topic').sort((a, b) => a.order - b.order)) {
    (out[n.sessionId] ||= []).push({ title: n.title, formula: n.rule || '', ar: n.detail || '', examples: n.examples || [], mistakes: n.mistakes || [] });
  }
  OVERRIDES = out;
}
export const hasGrammarOverride = (sessionId: string) => !!OVERRIDES[sessionId];
/** The built-in topics, ignoring any admin edits (used to start editing). */
export const builtInGrammar = (sessionId: string): GrammarTopic[] => GRAMMAR[sessionId] || [];
export const grammarFor = (sessionId: string): GrammarTopic[] => OVERRIDES[sessionId] || GRAMMAR[sessionId] || [];

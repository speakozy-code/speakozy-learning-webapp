/** Hand-written grammar for every session. Explanations are Egyptian Arabic, examples are English. */
export interface GrammarTopic {
  title: string;
  formula: string;
  ar: string;
  examples: string[];
  /** [wrong, right] pairs — shown as "common mistakes" and reused as quiz questions. */
  mistakes: [string, string][];
}
export type GrammarMap = Record<string, GrammarTopic[]>;
export const T = (title: string, formula: string, ar: string, examples: string[], mistakes: [string, string][] = []): GrammarTopic => ({ title, formula, ar, examples, mistakes });

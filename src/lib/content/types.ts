/** [prompt, correct answer, ...wrong answers] — options are shuffled at runtime. */
export type RawQ = [string, string, string, ...string[]];
export type QMap = Record<string, RawQ[]>;

import { DEEP1 } from './deep1.ts';
import { DEEP2 } from './deep2.ts';
import { DEEP3 } from './deep3.ts';
/** Detailed Egyptian-Arabic explanation per grammar topic, in the same order as the topics of each lesson. */
export const DEEP: Record<string, string[]> = { ...DEEP1, ...DEEP2, ...DEEP3 };

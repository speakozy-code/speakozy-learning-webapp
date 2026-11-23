import type { QMap } from './types.ts';
import { L1 } from './gq/l1.ts';
import { L2 } from './gq/l2.ts';
import { L3 } from './gq/l3.ts';
import { L4 } from './gq/l4.ts';
import { L5 } from './gq/l5.ts';
import { L6 } from './gq/l6.ts';
import { L7 } from './gq/l7.ts';
import { L8 } from './gq/l8.ts';
import { L9 } from './gq/l9.ts';
import { L10 } from './gq/l10.ts';
import { L11 } from './gq/l11.ts';

/** Authored multiple-choice grammar/lesson questions: 20 per session, written by hand. */
export const GRAMMAR_QUESTIONS: QMap = { ...L1, ...L2, ...L3, ...L4, ...L5, ...L6, ...L7, ...L8, ...L9, ...L10, ...L11 };

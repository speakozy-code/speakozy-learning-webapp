import { readdirSync, readFileSync } from 'node:fs';

/** All student page sources concatenated (the pages used to live in a single Student.tsx). */
export function readStudentSource() {
  const dir = new URL('../../src/pages/student/', import.meta.url);
  return readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).sort().map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
}

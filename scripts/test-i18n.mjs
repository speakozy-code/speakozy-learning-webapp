// Every string passed to tr() (and the Arabic copy in the data files) must have an English entry, and placeholders must match.
import assert from 'node:assert/strict';
import { EN } from '../src/lib/i18n/en.ts';
import { collectKeys } from './lib/i18n-keys.mjs';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };
const keys = collectKeys();
const slots = (s) => (s.match(/\{\d+\}/g) || []).sort().join(',');

t('every translatable string has an English entry', () => {
  const missing = [...keys.keys()].filter((k) => !(k in EN) || !EN[k].trim());
  assert.deepEqual(missing, [], `missing English for:\n${missing.join('\n')}`);
});
t('English entries keep the same {n} placeholders', () => {
  const bad = Object.entries(EN).filter(([k, v]) => slots(k) !== slots(v)).map(([k]) => k);
  assert.deepEqual(bad, [], `placeholder mismatch:\n${bad.join('\n')}`);
});
t('no English entry is unused', () => {
  const unused = Object.keys(EN).filter((k) => !keys.has(k));
  assert.deepEqual(unused, [], `unused entries:\n${unused.join('\n')}`);
});
console.log(`\n${pass} i18n checks passed (${keys.size} strings)`);

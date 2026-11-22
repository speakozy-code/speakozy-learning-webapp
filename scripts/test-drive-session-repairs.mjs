import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as D } from '../src/lib/driveCurriculum.ts';
import { SOURCE_SESSION_REPAIRS, replaceSessionSections } from '../src/lib/sourceSessionRepairs.ts';

// These sessions were previously overwritten with content from unrelated Drive decks.
// They must now remain exactly as imported from the curriculum source.
for (const id of ['l4-s1', 'l4-s3', 'l4-s7', 'l6-s1']) {
  const session = D.sessions.find((item) => item.id === id);
  assert.ok(session, `missing source session ${id}`);
  assert.equal(SOURCE_SESSION_REPAIRS[id], undefined, `${id} must not be manually replaced`);
  assert.equal(replaceSessionSections(id, session.sections), undefined, `${id} sections should remain from Drive`);
}

const expectedTitles = {
  'l4-s1': '1. SESSION 1 | Money',
  'l4-s3': '3. SESSION 3 | Success',
  'l4-s7': '7. SESSION 7 | Global problems and solutions',
  'l6-s1': '1. SESSION 1 | Media and influence',
};
for (const [id, title] of Object.entries(expectedTitles)) {
  const normalize = (value) => value.replace(/^\s*\d+\.\s*SESSION\s*\d+\s*\|\s*/i, '').trim().toLowerCase();
  assert.equal(normalize(D.sessions.find((item) => item.id === id).title), normalize(title), `${id} topic must match Drive`);
}

for (const id of ['l9-s4', 'l9-s5']) {
  const session = D.sessions.find((item) => item.id === id);
  assert.ok(replaceSessionSections(id, session.sections), `${id} curated vocabulary remains available`);
}
console.log('Drive curriculum integrity checks passed');

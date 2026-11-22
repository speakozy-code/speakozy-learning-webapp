import assert from 'node:assert/strict';
import { DRIVE_CURRICULUM as D } from '../src/lib/driveCurriculum.ts';
import { SOURCE_SESSION_REPAIRS, replaceSessionSections } from '../src/lib/sourceSessionRepairs.ts';
for (const id of ['l4-s1','l4-s3','l4-s7','l6-s1']) {
  const s=D.sessions.find(x=>x.id===id), r=SOURCE_SESSION_REPAIRS[id];
  assert.ok(s && r, `missing ${id}`);
  assert.match(r.material, /Source:.*\.pptx/);
  assert.ok(r.vocabulary.length>=10, `${id} vocabulary`);
  const sections=replaceSessionSections(id,s.sections);
  assert.ok(sections.some(x=>x.title==='Lesson material (text)' && x.body.includes('Source:')));
  assert.ok(sections.some(x=>x.title==='Grammar' && x.body===r.grammar));
}
for (const id of ['l9-s4','l9-s5']) assert.ok(replaceSessionSections(id,D.sessions.find(x=>x.id===id).sections));
console.log('Drive source-session repair checks passed');

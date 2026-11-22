import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const layout = readFileSync('src/components/Layout.tsx', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');
const student = readFileSync('src/pages/Student.tsx', 'utf8');
assert.match(layout, /className="float-wa"/);
assert.doesNotMatch(layout, /wa-top/);
const header = layout.slice(layout.indexOf('<div className="shell">'), layout.indexOf('{open &&'));
assert.doesNotMatch(header, /wa\.me|WA_LINK|واتساب/);
assert.match(css, /\.to-top\{position:fixed;bottom:9\.2rem;left:/);
assert.match(css, /\.float-wa\{position:fixed;bottom:5rem;left:/);
assert.match(css, /\.float-wa\{bottom:5rem;left:\.7rem;right:auto/);
for (const label of ['Words', 'Grammar', 'Practice', 'Quiz', 'Words Quiz', 'Grammar Practice', 'Speaking Practice', 'Session Quiz']) assert.ok(student.includes(label), `missing ${label}`);
assert.match(student, /\{\(w\.arabic \|\| w\.meaning\) && <div className="vocab-meaning"/);
assert.doesNotMatch(student, /!enMaterial && <div className="vocab-meaning"/);
console.log('requested material UI checks passed');
const curriculum = readFileSync('src/lib/driveCurriculum.ts', 'utf8');
function entry(id) {
  const match = curriculum.match(new RegExp(`\\{"id":"${id}".*?\\}`));
  assert.ok(match, `missing dictionary entry ${id}`);
  return JSON.parse(match[0]);
}
const broke = entry('dict-l7-s4-broke');
assert.equal(broke.arabic, 'مفلس');
assert.equal(broke.type, 'adjective');
assert.match(broke.examples[0], /Broke Generation/);
assert.match(broke.definitions[0], /little or no money/i);
const ripOff = entry('dict-l4-s1-rip-off');
assert.match(ripOff.arabic, /صفقة استغلالية/);
assert.equal(ripOff.examples[0], 'That is a total rip-off!');
assert.match(ripOff.definitions[0], /unfairly expensive|bad deal/i);
for (const heading of ['Examples', 'Common Mistakes', 'Grammar Practice', 'Quiz Complete', 'Session Quiz:']) {
  const at = student.indexOf(heading);
  assert.ok(at >= 0, `missing ${heading}`);
  assert.match(student.slice(Math.max(0, at - 100), at + heading.length + 50), /dir="ltr"/);
}
console.log('contextual dictionary and LTR regression checks passed');

const verifiedDriveTranslations = {
  'dict-l1-s1-great': 'بخير', 'dict-l1-s1-nice': 'سعيد بلقائك',
  'dict-l1-s4-mobile': 'محمول', 'dict-l1-s7-clean': 'ينظف',
  'dict-l1-s3-japanese': 'ياباني', 'dict-l1-s3-south-korean': 'كوري جنوبي',
  'dict-l2-s4-look-for': 'يبحث عن', 'dict-l2-s5-clean-up': 'ينظّف',
  'dict-l2-s5-home-sweet-home': 'ما أجمل العودة إلى البيت', 'dict-l2-s6-suit': 'يناسبك',
  'dict-l3-s1-book': 'يحجز', 'dict-l3-s1-change': 'يغيّر', 'dict-l3-s1-early': 'مبكرًا',
  'dict-l3-s3-return': 'ذهاب وعودة', 'dict-l3-s4-false': 'خطأ', 'dict-l3-s4-true': 'صحيح',
  'dict-l4-s2-travel': 'السفر', 'dict-l4-s5-online': 'على الإنترنت',
  'dict-l4-s7-change': 'تغيّر', 'dict-l4-s7-conserve': 'يحافظ على', 'dict-l4-s7-save': 'يوفّر',
  'dict-l9-s7-suit': 'يناسبك', 'dict-l10-s5-cut-in': 'يتخطّى الطابور',
  'dict-l11-s2-intrinsic': 'داخلي',
};
for (const [id, arabic] of Object.entries(verifiedDriveTranslations)) {
  assert.equal(entry(id).arabic, arabic, `Drive-context translation mismatch for ${id}`);
}
console.log(`${Object.keys(verifiedDriveTranslations).length} Drive-context vocabulary corrections verified`);

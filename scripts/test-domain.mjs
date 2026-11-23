// اختبارات منطق المجال - تعمل مباشرة على ملف TypeScript بفضل type stripping في Node الحديث
import assert from 'node:assert/strict';
import { gradeQuestion, sessionStatus, levelProgress, canOpenLevel, sessionOpen, totalScore, leaderboard, addScoreOnce, uid, proportionalScore, scoreRule } from '../src/lib/domain.ts';
import { readFileSync } from 'node:fs';

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok -', name); };

t('تصحيح اختيار متعدد', () => {
  const q = { type: 'mcq', points: 10, correct: 'تشرفت بمقابلتك', options: [], id:'', sessionId:'', levelId:'', scope:'word', prompt:'' };
  assert.equal(gradeQuestion(q, 'تشرفت بمقابلتك').score, 10);
  assert.equal(gradeQuestion(q, 'غلط').score, 0);
});
t('الإجابة الكتابية تنتظر المراجعة', () => {
  const q = { type: 'short', points: 20, correct: '', options: [], id:'', sessionId:'', levelId:'', scope:'session', prompt:'' };
  assert.deepEqual(gradeQuestion(q, 'Hi, I am Mariem'), { score: 0, auto: false });
});
t('ترتيب الكلمات', () => {
  const q = { type: 'order', points: 15, correct: ['Can','I','have'], options: [], id:'', sessionId:'', levelId:'', scope:'session', prompt:'' };
  assert.equal(gradeQuestion(q, 'Can|I|have').score, 15);
  assert.equal(gradeQuestion(q, 'I|Can|have').score, 0);
});
t('حالة الجلسة تتبع الإكمال والاعتماد', () => {
  const s = { id:'s1', levelId:'l1', order:1, title:'', topic:'', dueAt:'', sections:[{id:'a',title:'',body:''},{id:'b',title:'',body:''}] };
  const base = { users:[], levels:[], sessions:[s], questions:[], attempts:[], progress:[], tasks:[], taskCompletions:[], notifications:[], scores:[], savedWords:[], dictionary:[], certificates:[], logs:[], settings:{ scoreRules:{}, leaderboard:{enabled:true,nameMode:'first',period:'weekly',hidden:[]}, quizDefaults:{attempts:2,passScore:70,durationMin:10}, reminders:{inactivityDays:3,reminderHours:24} } };
  assert.equal(sessionStatus(base, s, 'stu').key, 'locked');
  base.progress.push({ id:'p1', studentId:'stu', sessionId:'s1', sectionId:'a', completedAt:'' });
  assert.equal(sessionStatus(base, s, 'stu').key, 'progress');
  base.attempts.push({ id:'a1', studentId:'stu', sessionId:'s1', questionId:'q', answer:'', autoScore:0, maxScore:10, status:'pending', createdAt:'' });
  assert.equal(sessionStatus(base, s, 'stu').key, 'review');
  base.attempts[0].status = 'approved';
  assert.equal(sessionStatus(base, s, 'stu').key, 'approved');
  assert.equal(levelProgress(base, 'l1', 'stu'), 100);
});
t('نطاق المستويات من أول ليفل لآخر ليفل', () => {
  const levels = [{ id: 'l1', order: 1 }, { id: 'l2', order: 2 }, { id: 'l3', order: 3 }, { id: 'l4', order: 4 }];
  const u = { id: 'u', name: '', email: '', role: 'student', active: true, levelId: 'l2', maxLevelId: 'l3', createdAt: '' };
  assert.equal(canOpenLevel(u, levels[0], levels), true);
  assert.equal(canOpenLevel(u, levels[3], levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l2', order: 3 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l3', order: 5 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l1', order: 1 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l1', order: 2 }, levels), false);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l4', order: 1 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l4', order: 2 }, levels), false);
});
t('نطاق مستوى واحد: أول ليفل = آخر ليفل', () => {
  const levels = [{ id: 'l1', order: 1 }, { id: 'l7', order: 7 }, { id: 'l8', order: 8 }];
  const u = { id: 'u', name: '', email: '', role: 'student', active: true, subscribed: true, levelId: 'l7', maxLevelId: 'l7', createdAt: '' };
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l7', order: 4 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l1', order: 1 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l1', order: 2 }, levels), false);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l8', order: 2 }, levels), false);
});
t('غير المشترك: أول سيشن فقط من كل ليفل حتى لو النطاق واسع', () => {
  const levels = [{ id: 'l1', order: 1 }, { id: 'l2', order: 2 }, { id: 'l7', order: 7 }];
  const u = { id: 'u', name: '', email: '', role: 'student', active: true, subscribed: false, levelId: 'l1', maxLevelId: 'l7', createdAt: '' };
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l1', order: 1 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l1', order: 2 }, levels), false);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l7', order: 1 }, levels), true);
  assert.equal(sessionOpen(u, { id: 's', levelId: 'l7', order: 3 }, levels), false);
});
t('النقاط لا تُحتسب مرتين لنفس النشاط', () => {
  const d = { scores:[], settings:{} };
  assert.equal(addScoreOnce(d, {studentId:'u',source:'study',points:10,refId:'x'}), true);
  assert.equal(addScoreOnce(d, {studentId:'u',source:'study',points:10,refId:'x'}), false);
  assert.equal(totalScore(d, 'u'), 10);
});
t('اللوحة تخفي الطلاب الموقوفين والمخفيين', () => {
  const d = { users:[
    {id:'a',name:'مريم أحمد',role:'student',active:true},
    {id:'b',name:'يوسف مصطفى',role:'student',active:false},
    {id:'c',name:'نور علي',role:'student',active:true},
  ], scores:[{studentId:'a',points:5,refId:'1'},{studentId:'c',points:9,refId:'2'}], settings:{ leaderboard:{enabled:true,nameMode:'first',period:'weekly',hidden:['c']} } };
  const b = leaderboard(d);
  assert.equal(b.length, 1);
  assert.equal(b[0].name, 'مريم');
  assert.equal(b[0].points, 5);
});
t('معرّف فريد', () => { assert.notEqual(uid(), uid()); });

// ---- نظام النقاط: مفيش نقاط مجانية ----
const student = readFileSync(new URL('../src/pages/Student.tsx', import.meta.url), 'utf8');
const fnBody = (name) => { const i = student.indexOf(`async function ${name}(`); assert.ok(i > 0, name); return student.slice(i, student.indexOf('\n  }\n', i)); };
t('نقاط نسبية: كل صح = كل النقاط', () => assert.equal(proportionalScore(10, 10, 10), 10));
t('نقاط نسبية: نص الدرجة = نص النقاط', () => assert.equal(proportionalScore(5, 10, 10), 5));
t('نقاط نسبية: صفر = صفر نقاط', () => assert.equal(proportionalScore(0, 10, 10), 0));
t('نقاط نسبية: لا تتخطى الحد الأقصى ولا تقل عن صفر', () => { assert.equal(proportionalScore(99, 10, 10), 10); assert.equal(proportionalScore(-3, 10, 10), 0); assert.equal(proportionalScore(5, 0, 10), 0); });
t('mark() مفيهاش نقاط مجانية', () => assert.ok(!fnBody('mark').includes('grantScore')));
t('markWord() مفيهاش نقاط مجانية', () => assert.ok(!fnBody('markWord').includes('grantScore')));
t('savePractice() مفيهاش نقاط مجانية', () => assert.ok(!fnBody('savePractice').includes('grantScore')));
t('submitGrammar() و submitWordQuiz() بيستخدموا النقاط النسبية', () => { for (const n of ['submitGrammar', 'submitWordQuiz']) assert.ok(fnBody(n).includes('proportionalScore'), n); });
t('قواعد النقاط الجديدة ليها قيم افتراضية', () => { for (const k of ['taskPending', 'taskApproved', 'speakingExercise', 'writingExercise']) assert.ok(scoreRule({}, k) > 0, k); assert.equal(scoreRule({ taskApproved: 9 }, 'taskApproved'), 9); });
t('نفس النشاط لا يتحسب مرتين (اعتماد التاسك)', () => {
  const d = { scores: [] };
  assert.equal(addScoreOnce(d, { studentId: 'a', source: 'task', points: 5, refId: 'task-approved-t1' }), true);
  assert.equal(addScoreOnce(d, { studentId: 'a', source: 'task', points: 5, refId: 'task-approved-t1' }), false);
  assert.equal(d.scores.length, 1);
});

console.log(`\n${pass} tests passed`);

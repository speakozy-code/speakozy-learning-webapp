// اختبارات منطق المجال - تعمل مباشرة على ملف TypeScript بفضل type stripping في Node الحديث
import assert from 'node:assert/strict';
import { gradeQuestion, sessionStatus, levelProgress, canOpenLevel, totalScore, leaderboard, addScoreOnce, uid } from '../src/lib/domain.ts';

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
t('فتح المستوى محدود بحد المسؤول', () => {
  const u = { id:'u', name:'', email:'', role:'student', active:true, levelId:'l1', maxLevelId:'l1', createdAt:'' };
  assert.equal(canOpenLevel(u, {id:'l1',order:1}, [{id:'l1',order:1},{id:'l2',order:2}]), true);
  assert.equal(canOpenLevel(u, {id:'l2',order:2}, [{id:'l1',order:1},{id:'l2',order:2}]), false);
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

console.log(`\n${pass} tests passed`);

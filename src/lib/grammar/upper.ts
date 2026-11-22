import { T, type GrammarMap } from './types.ts';

export const GRAMMAR_UPPER: GrammarMap = {
  'l7-s1': [
    T('Second Conditional', 'If + Past Simple, would / could / might + base verb', 'بنستخدمه لموقف خيالي أو مستبعد في الحاضر أو المستقبل. بعد if بنستخدم Past Simple وفي النتيجة would أو could أو might. ومع الفعل to be بنقول were حتى مع I وhe وshe.', ['If I were the CEO, I would give everyone more autonomy.', 'If he maintained his professionalism, he would get a promotion.', "If I didn't need the money, I would resign tomorrow."], [['If I would be the CEO, I would change it.', 'If I were the CEO, I would change it.'], ['If I have the money, I would resign.', 'If I had the money, I would resign.']]),
  ],
  'l7-s2': [
    T('Third Conditional', 'If + Past Perfect, would have + V3', 'بنستخدمه لماضي ما حصلش ونتخيل نتيجته. الموقف خلاص مش هيتغير. بعد if بنحط had + V3، والنتيجة would have + V3. غالباً بيعبر عن ندم أو فخر.', ["If I hadn't overslept, I wouldn't have missed my flight.", 'If I had talked to my dad enough, I would have told him a lot.', "If they had invited me, I would have gone."], [['If I would have studied, I would have passed.', 'If I had studied, I would have passed.'], ["If I hadn't overslept, I wouldn't miss my flight.", "If I hadn't overslept, I wouldn't have missed my flight."]]),
  ],
  'l7-s3': [
    T('Emphatic do', 'do / does / did + base verb', 'بنزود do أو does أو did قبل الفعل الأساسي في الجملة المثبتة عشان نقوي المعنى أو نوضح إننا فعلاً قصدنا كده أو نعترض على كلام اتقال. بعدها الفعل من غير s ومن غير ed.', ['I do believe your story.', 'She does like ice cream.', 'He did go to school yesterday.', 'Stop shouting, I did take the trash out.'], [['She does likes ice cream.', 'She does like ice cream.'], ['He did went to school.', 'He did go to school.']]),
  ],
  'l7-s4': [
    T('wish / If only', 'wish + Past Simple (present) · wish + Past Perfect (past) · wish + would (change)', 'بنستخدم wish أو if only للتمني. الزمن بيرجع خطوة لورا: للحاضر بنستخدم Past Simple، وللماضي Past Perfect، ولسلوك نتمنى يتغير في المستقبل would.', ['I wish I had more free time. (present)', 'I wish I had studied harder. (past)', 'If only it would stop raining. (future)'], [['I wish I have more time.', 'I wish I had more time.'], ['I wish I studied harder last year.', 'I wish I had studied harder last year.']]),
  ],
  'l7-s5': [
    T('Impersonal passive', 'It is / was + V3 + that + clause', 'بنستخدمه لما نقول معلومة من غير ما نحدد مين قالها: It is said that the castle is haunted بدل People say. وبنستخدمه في الأخبار والتقارير. it هنا ما بتشيرش لحاجة معينة.', ['It is said that the French Revolution changed the world forever.', 'It is believed that this ancient conflict started over a piece of land.', 'It was reported that the company had lost money.'], [['It is believed that the city is discovered recently.', 'It is believed that the city was discovered recently.'], ['He was said to be the winner tomorrow.', 'He is said to be the winner.']]),
  ],
  'l7-s6': [
    T('Past modals of deduction', 'must have + V3 · can\'t have + V3 · might have + V3', 'بنستنتج بيها حاجة عن الماضي. must have لما تكون متأكد إنها حصلت، وcan\'t have لما تكون متأكد إنها ما حصلتش، وmight have لما تكون مش متأكد.', ["She must have left the house. I couldn't find her.", "He can't have stayed. He had lots of work to do.", "He didn't come today. He might have been ill."], [['He must have went home.', 'He must have gone home.'], ["I'm sure she didn't see it: she mustn't have seen it.", "I'm sure she didn't see it: she can't have seen it."]]),
  ],
  'l7-s7': [
    T('Present Perfect and Past Simple', 'Present Perfect = connected to now · Past Simple = finished past', 'Present Perfect دايماً بيقول حاجة عن دلوقتي. Past Simple بيتكلم عن الماضي بس. ما بنستخدمش Present Perfect لو مفيش ارتباط بالحاضر أو لو الوقت معروف.', ['What have you done at school today? (the day is not over)', 'What did you do at school today? (the day is over)', 'Jack grew a beard but now he has shaved it off.', 'The Chinese invented printing.'], [['Shakespeare has written many plays.', 'Shakespeare wrote many plays.'], ['I have seen him last week.', 'I saw him last week.']]),
  ],
  'l11-s1': [
    T('Giving and justifying opinions', 'I agree / I disagree + because … · To some extent … but …', 'مفيش قاعدة نحوية واحدة هنا، لكن الدرس بيعتمد على لغة التعبير عن الرأي. قول رأيك ووضح السبب، ولو مش متأكد استخدم عبارات تخفف زي to some extent وin my view.', ['I agree because everyone needs something different.', "I don't agree that you must be rich to be happy.", 'To some extent, I agree with the speaker.', 'In my view, happiness is a journey, not a goal.'], [['I am agree with him.', 'I agree with him.'], ["I don't agree that money is everything because it's not.", "I don't agree that money is everything, because happiness depends on more."]]),
  ],
  'l11-s2': [
    T('Questions with used to and passive', 'Did + subject + use to + verb? · be + asked / inspired to + verb', 'الأسئلة في الدرس بتستخدم تراكيب سبق شرحها: Did you use to … ؟ وبعد use to بنحط الفعل الأصلي. وبنستخدم passive مع asked: How often are you asked to meet deadlines؟ وبعد inspired نقول to + الفعل.', ['Did you use to be more enthusiastic about learning?', 'How often are you asked to meet deadlines?', 'What inspired you to choose your profession?', 'What motivates you to learn English?'], [['Did you used to be enthusiastic?', 'Did you use to be enthusiastic?'], ['What inspired you choose this job?', 'What inspired you to choose this job?']]),
  ],
};

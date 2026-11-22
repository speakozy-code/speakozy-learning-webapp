import { T, type GrammarMap } from './types.ts';

export const GRAMMAR_INTER: GrammarMap = {
  'l4-s1': [
    T('Present Perfect vs Past Simple', 'have/has + V3 · V2 with a finished time', 'Present Perfect لخبرة أو حاجة لسه أثرها موجود دلوقتي ومن غير وقت محدد. Past Simple لحاجة خلصت في وقت معروف زي yesterday أو in 2018.', ['I have lost my keys. (I don\'t have them now)', 'I lost my keys yesterday.', 'She has worked here for 3 years. (still working)', 'She worked there in 2018. (not now)'], [['I have visited Italy last year.', 'I visited Italy last year.'], ['They have got married in 2020.', 'They got married in 2020.']]),
  ],
  'l4-s2': [
    T('Reasons: because / as / because of / due to', 'because / as + clause · because of / due to + noun', 'بعد because وas بنحط جملة كاملة فيها فاعل وفعل. وبعد because of وdue to بنحط اسم بس. due to أكتر رسمية.', ['I stayed home because I was sick.', 'I stayed home because of the rain.', 'The match was cancelled due to bad weather.'], [['I stayed home because the rain.', 'I stayed home because of the rain.'], ['She was late because of she was sick.', 'She was late because she was sick.']]),
    T('Results: so / therefore / that\'s why / as a result', 'cause, so result · cause. Therefore, result', 'so بتيجي في نص الجملة بعد فاصلة. أما therefore وas a result فبتبدأ الجملة الجديدة وبعدها فاصلة. وthat\'s why بتشرح السبب اللي قبلها.', ['I was tired, so I went to bed early.', 'I was tired. Therefore, I left early.', "I didn't sleep well. That's why I was tired.", 'He worked hard. As a result, he passed.'], [['I was tired, because I went to bed early.', 'I was tired, so I went to bed early.']]),
  ],
  'l4-s3': [
    T('Quantifiers', 'many/few/fewer + countable · much/little/less + uncountable', 'many وfew وfewer مع المعدود، وmuch وlittle وless مع غير المعدود. a few وa little معناها فيه شوية كفاية، لكن few وlittle لوحدهم معناها قليل جداً.', ["There aren't many cafés near here.", 'Do you watch much TV?', 'I have very little time for myself.', 'There are fewer flights in the winter.'], [['I have less friends than before.', 'I have fewer friends than before.'], ['How much people came?', 'How many people came?']]),
    T('too / enough', 'too + adj · too much/many + noun · enough + noun', 'too معناها أكتر من اللازم ومشكلة: too noisy. وenough معناها كفاية: enough parks. وenough بتيجي بعد الصفة: big enough.', ["It's too big and too noisy.", "There's too much traffic.", 'There are too many tourists.', "There aren't enough parks."], [['There is too many noise.', 'There is too much noise.'], ['The room is enough big.', 'The room is big enough.']]),
  ],
  'l4-s4': [
    T('Passive voice', 'be + past participle (V3)', 'بنستخدم المبني للمجهول لما الفاعل مجهول أو مش مهم والمهم الحدث نفسه. بنحافظ على نفس الزمن في be: The room is cleaned وThe room was cleaned وThe road is being repaired. وبنضيف by لو عايزين نذكر الفاعل.', ['My phone was stolen.', 'The road is being repaired.', 'The room is cleaned every day.', 'Was the room cleaned?'], [['My phone stolen yesterday.', 'My phone was stolen yesterday.'], ['The room cleaned every day.', 'The room is cleaned every day.']]),
  ],
  'l4-s5': [
    T('Three ways to talk about the future', 'will · be going to · am/is/are + verb-ing', 'will لقرار لحظي ساعة الكلام. be going to لخطة قررناها قبل كده. والحاضر المستمر لموعد اتحدد ورتبنا له.', ["The phone's ringing. I'll answer it.", "I'm going to travel tomorrow. (my plan)", "I'm meeting John at 6. (arranged)"], [["I'm going to answer it now, the phone is ringing.", "I'll answer it now."], ["I will meet John at 6, we fixed it yesterday.", "I'm meeting John at 6."]]),
  ],
  'l4-s6': [
    T('Past modals: should / could / must have', 'should / could / must + have + V3', 'should have لندم أو لوم على حاجة ما اتعملتش. could have لفرصة ضاعت أو قدرة ما استخدمناهاش. must have لاستنتاج أكيد عن الماضي.', ['I should have invested it well. (regret)', 'I could have bought gold. (lost chance)', 'I lost all my money. I must have been careless.'], [['I should have study more.', 'I should have studied more.'], ['I must had been tired.', 'I must have been tired.']]),
  ],
  'l4-s7': [
    T('unless / even if / in case', 'unless = if not · even if = no matter what · in case = to be ready', 'unless معناها if not: We will run out of water unless we conserve it. even if بتقول إن النتيجة مش هتتغير. in case بنعمل حاجة دلوقتي احتياطاً لشيء ممكن يحصل بعدين.', ["Unless you hurry up, we're going to leave.", "Even if we recycle every bottle, pollution will still exist.", 'Governments should invest in renewable energy in case oil prices rise.'], [["Unless you don't hurry, we will leave.", 'Unless you hurry, we will leave.'], ['Take an umbrella in case it will rain.', 'Take an umbrella in case it rains.']]),
  ],
  'l5-s1': [
    T('Past tenses working together', 'Past Perfect = backstory · Past Simple = main event · Past Continuous = background', 'تخيل الحكاية فيلم: Past Perfect هو اللي حصل قبل الأحداث، وPast Simple هو الحدث الرئيسي، وPast Continuous هو الخلفية اللي كانت شغالة.', ['I had bought a map before I left.', 'I found a cafe while I was looking for the hotel.', 'It was raining when we arrived.'], [['When I arrived, the film already started.', 'When I arrived, the film had already started.']]),
  ],
  'l5-s2': [
    T('Present Perfect Continuous vs Simple', 'have/has been + verb-ing · have/has + V3', 'Present Perfect Continuous بيركز على المجهود والمدة: I have been painting my room for two hours. أما Present Perfect Simple فبيركز على النتيجة أو العدد: I have painted three rooms.', ['I have been painting my room all day.', 'I have painted three rooms.', 'She has been learning English since 2022.', 'I have drunk three cups of coffee today.'], [['I have been knowing him for years.', 'I have known him for years.'], ['I have been painting three rooms.', 'I have painted three rooms.']]),
  ],
  'l5-s3': [
    T('Verb patterns: stop / remember / try', 'verb + -ing vs verb + to + verb', 'stop + ing معناها بطّلت العادة، وstop + to معناها وقفت عشان أعمل حاجة تانية. remember + ing ذكرى من الماضي، وremember + to مهمة لازم أعملها. try + ing تجربة، وtry + to مجهود لحاجة صعبة.', ['I stopped buying useless things.', 'I stopped to buy some water.', 'I remember buying this jacket 5 years ago.', "Remember to lock the door."], [['I remember to lock the door yesterday.', 'I remember locking the door yesterday.'], ['She stopped to smoke last year.', 'She stopped smoking last year.']]),
  ],
  'l5-s4': [
    T('be allowed to · had better · be supposed to', 'be allowed to + verb · had better + verb · be supposed to + verb', 'be allowed to للقواعد والتصريح الرسمي. had better تحذير أقوى من should ومعاه نتيجة سيئة لو ما عملتش. be supposed to للتوقع أو الواجب اللي المفروض يحصل. وبعد had better مفيش to.', ['Students are allowed to use phones in the break.', 'We had better stop using so much plastic.', 'You are supposed to arrive at 9.'], [['You had better to leave now.', 'You had better leave now.'], ['We are not allow to park here.', 'We are not allowed to park here.']]),
  ],
  'l5-s5': [
    T('Purpose clauses', 'to / in order to + verb · so that + clause', 'بنقول ليه بنعمل الحاجة. to الأبسط، وin order to أكتر رسمية. وso that بيتبعها جملة كاملة غالباً فيها can أو will. ما بنستخدمش for مع الفعل.', ['I drink coffee to stay awake.', 'We launch campaigns in order to attract customers.', 'I speak slowly so that everyone can understand.'], [['I drink coffee for stay awake.', 'I drink coffee to stay awake.'], ['I study hard so that to pass.', 'I study hard so that I can pass.']]),
  ],
  'l5-s6': [
    T('Passive voice in all tenses', 'object + be (any tense) + V3', 'بنستخدم الـpassive في أخبار الجرائم والتقارير لأن الحدث أو الضحية أهم من الفاعل. be بتتغير حسب الزمن: is stolen وwas stolen وhas been stolen وwill be stolen، وV3 ثابتة.', ['A car is stolen every day.', 'The car was stolen yesterday.', 'The suspect has been arrested.', 'The case will be closed soon.'], [['The suspect has arrested.', 'The suspect has been arrested.'], ['The car was steal.', 'The car was stolen.']]),
  ],
  'l5-s7': [
    T('Double comparatives', 'The + comparative, the + comparative', 'بنوضح بيها إن تغيّر بيسبب تغيّر تاني: The more you scroll, the more you spend.', ['The more brand-conscious you are, the more you pay.', 'The older I get, the wiser I become.', 'The more time I spend online, the less I sleep.'], [['The more you scroll, more you spend.', 'The more you scroll, the more you spend.']]),
    T('Modifiers of comparison', 'much / far / a lot + comparative · slightly / a bit + comparative', 'much وfar وa lot بتوضح فرق كبير. slightly وa little وa bit بتوضح فرق صغير. بنحطهم قبل الصفة المقارنة.', ['This phone is much more expensive.', 'The new model is far better.', 'It is slightly cheaper than the old one.'], [['This is very more expensive.', 'This is much more expensive.']]),
  ],
  'l5-s8': [
    T('Narrative tenses', 'Past Continuous (scene) · Past Simple (events) · Past Perfect (before)', 'عشان تحكي قصة مقنعة بتمزج التلاتة: Past Continuous ترسم المشهد، وPast Simple تحكي الأحداث، وPast Perfect ترجع بيها لحاجة حصلت قبل.', ['I was walking in the garden when I found a box.', 'I opened it and saw an old letter.', 'Someone had buried it years ago.'], [['I was finding a box.', 'I found a box.'], ['When I opened it, someone buried it before.', 'When I opened it, I realised someone had buried it before.']]),
  ],
  'l6-s1': [
    T('Reported speech', 'say / tell + one tense back', 'لما بننقل كلام حد بنرجع خطوة في الزمن وبنغير الضمائر والظروف: am → was، will → would، tomorrow → the next day. وبنستخدم told مع اسم الشخص: told me. وsaid من غيره.', ['Direct: "I am tired." → She said she was tired.', 'Direct: "I will call you." → He told me he would call me.', 'Direct: "I am working." → Sarah said she was working.'], [['She said me she was tired.', 'She told me she was tired.'], ['He said he will call me.', 'He said he would call me.']]),
  ],
  'l6-s2': [
    T('Future Perfect vs Future Continuous', 'will have + V3 · will be + verb-ing', 'Future Perfect لحاجة هتبقى خلصت قبل وقت محدد في المستقبل: By 2050, we will have solved it. Future Continuous لحاجة هتكون شغالة في وقت محدد: In 2050, we will be living on Mars.', ['By 2050, we will have reduced carbon emissions.', 'In 2050, we will be living in smart cities.', 'By next year, I will have finished my course.'], [['By 2050 we will be solved it.', 'By 2050 we will have solved it.'], ['At 8 tomorrow I will have worked.', 'At 8 tomorrow I will be working.']]),
  ],
  'l6-s3': [
    T('Present Perfect and Past Simple together', 'Present Perfect = achievement up to now · Past Simple = specific event', 'Present Perfect للإنجاز من غير تحديد الوقت. Past Simple لما نذكر التفاصيل والوقت. في قصة النجاح بنبدأ بـ Present Perfect وبعدين نفصّل بـ Past Simple.', ['He has won five Olympic medals.', 'He won his first medal in 2012.', "I've started three companies. I started the first one in 2015."], [['He has won a medal in 2012.', 'He won a medal in 2012.']]),
  ],
  'l6-s4': [
    T('Defining vs non-defining relative clauses', 'defining: no commas · non-defining: , who/which … ,', 'الجملة المحددة بتدينا معلومة أساسية ومن غيرها المعنى ناقص، وما بنحطش فاصلتين. وغير المحددة معلومة إضافية ممكن نشيلها، وبنحطها بين فاصلتين. ومع غير المحددة ما بنستخدمش that.', ['My brother who lives in Paris is a doctor. (I have more than one brother)', 'My brother, who lives in Paris, is a doctor. (I have only one brother)', 'The book that I bought yesterday is great.'], [['My mother, that is a nurse, works here.', 'My mother, who is a nurse, works here.']]),
  ],
  'l6-s5': [
    T('Modals of deduction in the past', 'might / could have + V3 · must / can\'t have + V3', 'might have وcould have لاحتمال حوالي 50%. must have لاستنتاج شبه أكيد إنه حصل، وcan\'t have لاستنتاج شبه أكيد إنه ما حصلش. بنبني على دليل.', ["He didn't reply. He might have fallen asleep.", 'He was online five minutes ago. He must have seen it!', "She can't have forgotten. She wrote it down."], [['He must have forget it.', 'He must have forgotten it.'], ["She mustn't have seen it.", "She can't have seen it."]]),
  ],
  'l6-s6': [
    T('have / get something done', 'have / get + object + V3', 'بنستخدمه لما حد تاني بيعمل الحاجة بدالنا. البناء ثابت في كل الأزمنة: Subject + have/get + object + V3.', ['I had my contract checked by a lawyer.', 'I need to get my passport renewed.', 'He had his fine reduced by the judge.', 'We will have the house painted next week.'], [['I checked my contract by a lawyer.', 'I had my contract checked by a lawyer.'], ['I have my car repair.', 'I have my car repaired.']]),
  ],
  'l6-s7': [
    T('used to · be used to · get used to', 'used to + verb · be used to + verb-ing · get used to + verb-ing', 'used to لعادة في الماضي ومبقتش. be used to يعني الحاجة بقت عادية عندي. get used to يعني بتعود تدريجياً. بعد be used to وget used to بنحط اسم أو verb-ing.', ['I used to eat junk food.', 'I am used to waking up at 6 AM.', 'It took me a month to get used to my new routine.'], [['I am used to wake up early.', 'I am used to waking up early.'], ['I used to waking up late.', 'I used to wake up late.']]),
  ],
};

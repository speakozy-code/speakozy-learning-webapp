import { T, type GrammarMap } from './types.ts';

export const GRAMMAR_PRE: GrammarMap = {
  'l8-s1': [
    T('Present Continuous', 'am / is / are + verb-ing', 'بنستخدمه للحاجة اللي بتحصل دلوقتي في اللحظة دي. بنكوّنه من am أو is أو are + الفعل مع ing. للنفي بنزود not، وللسؤال بنقدّم am/is/are على الفاعل.', ["I'm listening to you now.", 'She is not working today.', 'What are you doing now?', 'Are they studying English?'], [['I listening to music.', 'I am listening to music.'], ['He is work now.', 'He is working now.']]),
  ],
  'l8-s2': [
    T('Comparatives', 'short: adj + er + than · long: more + adj + than', 'بنقارن بيها بين حاجتين بس. الصفة القصيرة بنزود لها er: tall → taller. والصفة الطويلة بنحط قبلها more: expensive → more expensive. وبعدهم دايماً than.', ['Ahmed is taller than Omar.', 'The train is faster than the bus.', 'A taxi is more expensive than the subway.', 'The metro is better than the bus.'], [['A taxi is more fast than a bus.', 'A taxi is faster than a bus.'], ['Ahmed is taller that Omar.', 'Ahmed is taller than Omar.']]),
  ],
  'l8-s3': [
    T('Present Simple vs Present Continuous', 'routine: verb(s) · now / arrangement: am/is/are + verb-ing', 'Present Simple للروتين والعادات: She drinks coffee every morning. أما Present Continuous فللحاجة اللي بتحصل دلوقتي أو لترتيب مستقبلي متفق عليه: I am meeting my manager tomorrow.', ['I wake up at 7 every day.', 'She drinks coffee every morning.', 'I am taking the course this month.', 'I am meeting my manager tomorrow.'], [['I am wake up at 7.', 'I wake up at 7.'], ['She is drinks coffee now.', 'She is drinking coffee now.']]),
  ],
  'l8-s4': [
    T('-ed vs -ing adjectives', '-ed = how you feel · -ing = what causes it', 'الصفة اللي بتنتهي بـ ed بتوصف إحساس الشخص: I am bored. والصفة اللي بتنتهي بـ ing بتوصف الحاجة اللي سببت الإحساس: The lesson is boring.', ['I am tired because the work is tiring.', 'She is bored because the book is boring.', 'We are excited because the plan is exciting.'], [['The lesson is bored.', 'The lesson is boring.'], ['I am boring in the class.', 'I am bored in the class.']]),
  ],
  'l8-s5': [
    T('be going to', 'am / is / are + going to + verb', 'بنستخدمه للخطط اللي قررناها قبل ما نتكلم. للسؤال بنقدّم am/is/are: Are you going to travel alone? والإجابة القصيرة: Yes, I am. أو No, I\'m not.', ['I am going to pack my suitcase tonight.', 'She is not going to buy any souvenirs.', 'Are you going to take photos?', "Yes, I am. / No, I'm not."], [['I going to stay in a hotel.', 'I am going to stay in a hotel.'], ['She is going to buys a ticket.', 'She is going to buy a ticket.']]),
  ],
  'l8-s6': [
    T('Superlatives', 'the + adj + est · the most + adj', 'بنقارن بيها حاجة واحدة بمجموعة كاملة. الصفة القصيرة: the tallest. ولو بتنتهي بـ y بنغيرها: the busiest. والطويلة: the most interesting. والشاذة: good → the best وbad → the worst وfar → the furthest.', ['My boss is the busiest person in the company.', 'My best friend is the most reliable guy.', 'He is the best boss in the world.', 'That was the worst movie.'], [['He is the most tall player.', 'He is the tallest player.'], ['That was the baddest film.', 'That was the worst film.']]),
  ],
  'l8-s7': [
    T('will', 'will + base verb', 'بنستخدم will في أربع حالات: قرار لحظي، وعرض مساعدة، ووعد، وتوقع من غير دليل قوي. بعد will الفعل من غير to. النفي won\'t.', ['The chocolate is on sale. I will buy two!', 'Your bags look heavy. I will help you.', "I promise I won't forget the milk!", 'I think it will be crowded.'], [['I will to help you.', 'I will help you.'], ['She will goes tomorrow.', 'She will go tomorrow.']]),
  ],
  'l9-s1': [
    T('Past Simple vs Past Continuous', 'finished action: verb-ed · action in progress: was / were + verb-ing', 'Past Simple لحاجة خلصت. Past Continuous لحاجة كانت شغالة في وقت معين. وبنستخدم while مع الحدث الطويل، وwhen مع الحدث القصير اللي قاطع.', ['They arrived home on Thursday.', 'I was watching TV at 8 pm.', 'He was watching TV while he was eating.', 'When her phone rang, she was watching TV.'], [['I was watch TV at 8.', 'I was watching TV at 8.'], ['We was eating when he called.', 'We were eating when he called.']]),
  ],
  'l9-s2': [
    T('Questions with be and did', 'Be + subject …? · Did + subject + base verb?', 'مع verb to be بنقدّم am/is/are/was/were على الفاعل: Are you ready? ومع الأفعال العادية في الماضي بنستخدم did والفعل بعده بشكله الأصلي.', ['You are ready. → Are you ready?', 'Was Mona at home?', 'Did you see the film?', 'Where did they go?'], [['Did she called you?', 'Did she call you?'], ['You are ready?', 'Are you ready?']]),
  ],
  'l9-s3': [
    T('Zero Conditional', 'If + Present Simple, Present Simple', 'بنستخدمه للحقائق والقواعد اللي صح 100% دايماً. الجملتين في الحاضر البسيط. ولو الجملة بدأت بـ if بنحط فاصلة بعدها.', ['If you skip too many lectures, you fail the course.', 'If students miss a deadline, the professor gives them a zero.', 'If you heat ice, it melts.'], [['If you will heat ice, it melts.', 'If you heat ice, it melts.']]),
  ],
  'l9-s4': [
    T('used to', 'used to + verb · didn\'t use to + verb', 'بنستخدم used to للعادات والحالات اللي كانت في الماضي ومبقتش دلوقتي. في النفي والسؤال بنقول use to من غير d لأن didn\'t وdid هم اللي شايلين الماضي.', ['I used to play tennis when I was young.', 'She used to be married.', "They didn't use to go out together.", 'Did she use to be single?'], [["She didn't used to be married.", "She didn't use to be married."], ['He use to be single.', 'He used to be single.'], ['They used to going out.', 'They used to go out.']]),
  ],
  'l9-s5': [
    T('First Conditional', 'If + Present Simple, will + base verb', 'بنستخدمه لموقف حقيقي ممكن يحصل في المستقبل. بعد if بنستخدم الحاضر البسيط مش will. ولو الجملة بدأت بالنتيجة ما بنحطش فاصلة.', ['If you take my phone, I will be so mad!', 'I will earn a good salary if I work long hours.', "If you don't study, you won't pass."], [['If I will get a promotion, I will be happy.', 'If I get a promotion, I will be happy.'], ['If he work hard, he will succeed.', 'If he works hard, he will succeed.']]),
  ],
  'l9-s6': [
    T('Present Perfect for experiences', 'have / has + past participle', 'بنستخدمه لخبرات في حياتنا من غير ما نحدد إمتى. مع I وyou وwe وthey بنقول have، ومع he وshe وit بنقول has. لو قلنا وقت محدد زي yesterday بنرجع للـ Past Simple.', ["I've played this game.", 'She has worked in a team.', 'Have you ever quit a job?', "Yes, I have. / No, I haven't."], [['I have eat snake meat.', 'I have eaten snake meat.'], ['I have seen him yesterday.', 'I saw him yesterday.']]),
  ],
  'l9-s7': [
    T('for vs since', 'for + period · since + starting point', 'for مع المدة: for five years. وsince مع نقطة البداية: since 2021. وبنستخدمهم مع Present Perfect.', ['I have lived in Cairo for 5 years.', 'I have lived in Cairo since 2021.', 'We have studied English since January.'], [['I have lived here since five years.', 'I have lived here for five years.'], ['She has worked there for 2020.', 'She has worked there since 2020.']]),
    T('already / just / yet', 'have + already / just … · … yet?', 'already معناها خلاص حصل. just يعني من لحظات. yet بتيجي في آخر الجملة في السؤال والنفي.', ['I have already bought my shoes.', 'She has just left.', 'Have you finished yet?', "I haven't called him yet."], [["I haven't finished already.", "I haven't finished yet."]]),
  ],
  'l10-s1': [
    T('Past Perfect', 'had + past participle', 'بنستخدمه لما يكون فيه حدثين في الماضي ونوضح مين حصل الأول. الحدث الأقدم بنحطه في Past Perfect والأحدث في Past Simple.', ['When Kevin arrived, the class had already started.', 'After my son had gone to bed, I watched a movie.', 'She had left when he arrived.'], [['When I arrived, she has left.', 'When I arrived, she had left.'], ['She had went home.', 'She had gone home.']]),
  ],
  'l10-s2': [
    T('Extreme adjectives', 'absolutely / completely + extreme adjective', 'الصفة القوية زي exhausted وhuge وfreezing ليها معنى very جواها، فما بنقولش very معاها. بنستخدم absolutely أو completely بدالها.', ['I am exhausted. (very tired)', 'The house is huge. (very big)', 'It is freezing today. (very cold)', 'The joke was hilarious. (very funny)'], [['It is very freezing.', 'It is absolutely freezing.'], ['She is very exhausted.', 'She is completely exhausted.']]),
  ],
  'l10-s3': [
    T('much / many / a lot of', 'many + countable · much + uncountable · a lot of + both', 'many مع المعدود: many books. much مع غير المعدود: much sugar. وهم غالباً في النفي والأسئلة. أما في الجملة المثبتة فبنستخدم a lot of أو lots of.', ['How many books do you have?', 'How much sugar is there?', "I don't have much time.", 'She has a lot of friends.'], [['How much books do you have?', 'How many books do you have?'], ['I have many money.', 'I have a lot of money.']]),
  ],
  'l10-s4': [
    T('Gap fillers for natural speaking', 'Well… · Let me think… · You know…', 'الكلمات دي بتديك وقت تفكر من غير ما تسكت. استخدم واحدة أو اتنين بس مش كتير. Well لبداية الإجابة، وLet me think لما تحتاج ثواني، وFirst of all لترتيب الأفكار.', ['Well, plastic is very bad for wildlife.', 'Let me think… I would say yes.', "That's a good question.", 'First of all, we should recycle.']),
  ],
  'l10-s5': [
    T('Relative clauses', 'who (people) · which (things) · that (both) · where (places)', 'بنستخدمهم عشان نربط جملتين. who للناس، وwhich للحاجات، وthat للاتنين، وwhere للأماكن. ما بنكررش الضمير بعدهم: the phone that I use مش that I use it.', ["He's the doctor who looked after your grandmother.", 'This is the machine which we used.', "She's the girl that lives next door.", 'This is the city where I was born.'], [['This is the phone that I use it at work.', 'This is the phone that I use at work.'], ['He is the man which helped us.', 'He is the man who helped us.']]),
  ],
  'l10-s6': [
    T('can / could for ability and requests', 'can = now · could = past or polite', 'can لقدرة دلوقتي، وcould لقدرة كانت في الماضي. وفي الطلبات can غير رسمي مع الأصحاب، وcould أكتر أدباً مع الزملاء والغرباء.', ['I can speak English fluently.', 'I could run fast when I was young.', 'Can you open the window?', 'Could you help me, please?']),
    T('must / might / may / can\'t for deduction', 'must = sure · might / may = possible · can\'t = sure it is not', 'بنخمن بيها بناءً على دليل. must لما تكون متأكد 100%، وcan\'t لما تكون متأكد إنه مستحيل، وmight وmay لما تكون مش متأكد.', ['He has a Ferrari. He must be rich.', "He can't be tired. He just woke up.", 'He might be sleeping, or he may be driving.'], [["He must to be rich.", 'He must be rich.']]),
  ],
  'l10-s7': [
    T('either … or / neither … nor', 'either A or B · neither A nor B', 'either…or بتختار واحد من اتنين. وneither…nor معناها لا ده ولا ده. الفعل بعد neither يفضل مثبت لأن neither نفسها نفي: I like neither Facebook nor Twitter.', ['You can use either Instagram or TikTok.', 'You can either delete the app or mute your friends.', 'I like neither Facebook nor Twitter.'], [["I don't like neither Facebook nor Twitter.", 'I like neither Facebook nor Twitter.'], ['You can use either Instagram nor TikTok.', 'You can use either Instagram or TikTok.']]),
  ],
};

// Hand-reviewed Arabic meanings (the Google Translate output was context-free) and missing examples.
export const META = new Set(["noun","nouns","verb","verbs","adverb","adverbs","adjectives","pronoun","pronouns","plurals","possessive","passive","active","conditional","tense","tenses","grammar","rule","rules","past","present","perfect","continuous","second","third","type","clause","clauses","commas","agent","narrative","don't","isn't","he's","she's","going","goes","likes","eating","playing","bought","found","cleaned","happened","believed","back","down","away","well","even","case","give","learn","talk","tell","english","story","john","samy","quito","frequency","object","after","base","everyday","daily","tasks","simple","myself","specific","details","extra","text","action","media","video","speaker","count","countable","uncountable","polite","round","quotes","underneath","topic","agree","approach","class","share","always","message","reply","digital","clock","unless","hidden","meeting","feel","checklists","leaves","spell","free","cons","energy","pollution","agenda","personality","mind","school"]);

export const FIX = {
  german:'ألماني', drink:'يشرب', platform:'رصيف المحطة', train:'قطار', leave:'يغادر', false:'خاطئ', earache:'ألم الأذن', fare:'أجرة التذكرة',
  patient:'صبور', organized:'منظم', careful:'حريص', 'problem-solving':'القدرة على حل المشكلات', 'cheer up':'يرفع معنوياته', reservation:'حجز',
  motel:'فندق صغير على الطريق', classmate:'زميل دراسة', acquaintance:'شخص تعرفه معرفة سطحية', 'get along':'ينسجم مع', aisle:'ممر بين الأرفف',
  groceries:'مشتريات البقالة', wrinkles:'تجاعيد', complexion:'لون البشرة', loose:'واسع', match:'يتناسب مع', casual:'كاجوال (غير رسمي)', smart:'أنيق',
  'put on':'يرتدي', clean:'نظيف', fit:'يناسب (المقاس)', 'try on':'يجرّب (ملابس)', suit:'بدلة', discount:'خصم', fancy:'فاخر', 'shopping cart':'عربة التسوق',
  'take back':'يرجع (البضاعة)', 'break the bank':'يكلّف مبلغاً ضخماً', hire:'يوظّف', fire:'يفصل من الوظيفة', bonus:'مكافأة', unemployed:'عاطل عن العمل',
  colleague:'زميل عمل', entertainment:'الترفيه', homebody:'شخص يحب البقاء في البيت', voluntary:'تطوعي', 'couch potato':'شخص كسول يقضي وقته جالساً',
  hiking:'المشي في الطبيعة', crush:'إعجاب بشخص', confess:'يعترف', date:'موعد غرامي', chemistry:'انسجام عاطفي', arguments:'مشاجرات', kindergarten:'روضة أطفال',
  'head teacher':'مدير المدرسة', dean:'عميد الكلية', curriculum:'المنهج الدراسي', scholarship:'منحة دراسية', assignment:'واجب', engagement:'خطوبة',
  'bachelor party':'حفلة توديع العزوبية', compatible:'متوافق', harmony:'انسجام', honeymoon:'شهر العسل', 'show off':'يتباهى', ambitious:'طموح',
  broke:'مفلس', loan:'قرض', withdraw:'يسحب (من الحساب)', 'rip-off':'سعر مبالغ فيه', 'cost-effective':'اقتصادي ومجدٍ', debt:'دَين', overspend:'ينفق أكثر من اللازم', frugal:'مقتصد',
  sue:'يرفع دعوى قضائية', 'hit it off':'ينسجم بسرعة مع شخص', 'clear the air':'يصفّي الأجواء', 'pay through the nose':'يدفع مبلغاً مبالغاً فيه', 'turn over a new leaf':'يبدأ صفحة جديدة',
  'carry on':'يستمر', pursue:'يسعى وراء', overcome:'يتغلب على', strict:'صارم', 'give up':'يستسلم', 'cut in':'يقاطع / يتخطى الطابور', 'take after':'يشبه أحد والديه',
  'tell off':'يوبّخ', reminisce:'يتذكر الماضي بحنين', milestone:'محطة مهمة', overprotective:'مفرط في الحماية', curfew:'موعد الرجوع للبيت', chew:'يمضغ',
  guarantee:'ضمان', inconvenience:'إزعاج', eradicate:'يقضي على', consistency:'الاستمرارية', resilience:'القدرة على التعافي', dedication:'التفاني', clutter:'الأشياء المكدسة',
  hoarder:'شخص يكدّس الأشياء', minimalism:'البساطة', cramped:'ضيق ومزدحم', accumulate:'يتراكم', bystander:'شخص يتفرج دون تدخل', literacy:'القدرة على القراءة والكتابة',
  absorb:'يستوعب', assessment:'تقييم', syllabus:'المنهج الدراسي', compulsory:'إجباري', intensive:'مكثّف', forensics:'علم الأدلة الجنائية', shoplifting:'السرقة من المحلات',
  warrant:'أمر قضائي', prosecutor:'وكيل النيابة', investigate:'يحقق في', smuggle:'يهرّب', shopaholic:'مدمن تسوق', 'retail therapy':'التسوق للترفيه عن النفس',
  counterfeit:'مقلّد', affordable:'بسعر مناسب', extravagant:'مسرف', splurge:'ينفق ببذخ', 'high-end':'فاخر', retailer:'تاجر تجزئة', credible:'موثوق', scrutinize:'يدقق في',
  biased:'متحيّز', propaganda:'دعاية سياسية', 'echo chamber':'فقاعة تكرر نفس الآراء', endorse:'يؤيّد', notorious:'سيئ السمعة', conservation:'الحفاظ على البيئة',
  renewable:'متجدد', depletion:'استنزاف', catastrophic:'كارثي', prominence:'الشهرة', reciprocity:'المعاملة بالمثل', bombard:'يغرق بالرسائل', articulate:'يعبّر بوضوح',
  'wipe out':'يمسح تماماً', verdict:'الحكم', perpetrator:'الجاني', incarcerate:'يسجن', alibi:'حجة غياب', lethargic:'خامل', nutritious:'مغذٍّ', recuperate:'يتعافى',
  wholesome:'صحي ومفيد', sedentary:'قليل الحركة', hydration:'شرب الماء الكافي', mindfulness:'اليقظة الذهنية', 'fit as a fiddle':'في أتم صحة', pitch:'عرض تسويقي',
  demographic:'فئة سكانية', inflation:'التضخم', intuition:'الحدس', analyze:'يحلل', burnout:'الإرهاق الوظيفي', addiction:'الإدمان', ancient:'قديم جداً',
  professionalism:'الاحترافية', resign:'يستقيل', hypothetical:'افتراضي', corporate:'خاص بالشركات', 'cutting-edge':'متطور جداً', 'tech-savvy':'خبير بالتكنولوجيا', adapt:'يتأقلم',
  gadget:'جهاز صغير', 'start over':'يبدأ من جديد', 'generation gap':'فجوة الأجيال', lenient:'متساهل', spoiled:'مدلل', nostalgia:'الحنين للماضي', considerate:'يراعي مشاعر الآخرين',
  courtesy:'المجاملة', etiquette:'آداب السلوك', hospitality:'كرم الضيافة', defective:'به عيب', 'artificial intelligence':'الذكاء الاصطناعي', inconvenienc:'إزعاج',
  tired:'مرهق', stimulating:'محفّز', enthusiastic:'متحمس', rewarding:'مُجزٍ', inspires:'يلهم', approach:'أسلوب', generation:'جيل', sure:'متأكد',
};
export const FIX_SESSION = { 'l3-s4|cold':'نزلة برد', 'l1-s6|cold':'بارد' };

export const EX = {
  interviewer:'The interviewer asked me about my last job.', actor:'My uncle is an actor in a TV series.', artist:'She is a talented artist.', officer:'The police officer helped us find the street.',
  phone:'My phone is on the table.', laptop:'I work on my laptop every day.', notebook:'Write the new words in your notebook.', uncle:'My uncle lives in Alexandria.', parents:'My parents are both teachers.',
  visit:'I visit my grandparents every Friday.', bill:'Can we have the bill, please?', pharmacy:'I bought some medicine at the pharmacy.', bakery:'The bakery opens at six in the morning.',
  'bus stop':'I wait for the bus at the bus stop.', crosswalk:'Use the crosswalk to cross the street.', 'traffic lights':'Turn left at the traffic lights.', 'gas station':'There is a gas station on the corner.',
  roundabout:'Take the second exit at the roundabout.', elevator:'The elevator is next to the stairs.', kitchen:'My mother is cooking in the kitchen.', wardrobe:'My clothes are in the wardrobe.',
  fridge:'There is some milk in the fridge.', bookshelf:'The bookshelf is next to the window.', rug:'There is a red rug in the living room.', hotel:'We stayed in a small hotel near the beach.',
  plane:'The plane leaves at ten o\'clock.', restaurant:'We had dinner at a new restaurant.', menu:'Can I see the menu, please?', swimming:'Swimming is good for your back.',
  'ticket office':'The ticket office opens at nine.', 'pedestrian crossing':'Use the pedestrian crossing to cross the road.', tunnel:'The train goes through a long tunnel.', fare:'The bus fare is five pounds.',
  'problem-solving':'Problem-solving is an important skill at work.', motel:'We slept in a cheap motel on the highway.', partner:'I work with a very helpful partner.', entertainment:'The hotel has free entertainment every evening.',
  'couch potato':'My brother is a couch potato; he watches TV all day.', chemistry:'There was real chemistry between them on the first date.', kindergarten:'My daughter starts kindergarten in September.',
  dean:'The dean of the faculty spoke to the students.', curriculum:'The new curriculum includes more speaking practice.', scholarship:'She won a scholarship to study abroad.', 'bachelor party':'His friends planned a bachelor party for him.',
  'try on':'Can I try on these jeans?', 'shopping cart':'Put the milk in the shopping cart.', 'break the bank':'This dress is nice and it won\'t break the bank.', 'artificial intelligence':'Artificial intelligence can translate languages in seconds.',
  'cutting-edge':'The lab uses cutting-edge technology.', 'tech-savvy':'My niece is very tech-savvy.', mediation:'The couple chose mediation instead of going to court.', 'generation gap':'There is a generation gap between my father and me.',
  milestone:'Learning to walk is a big milestone for a baby.', overprotective:'My parents were overprotective when I was young.', reminisce:'We love to reminisce about our school days.', curfew:'My parents set a curfew of ten o\'clock.',
  nostalgia:'The old song filled him with nostalgia.', etiquette:'Table etiquette is different in every country.', 'cut in':'It is rude to cut in line.', defective:'I returned the defective phone to the shop.',
  inconvenience:'We apologise for any inconvenience.', 'cost-effective':'Buying in bulk is more cost-effective.', 'rip-off':'Fifty dollars for a coffee is a rip-off.', procrastination:'Procrastination is the enemy of success.',
  dedication:'Her dedication to her work is amazing.', resilience:'Children show great resilience after difficult times.', clutter:'I need to clear the clutter from my desk.', hoarder:'He is a hoarder and never throws anything away.',
  minimalism:'Minimalism means living with fewer things.', accountability:'Accountability is important in every team.', bystander:'A bystander called the police.', initiative:'She took the initiative and organised the event.',
  literacy:'Digital literacy is a key skill today.', comprehension:'The test has a reading comprehension part.', assessment:'The final assessment is next week.', syllabus:'The teacher gave us the syllabus on the first day.',
  forensics:'Forensics experts examined the room.', shoplifting:'Shoplifting is a crime.', attorney:'The attorney spoke to the judge.', bribery:'Bribery is illegal in every country.', smuggle:'They tried to smuggle gold across the border.',
  consumerism:'Consumerism makes people buy things they do not need.', 'retail therapy':'She goes shopping for retail therapy after a bad day.', retailer:'The retailer offers free delivery.', 'pay through the nose':'I refuse to pay through the nose for coffee.',
  credible:'Only share news from credible sources.', bombard:'Journalists bombard the star with questions.', deterrent:'Cameras are a good deterrent against crime.', perpetrator:'The police arrested the perpetrator.',
  incarcerate:'The judge decided to incarcerate him for two years.', loophole:'The company found a loophole in the law.', lethargic:'I feel lethargic after a big meal.', nutritious:'Fruit and vegetables are nutritious.',
  recuperate:'He needs a week to recuperate after the surgery.', wholesome:'My grandmother cooks wholesome meals.', hydration:'Hydration is important in hot weather.', mindfulness:'Mindfulness helps me stay calm.',
  professionalism:'His professionalism impressed the manager.', intuition:'My intuition told me something was wrong.', analyze:'We analyze the data every Monday.', demographic:'Young adults are our main demographic.',
  celebrity:'The celebrity signed autographs for the fans.', castle:'We visited an old castle on the hill.', burnout:'Long hours can lead to burnout.', addiction:'Phone addiction is a growing problem.', failure:'Failure is part of learning.',
  video:'We watched a short video in class.', agent:'The travel agent booked our flights.', checklists:'Pilots use checklists before every flight.', pollution:'Air pollution is a problem in big cities.', energy:'Solar energy is clean.', agenda:'What is on the agenda today?',
};
export const NEW = `l1-s3|country|noun|دولة|an area with its own government|Egypt is a big country.
l1-s3|nationality|noun|جنسية|the country you belong to|My nationality is Egyptian.
l1-s3|Egyptian|adjective|مصري|from Egypt|She is Egyptian.
l1-s3|American|adjective|أمريكي|from the United States|He is American.
l1-s3|British|adjective|بريطاني|from the United Kingdom|My teacher is British.
l1-s3|French|adjective|فرنسي|from France|They are French.
l1-s3|Italian|adjective|إيطالي|from Italy|I love Italian food.
l1-s3|Japanese|adjective|ياباني|from Japan|My friend is Japanese.
l1-s3|Spanish|adjective|إسباني|from Spain|He speaks Spanish.
l1-s6|red|adjective|أحمر|the colour of blood|She has a red bag.
l1-s6|green|adjective|أخضر|the colour of grass|The grass is green.
l1-s6|yellow|adjective|أصفر|the colour of the sun|I have a yellow shirt.
l1-s6|big|adjective|كبير|large in size|It is a big house.
l1-s6|small|adjective|صغير|not big|I have a small car.
l1-s6|old|adjective|قديم / كبير في السن|not new|This is an old book.
l1-s6|new|adjective|جديد|recently made|I have a new phone.
l2-s3|hobby|noun|هواية|something you enjoy doing in your free time|My hobby is drawing.
l2-s3|swim|verb|يسبح|to move through water|I swim every Friday.
l2-s3|cook|verb|يطبخ|to prepare food|She likes to cook for her family.
l2-s3|draw|verb|يرسم|to make a picture with a pencil|He draws very well.
l2-s3|gym|noun|نادي رياضي|a place where you exercise|I go to the gym on Mondays.
l2-s3|camping|noun|التخييم|sleeping outside in a tent|We love camping in the desert.
l2-s3|chess|noun|شطرنج|a board game for two players|My father plays chess.
l2-s3|photography|noun|التصوير|taking photographs|Photography is my favourite hobby.
l3-s2|website|noun|موقع إلكتروني|a place on the internet with pages of information|I visit this website every day.
l3-s2|download|verb|ينزّل|to copy a file from the internet|I download films at night.
l3-s2|search|verb|يبحث|to look for information|I search for recipes online.
l3-s2|password|noun|كلمة المرور|a secret word to enter an account|Do not share your password.
l3-s2|email|noun|بريد إلكتروني|a message sent on the internet|I sent an email to my boss.
l3-s2|screen|noun|شاشة|the part of a phone or TV you look at|The screen is very big.
l3-s2|connection|noun|اتصال|a link to the internet|My internet connection is slow.
l3-s2|click|verb|ينقر|to press a button on a mouse|Click on this link.
l3-s6|waiter|noun|نادل|a man who serves food in a restaurant|The waiter brought our drinks.
l3-s6|bill|noun|الحساب|the paper that shows how much you pay|Can we have the bill, please?
l3-s6|dessert|noun|حلوى|sweet food after the main meal|I'd like a chocolate dessert.
l3-s6|starter|noun|مقبلات|a small dish before the main meal|I'll have soup as a starter.
l3-s6|tip|noun|بقشيش|extra money you give to a waiter|We left a tip for the waiter.
l3-s6|vegetarian|adjective|نباتي|not eating meat|I am vegetarian.
l3-s6|reserve|verb|يحجز|to arrange to keep a table|I want to reserve a table for four.
l3-s7|team|noun|فريق|a group of players|Our team is very good.
l3-s7|win|verb|يفوز|to be the best in a game|We want to win the match.
l3-s7|lose|verb|يخسر|not to win|They lose every week.
l3-s7|score|verb|يسجل هدفاً|to get a goal or point|He scored two goals.
l3-s7|coach|noun|مدرب|a person who trains a team|The coach is very strict.
l3-s7|stadium|noun|ملعب|a large place for sports matches|The stadium is full of fans.
l3-s7|tennis|noun|تنس|a game played with rackets|I play tennis on Saturdays.
l8-s1|tall|adjective|طويل|high in height|My brother is very tall.
l8-s1|slim|adjective|نحيف|thin in a nice way|She is tall and slim.
l8-s1|curly|adjective|مجعد|having curls|He has curly hair.
l8-s1|bald|adjective|أصلع|having no hair on the head|My uncle is bald.
l8-s1|beard|noun|لحية|hair on a man's face|He has a short beard.
l8-s1|freckles|noun|نمش|small brown spots on the skin|She has freckles on her nose.
l8-s1|good-looking|adjective|وسيم / جميل|attractive|He is a good-looking man.
l8-s1|elderly|adjective|مسن|old (polite)|An elderly man helped me.
l8-s3|reliable|adjective|يُعتمد عليه|you can trust him to do the work|She is a reliable colleague.
l8-s3|hard-working|adjective|مجتهد|working with a lot of effort|He is a hard-working student.
l8-s3|creative|adjective|مبدع|good at having new ideas|A creative designer made this logo.
l8-s3|confident|adjective|واثق|sure about yourself|She is confident in meetings.
l8-s3|honest|adjective|صادق|always telling the truth|He is an honest person.
l8-s3|punctual|adjective|ملتزم بالمواعيد|always on time|Our manager is punctual.
l8-s4|excited|adjective|متحمس|very happy about something|I'm excited about the trip.
l8-s4|worried|adjective|قلق|thinking about problems|She is worried about the exam.
l8-s4|relaxed|adjective|مرتاح|calm and comfortable|I feel relaxed on holiday.
l8-s4|frustrated|adjective|محبط|annoyed because you cannot do something|He is frustrated with the traffic.
l8-s4|surprised|adjective|متفاجئ|feeling that something is unexpected|I was surprised by the news.
l8-s4|confused|adjective|مرتبك|not understanding|I am confused about this rule.
l8-s5|luggage|noun|الأمتعة|bags you take on a trip|My luggage is very heavy.
l8-s5|passport|noun|جواز السفر|a document you need to travel abroad|Don't forget your passport.
l8-s5|itinerary|noun|خطة الرحلة|a plan of a journey|Our itinerary includes three cities.
l8-s5|souvenir|noun|هدية تذكارية|something you buy to remember a place|I bought a souvenir for my mother.
l8-s5|sightseeing|noun|زيارة المعالم السياحية|visiting interesting places|We went sightseeing in Luxor.
l8-s5|check in|verb|يسجّل الوصول|to register at a hotel or airport|We check in at two o'clock.
l8-s7|trolley|noun|عربة التسوق|a cart for shopping|I pushed the trolley to the checkout.
l8-s7|checkout|noun|الكاشير|the place where you pay|There is a long queue at the checkout.
l8-s7|queue|noun|طابور|a line of people waiting|We waited in a long queue.
l8-s7|shelf|noun|رف|a flat board for things|The milk is on the top shelf.
l8-s7|fresh|adjective|طازج|recently made or picked|These vegetables are fresh.
l8-s7|frozen|adjective|مجمّد|stored at a very cold temperature|I bought frozen pizza.
l8-s7|bargain|noun|سعر مغرٍ|something cheap and good|This jacket was a bargain.
l9-s1|pastime|noun|وسيلة تسلية|something you do for fun|Reading is my favourite pastime.
l9-s1|concert|noun|حفلة موسيقية|a live music show|We went to a concert last night.
l9-s1|exhibition|noun|معرض|a public show of art or objects|The art exhibition opens on Friday.
l9-s1|relax|verb|يسترخي|to rest and feel calm|I relax by listening to music.
l9-s2|propose|verb|يتقدم للزواج|to ask someone to marry you|He proposed to her on the beach.
l9-s2|trust|noun|ثقة|believing someone is honest|Trust is important in a relationship.
l9-s2|break up|verb|ينفصل|to end a relationship|They broke up last year.
l9-s3|lecture|noun|محاضرة|a talk at university|The lecture starts at nine.
l9-s3|degree|noun|درجة علمية|a university qualification|She has a degree in law.
l9-s3|semester|noun|فصل دراسي|half of an academic year|The new semester starts in February.
l9-s3|graduate|verb|يتخرج|to finish university|I graduate next summer.
l9-s3|deadline|noun|موعد التسليم|the last time to finish a task|The deadline is on Friday.
l9-s4|wedding|noun|حفل زفاف|a marriage ceremony|Their wedding was beautiful.
l9-s4|spouse|noun|زوج أو زوجة|a husband or wife|Please bring your spouse.
l9-s4|anniversary|noun|ذكرى سنوية|a day you remember each year|Today is our anniversary.
l9-s4|marry|verb|يتزوج|to become husband or wife|They want to marry next year.
l9-s5|outgoing|adjective|اجتماعي|friendly and sociable|He is outgoing and loves parties.
l9-s5|shy|adjective|خجول|nervous with other people|She is shy in big groups.
l9-s5|generous|adjective|كريم|happy to give|My uncle is very generous.
l9-s5|stubborn|adjective|عنيد|refusing to change your mind|He is too stubborn to listen.
l9-s5|moody|adjective|متقلب المزاج|often changing from happy to sad|She is moody in the morning.
l9-s5|easy-going|adjective|سهل التعامل|relaxed and not easily upset|My boss is easy-going.
l9-s6|salary|noun|راتب|money you get every month|My salary is paid on the first.
l9-s6|interview|noun|مقابلة عمل|a meeting to get a job|I have a job interview tomorrow.
l9-s6|employer|noun|صاحب العمل|a person who gives you a job|My employer is very kind.
l9-s6|resign|verb|يستقيل|to leave your job|He decided to resign.
l10-s1|automation|noun|الأتمتة|using machines to do work|Automation is changing factories.
l10-s1|privacy|noun|الخصوصية|keeping your information private|Online privacy is important.
l10-s1|update|noun|تحديث|a new version of software|Please install the update.
l10-s1|device|noun|جهاز|a machine like a phone|Turn off your device.
l10-s3|separation|noun|انفصال|living apart from a partner|Their separation was peaceful.
l10-s3|custody|noun|حضانة|the legal right to look after a child|She has custody of the children.
l10-s3|settlement|noun|تسوية|an agreement after a dispute|They reached a settlement.
l10-s3|argument|noun|مشاجرة|an angry discussion|They had a long argument.
l10-s5|rude|adjective|وقح|not polite|It is rude to interrupt.
l10-s5|manners|noun|آداب التعامل|polite ways of behaving|Children must learn good manners.
l10-s5|apologise|verb|يعتذر|to say sorry|I apologise for being late.
l10-s6|refund|noun|استرداد المال|money given back|I asked for a refund.
l10-s6|complaint|noun|شكوى|saying you are not happy|I made a complaint to the manager.
l10-s6|replace|verb|يستبدل|to give something new instead|They will replace the phone.
l10-s6|compensation|noun|تعويض|money paid for a problem|We received compensation for the delay.
l4-s1|budget|noun|ميزانية|a plan for spending money|We have a small budget.
l4-s1|savings|noun|مدخرات|money you keep in the bank|I use my savings for travel.
l4-s1|afford|verb|يقدر مادياً|to have enough money to buy|I can't afford a new car.
l4-s1|invest|verb|يستثمر|to put money in something to make more|He invests in property.
l4-s3|achieve|verb|يحقق|to succeed in doing something|She achieved her goal.
l4-s3|effort|noun|جهد|hard work|Success needs effort.
l4-s3|goal|noun|هدف|something you want to achieve|My goal is to speak fluently.
l4-s3|motivation|noun|دافع|the reason you want to do something|Motivation helps me study.
l4-s4|director|noun|مخرج|the person who makes a film|The director won an award.
l4-s4|audience|noun|الجمهور|people watching a show|The audience loved the film.
l4-s4|scene|noun|مشهد|a part of a film|My favourite scene is at the end.
l4-s4|script|noun|سيناريو|the written words of a film|The script was written in a month.
l4-s5|headline|noun|عنوان خبر|the title of a news story|The headline was shocking.
l4-s5|journalist|noun|صحفي|a person who writes news|The journalist asked a good question.
l4-s5|viral|adjective|منتشر بسرعة|spreading fast online|The video went viral.
l4-s5|fake news|noun|أخبار كاذبة|false information in the news|Fake news spreads fast on social media.
l5-s1|algorithm|noun|خوارزمية|a set of rules for a computer|The algorithm chooses what you see.
l5-s1|data|noun|بيانات|information stored on a computer|Companies collect a lot of data.
l5-s1|robot|noun|روبوت|a machine that can do tasks|A robot cleans our floor.
l5-s1|machine learning|noun|تعلّم الآلة|computers learning from data|Machine learning improves translation.
l5-s2|willpower|noun|قوة الإرادة|the strength to do what you decide|It takes willpower to wake up early.
l5-s2|routine|noun|روتين|things you do regularly|A morning routine helps me.
l5-s2|setback|noun|انتكاسة|a problem that slows you down|A small setback should not stop you.
l5-s2|discipline|noun|الانضباط|controlling yourself to reach a goal|Discipline is the key to success.
l5-s8|heritage|noun|التراث|traditions from the past|We are proud of our heritage.
l5-s8|ancestor|noun|جد من الأجداد|a family member from long ago|My ancestors came from Upper Egypt.
l5-s8|tradition|noun|تقليد|a custom passed down|It is a tradition to eat together.
l5-s8|belong|verb|ينتمي|to feel part of a group|I feel I belong here.
l6-s3|champion|noun|بطل|the winner of a competition|He is a world champion.
l6-s3|medal|noun|ميدالية|a prize you wear|She won a gold medal.
l6-s3|talent|noun|موهبة|a natural skill|He has a talent for music.
l6-s3|determination|noun|العزيمة|not giving up|Her determination is amazing.
l6-s4|bond|noun|رابطة|a strong connection|There is a strong bond between them.
l6-s4|loyalty|noun|الولاء|staying faithful to someone|Loyalty is rare these days.
l6-s4|reconcile|verb|يتصالح|to become friends again|They finally reconciled.
l6-s5|misinterpret|verb|يسيء الفهم|to understand wrongly|She misinterpreted my message.
l6-s5|notification|noun|إشعار|a message on your phone|I got a notification from the bank.
l6-s5|typo|noun|خطأ مطبعي|a small mistake in typing|There is a typo in your email.
l7-s2|subconscious|noun|العقل الباطن|the part of the mind you are not aware of|Dreams come from the subconscious.
l7-s2|instinct|noun|غريزة|a natural way of reacting|I followed my instinct.
l7-s2|bias|noun|تحيّز|an unfair preference|We should avoid bias.
l7-s2|perception|noun|إدراك|the way you see something|His perception of money changed.
l7-s6|anxiety|noun|القلق|a feeling of worry|Exercise can reduce anxiety.
l7-s6|stress|noun|ضغط نفسي|pressure and worry|Work stress affects sleep.
l7-s6|therapy|noun|العلاج النفسي|treatment by talking|Therapy helped him a lot.
l7-s6|cope|verb|يتأقلم مع|to deal with a problem|She copes well with pressure.
l7-s7|quit|verb|يقلع عن|to stop doing something|He quit smoking last year.
l7-s7|procrastinate|verb|يماطل|to delay doing something|I procrastinate before exams.
l7-s7|craving|noun|رغبة شديدة|a strong wish for something|I have a craving for sweets.
l7-s7|junk food|noun|وجبات سريعة|unhealthy fast food|Junk food is bad for you.
l11-s1|contentment|noun|الرضا|a feeling of being satisfied|He found contentment in a simple life.
l11-s1|myth|noun|خرافة|a false but popular belief|It is a myth that money buys happiness.
l11-s1|fulfilment|noun|الإشباع الداخلي|a feeling of satisfaction|Her job gives her fulfilment.
l11-s1|gratitude|noun|الامتنان|being thankful|She wrote about her gratitude.
l11-s2|extrinsic|adjective|خارجي|coming from outside|Money is an extrinsic motivation.
l11-s2|inspire|verb|يلهم|to make someone want to do something|Her story inspires me.
l11-s2|stimulating|adjective|محفّز|interesting and exciting|It was a stimulating discussion.
l11-s2|enthusiastic|adjective|متحمس|very interested and excited|She is enthusiastic about learning.
l11-s2|deadline|noun|موعد التسليم|the last time to finish a task|I work better with a deadline.`;

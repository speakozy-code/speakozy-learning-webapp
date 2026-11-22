import { T, type GrammarMap } from './types.ts';

export const GRAMMAR_E: GrammarMap = {
  'l1-s1': [
    T('Verb to be: I am / You are', 'I am · You are', 'بنستخدم am وare عشان نقول اسمنا وبلدنا وسننا. مع I بنقول am، ومع you بنقول are. والاختصار شائع جداً: I\'m وyou\'re.', ["I'm Nadia.", 'I am from Egypt.', 'You are a student.', "I'm twenty-five."], [['I are from Egypt.', 'I am from Egypt.'], ['You is a student.', 'You are a student.']]),
    T('Negative and questions with be', 'I am not · You are not · Are you …?', 'للنفي بنزود not بعد am أو are. وللسؤال بنقدّم are على الفاعل. والإجابة القصيرة بتكرر am أو are: Yes, I am. أو No, I\'m not.', ["I'm not from Canada.", 'Are you a student?', 'Yes, I am.', "No, I'm not."], [['You not are a teacher.', 'You are not a teacher.'], ["Yes, I'm.", 'Yes, I am.']]),
  ],
  'l1-s2': [
    T('He / She / It + is', 'He is · She is · It is', 'مع he وshe وit بنستخدم is. he للراجل، وshe للست، وit للحاجة أو الحيوان. وبنقدر نختصر: he\'s وshe\'s وit\'s. قبل الوظيفة بنحط a أو an.', ['He is a bus driver.', "She's a nurse.", 'She is an actor.', "It's four dollars."], [['He are a doctor.', 'He is a doctor.'], ['She a nurse.', 'She is a nurse.']]),
    T('isn\'t and questions with is', 'He isn\'t … · Is she …?', 'للنفي بنقول isn\'t أو is not. وللسؤال بنقدّم is على he/she/it. والإجابة القصيرة: Yes, he is. مش Yes, he\'s.', ["He isn't in London.", 'It is not from Egypt.', 'Is she an actor?', 'Yes, she is.'], [["Is he a doctor? Yes, he's.", 'Is he a doctor? Yes, he is.'], ["She not is a nurse.", "She isn't a nurse."]]),
  ],
  'l1-s3': [
    T('We / You / They + are', 'We are · You are · They are', 'مع we وyou وthey بنستخدم are. we يعني أنا وغيري، وthey يعني ناس تانيين. بعد are بنحط الجمع من غير a: They are students.', ['We are students.', "They're Colombian.", 'You are my friends.', 'Are they from Brazil?'], [['We is students.', 'We are students.'], ['They are a students.', 'They are students.']]),
    T('Country vs nationality', 'I am from Italy → I am Italian', 'الدولة حاجة والجنسية حاجة. بنقول I\'m from Egypt للدولة، وI\'m Egyptian للجنسية. الجنسية غالباً بتنتهي بـ -an أو -ish أو -ese: Brazilian وBritish وJapanese.', ["I'm from Japan. I'm Japanese.", 'She is from France. She is French.', 'They are from Germany. They are German.'], [['I am from Egyptian.', 'I am from Egypt.'], ["I'm Italy.", "I'm Italian."]]),
  ],
  'l1-s4': [
    T('a / an', 'a + consonant sound · an + vowel sound', 'بنستخدم a قبل الصوت الساكن (a bag)، وan قبل صوت العلة (an umbrella). المهم الصوت مش الحرف: an hour لكن a university. والصفة ما بتتجمعش.', ['a bag', 'an umbrella', 'an actor', 'a big bag'], [['I have a umbrella.', 'I have an umbrella.'], ['a bigs bag', 'a big bag']]),
    T('Plurals', '+s · +es · y → ies', 'الجمع غالباً بنزود s: key → keys. لو الكلمة بتنتهي بـ ch أو s أو sh أو x بنزود es: watch → watches. ولو بتنتهي بساكن + y بنشيل y ونزود ies: country → countries.', ['two bags', 'three watches', 'many countries', 'five keys'], [['two watchs', 'two watches'], ['three countrys', 'three countries']]),
    T('have / has', 'I/you/we/they have · he/she/it has', 'مع I وyou وwe وthey بنقول have، ومع he وshe وit بنقول has. وبنستخدم the لما نتكلم عن حاجة واحدة معروفة: Close the door.', ['I have a passport.', 'She has an umbrella.', 'They have two phones.', 'Close the door.'], [['He have a laptop.', 'He has a laptop.']]),
  ],
  'l1-s5': [
    T('Possessive adjectives', 'my · your · his · her · its · our · their + noun', 'بنستخدمهم قبل الاسم عشان نقول الحاجة بتاعة مين. my بتاعي، your بتاعك، his بتاعه، her بتاعها، our بتاعنا، their بتاعهم. ما بنحطش the معاهم.', ['This is my book.', 'Her sister is a doctor.', 'Their house is very big.', 'What is your name?'], [['She name is Fatima.', 'Her name is Fatima.'], ['They dog is cute.', 'Their dog is cute.']]),
    T("Possessive 's", "name + 's + noun", "لما نقول إن حاجة بتاعة شخص بنزود 's للاسم: Ali's car. ما بنقولش the car of Ali. ولو الكلمة جمع وبتنتهي بـ s بنزود ' بس: my parents' house.", ["This is Ali's car.", "My brother's name is Omar.", "Sarah is John's wife.", "My parents' house is beautiful."], [['This is the book of my brother.', "This is my brother's book."]]),
  ],
  'l1-s6': [
    T('Subject and object pronouns', 'I → me · he → him · she → her · we → us · they → them', 'الـobject pronoun بييجي بعد الفعل أو بعد حرف جر زي to وfor وwith وabout، عشان ما نكررش الاسم. ما بنقولش love she، بنقول love her.', ['I call her every day.', 'The children love him.', 'Do you want to play with us?', "My father doesn't listen to me."], [['Everybody likes she.', 'Everybody likes her.'], ['Please listen to I!', 'Please listen to me!'], ["I can't answer they.", "I can't answer them."]]),
  ],
  'l1-s7': [
    T('Present Simple: positive', 'I / You / We / They + verb', 'بنستخدم الحاضر البسيط للعادات والروتين. مع I وyou وwe وthey بنحط الفعل زي ما هو من غير أي إضافة.', ['I wake up at 7:00 AM.', 'We go to the beach in August.', 'They have dinner late.'], [['I wakes up at 7.', 'I wake up at 7.']]),
    T('Present Simple: negative and questions', "don't + verb · Do + subject + verb?", 'للنفي بنحط don\'t قبل الفعل. وللسؤال بنبدأ بـ Do. والفعل بعدهم دايماً بشكله الأصلي. والإجابة القصيرة: Yes, I do. أو No, I don\'t.', ["I don't wake up early on Friday.", 'They don\'t watch TV every day.', 'Do you have breakfast in the morning?', "Yes, I do. / No, I don't."], [['I no watch TV.', "I don't watch TV."], ['Do you goes to school?', 'Do you go to school?']]),
    T('in + month', 'in May · in July', 'قبل أسماء الشهور بنقول in دايماً: in May، in October. مش on ولا at.', ['My birthday is in May.', 'I go to Alexandria in July.', 'Do you have a holiday in August?'], [['I go to Alexandria on July.', 'I go to Alexandria in July.']]),
  ],
  'l2-s1': [
    T('Present Simple for daily routine', 'I / you / we / they + base verb', 'بنوصف بيه يومنا: I wake up وI brush my teeth. للنفي don\'t، وللسؤال Do، وممكن نبدأ السؤال بكلمة استفهام: What do you do in the evening?', ['I wake up at 7.', "I don't eat breakfast at home.", 'What do you do in the evening?', 'Do you work on Sundays?'], [['I wakes up at 7.', 'I wake up at 7.'], ['Do you work? Yes, I work.', 'Do you work? Yes, I do.']]),
    T('Telling the time', "It's … o'clock · half past · a quarter to/past", "للساعة بالظبط بنقول o'clock. وبنقول half past للنص، وa quarter past للربع، وa quarter to قبل الساعة بربع.", ["It's two o'clock.", "It's half past eight.", "It's a quarter to three.", "It's three fifteen."]),
  ],
  'l2-s2': [
    T('He / She / It + verb-s', 'he / she / it + verb + s', 'مع he وshe وit بنزود s للفعل: works. لو الفعل بينتهي بـ ch أو sh أو s أو x أو o بنزود es: watches وgoes. ولو ساكن + y بنغيرها ies: studies. وhave بتبقى has.', ['Marko lives in Vienna.', 'She watches TV at night.', 'My son goes to bed at nine.', 'Rachel studies in the evening.'], [['Rachel studys in the evening.', 'Rachel studies in the evening.'], ['My son gos to bed at nine.', 'My son goes to bed at nine.']]),
    T('doesn\'t and Does …?', "doesn't + base verb · Does + he/she/it + base verb?", 'للنفي بنقول doesn\'t وللسؤال Does. بعدهم الفعل بيرجع لشكله الأصلي من غير s، لأن s اتحطت على doesn\'t وdoes.', ["She doesn't like football.", "Diana doesn't work on Mondays.", 'Does he eat fish?', "Yes, he does. / No, he doesn't."], [["Dr Lund doesn't likes it.", "Dr Lund doesn't like it."], ['My brother no hates cats.', "My brother doesn't hate cats."]]),
  ],
  'l2-s3': [
    T('Adverbs of frequency', 'always · usually · often · sometimes · never + verb', 'بتقول كل قد إيه بنعمل الحاجة. بتيجي قبل الفعل الأساسي، لكن بعد verb to be: She is always late. وnever معناها نفي لوحدها فما بنحطش معاها don\'t.', ['I always have an egg for breakfast.', 'We never eat in restaurants.', 'He is usually late.'], [['I have always an egg.', 'I always have an egg.'], ["We don't never eat.", 'We never eat.']]),
    T('like / love / hate + verb-ing', 'like + verb-ing', 'بعد أفعال المشاعر زي like وlove وhate وenjoy بنحط الفعل التاني بـ ing: I love swimming.', ['I love swimming in the sea.', 'She loves reading books.', "I don't like waking up early.", 'We enjoy playing football.'], [['I love watch movies.', 'I love watching movies.']]),
  ],
  'l2-s4': [
    T('This / That / These / Those', 'this/these = near · that/those = far', 'this وthese للحاجة القريبة، وthat وthose للحاجة البعيدة. this وthat للمفرد، وthese وthose للجمع.', ['Look at this map.', 'Do you see that tall building?', 'These are my tickets.', 'Are those your bags?'], [['This are my keys.', 'These are my keys.']]),
    T('Prepositions of place', 'next to · between · opposite · in front of · behind', 'بنحدد بيها المكان. between لازم يبقى بين حاجتين: between the cafe and the bakery. وopposite يعني قدام وعلى الناحية التانية من الشارع.', ['The bank is next to the supermarket.', 'The pharmacy is between the cafe and the bakery.', 'The park is opposite the school.', 'My car is in front of the house.'], [['The pharmacy is between the bakery.', 'The pharmacy is between the cafe and the bakery.']]),
    T('Giving directions', 'Go straight on · Turn left · Go past …', 'الأوامر القصيرة دي بنستخدمها لما نوصف طريق: Go straight on وTurn left وGo past وTake the second right.', ['Go straight on.', 'Turn left at the traffic lights.', 'Go past the bakery.', 'Take the second right.']),
  ],
  'l2-s5': [
    T('There is / There are', 'There is + one · There are + more than one', 'بنقول there is لحاجة واحدة موجودة، وthere are لأكتر من واحدة. النفي: there isn\'t وthere aren\'t، ومع الجمع بنستخدم any.', ['There is a big bed in my room.', 'There are two armchairs in the living room.', "There isn't a TV in the kitchen.", "There aren't any books."], [['There is two armchairs.', 'There are two armchairs.']]),
    T('Questions with there', 'Is there …? · Are there any …?', 'للسؤال بنقدّم is أو are: Is there a fridge? وAre there any rugs? والإجابة القصيرة: Yes, there is. أو No, there aren\'t.', ['Is there a fridge in the kitchen?', 'Yes, there is.', 'Are there any rugs in the living room?', "No, there aren't."], [['Is there any rugs?', 'Are there any rugs?']]),
    T('and / but / or / because', 'and = addition · but = contrast · or = choice · because = reason', 'بنربط بيها الجمل عشان نتكلم زي الناس مش زي الروبوت. بعد because لازم جملة كاملة فيها فاعل.', ['There is a bed and a wardrobe in my room.', "There is a sofa, but there isn't an armchair.", 'Is there a bath or a shower?', 'I love my bedroom because it is quiet.'], [['I love my room because is quiet.', 'I love my room because it is quiet.']]),
  ],
  'l2-s6': [
    T('love / like / hate', 'love / like / hate + verb-ing or noun', 'بعد love وlike وhate ممكن نحط اسم (blue dresses) أو فعل بـ ing (wearing jeans). ومع he وshe بنزود s على love وlike وhate نفسهم.', ['I love wearing comfortable jeans.', 'She likes blue dresses.', 'He hates shopping for shoes.'], [["I don't like wear formal clothes.", "I don't like wearing formal clothes."]]),
    T('prefer', 'I prefer A to B', 'بنستخدم prefer لما نفضّل حاجة على حاجة. وبنقول prefer A to B مش than: I prefer sneakers to shoes.', ['I prefer sneakers to classic shoes.', 'I prefer the blue shirt.', 'Which do you prefer, this jacket or that coat?'], [['I prefer sneakers than shoes.', 'I prefer sneakers to shoes.']]),
    T('At the clothes shop', 'Can I …? · Do you have …? · How much is …?', 'جمل جاهزة للشراء: السؤال عن السعر، وعن المقاس، وعن تجربة القطعة.', ['How much is this?', 'Do you have this in a medium?', 'Can I try this on, please?', 'How does it fit?']),
  ],
  'l2-s7': [
    T('Ordinal numbers and dates', '1st · 2nd · 3rd · 4th …', 'التواريخ بنقولها بالترتيبي مش بالعدد: the fifth مش five. الاستثناءات: first وsecond وthird، والباقي غالباً th: fourth وtwentieth. وبنقول on قبل التاريخ.', ['My birthday is on the 5th of May.', 'The meeting was on October 12th.', 'the 21st — twenty-first'], [['My birthday is on May five.', 'My birthday is on the 5th of May.']]),
    T('was / were', 'I/he/she/it was · we/you/they were', 'was وwere هم الماضي بتاع am وis وare. مع I وhe وshe وit بنقول was، ومع we وyou وthey بنقول were. والنفي wasn\'t وweren\'t.', ['I was at home on the 3rd of June.', "The hotel wasn't clean.", 'We were at a very exciting party.', "They weren't cheap."], [['We was at the party.', 'We were at the party.']]),
    T('Questions with was / were', 'Was + he/she/it …? · Were + you/we/they …?', 'بنبدأ السؤال بـ was أو were. والإجابة القصيرة: Yes, it was. أو No, I wasn\'t.', ['Was the movie boring?', 'Yes, it was.', 'Were you at the crowded mall yesterday?', "No, I wasn't."], [['Was you at the mall?', 'Were you at the mall?']]),
  ],
  'l3-s1': [
    T('Past Simple: regular verbs', 'verb + ed', 'الماضي البسيط للحاجات اللي خلصت في وقت فات. الأفعال المنتظمة بنزود ed: play → played. لو الفعل بينتهي بـ e بنزود d بس: like → liked. ولو ساكن + y بنغيرها ied: study → studied.', ['Yesterday I played football.', 'We booked a room near the beach.', 'She studied English at school.', 'They arrived early.'], [['I play football yesterday.', 'I played football yesterday.'], ['She studyed English.', 'She studied English.']]),
    T('Past Simple: negative', "didn't + base verb", 'للنفي بنقول didn\'t قبل الفعل الأصلي. didn\'t هي اللي شايلة الماضي، فالفعل بعدها من غير ed.', ["I didn't wash my hair.", "He didn't like the hotel.", "We didn't stay long."], [["I didn't washed my hair.", "I didn't wash my hair."]]),
  ],
  'l3-s2': [
    T('Irregular verbs', 'go → went · eat → ate · take → took · do → did', 'في أفعال ليها ماضي مخصوص ولازم نحفظه: go → went وeat → ate وtake → took وhave → had وsee → saw وbuy → bought.', ['I went to work yesterday.', 'I ate lunch at two.', 'I took a nap.', 'We did our homework.'], [['I goed to work.', 'I went to work.']]),
    T('Past Simple: questions', 'Did + subject + base verb?', 'للسؤال بنبدأ بـ Did والفعل بعدها بشكله الأصلي. والإجابة القصيرة: Yes, I did. أو No, I didn\'t.', ['Did you go to work yesterday?', 'Yes, I did.', "He didn't eat his breakfast.", "They didn't play outside."], [['Did you went to work?', 'Did you go to work?']]),
  ],
  'l3-s3': [
    T('at / on / in for time', 'at 10:30 · on Monday · in the morning', 'at للساعة بالظبط، وon للأيام والتواريخ، وin لأجزاء اليوم والشهور والسنين.', ['The train leaves at 10:30.', 'We go to Alexandria on Friday.', 'I pack my suitcase in the evening.'], [['The flight leaves in 10:15 AM.', 'The flight leaves at 10:15 AM.'], ['I will travel in Monday.', 'I will travel on Monday.']]),
    T('at / on / in for place and transport', 'at the airport · on a bus · in a taxi', 'at لنقطة محددة زي المطار والمحطة. وon لوسيلة المواصلات اللي تقدر تقف وتتحرك جواها (bus، train، plane). وin للعربية الخاصة والتاكسي.', ["I'm at the airport.", "I'm on a bus.", 'We are in a taxi.', 'The passengers are on platform 9.'], [["I'm in a bus.", "I'm on a bus."]]),
  ],
  'l3-s4': [
    T('should / shouldn\'t', 'should + base verb', 'بنستخدم should لما ندي نصيحة، وshouldn\'t لما ننصح بالعكس. بعد should الفعل من غير to وبنفس الشكل مع كل الضمائر.', ['You should visit the doctor.', 'You should rest.', "You shouldn't smoke."], [['You should to rest.', 'You should rest.'], ['She shoulds drink water.', 'She should drink water.']]),
    T('Health vocabulary with have got', "I've got a headache", 'للتعبير عن الألم بنقول I\'ve got أو I have مع a: a headache وa cold. ولأجزاء الجسم بنقول My back hurts.', ["I've got a headache.", "She's got a cold.", 'My back hurts.', 'I feel dizzy.'], [["I've got headache.", "I've got a headache."]]),
  ],
  'l3-s5': [
    T('can / can\'t for ability', 'can + base verb', 'can معناها أقدر، وcan\'t معناها ما أقدرش. بعدها الفعل من غير to ومن غير s حتى مع he وshe. وللسؤال بنقدّم can: Can you read a map?', ['I can read English.', "I can't remember names.", 'Can you read a map?', "Yes, I can. / No, I can't."], [['I can to swim.', 'I can swim.'], ['She cans speak English.', 'She can speak English.']]),
    T('Polite requests', 'Could you …? · Can I …? · Could I have …?', 'في المحلات بنطلب بأدب بـ could وcan: Could you help me? وCan I try it on?', ['Could you help me?', 'Can I try it on?', 'Could I have a receipt?', 'Can I pay by card?']),
  ],
  'l3-s6': [
    T('Countable and uncountable nouns', 'a banana / two bananas · some water', 'الاسم المعدود ليه مفرد وجمع وبنعده: two onions. أما غير المعدود زي water وrice وmilk فمالوش جمع ومش بنحط قبله a.', ['an onion — two onions', 'some water', 'some rice', 'a bottle of milk'], [['I want a rice.', 'I want some rice.']]),
    T('some / any', 'some = positive · any = negative and questions', 'بنستخدم some في الجمل المثبتة، وany في النفي والأسئلة. وبيتستخدموا مع المعدود والغير معدود.', ['I have some bananas.', "I don't have any milk.", 'Do you have any eggs?'], [["I don't have some milk.", "I don't have any milk."]]),
  ],
  'l3-s7': [
    T('must / mustn\'t', 'must + base verb', 'must للقواعد والقوانين اللي مفيهاش اختيار، وmustn\'t معناها ممنوع. بعدها الفعل من غير to.', ['In football, you must kick the ball.', "You mustn't touch the ball with your hands.", "In the pool, you mustn't run."], [['You must to wear a helmet.', 'You must wear a helmet.']]),
    T('should / shouldn\'t', 'should + base verb', 'should نصيحة أو فكرة كويسة، يعني فيه اختيار. الفرق: mustn\'t ممنوع لأنه قانون، وshouldn\'t مش أحسن لأنه نصيحة.', ['You should drink water after you run.', 'You should practice every day.', "You shouldn't eat a lot before a match."]),
  ],
};

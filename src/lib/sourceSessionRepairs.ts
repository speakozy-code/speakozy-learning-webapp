import type { DictionaryEntry, Section } from '../types';

export type SourceWord = Pick<DictionaryEntry, 'word' | 'arabic' | 'type' | 'definitions' | 'examples'>;
export type SourceSessionRepair = {
  title: string;
  topic: string;
  material: string;
  vocabulary: SourceWord[];
  grammar: string;
  useful: string;
  practice: string;
  homework: string;
  summary: string;
};

const w = (word: string, arabic: string, type: string, definition: string, example: string): SourceWord => ({
  word, arabic, type, definitions: [definition], examples: [example],
});

// These entries are tied to the original Drive deck transcripts reviewed in the audit.
export const SOURCE_SESSION_REPAIRS: Record<string, SourceSessionRepair> = {
  'l4-s1': {
    title: '1. SESSION 1 | Social Media', topic: 'Social Media',
    material: `Source: 1-Social Media.pptx (Drive, Inter 1 / Session 1)\n\nWarm-up: How many hours a day do you spend on your phone? If you had to delete all apps except one, which would you keep and why?\n\nObjectives: learn social-media vocabulary; review the Present Perfect with already, just, and yet; practise polite agreeing and disagreeing.\n\nVocabulary and examples:\n${[
      'FOMO — “I didn’t want to go to the party, but I had FOMO when I saw their pictures.”',
      'Doomscrolling — “Reading bad news for hours before bed is called doomscrolling.”',
      'Echo Chamber — “Social media is an echo chamber; you only see opinions you already agree with.”',
      'Overshare — “Please don’t overshare your personal problems on Facebook.”',
      'Digital Detox — “I am taking a one-week digital detox to improve my mental health.”',
      'Misinformation — “We must be careful because misinformation spreads quickly online.”',
      'Troll — “Don’t reply to his angry comments; he is just an internet troll.”',
      'Brain rot — “I watched TikTok for four hours straight, and now I have serious brain rot.”',
      'Algorithm — “The YouTube algorithm knows exactly what kind of videos I like.”',
      'Engagement — “Asking questions at the end of a video can increase audience engagement.”',
      'Influencer — “The influencer has two million followers on Instagram.”',
      'Touch grass — go outside and take a break from the internet.',
      'Break the internet — become so popular online that everyone talks about it.',
      'Opt out — choose not to take part in something.',
    ].join('\n')}\n\nGrammar: Present Perfect = have/has + past participle. Use already for something completed sooner than expected, just for something that happened very recently, and yet in questions and negative sentences at the end. Examples: “We have already spent all our money.” “I have just paid the bill.” “Have you tried on the jacket yet?”\n\nAgreeing/disagreeing: “I couldn’t agree more.” “That’s exactly what I think.” “I see your point, but…” “I’m afraid I disagree.” “I’m not so sure about that.”\n\nDrive practice: complete social-media sentences with the vocabulary; correct the source examples “I haven’t got my refund already” → “I haven’t got my refund yet”; “Have you just bought the tickets yet?” → remove either just or yet; “She has yet found a great bargain” → “She has already/just found…”`,
    vocabulary: [
      w('FOMO','الخوف من فوات شيء','noun','Fear of missing out on an enjoyable or important event.','I had FOMO when I saw their party pictures.'),
      w('Doomscrolling','التصفح القهري للأخبار السيئة','noun','The habit of spending a long time reading upsetting news online.','Reading bad news for hours before bed is doomscrolling.'),
      w('Echo Chamber','غرفة الصدى','noun','An online environment where people mainly encounter opinions like their own.','Social media can become an echo chamber.'),
      w('Overshare','يكشف تفاصيل شخصية أكثر من اللازم','verb','To share too much personal information.','Please don’t overshare personal problems online.'),
      w('Digital Detox','استراحة من الأجهزة الرقمية','noun','A period when someone avoids digital devices or online services.','I am taking a one-week digital detox.'),
      w('Misinformation','معلومات مضللة','noun','False or inaccurate information, especially when shared without intending harm.','Misinformation can spread quickly online.'),
      w('Troll','مستفز على الإنترنت','noun','A person who posts deliberately upsetting comments online.','Don’t reply to the angry comments; he is an internet troll.'),
      w('Brain rot','إرهاق ذهني من المحتوى الرقمي','noun','Informal term for the perceived mental effect of consuming trivial online content for too long.','After four hours of short videos, I have serious brain rot.'),
      w('Algorithm','خوارزمية','noun','A set of rules a platform uses to select or rank content.','The YouTube algorithm knows what videos I like.'),
      w('Engagement','تفاعل الجمهور','noun','The amount of interaction an audience has with online content.','Questions can increase audience engagement.'),
      w('Influencer','مؤثر / مؤثرة','noun','A person whose online presence can influence an audience.','The influencer has two million followers.'),
      w('Touch grass','ابتعد عن الإنترنت واخرج قليلًا','idiom','Slang: go outside and take a break from online activity.','You have argued online all day; go touch grass.'),
      w('Break the internet','يثير ضجة واسعة على الإنترنت','idiom','To attract an unusually large amount of online attention.','The announcement broke the internet.'),
      w('Opt out','ينسحب / يختار عدم المشاركة','phrasal verb','To choose not to take part in something.','I decided to opt out of the group chat.'),
    ],
    grammar: 'Present Perfect: subject + have/has + past participle. Use already for completion sooner than expected, just for a very recent event, and yet in questions or negatives at the end. Examples: “I have already bought some.” “The shop has just opened.” “Have you tried it yet?”',
    useful: 'I couldn’t agree more. | That’s exactly what I think. | I see your point, but… | I’m afraid I disagree. | I’m not so sure about that.',
    practice: 'Drive practice — choose the correct lesson word: (1) I decided to ____ of the group chat. (2) He spent five hours reading negative news online; he was ____. (3) She had ____ when she saw the party pictures. (4) Don’t ____ personal information online. (5) A feed showing only opinions you agree with is an ____. (6) After arguing online all day, go ____. (7) Take a ____ from social media. (8) ____ can spread quickly online. (9) A person posting comments to provoke people is a ____. (10) Too many short videos can cause ____. (11) Questions can increase audience ____. (12) The celebrity’s announcement ____ within minutes.',
    homework: 'Drive homework: Explain how social media affects you and people around you; discuss its good and bad sides and how to use it more healthily. Use the lesson vocabulary, one idiom, one phrasal verb, and the grammar rule.',
    summary: 'Drive lesson: Social Media vocabulary (including FOMO, doomscrolling, and echo chamber); Present Perfect with already / just / yet; polite agreeing and disagreeing; discussion and homework about social media.',
  },
  'l4-s3': {
    title: '3. SESSION 3 | Health & Lifestyle', topic: 'Health & Lifestyle',
    material: `Source: 3_Health_Lifestyle.pptx (Drive, Inter 1 / Session 3)\n\nWarm-up: Do you live a healthy lifestyle? What do you eat every day? Do you exercise regularly?\n\nVocabulary from the Drive slides:\n${[
      'A balanced diet — “I try to eat a balanced diet every day with vegetables, protein, and grains.”',
      'Insomnia — “Holly suffered from insomnia caused by stress at work.”',
      'Processed food — “Many nutritionists advise us to avoid processed food.”',
      'Rejuvenated — “The coach was full of praise for his rejuvenated side.”',
      'Fatigue — “I have fatigue after working long hours at my desk.”',
      'A sedentary lifestyle — “A sedentary lifestyle can lead to various health problems.”',
      'Burnout — “After working 80 hours a week, Mark began experiencing severe burnout.”',
      'Starving — “I’m so hungry I feel starving!”',
      'Sluggish — “I feel sluggish in the morning before my coffee.”',
      'Wind down — “After a busy day, it’s important to wind down before bed.”',
      'Break a habit — stop doing something you do regularly, especially something bad.',
      'Cut down on — reduce the amount of something.',
    ].join('\n')}\n\nGrammar: Question tags are short questions added to the end of a statement. A positive statement takes a negative tag; a negative statement takes a positive tag. In Present Simple use do/does; in Past Simple use did. Examples: “You like coffee, don’t you?” “He works here, doesn’t he?” “She doesn’t drive, does she?” With “Let’s…”, use “shall we?”\n\nHealth phrases in the deck: “I have a headache.” “I feel tired.” “I’m not feeling well.” “I feel sick.” “I have a stomachache.” “I feel sluggish.” “I wish you a speedy recovery.”`,
    vocabulary: [
      w('A balanced diet','نظام غذائي متوازن','noun phrase','A variety of foods in the right proportions for good health.','I try to eat a balanced diet every day.'),
      w('Insomnia','أرق','noun','A condition in which someone has difficulty sleeping.','Holly suffered from insomnia caused by stress.'),
      w('Processed food','طعام مُصنّع','noun phrase','Food changed from its natural state, often during preparation or preservation.','Many nutritionists advise us to avoid processed food.'),
      w('Rejuvenated','مفعم بالحيوية من جديد','adjective','Feeling or appearing fresh, energetic, or renewed.','After the break, I felt rejuvenated.'),
      w('Fatigue','إرهاق','noun','Extreme tiredness, often resulting from effort or illness.','I have fatigue after working long hours.'),
      w('A sedentary lifestyle','نمط حياة قليل الحركة','noun phrase','A way of life involving a lot of sitting and little physical activity.','A sedentary lifestyle can lead to health problems.'),
      w('Burnout','إجهاد شديد / احتراق وظيفي','noun','Physical or emotional exhaustion caused by prolonged stress.','Mark experienced severe burnout after working 80 hours a week.'),
      w('Starving','جائع جدًا','adjective','Extremely hungry.','I’m starving; let’s get something to eat.'),
      w('Sluggish','خامل / بطيء الحركة','adjective','Moving or reacting more slowly than usual.','I feel sluggish in the morning.'),
      w('Wind down','يسترخي تدريجيًا','phrasal verb','To relax after being active or stressed.','It’s important to wind down before bed.'),
      w('Break a habit','يتخلص من عادة','idiom','To stop doing something regularly, especially an undesirable action.','I’m trying to break a habit of eating late.'),
      w('Cut down on','يقلل من','phrasal verb','To reduce the amount or frequency of something.','I’m trying to cut down on sugar.'),
    ],
    grammar: 'Question tags: add a short question to a statement. Positive statement → negative tag; negative statement → positive tag. Use do/does in the Present Simple and did in the Past Simple. “You like coffee, don’t you?” “He works here, doesn’t he?” “She doesn’t drive, does she?” Special case: “Let’s go, shall we?”',
    useful: 'I have a headache. | I feel tired. | I’m not feeling well. | I feel sick. | I have a stomachache. | I feel sluggish. | Poor you. I wish you a speedy recovery. | What healthy habits do you have? | What should someone do when they feel under the weather?',
    practice: 'Drive practice: form the correct question tag: “You are tired, ____?” “He likes football, ____?” “You aren’t tired, ____?” “She doesn’t drive, ____?” “You like coffee, ____?” “He called you, ____?” Correct the source error “She likes coffee, don’t she?” → “She likes coffee, doesn’t she?” Special case: “Let’s go, shall we?”',
    homework: 'Drive homework: Talk about your lifestyle and how you take care of your health. Describe healthy habits and health problems. Use the lesson vocabulary, one idiom, one phrasal verb, and the grammar rule.',
    summary: 'Drive lesson: Health & Lifestyle vocabulary; Question Tags; phrases for describing health problems; discussion of healthy habits.',
  },
  'l4-s7': {
    title: '7. SESSION 7 | Addictions', topic: 'Addictions',
    material: `Source: 7- Addictions.pptx (Drive, Inter 1 / Session 7)\n\nWarm-up: The deck discusses everyday habits people feel unable to stop, including legal habits such as eating or drinking something.\n\nVocabulary from the Drive slides:\n${[
      'Trigger — “For many smokers, feeling stressed is a huge trigger for their bad habits.”',
      'Withdrawal — “When I stopped drinking coffee, I had terrible withdrawal headaches.”',
      'Obsession — “His obsession with social media is affecting his relationships.”',
      'Substance — “Coffee contains a highly addictive substance called caffeine.”',
      'Relapse — “He stopped playing video games for a month, but had a relapse during the holidays.”',
      'Rehab — “The celebrity had to check into rehab to get help.”',
      'Compulsive — “She is a compulsive shopper who buys things she doesn’t need.”',
      'Temptation — “The temptation to check my phone is too strong.”',
      'Binge — “He always binges on food.”',
      'Recovery — “He has been in recovery for two years and is doing great.”',
      'Sober — “She is proud that she has been sober for five years.”',
      'Hooked on — “I started watching that show, and now I am completely hooked on it.”',
      'Go cold turkey — stop a habit suddenly rather than reducing it gradually.',
    ].join('\n')}\n\nGrammar: unless means “if not”; even if emphasizes that the result will not change; in case describes preparation for a possibility. Examples: “We will run out of water unless we conserve it.” “Even if we recycle every bottle, pollution will still exist.” “Governments should invest in renewable energy in case oil prices rise.”\n\nDrive practice: complete 13 vocabulary questions on trigger, hooked on, go cold turkey, substance, rehab, binge, withdrawal, relapse, compulsive, temptation, recovery, sober, and addiction.`,
    vocabulary: [
      w('Trigger','مُحفّز','noun','Something that causes a particular reaction or starts an event.','For many smokers, stress is a trigger for bad habits.'),
      w('Withdrawal','أعراض الانسحاب','noun','Physical or mental effects experienced after stopping a substance or behaviour.','I had terrible withdrawal headaches after stopping coffee.'),
      w('Obsession','هوس','noun','An unusually strong and persistent interest or concern.','His obsession with social media is affecting his relationships.'),
      w('Substance','مادة','noun','A particular kind of matter, especially one with a specific effect.','Caffeine is an addictive substance.'),
      w('Relapse','انتكاسة','noun','A return to a previous harmful behaviour after improvement.','He had a relapse during the holidays.'),
      w('Rehab','مركز / برنامج تأهيل','noun','Treatment intended to help someone recover from addiction or illness.','The celebrity checked into rehab to get help.'),
      w('Compulsive','قهري','adjective','Difficult to control or stop, often despite negative effects.','She is a compulsive shopper.'),
      w('Temptation','إغراء','noun','A strong desire to do something, especially something unwise.','The temptation to check my phone is too strong.'),
      w('Binge','نوبة إفراط','verb','To consume too much of something in a short time.','He sometimes binges on food when he feels stressed.'),
      w('Recovery','تعافٍ','noun','The process of becoming healthy or free from addiction again.','He has been in recovery for two years.'),
      w('Sober','ممتنع عن الكحول / المخدرات','adjective','Not affected by alcohol or drugs; in recovery, not using them.','She has been sober for five years.'),
      w('Hooked on','مدمن على / شديد التعلق بـ','phrasal verb','Unable to stop using or doing something because of strong enjoyment or dependence.','I am completely hooked on that show.'),
      w('Go cold turkey','يتوقف فجأة وبشكل كامل','idiom','To stop doing or using something suddenly and completely.','He decided to go cold turkey and stop smoking.'),
    ],
    grammar: 'Unless = if not: “We will run out of water unless we conserve it.” Even if emphasizes that the result will not change: “Even if we recycle every bottle, pollution will still exist.” In case describes preparation for a possible future event: “Take your umbrella in case it rains.”',
    useful: 'What does addiction mean to you? | What non-drug addictions are common nowadays? | Why do people relapse? | How can someone overcome an addiction? | What makes someone become a workaholic?',
    practice: 'Drive practice — choose the correct word: (1) Stress became a major ____ for his bad habits. (2) She was completely ____ social media. (3) He decided to ____ and stop smoking. (4) Caffeine is an addictive ____. (5) He entered ____ to get help. (6) She had a shopping ____. (7) He had severe ____ symptoms. (8) He had a ____ and started smoking again. (9) She is a ____ shopper. (10) He could not resist the ____. (11) He has been in ____ for two years. (12) She has been ____ for five years. (13) Excessive phone use can lead to smartphone ____.',
    homework: 'Drive homework: Talk about an addiction or a bad habit, its causes and triggers, and possible solutions. Use at least six lesson vocabulary items and the target grammar. Explain your ideas with examples and details.',
    summary: 'Drive lesson: vocabulary about habits and addiction; unless, even if, and in case; discussion of addiction and possible solutions.',
  },
  'l6-s1': {
    title: '1. SESSION 1 | Work & Career', topic: 'Work & Career',
    material: `Source: 1- Work & Career.pptx (Drive, Inter 3 / Session 1)\n\nWarm-up: What does a good job mean to you? Would you choose a high salary or a job you genuinely enjoy?\n\nDrive vocabulary:\n${[
      'Work-life balance — “Working from home can improve your work-life balance.”',
      'Recognition — “Employees need recognition for their hard work.”',
      'Qualification — “She has the right qualifications for the job.”',
      'Feel fulfilled — “A good job should make you feel fulfilled, not just well-paid.”',
      'Corporate culture — “I left because I didn’t like the corporate culture.”',
      'Financial stability — “I’m looking for a stable job to achieve financial stability.”',
      'Intellectual stimulation — “Reading and problem-solving provide intellectual stimulation.”',
      'Workplace hierarchy — “Employees understand their position within the workplace hierarchy.”',
      'Career stagnation — “He left the company because of career stagnation.”',
      'Remuneration — “Employees are demanding better remuneration.”',
      'Fringe benefits — “The job offers a good salary and attractive fringe benefits.”',
      'Executive position — “She was promoted to an executive position.”',
      'Move up the ladder — “He wants to move up the ladder and become a manager.”',
      'Cope with — “She is learning how to cope with stress at work.”',
    ].join('\n')}\n\nGrammar: Reported Speech reports what another person said without quotation marks. Pronouns and often verb tenses change. Examples: “I am tired.” → She said she was tired. “We love this movie.” → They said they loved the movie. Present Simple → Past Simple; Present Continuous → Past Continuous; Present Perfect → Past Perfect; will → would; can → could; may → might; must → had to.\n\nDrive speaking task: compare two job offers (high salary/stress/long hours/fast progression versus average salary/work-life balance/friendly workplace/slower promotion) and explain your choice.`,
    vocabulary: [
      w('Work-life balance','التوازن بين العمل والحياة','noun','A satisfactory relationship between time spent working and personal life.','Working from home can improve your work-life balance.'),
      w('Recognition','تقدير','noun','Public acknowledgement of someone’s achievements or qualities.','Employees need recognition for their hard work.'),
      w('Qualification','مؤهل','noun','A skill, experience, or certificate that makes someone suitable for a job.','She has the right qualifications for the job.'),
      w('Feel fulfilled','يشعر بالرضا والإنجاز','verb phrase','To feel satisfied because something is meaningful or worthwhile.','A good job should make you feel fulfilled.'),
      w('Corporate culture','ثقافة الشركة','noun','The shared values, attitudes, and practices of an organisation.','I left because I didn’t like the corporate culture.'),
      w('Financial stability','استقرار مالي','noun','A state of having reliable income and manageable financial obligations.','She wants financial stability.'),
      w('Intellectual stimulation','تحفيز فكري','noun','Activity that encourages thought and mental effort.','Reading provides intellectual stimulation.'),
      w('Workplace hierarchy','التسلسل الوظيفي','noun','The levels of authority and responsibility in a workplace.','Employees understand their place in the workplace hierarchy.'),
      w('Career stagnation','جمود مهني','noun','A lack of progress or development in someone’s career.','He left because of career stagnation.'),
      w('Remuneration','أجر / مكافأة مالية','noun','Money paid for work or services.','Employees are demanding better remuneration.'),
      w('Fringe benefits','مزايا إضافية','noun','Additional benefits provided by an employer beyond wages.','The job offers attractive fringe benefits.'),
      w('Executive position','منصب تنفيذي','noun','A senior position involving important decisions in an organisation.','She was promoted to an executive position.'),
      w('Move up the ladder','يتدرج إلى مناصب أعلى','idiom','To advance to higher positions in an organisation.','He wants to move up the ladder and become a manager.'),
      w('Cope with','يتعامل مع / يتأقلم مع','phrasal verb','To manage a difficult situation or problem.','She is learning to cope with stress at work.'),
    ],
    grammar: 'Reported Speech: use it to report what another person said. Pronouns and usually verb tenses change: Present Simple → Past Simple; Present Continuous → Past Continuous; Present Perfect → Past Perfect; will → would; can → could; may → might; must → had to. Example: “I am working.” → He said that he was working.',
    useful: 'What does a successful career mean to you? | Is it better to specialize or have many skills? | What makes a workplace good? | Would you sacrifice happiness for financial stability? | Which job offer would you choose, and why?',
    practice: 'Drive practice: report the statements using said, told, or asked: Sarah: “I am working from home today.” Ahmed: “I will call you tomorrow.” The Manager: “We went to a great restaurant yesterday.” Mona: “My new phone has just broken!” The Tourist: “I can’t speak Arabic.” Omar: “I am playing football now.”',
    homework: 'Drive task: compare the two job offers in the lesson. Explain which one you would choose, why, what could change your decision, and the biggest risk of your choice.',
    summary: 'Drive lesson: 12 modern work words and idioms; Reported Speech basics (tense and pronoun changes; said/told); speaking about Work & Career.',
  },
};

export const SOURCE_WORDS_BY_SESSION: Record<string, SourceWord[]> = Object.fromEntries(
  Object.entries(SOURCE_SESSION_REPAIRS).map(([id, repair]) => [id, repair.vocabulary]),
);

SOURCE_WORDS_BY_SESSION['l9-s4'] = [
  w('Propose','يتقدّم بطلب الزواج','verb','To ask someone to marry you.','He proposed to her during a romantic dinner.'),
  w('Engagement','خطوبة','noun','An agreement to get married.','Their engagement party was beautiful.'),
  w('Fiancé / Fiancée','خطيب / خطيبة','noun','A man or woman who is engaged to be married.','Meet Ahmed; he is my fiancé.'),
  w('Bachelor party','حفلة توديع العزوبية','noun','A party for a man shortly before his wedding.','They planned a bachelor party before the wedding.'),
  w('Compromise','يتوصل إلى حل وسط','verb','To reach an agreement by accepting less than you wanted.','A strong marriage needs compromise.'),
  w('Bride / Groom','عروس / عريس','noun','A woman or man on their wedding day.','The bride looked stunning in her white dress.'),
  w('Compatible','متوافق','adjective','Able to have a good relationship because of similar qualities or needs.','They have different personalities, but they are compatible.'),
  w('Spouse','زوج / زوجة','noun','A person’s husband or wife.','You need to provide your spouse’s information.'),
  w('Harmony','انسجام','noun','A state of agreement and peaceful relationship.','They try to live together in harmony.'),
  w('Honeymoon','شهر العسل','noun','A holiday taken by a couple after their wedding.','They went to Italy for their honeymoon.'),
  w('Chemistry','انسجام / انجذاب متبادل','noun','A natural attraction or understanding between people.','They had great chemistry from the beginning.'),
  w('Split up','ينفصل','phrasal verb','To end a romantic relationship.','After many fights, they split up.'),
  w('Patch things up','يصلح العلاقة','idiom','To repair a relationship after an argument.','After the argument, they decided to patch things up.'),
];

SOURCE_WORDS_BY_SESSION['l9-s5'] = [
  w('Sensitive','مرهف / حساس','adjective','Quick to notice or be affected by other people’s feelings.','She felt sensitive to how her friend was feeling.'),
  w('Generous','كريم','adjective','Willing to give or share more than is expected.','He was generous enough to share his lunch.'),
  w('Talkative','ثرثار / كثير الكلام','adjective','Enjoying talking and talking a lot.','She is talkative and starts lively conversations.'),
  w('Ambitious','طموح','adjective','Having a strong desire to achieve something.','He is ambitious and works hard to reach his goals.'),
  w('Outgoing','اجتماعي ومنفتح','adjective','Friendly and confident with other people.','She is outgoing and easily makes friends.'),
  w('Stubborn','عنيد','adjective','Unwilling to change an opinion or decision.','He is stubborn and refuses to change his opinion.'),
  w('Reliable','يمكن الاعتماد عليه','adjective','Able to be trusted to do what is expected.','She is reliable and always keeps her promises.'),
  w('Easygoing','سهل التعامل / هادئ','adjective','Relaxed and not easily worried or upset.','He is easygoing and gets along with everyone.'),
  w('Clumsy','أخرق / كثير التعثر','adjective','Often moving awkwardly or dropping things.','He is clumsy and often drops things.'),
  w('Selfish','أناني','adjective','Caring only about yourself and not other people.','He was selfish and refused to share his lunch.'),
  w('Arrogant','مغرور','adjective','Behaving as if you are better or more important than others.','She sounded arrogant when she said no one could do the job better.'),
  w('Show off','يتباهى','phrasal verb','To behave in a way intended to impress people.','He likes to show off by talking about his new car.'),
  w('Down-to-earth','عملي / متواضع','idiom','Practical, realistic, and not pretentious.','He is down-to-earth and stays calm and practical.'),
];

const extraSectionRepairs: Record<string, { vocabulary: string; practice: string }> = {
  'l9-s4': {
    vocabulary: SOURCE_WORDS_BY_SESSION['l9-s4'].map((item) => `${item.word} — ${item.type} · ${item.arabic}`).join('\n'),
    practice: 'Drive practice: error correction — find and correct each mistake: “She didn’t used to have a boyfriend.” “Did they used to be married?” “He use to be single.” “They didn’t use to going out.” “Did she use to loves him?” Correct pattern: didn’t use to + base verb; Did + subject + use to + base verb.',
  },
  'l9-s5': {
    vocabulary: SOURCE_WORDS_BY_SESSION['l9-s5'].map((item) => `${item.word} — ${item.type} · ${item.arabic}`).join('\n'),
    practice: 'Drive practice — choose a lesson word: (1) She felt ____ to how her friend was feeling. (2) He was ____ enough to share his lunch. (3) She is ____ and starts lively conversations. (4) He is ____ and works hard to reach his goals. (5) She is ____ and easily makes friends. (6) He is ____ and refuses to change his opinion. (7) She is ____ and always keeps her promises. (8) He is ____ and gets along with everyone. (9) He is ____ and often drops things. (10) He was ____ and refused to share. (11) She sounded ____ when she said no one could do the job better. (12) He likes to ____ by talking about his new car. (13) He is ____ and practical.',
  },
};

export function replaceSessionSections(sessionId: string, sections: Section[]): Section[] | undefined {
  const repair = SOURCE_SESSION_REPAIRS[sessionId];
  const extra = extraSectionRepairs[sessionId];
  if (!repair && !extra) return undefined;
  if (!repair) return sections.map((section) => {
    if (section.title === 'Vocabulary') return { ...section, body: extra!.vocabulary };
    if (section.title === 'Practice exercises') return { ...section, body: extra!.practice };
    return section;
  });
  const replacements: Record<string, string> = {
    'Lesson material (text)': repair.material,
    'Warm-up & objectives': `${repair.title}\n${repair.topic}\n${repair.material.split('\n\n').slice(1, 3).join('\n\n')}`,
    Vocabulary: repair.vocabulary.map((item) => `${item.word} — ${item.type} · ${item.arabic}`).join('\n'),
    Grammar: repair.grammar,
    'Useful language': repair.useful,
    'Practice exercises': repair.practice,
    Homework: repair.homework,
    Summary: repair.summary,
  };
  return sections.map((section) => replacements[section.title] === undefined
    ? section
    : { ...section, body: replacements[section.title] });
}

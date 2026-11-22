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

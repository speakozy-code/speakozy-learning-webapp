// Expanded explanations written for the imported grammar topics.
// Arabic stays pure Arabic script; examples stay in English.

export interface Insight { detail: string; extra: string[] }

export const INSIGHTS: Record<string, Insight> = {
  'past simple': {
    detail: 'نستخدم الماضي البسيط لأي حديث خلص وانتهى في وقت محدد في الماضي، زي أمس أو الأسبوع اللي فات. بنستخدمه كمان للحاجات اللي كانت بتحصل بانتظام في الماضي. تكوينة الجملة بسيطة: الفعل بياخد شكل الماضي، وما بنحتاجش was ولا were.',
    extra: ['I visited my grandparents last weekend.', 'She checked her email twice yesterday.', 'We played football every Saturday when we were young.'],
  },
  'past continuous': {
    detail: 'الماضي المستمر بيوصف حدث كان شغال في وقت محدد في الماضي، يعني كان بدأ قبل اللحظة دي ولسه مستمر لحد ما حصل حاجة تانية. بنكوّنه من was أو were مع الفعل المضاف له ing. استخدمه لما تحب ترسم الخلفية قبل الأحداث.',
    extra: ['I was cooking when the phone rang.', 'They were watching TV at 8 pm.', 'It was raining, so we stayed at home.'],
  },
  'when & while': {
    detail: 'كلمة when بتيجي قبل الحدث القصير المفاجئ اللي بيقطع الحدث الطويل، وwhile بتيجي قبل الحدث الطويل نفسه. لو بندمج جملتين، بنستخدم past continuous مع الحدث الطويل وpast simple مع الحدث القصير. لاحظ إن while ما بتيجيش قبل past simple.',
    extra: ['I was reading when she called me.', 'While I was cooking, my son was doing his homework.', 'When he arrived, we were having dinner.'],
  },
  'linking words': {
    detail: 'كلمات الربط بتوصل بين السبب والنتيجة. اللي بيجي بعده جملة كاملة نستخدم معاه because أو as أو so. واللي بيجي بعده اسم أو كلمة واحدة نستخدم معاه because of أو due to. أما therefore وas a result وthat’s why فبيجوا في أول جملة النتيجة.',
    extra: ['I stayed home because it was raining.', 'The flight was cancelled due to bad weather.', 'He worked hard; therefore he passed the exam.'],
  },
  'present simple': {
    detail: 'الحاضر البسيط بيوصف حاجات بتحصل دايمًا أو عادة أو حقيقة. مع he وshe وit بنضيف s للفعل. بنستخدمه كمان مع الأفعال اللي ما بتتحركش زي like وknow وwant.',
    extra: ['She works in a bank.', 'We drink coffee every morning.', 'Water boils at 100 degrees.'],
  },
  'present perfect': {
    detail: 'الحاضر التام بيتكلم عن حاجة حصلت في الماضي ولسه ليها أثر دلوقتي، أو حاجة حصلت في وقت مش محدد. بنكوّنه من have أو has مع التصريف الثالث. كلمات زي already وyet وever وnever وjust بتظهر معاه كتير.',
    extra: ['I have finished my homework.', 'She has never been to London.', 'Have you ever tried sushi?'],
  },
  'past perfect': {
    detail: 'الماضي التام بيوصف حدث حصل قبل حدث تاني في الماضي. بنكوّنه من had مع التصريف الثالث. استخدمه لما تحكي قصة فيها ترتيب واضح: حاجة حصلت الأول، وبعدين حاجة تانية.',
    extra: ['I had left before she arrived.', 'They had already eaten when we called.', 'He had never seen snow until that winter.'],
  },
  'future': {
    detail: 'المستقبل في الكلام اليومي غالبا will للقرار السريع أو الوعد، وgoing to للخطة اللي مترتبة من قبل. الاتنين بيتبعهم الفعل في المصدر من غير to.',
    extra: ['I will help you with that.', 'We are going to travel next month.', 'It will rain later.'],
  },
  'present perfect vs. past simple': {
    detail: 'الماضي البسيط لحدث خلص في وقت معروف زي yesterday أو last year. الحاضر التام لحدث مش مربوط بوقت محدد أو لسه مستمر في نتيجته. لو في تاريخ واضح استخدم past simple.',
    extra: ['I saw him yesterday.', 'I have seen that film.', 'She lived in Cairo in 2019.'],
  },
  'present continuous': {
    detail: 'الحاضر المستمر بيوصف حاجة بتحصل دلوقتي أو حولين الوقت الحالي. بنكوّنه من am أو is أو are مع الفعل و-ing. استخدمه كمان لخطط قريبة زي I am meeting him tomorrow.',
    extra: ['I am learning English right now.', 'They are having lunch at the moment.', 'We are moving house next week.'],
  },
};

export function insightFor(title: string, rule: string): Insight {
  const t = (title || '').toLowerCase();
  const match = Object.keys(INSIGHTS).find((k) => t.includes(k));
  if (match) return INSIGHTS[match];
  const clean = (rule || '').replace(/\s+/g, ' ').trim();
  return {
    detail: clean
      ? `القاعدة دي: ${clean} اقرأ الجملة بتمعن، وبعدين كوّن جملة من عندك بنفس الشكل عشان تثبّتها في كلامك.`
      : 'اقرأ القاعدة والأمثلة، وبعدين كوّن جملة من عندك بنفس الشكل عشان تثبّتها في كلامك.',
    extra: [],
  };
}

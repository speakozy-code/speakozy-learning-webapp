// Tiny event bridge so any component (profile menu, panel footer…) can open the help panel.
export type HelpView = 'faq' | 'guide';
const EVT = 'speakozy:help';
export const openHelp = (view: HelpView = 'faq') => window.dispatchEvent(new CustomEvent(EVT, { detail: view }));
export const onHelp = (fn: (v: HelpView) => void) => {
  const h = (e: Event) => fn(((e as CustomEvent).detail as HelpView) || 'faq');
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
};

// "جولة تعريفية": replays the intro tour of the page the student is on (falls back to the site guide when the page has none).
const TOUR_EVT = 'speakozy:tour';
export const startTour = () => {
  const detail = { handled: false };
  window.dispatchEvent(new CustomEvent(TOUR_EVT, { detail }));
  if (!detail.handled) openHelp('guide');
};
export const onStartTour = (fn: () => void) => {
  const h = (e: Event) => { ((e as CustomEvent).detail as { handled: boolean }).handled = true; fn(); };
  window.addEventListener(TOUR_EVT, h);
  return () => window.removeEventListener(TOUR_EVT, h);
};

export const FAQ: { q: string; a: string }[] = [
  { q: 'إزاي أبدأ مذاكرة سيشن؟', a: 'من «المسار» اختار سيشن مفتوح وادخله. السيشن فيه Overview ثم Words ثم Grammar ثم Practice ثم Quiz — امشي بالترتيب.' },
  { q: 'النقط بتتحسب إزاي؟', a: 'النقط بتيجي من الكويزات على قد درجتك الحقيقية، ومن التاسكات والشادوينج بعد ما المدرّس يوافق عليها. مفيش نقط على مجرد الضغط.' },
  { q: 'إزاي أبعت إجابتي للمدرّس؟', a: 'سجّل فويس نوت بصوتك وابعته على واتساب Speakozy. المدرّس بيسمعه ويرد عليك، ومن غير ما يتحسب عليه نقط في الموقع.' },
  { q: 'إزاي أسمع نطق الكلمة؟', a: 'في تبويب Words دوس على زرار السماع أو على لهجة YouGlish تحت الكلمة وهتسمعها من متحدثين أصليين جوه الصفحة.' },
  { q: 'ازاي أراجع الكلمات اللي حفظتها؟', a: 'الكلمات اللي بتحفظها بالنجمة بتروح لصفحة «الكلمات» وبتتراجع بنظام المراجعة المتباعدة.' },
  { q: 'السيشن مقفول، أعمل إيه؟', a: 'السيشن بيتفتح لما تخلّص اللي قبله أو بحسب اشتراكك. لو محتاج مساعدة كلمنا على واتساب.' },
  { q: 'إزاي أغيّر اللغة أو الثيم؟', a: 'من الزرارين اللي فوق جنب جرس الإشعارات: EN/عربي للغة، والقمر/الشمس للوضع الغامق والفاتح.' },
  { q: 'إزاي أثبّت الموقع كتطبيق؟', a: 'من قايمة الحساب اختار «تثبيت التطبيق على الموبايل». على الآيفون: زرار المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».' },
];
export const FAQ_PREVIEW = 5;

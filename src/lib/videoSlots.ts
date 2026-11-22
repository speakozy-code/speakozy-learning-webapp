// أماكن فيديوهات اليوتيوب: السيشن التجريبية وفيديوهات الشادوينج لكل مستوى.
// لما اللينكات توصل، حط معرف الفيديو (youtubeId) هنا.
export const TRIAL_VIDEO: { youtubeId: string; title: string } = {
  youtubeId: 'PrxzEC0PrrQ',
  title: 'السيشن التجريبية — نظام كل سيشن ونظام الكورس',
};

export type ShadowVideo = { title: string; youtubeId: string };

export const SHADOWING_VIDEOS: Record<string, ShadowVideo[]> = {
  l1: [], l2: [], l3: [], l8: [], l9: [], l10: [],
  l4: [
    { title: 'Shadowing 2 — Inter 1', youtubeId: 'UuL_wHXFxkM' },
    { title: 'Shadowing 1 — Inter 1', youtubeId: 'GFT1-b9vN-E' },
  ], l5: [], l6: [], l7: [], l11: [],
};

export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

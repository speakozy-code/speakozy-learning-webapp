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
    { title: 'Shadowing 3 — Inter 1', youtubeId: 'TZKNdUd4Rcg' },
    { title: 'Shadowing 4 — Inter 1', youtubeId: '-9bEBGalrKQ' },
    { title: 'Shadowing 5 — Inter 1', youtubeId: 'eFLAjD2Jt_w' },
    { title: 'Shadowing 6 — Inter 1', youtubeId: '_hahvDy_eC4' },
  ], l5: [
    { title: 'Shadowing 1 — Inter 2', youtubeId: 'FnoH3QPNS7Q' },
    { title: 'Shadowing 2 — Inter 2', youtubeId: 'WGAX2eStbwc' },
    { title: 'Shadowing 3 — Inter 2', youtubeId: 'h4rJhUPcOH8' },
    { title: 'Shadowing 4 — Inter 2', youtubeId: 'b2ITUZNOGH8' },
    { title: 'Shadowing 5 — Inter 2', youtubeId: 'NSQHvoCnxXM' },
    { title: 'Shadowing 6 — Inter 2', youtubeId: 'JjTLTwtRpos' },
  ], l6: [], l7: [], l11: [],
};

export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

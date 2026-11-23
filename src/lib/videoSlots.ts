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
    { title: 'Shadowing 1 — Inter 1', youtubeId: 'GFT1-b9vN-E' },
    { title: 'Shadowing 2 — Inter 1', youtubeId: 'UuL_wHXFxkM' },
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
  ],
  l6: [
    { title: 'Shadowing 1 — Inter 3', youtubeId: 'Jd2KKh-_O2A' },
    { title: 'Shadowing 2 — Inter 3', youtubeId: 'OcY-jZojr3M' },
    { title: 'Shadowing 3 — Inter 3', youtubeId: 'y4s4_AKwGGk' },
    { title: 'Shadowing 4 — Inter 3', youtubeId: 'AchjadlAglQ' },
    { title: 'Shadowing 5 — Inter 3', youtubeId: '2SN5Zgy4Oec' },
    { title: 'Shadowing 6 — Inter 3', youtubeId: 'tiHn9qAy-3U' },
  ],
  l7: [
    { title: 'Shadowing 1 — Upper 1', youtubeId: '_HjkIulvjvg' },
    { title: 'Shadowing 2 — Upper 1', youtubeId: 'xyY3EPGhF0s' },
    { title: 'Shadowing 3 — Upper 1', youtubeId: 'TlsOHzeV5zQ' },
    { title: 'Shadowing 4 — Upper 1', youtubeId: 'FwIeucSxtO4' },
    { title: 'Shadowing 5 — Upper 1', youtubeId: 'rz-wyzKfoZE' },
    { title: 'Shadowing 6 — Upper 1', youtubeId: 'SSXoUrZ1K_A' },
  ],
  l11: [
    { title: 'Shadowing 1 — Upper 2', youtubeId: 'FACOM4icmKk' },
    { title: 'Shadowing 2 — Upper 2', youtubeId: 'JSEQ6zPTDKQ' },
    { title: 'Shadowing 3 — Upper 2', youtubeId: '6rV6lEdiNcM' },
    { title: 'Shadowing 4 — Upper 2', youtubeId: 'JIiL4J4VS1k' },
    { title: 'Shadowing 5 — Upper 2', youtubeId: 'frvOfY5ufyA' },
    { title: 'Shadowing 6 — Upper 2', youtubeId: 'ly13pYgL3jc' },
  ],
  l12: [
    { title: 'Shadowing 1 — Upper 3', youtubeId: 'wA-FgZxIQ2E' },
    { title: 'Shadowing 2 — Upper 3', youtubeId: '9RmzhX5CKTM' },
    { title: 'Shadowing 3 — Upper 3', youtubeId: 'ZifQNqH4BJ4' },
    { title: 'Shadowing 4 — Upper 3', youtubeId: '46b8DlXtLPM' },
    { title: 'Shadowing 5 — Upper 3', youtubeId: 'iJpojFbxHqY' },
  ],
};

export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

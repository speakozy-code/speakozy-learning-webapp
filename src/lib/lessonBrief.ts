// Turns imported session files into a scannable lesson brief.
// The raw "Lesson material (text)" dump stays available as a transcript, not the overview.

type Section = { id: string; title: string; body: string };
type SessionLike = { id: string; title?: string; topic?: string; sections?: Section[] };

export type BriefKind = 'warmup' | 'objectives' | 'phrases' | 'summary';
export interface BriefBlock {
  id: string;
  kind: BriefKind;
  title: string;
  items: string[];
}

const NOISE = /^(one|two|three|four|five|six|seven|eight|nine|ten|let's practise!?|let's check the answers\.?|let's learn some words!?|let's go with the grammar\.?|let's play a game!?|let's get started|with a warm-up|practice|positive \+|negative -|short answers|yes, no question)$/i;

function section(s: SessionLike, re: RegExp) {
  return (s.sections || []).find((x) => re.test(x.title));
}

function slideChunks(body: string): string[] {
  return String(body || '')
    .split(/Slide\s+\d+:\s*/i)
    .map((x) => x.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function clip(text: string, max = 220) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function splitBits(text: string): string[] {
  return String(text || '')
    .split(/\s*\|\s*|\n+/)
    .map((x) => x.replace(/\s+/g, ' ').trim())
    .filter((x) => x && x.length > 3 && !NOISE.test(x) && !/^Slide\s+\d+/i.test(x));
}

function unique(items: string[], max = 8) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = clip(raw);
    const key = t.toLowerCase();
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function material(s: SessionLike) {
  return section(s, /lesson material/i)?.body || '';
}

export function sourceTranscript(s: SessionLike): string {
  return (material(s) || '').trim();
}

function warmupFromSlides(slides: string[]): string[] {
  const start = slides.findIndex((x) => /warm-?up/i.test(x));
  const end = slides.findIndex((x, i) => i > start && /let's learn some words|vocabulary:/i.test(x));
  const window = start >= 0 ? slides.slice(start + 1, end > start ? end : start + 8) : [];
  const bits = window.flatMap(splitBits).filter((x) =>
    /[?؟]$/.test(x) || /^(what|do you|how|why|where|who|tell|talk|describe|think)/i.test(x)
  );
  return unique(bits, 6);
}

function objectivesFromSlides(slides: string[]): string[] {
  const hit = slides.find((x) => /vocabulary:|grammar:|speaking:/i.test(x));
  if (!hit) return [];
  return unique(splitBits(hit).filter((x) => /^(vocabulary|grammar|speaking|game|homework)\b/i.test(x) || x.length > 18), 6);
}

function phrasesFromSlides(slides: string[]): string[] {
  const vocabAt = slides.findIndex((x) => /let's learn some words|vocabulary:/i.test(x));
  const early = slides.slice(0, vocabAt > 0 ? vocabAt : 12);
  const classroom = early.flatMap(splitBits).filter((x) =>
    /^(open|close|look|repeat|read|write|listen|say|sit)\b/i.test(x)
  );
  return unique(classroom, 8);
}

export function lessonBrief(s: SessionLike): BriefBlock[] {
  const slides = slideChunks(material(s));
  const blocks: BriefBlock[] = [];

  const warmupNamed = splitBits(section(s, /warm-?up|objectives/i)?.body || '');
  const warmup = unique([...warmupFromSlides(slides), ...warmupNamed.filter((x) => x.length > 12 && x !== s.title)], 6);
  if (warmup.length) blocks.push({ id: `${s.id}-warmup`, kind: 'warmup', title: 'Warm-up', items: warmup });

  const objNamed = splitBits(section(s, /objectives/i)?.body || '');
  const objectives = unique([...objectivesFromSlides(slides), ...objNamed.filter((x) => /vocabulary|grammar|speaking|learn/i.test(x))], 6);
  if (objectives.length) {
    blocks.push({ id: `${s.id}-objectives`, kind: 'objectives', title: 'In this lesson', items: objectives });
  } else if (s.topic) {
    blocks.push({ id: `${s.id}-objectives`, kind: 'objectives', title: 'In this lesson', items: [clip(s.topic, 160)] });
  }

  const useful = splitBits(section(s, /useful language/i)?.body || '');
  const phrases = unique([...phrasesFromSlides(slides), ...useful.filter((x) => x.length > 8)], 8);
  if (phrases.length) blocks.push({ id: `${s.id}-phrases`, kind: 'phrases', title: 'Useful language', items: phrases });

  const summaryNamed = splitBits(section(s, /summary/i)?.body || '');
  const summarySlides = slides.flatMap(splitBits).filter((x) => /today we (studied|learned|learnt)/i.test(x));
  const summary = unique([...summarySlides, ...summaryNamed], 4);
  if (summary.length) blocks.push({ id: `${s.id}-summary`, kind: 'summary', title: 'Today we learned', items: summary });

  if (!blocks.length) {
    const fallback = unique(slides.flatMap(splitBits).filter((x) => x.length > 18 && !/Mr\.Ahmed|Let's Speak/i.test(x)), 5);
    if (fallback.length) {
      blocks.push({ id: `${s.id}-objectives`, kind: 'objectives', title: 'In this lesson', items: fallback });
    } else {
      blocks.push({
        id: `${s.id}-objectives`,
        kind: 'objectives',
        title: 'In this lesson',
        items: [clip(s.title || s.topic || 'Open the vocabulary and grammar tabs to study this session.', 160)],
      });
    }
  }
  return blocks;
}

export interface OverviewOutline {
  title: string;
  topic: string;
  headings: string[];
  summary: string;
}

function lessonName(s: SessionLike) {
  return String(s.title || '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^SESSION\s+\d+\s*[|—-]\s*/i, '')
    .trim() || 'This lesson';
}

export function overviewOutline(s: SessionLike): OverviewOutline {
  const title = lessonName(s);
  const grammar = (section(s, /grammar/i)?.title || 'Grammar').replace(/^Grammar\s*[—-]\s*/i, '').trim();
  const wordCount = splitBits(section(s, /vocab/i)?.body || '').length;
  const summary = `This lesson is “${title}”. You will learn the new words${wordCount ? ` (${Math.min(wordCount, 20)} items)` : ''}, study ${clip(grammar, 70) || 'the grammar point'}, practise speaking, then write a short summary of what you understood.`;
  return {
    title,
    topic: s.topic || '',
    headings: ['Objectives', 'Words', 'Grammar', 'Practice'],
    summary: clip(summary, 380),
  };
}

export function letsTalk(s: SessionLike): string[] {
  const slides = slideChunks(material(s));
  const out: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    if (!/let'?s talk|open discussion|discuss these questions|speaking practi/i.test(slides[i])) continue;
    const bits = [...splitBits(slides[i]), ...(slides[i + 1] ? splitBits(slides[i + 1]) : [])];
    for (const b of bits) {
      if (/let'?s talk|open discussion|give detailed|partner/i.test(b)) continue;
      if (/[?؟]$/.test(b) || /^(discuss|talk|tell|describe|what|how|why|do you|when you)/i.test(b)) out.push(b);
    }
  }
  return unique(out, 8);
}

export function voicePrompts(s: SessionLike): string[] {
  const talk = letsTalk(s);
  const fallback = [
    `Talk about ${s.topic || lessonName(s)} using five new words from this lesson.`,
    `Tell a short true story connected to ${lessonName(s)}.`,
  ];
  return unique([...talk, ...fallback], 2);
}

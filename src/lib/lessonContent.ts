// Turns the raw text sections imported from presentations into structured,
// individually-configured lesson content. Pure functions, no side effects.

import { insightFor } from './grammarInsights';

export interface GrammarSlide {
  title: string;
  rule: string;
  examples: string[];
  detail?: string;
}

export interface ExerciseItem {
  id: string;
  prompt: string;
  answer: string;
  kind: 'fill' | 'writing';
}

export interface HomeworkBlock {
  title: string;
  brief: string;
  requirements: string[];
}

export interface GameBlock {
  title: string;
  description: string;
}

type Section = { id: string; title: string; body: string };
type SessionLike = { id: string; sections?: Section[] };

const section = (s: SessionLike, re: RegExp) => (s.sections || []).find((x) => re.test(x.title));
const sentences = (text: string) => text.replace(/\s+/g, ' ').split(/(?<=[.!?؟])\s+/).map((x) => x.trim()).filter(Boolean);
const clean = (text: string) => (text || '').replace(/\s+/g, ' ').trim();

const HEAD = /^(Past Simple|Past Continuous|Present Simple|Present Continuous|when and while|while While:|When:|While:|Future|Conditional|Linking Words)\b/i;
const EXAMPLE = /^(What|I |They |He |She |NOT |When I |When the |While I |While the )/i;

/** Grammar content as a deck of slides: one topic per slide, with its examples. */
export function grammarSlides(s: SessionLike): GrammarSlide[] {
  const secs = (s.sections || []).filter((x) => /grammar|قاعدة|قواعد/i.test(x.title));
  if (!secs.length) return [];
  const slides: GrammarSlide[] = [];

  for (const sec of secs) {
    const body = (sec.body || '').trim();
    if (!body) continue;

    // Explicit topic headings in the imported presentations (Past Simple, While, …).
    const parts = sentences(body);
    let current: { title: string; parts: string[] } | null = null;
    const push = () => {
      if (!current) return;
      const firstExample = current.parts.findIndex((p) => EXAMPLE.test(p));
      const ruleParts = firstExample < 0 ? current.parts : current.parts.slice(0, firstExample);
      const examples = firstExample < 0 ? [] : current.parts.slice(firstExample).filter((p) => EXAMPLE.test(p));
      const rule = ruleParts.join(' ').trim();
      if (rule || examples.length) slides.push({ title: current.title, rule, examples });
      current = null;
    };

    for (const p of parts) {
      if (/^The grammar/i.test(p)) continue;
      const match = p.match(HEAD);
      if (match) {
        push();
        const heading = match[1];
        const rest = p.slice(heading.length).trim();
        current = { title: heading.replace(/^when and while$/i, 'When & While'), parts: rest ? [rest] : [] };
      } else if (current) {
        current.parts.push(p);
      } else {
        current = { title: 'Key idea', parts: [p] };
      }
    }
    push();

    // Arabic/short grammar notes: one slide per short line, grouped in pairs.
    const sectionTitle = sec.title.replace(/^Grammar\s*[—-]\s*/i, '').trim();
    if (slides.length === 0) {
      const lines = body.split('\n').map((x) => x.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i += 2) {
        const title = i === 0 && sectionTitle ? sectionTitle : (lines[i].length > 64 ? lines[i].slice(0, 61) + '…' : lines[i]);
        const rule = i === 0 && sectionTitle ? lines.slice(i, i + 2).join(' ') : (lines[i + 1] || '');
        slides.push({ title, rule, examples: [] });
      }
    }
  }

  // Last resort for very short notes: two sentences per slide.
  if (!slides.length) {
    const all = sentences(secs.map((x) => x.body).join(' '));
    const label = secs[0].title.replace(/^Grammar\s*[—-]\s*|^قاعدة\s*/i, '').trim() || 'Grammar';
    for (let i = 0; i < all.length; i += 2) {
      slides.push({ title: i === 0 ? label : all[i].slice(0, 64), rule: all.slice(i + 1, i + 3).join(' '), examples: [] });
    }
  }
  // Notes with no topic heading still need a meaningful slide title.
  if (slides.length && slides.every((x) => x.title === 'Key idea')) {
    const labels = secs.map((x) => x.title.replace(/^Grammar\s*[—-]\s*|^قاعدة\s*/i, '').trim());
    slides.forEach((x, i) => { if (labels[i]) x.title = labels[i]; });
  }
  // Every slide gets an expanded explanation (and extra examples where known).
  slides.forEach((slide) => {
    if (slide.detail) return;
    const insight = insightFor(slide.title, slide.rule);
    slide.detail = insight.detail;
    if (!slide.examples.length && insight.extra.length) slide.examples = insight.extra;
  });
  return slides;
}

/** Each exercise becomes its own item, with the expected answer linked to the word bank. */
export function exercises(s: SessionLike): ExerciseItem[] {
  const sec = section(s, /practice exercises|أمثلة وتمارين|exercises/i);
  if (!sec) return [];
  const lines = (sec.body || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const bankLine = lines.find((x) => /^word bank:/i.test(x));
  const bank = bankLine ? bankLine.replace(/^word bank:\s*/i, '').split(/[,،]/).map((x) => x.trim()).filter(Boolean) : [];
  const items: ExerciseItem[] = [];
  let n = 0;

  for (const line of lines) {
    if (/^word bank:/i.test(line)) continue;
    if (/:$/.test(line) && !/___/.test(line)) continue; // instruction header, not a question
    if (/^exercise\s*\d+\s*[—-]/i.test(line)) {
      items.push({ id: `${s.id}-ex-${++n}`, prompt: line.replace(/^exercise\s*\d+\s*[—-]\s*/i, ''), answer: '', kind: 'writing' });
      continue;
    }
    if (/^[•\-*]/.test(line)) {
      const prompt = line.replace(/^[•\-*]\s*/, '');
      const answer = bank[items.filter((x) => x.kind === 'fill').length] || '';
      items.push({ id: `${s.id}-ex-${++n}`, prompt, answer, kind: 'fill' });
      continue;
    }
    if (line.includes('—')) {
      const [prompt, answer] = line.split('—').map((x) => x.trim());
      items.push({ id: `${s.id}-ex-${++n}`, prompt, answer: answer || '', kind: 'writing' });
    }
  }
  return items;
}

/** Homework as a brief plus a checklist, each requirement separated. */
export function homework(s: SessionLike): HomeworkBlock | null {
  const sec = section(s, /homework|الواجب/i);
  if (!sec) return null;
  const text = clean(sec.body);
  const idx = text.search(/You MUST include:|لازم تتضمن|المطلوب:/i);
  const marker = idx >= 0 ? (text.slice(idx).match(/^[^:]+:/) || [''])[0].length : 0;
  const before = idx >= 0 ? text.slice(0, idx) : text;
  const after = idx >= 0 ? text.slice(idx + marker) : '';
  const requirements = sentences(after).map((x) => x.replace(/^[-•]\s*/, '').trim()).filter(Boolean).slice(0, 10);
  const record = before.match(/Record Yourself/i);
  const title = record ? 'Record Yourself' : (before.match(/^Homework\s*/i) ? 'Homework' : (before.split(/\s+/)[0] || 'Homework'));
  const brief = record
    ? before.slice((record.index || 0) + 'Record Yourself'.length).replace(/^\s*Task\s*/i, '').replace(/^[:—\-\s]+/, '').trim()
    : before.replace(/^Homework\s*/i, '').replace(/^[:—\-\s]+/, '').trim();
  return { title, brief, requirements };
}

/** Game as its own activity, stripped of the slide-decoration noise. */
export function game(s: SessionLike): GameBlock | null {
  const sec = section(s, /game|لعبة/i);
  if (!sec) return null;
  let text = clean(sec.body);
  const cut = text.search(/Today we Learned|Today we learned/i);
  if (cut > 0) text = text.slice(0, cut);
  text = text.replace(/Click here|\b\d{2}\s+\d{2}\b/g, '').trim();
  const title = 'Game';
  const description = clean(text);
  return { title, description };
}

/** Sections that are reference material only — shown on the Overview tab. */
export function overviewSections(s: SessionLike): Section[] {
  const skip = /vocab|مفردات|grammar|قاعدة|قواعد|homework|game|practice exercises|أمثلة وتمارين|واجب|لعبة/i;
  return (s.sections || []).filter((x) => !skip.test(x.title));
}

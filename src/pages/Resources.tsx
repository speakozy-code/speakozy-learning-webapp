import React from 'react';
import { Card, SectionTitle, Badge } from '../components/UI';
import { youtubeEmbed } from '../lib/videoSlots';
import { Library, Headphones, Mic2 } from 'lucide-react';

// مصادر إضافية: بلاي ليستات شادوينج + قنوات بودكاست.
const SHADOW_VIDEO = 'iJpojFbxHqY';
const SHADOW_PLAYLISTS = [
  'PLA7lNLNvxTzig5dqfGl8DGbLOvUI08yXg',
  'PLL8rrkKVLqeRdeFKmygYujTkwOefatZ6G',
  'PLjFBDcUo70iPQYiWU8vt1KykEEwVzTKqG',
  'PLlpAWCqcstzpkZomfDM5P2gwO4dgP0o_5',
];
const PODCAST_CHANNELS = ['5104992', '5562189', '468568', '574393', '4832025', '1018980', '4956820', '4827692', '4580807', '483309'];
const ENGLISH_PODCASTS = ['1325176', '2046285', '3995961', '2269226', '2918889'];

const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`;
const castboxUrl = (id: string) => `https://castbox.fm/vc/${id}`;

function LinkGrid({ items, label, href }: { items: string[]; label: string; href: (id: string) => string }) {
  return <div className="grid g3">
    {items.map((id, i) => <a key={id} className="section-card" href={href(id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="row between"><strong dir="ltr" className="en">{label} {i + 1}</strong><Badge tone="blue">افتح ↗</Badge></div>
    </a>)}
  </div>;
}

export default function ResourcesPage() {
  return <div className="stack">
    <div><h1><Library size={22} /> المصادر</h1>
      <p className="muted">مصادر إضافية تساعدك تتدرب بره السيشنات: فيديوهات شادوينج وبودكاست إنجليزي.</p></div>

    <Card>
      <SectionTitle title="مصادر الشادوينج" action={<Badge tone="green"><Headphones size={12} /> شادوينج</Badge>} />
      <div className="video-frame"><iframe src={youtubeEmbed(SHADOW_VIDEO)} title="Shadowing resource" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
      <p className="muted" style={{ marginBottom: '.4rem' }}>بلاي ليستات شادوينج على يوتيوب:</p>
      <LinkGrid items={SHADOW_PLAYLISTS} label="Playlist" href={playlistUrl} />
    </Card>

    <Card>
      <SectionTitle title="مصادر بودكاست — Podcast channels" action={<Badge tone="amber"><Mic2 size={12} /> بودكاست</Badge>} />
      <LinkGrid items={PODCAST_CHANNELS} label="Podcast" href={castboxUrl} />
    </Card>

    <Card>
      <SectionTitle title="English Podcast" action={<Badge tone="amber"><Mic2 size={12} /> بودكاست</Badge>} />
      <LinkGrid items={ENGLISH_PODCASTS} label="English Podcast" href={castboxUrl} />
    </Card>
  </div>;
}

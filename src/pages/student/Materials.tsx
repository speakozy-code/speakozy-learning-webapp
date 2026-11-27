import { PageTour } from '../../components/Tour';
import { useEffect, useState } from 'react';
import { useApp } from '../../lib/store';
import { Card, Button, Badge, Empty, Field } from '../../components/UI';
import { pickableLevels, sessionOpen, levelFullyOpen, levelLabel } from '../../lib/domain';
import { go } from '../../App';

import { PdfActions } from './materialPdf';

export function MaterialsPage() {
  const { user, data, saveProfile } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  const [selected, setSelected] = useState(user?.role === 'student' ? user.levelId : '');
  useEffect(() => { if (user?.role === 'student') setSelected(user.levelId); }, [user?.levelId]);
  if (!user) return null;
  const admin = user.role === 'admin';
  const levelId = selected;
  const level = data.levels.find((l) => l.id === levelId);
  const sessions = data.sessions.filter((s) => !!level && s.levelId === level.id).sort((a, b) => a.order - b.order);
  const partial = level ? (!admin && !levelFullyOpen(user, level, data.levels)) : false;
  const en = true;
  const L = en ? { title:'Materials', hint:'Pick a level from the list. All levels are available for browsing.', level:'Level', words:'words', ready:'Ready', locked:'Locked', open:'Open lesson', none:'No materials in this level', noneHint:'Materials will appear here once lessons are added.', lesson:'Lesson', pdf:'Open PDF', dl:'Download' } :
    { title:'الماتيريال', hint:'اختار مستوى من القائمة — كل المستويات متاحة للتصفح.', level:'المستوى', words:'كلمة', ready:'جاهز', locked:'مقفول', open:'افتح الدرس', none:'مفيش ماتيريال في المستوى ده', noneHint:'الماتيريال هتظهر هنا أول ما الدروس تتضاف.', lesson:'الدرس', pdf:'افتح PDF ↗', dl:'نزّل PDF ⬇' };
  return <div className="stack" dir={en ? 'ltr' : undefined}>
    <PageTour id="materials" />
    <div><h1>{L.title}</h1><p className="muted">{L.hint}</p></div>
    <Card>
      <Field label={L.level}><select value={levelId} onChange={(e) => { const v = e.target.value; setSelected(v); if (!admin && v && v !== user.levelId && pickableLevels(user, data.levels).some((l) => l.id === v)) void saveProfile({ currentLevelId: v }); }}>
        <option value="">{en ? '— Pick your level —' : '— اختار الليفل بتاعك —'}</option>
        {levels.map((l) => {
          return <option key={l.id} value={l.id}>{levelLabel(l)}</option>;
        })}
      </select></Field>
      {level && <div className="row" style={{ marginTop: '.2rem' }}><Badge tone={partial ? 'muted' : 'green'}>{levelLabel(level)}</Badge><Badge tone="blue">{sessions.length} {en ? 'lessons' : 'دروس'}</Badge></div>}
    </Card>
    {!level && <div className="note" dir="rtl">اختار الليفل بتاعك علشان تبدأ.</div>}
    {level && sessions.length ? <div className="grid g2">{sessions.map((s) => {
      const sessionLocked = !admin && !sessionOpen(user, s, data.levels);
      const wordCount = data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id)).length;
      const grammarTitle = (s.sections.find((x) => /grammar/i.test(x.title))?.title || (en ? 'Grammar' : 'الجرامر')).replace(/^Grammar\s*[—-]\s*/i, '');
      return <Card key={s.id} className="material-card">
        <div className="brief-kicker">{L.lesson} {s.order}</div>
        <h3>{s.title}</h3>
        <p className="muted" style={{ marginBottom: '.7rem' }}>{s.topic}</p>
        <div className="row" style={{ marginBottom: '.8rem' }}>
          <Badge tone="blue">{wordCount} {L.words}</Badge>
          <Badge>{grammarTitle.slice(0, 42)}</Badge>
        </div>
        <div className="row">
          <PdfActions s={s} stop />
          <Button size="sm" disabled={sessionLocked} onClick={() => go(`/session/${s.id}`)}>{sessionLocked ? L.locked : L.open}</Button>
        </div>
      </Card>;
    })}</div> : level ? <Empty icon="📂" title={L.none} hint={L.noneHint} /> : null}
  </div>;
}

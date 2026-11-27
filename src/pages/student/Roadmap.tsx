import { PageTour } from '../../components/Tour';
import { useApp } from '../../lib/store';
import { Card, Badge, SectionTitle, fmtDay } from '../../components/UI';
import { sessionStatus, engagementProgress, sessionOpen, levelFullyOpen, levelLabel } from '../../lib/domain';
import { SubscribeButtons } from '../../components/Upsell';

import { statusTone } from './shared';

export function Roadmap() {
  const { user, data } = useApp();
  const levels = [...data.levels].sort((a, b) => a.order - b.order);
  if (!user) return null;
  const currentLevel = data.levels.find((l) => l.id === user.levelId) || levels[0];
  const levelSessions = data.sessions.filter((s) => s.levelId === currentLevel?.id).sort((a, b) => a.order - b.order);
  return <div className="stack">
    <PageTour id="roadmap" />
    <div><h1>خريطة المستويات</h1><p className="muted">عرضين في مكان واحد: سيشناتك الأول وبعدين مسار المستويات كامل. الاتنين للقراءة — ذاكر من الرئيسية أو الماتيريال.</p></div>
    <Card className="roadmap-card">
      <SectionTitle title={`سيشنات ${currentLevel?.title || '—'}`} action={<Badge tone="blue">{levelSessions.length} سيشن</Badge>} />
      <div className="roadmap-map session-map">
        {levelSessions.map((s, i) => {
          const st = sessionStatus(data, s, user.id);
          const open = sessionOpen(user, s, data.levels);
          return <div key={s.id} className={`rm-level ${open ? 'is-open' : 'is-locked'} ${i % 2 ? 'rm-right' : 'rm-left'}`}>
            <div className="rm-marker">{open ? i + 1 : '🔒'}</div>
            <div className="rm-body">
              <div className="between"><strong>{s.title}</strong><Badge tone={statusTone[st.key]}>{st.key === 'locked' ? 'لسه ما بدأتش' : st.label}</Badge></div>
              <p className="muted" style={{ margin: '.3rem 0' }}>{s.topic} · {fmtDay(s.dueAt)}</p>
              <div className="muted" style={{ fontSize: '.8rem' }}>{data.dictionary.filter((w) => (w.sessionIds || []).includes(s.id)).length} كلمة · {s.sections.length} أجزاء</div>
            </div>
          </div>;
        })}
      </div>
    </Card>
    <Card className="roadmap-card">
      <SectionTitle title="المستويات" action={<Badge tone="blue">{levels.length} مستوى — تصنيف CEFR العالمي</Badge>} />
      {user.subscribed === false && <><div className="note">تقدر تتصفح كل المستويات من البداية بتقسيمها العالمي — اشترك عشان تفتح كل الجلسات.</div>
        <Card className="shadow-inline"><div className="row between"><span>🎧 تاسكات يومية هتخليك تتكلم إنجليزي كل يوم وتوصل لهدفك أسرع — ابدأ معانا الشادوينج.</span>
          <SubscribeButtons size="sm" /></div></Card></>}
      <div className="roadmap-map">
        {levels.map((l, i) => {
          const sessions = data.sessions.filter((s) => s.levelId === l.id).sort((a, b) => a.order - b.order);
          const full = levelFullyOpen(user, l, data.levels);
          const pct = engagementProgress(data, l.id, user.id);
          const approved = sessions.filter((s) => sessionStatus(data, s, user.id).key === 'approved').length;
          return <div key={l.id} className={`rm-level is-open ${l.id === user.levelId ? 'is-current' : ''} ${i % 2 ? 'rm-right' : 'rm-left'}`}>
            <div className="rm-marker">{i + 1}</div>
            <div className="rm-body">
              <div className="between"><strong>{levelLabel(l)}</strong><Badge tone={full ? 'green' : 'muted'}>{levelLabel(l)}</Badge></div>
              <p className="muted" style={{ margin: '.3rem 0' }}>{l.description}</p>
              <div className="rm-dots">{sessions.map((s) => { const st = sessionStatus(data, s, user.id).key; return <span key={s.id} className={`rm-dot ${st === 'approved' ? 'done' : st === 'progress' || st === 'review' || st === 'done' ? 'active' : ''}`} title={s.title} />; })}</div>
              {sessions.length
                ? <div className="muted" style={{ fontSize: '.8rem' }}>{approved} من {sessions.length} سيشن معتمدة · {pct}% مكتمل</div>
                : <div className="muted" style={{ fontSize: '.8rem' }}>🚧 المحتوى قريبًا</div>}
            </div>
          </div>;
        })}
      </div>
    </Card>
  </div>;
}

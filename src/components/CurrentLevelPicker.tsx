import React from 'react';
import { useApp } from '../lib/store';
import { pickableLevels } from '../lib/domain';

/** Students with more than one opened level choose here which one they are working on now (saved on the profile). */
export function CurrentLevelPicker({ dark = false }: { dark?: boolean }) {
  const { user, data, saveProfile } = useApp();
  if (!user || user.role !== 'student') return null;
  const levels = pickableLevels(user, data.levels);
  if (levels.length < 2) return null;
  return <div className={`level-picker${dark ? ' on-dark' : ''}`}>
    <label>
      <span>مستواك الحالي</span>
      <select value={user.levelId} onChange={(e) => { void saveProfile({ currentLevelId: e.target.value }); }}>
        {levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
      </select>
    </label>
    <small>النقاط والتقدّم والتاسكات والشادوينج والماتيريال هتتعرض على المستوى ده.</small>
  </div>;
}

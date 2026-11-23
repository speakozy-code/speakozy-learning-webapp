import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppData, User } from '../types';
import { seedData, PLANNED_LEVELS } from './seed';
import { LEVEL_TASKS } from './levelTasks';
import { buildDailyTasks } from './dailyTasks';
import { UNIT_WORDS } from './unitWords';
import { fixWords } from './wordFixes';
import { uid, today, addScoreOnce, buildStudentAccount, dailyNotifications } from './domain';
import { isFirebase, fbSignIn, fbSignOut, fbLoadAll, fbWrite, fbDelete } from './firebase';
import { isSupabase, sbSignIn, sbSignOut, sbLoadAll, sbLoadDoc, sbSaveDoc, sbWrite, sbDelete, sbSignUp, sbCurrentUserId, sbCurrentAuth, sbEnsureProfile, sbSaveMyProfile, sbChangePassword, sbUpsertRecord, sbDeleteRecord } from './supabase';
import { englishify } from './translate';

const KEY = 'speakozy-demo-v12';
const CLOUD = isSupabase ? 'supabase' : isFirebase ? 'firebase' : 'demo';
const COLLECTIONS = ['users','levels','sessions','questions','attempts','progress','tasks','taskCompletions','notifications','scores','savedWords','dictionary','certificates','logs','grammarNotes','testimonials'];

function emptyData(): AppData {
  return { users: [], levels: [], sessions: [], questions: [], attempts: [], progress: [], tasks: [], taskCompletions: [], notifications: [], scores: [], savedWords: [], dictionary: [], certificates: [], logs: [], grammarNotes: [], testimonials: [], settings: seedData().settings };
}

function readDemo(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return withLevelTasks(englishify(JSON.parse(raw) as AppData));
  } catch {}
  const seeded = seedData();
  saveDemo(seeded);
  return withLevelTasks(englishify(seeded));
}
function withDailyNotes(d: AppData, user: any): AppData {
  if (!user || user.role !== 'student') return d;
  const notes = dailyNotifications(user.id, user.levelId);
  const ids = new Set(notes.map((n) => n.id));
  return { ...d, notifications: [...notes, ...((d.notifications || []).filter((n: any) => !ids.has(n.id)))] };
}
// التاسكات المستوردة من مواقع المستويات مصدرها الكود؛ بتندمج مع أي تاسكات مخصصة من الأدمن.
const stripSession = (t?: string) => String(t || '').replace(/^\s*session\s+\d+\s*[|—:-]\s*/i, '').replace(/^\s*\d+\.\s*/, '').trim();
/** "SESSION 1 | Social Media" → "Social Media"; when topic repeats the title, the topic is dropped. */
function cleanSessions(d: AppData): AppData {
  return { ...d, sessions: (d.sessions || []).map((x) => {
    const title = stripSession(x.title) || x.title;
    const topic = stripSession(x.topic);
    return { ...x, title, topic: topic.toLowerCase() === title.toLowerCase() ? '' : topic };
  }) };
}
/** The live document may predate the full 14-level path: add any level that is missing (structure only). */
function withAllLevels(d: AppData): AppData {
  const have = new Set((d.levels || []).map((l) => l.id));
  const missing = PLANNED_LEVELS.filter((l) => !have.has(l.id));
  if (!missing.length) return d;
  const top = Math.max(0, ...(d.levels || []).map((l) => l.order || 0));
  return { ...d, levels: [...(d.levels || []), ...missing.map((l, i) => ({ ...l, order: Math.max(l.order, top + 1 + i) }))] };
}
function withLevelTasks(d0: AppData): AppData {
  const d = cleanSessions(withAllLevels(d0));
  const daily = buildDailyTasks(d.levels || [], d.sessions || []);
  // the old imported tasks (LEVEL_TASKS) are retired: drop them and rebuild daily tasks from the level's topics
  const taskIds = new Set([...LEVEL_TASKS.map((t) => t.id), ...daily.map((t) => t.id)]);
  const wordKeys = new Set(UNIT_WORDS.map((w) => w.word.toLowerCase() + '|' + (w.sessionIds || [])[0]));
  const customWords = (d.dictionary || []).filter((w) => !wordKeys.has(w.word.toLowerCase() + '|' + (w.sessionIds || [])[0]));
  return { ...d, tasks: [...daily, ...((d.tasks || []).filter((t) => !taskIds.has(t.id)))], dictionary: fixWords([...UNIT_WORDS, ...customWords]) };
}
function saveDemo(data: AppData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

type Ctx = {
  user: User | null; ready: boolean; demo: boolean; data: AppData;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
  saveProfile: (updates: { avatar?: string; name?: string; phone?: string }) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  put: (collectionName: string, value: any) => Promise<void>;
  remove: (collectionName: string, id: string) => Promise<void>;
  putSettings: (s: AppData['settings']) => Promise<void>;
  grantScore: (studentId: string, source: string, points: number, refId: string) => Promise<void>;
  log: (action: string, target: string) => Promise<void>;
  resetDemo: () => void;
};

const AppCtx = createContext<Ctx>(null as any);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const demo = CLOUD === 'demo';

  useEffect(() => {
    if (!user || user.role !== 'student' || demo) return;
    setData((prev) => withDailyNotes(prev, user));
  }, [user?.id, user?.levelId]);

  async function refresh() {
    if (demo) { setData(withDailyNotes(readDemo(), user)); return; }
    const loaded = CLOUD === 'supabase' ? await sbLoadAll(COLLECTIONS) : await fbLoadAll(COLLECTIONS);
    setData(withDailyNotes(withLevelTasks(englishify({ ...emptyData(), ...loaded } as AppData)), user));
  }

  useEffect(() => {
    (async () => {
      if (demo) {
        setData(readDemo());
        const savedId = localStorage.getItem('speakozy-user');
        if (savedId) {
          const found = readDemo().users.find((u) => u.id === savedId);
          if (found) setUser(found);
        }
      } else {
        await refresh();
        if (CLOUD === 'supabase') {
          const auth = await sbCurrentAuth();
          if (auth) {
            const match = (list: any[]) => (list || []).find((u: any) => u.id === `auth-${auth.id}` || u.authId === auth.id || (u.email || '').toLowerCase() === auth.email);
            let loaded = await sbLoadAll(['users']);
            let found = match(loaded.users);
            if (!found) {
              await sbEnsureProfile();
              await refresh();
              loaded = await sbLoadAll(['users']);
              found = match(loaded.users);
            }
            if (found) setUser(found as User);
          }
        }
      }
      setReady(true);
    })();
  }, []);

  async function login(email: string, password: string) {
    if (demo) {
      const found = readDemo().users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.demoPassword === password);
      if (!found) throw new Error('Invalid email or password');
      if (!found.active) throw new Error('Account disabled, please contact the administration');
      localStorage.setItem('speakozy-user', found.id);
      setUser(found);
      setData(readDemo());
      return;
    }
    if (CLOUD === 'supabase') await sbSignIn(email, password); else await fbSignIn(email, password);
    await refresh();
    const fresh = CLOUD === 'supabase' ? await sbLoadAll(['users']) : await fbLoadAll(['users']);
    const authId = CLOUD === 'supabase' ? await sbCurrentUserId() : null;
    const me = (fresh.users || []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase() || u.id === `auth-${authId}`);
    if (!me) throw new Error('User profile not found');
    setUser(me as User);
  }

  async function signup(name: string, email: string, password: string, phone?: string) {
    if (!demo) {
      await sbSignUp(name.trim(), email.trim(), password);
      // the phone number is stored with the student's profile (needs the save_my_profile update in supabase/migrations)
      if (phone && CLOUD === 'supabase') { try { await sbSaveMyProfile({ phone }); } catch {} }
      await refresh();
      const loaded = await sbLoadAll(['users']);
      const authId = await sbCurrentUserId();
      const account = (loaded.users || []).find((u: any) => (u.email || '').toLowerCase() === email.trim().toLowerCase() || u.id === `auth-${authId}` || u.authId === authId);
      if (account) setUser(account as User);
      return;
    }
    const d = readDemo();
    const mail = email.trim().toLowerCase();
    const granted = d.users.find((u) => u.email.toLowerCase() === mail);
    if (granted && granted.demoPassword) throw new Error('An account with this email already exists');
    let account: User;
    if (granted) {
      granted.demoPassword = password;
      if (name.trim()) granted.name = name.trim();
      if (phone) granted.phone = phone;
      account = granted;
    } else {
      const first = d.levels.slice().sort((a, b) => a.order - b.order)[0]?.id || 'l1';
      account = buildStudentAccount({ name, email: mail, demoPassword: password, levelId: first, maxLevelId: first, subscribed: false, phone });
      d.users.push(account);
    }
    saveDemo(d);
    localStorage.setItem('speakozy-user', account.id);
    setData(d);
    setUser(account);
  }

  async function logout() {
    if (CLOUD === 'supabase') await sbSignOut(); else if (!demo) await fbSignOut();
    localStorage.removeItem('speakozy-user');
    setUser(null);
  }

  async function saveProfile(updates: { avatar?: string; name?: string; phone?: string }) {
    if (!user) return;
    if (demo) {
      const d = readDemo();
      const me = d.users.find((u) => u.id === user.id);
      if (me) { Object.assign(me, updates); saveDemo(d); setData(d); setUser({ ...me }); }
      return;
    }
    if (CLOUD === 'supabase') {
      await sbSaveMyProfile(updates);
      await refresh();
      const loaded = await sbLoadAll(['users']);
      const me = (loaded.users || []).find((u: any) => u.id === user.id);
      if (me) setUser(me as User);
      return;
    }
    await fbWrite('users', user.id, { ...user, ...updates });
    setUser({ ...user, ...updates });
  }

  const FAST_KEYS = ['progress', 'attempts', 'taskCompletions', 'savedWords', 'notificationReads', 'testimonials'];
  async function put(collectionName: string, value: any) {
    const id = value.id || uid();
    const record = { ...value, id };
    if (demo) {
      const next = readDemo();
      const list = (next as any)[collectionName] as any[];
      const idx = list.findIndex((x) => x.id === id);
      if (idx >= 0) list[idx] = record; else list.push(record);
      saveDemo(next);
      setData(next);
    } else if (CLOUD === 'supabase') {
      if (user?.role === 'student' && FAST_KEYS.includes(collectionName)) {
        // تحديث فوري للواجهة + سفرة واحدة للخادم
        setData((prev) => {
          const list = ((prev as any)[collectionName] || []) as any[];
          const idx = list.findIndex((x) => x.id === id);
          const nextList = idx >= 0 ? list.map((x) => (x.id === id ? record : x)) : [...list, record];
          return { ...prev, [collectionName]: nextList } as AppData;
        });
        await sbUpsertRecord(collectionName, record);
        return;
      }
      setData((prev) => {
        const list = ((prev as any)[collectionName] || []) as any[];
        const idx = list.findIndex((x) => x.id === id);
        const nextList = idx >= 0 ? list.map((x) => (x.id === id ? record : x)) : [...list, record];
        return { ...prev, [collectionName]: nextList } as AppData;
      });
      void sbWrite(collectionName, id, record).catch((e) => { console.error('write failed', e); void refresh(); });
    } else {
      setData((prev) => {
        const list = ((prev as any)[collectionName] || []) as any[];
        const idx = list.findIndex((x) => x.id === id);
        const nextList = idx >= 0 ? list.map((x) => (x.id === id ? record : x)) : [...list, record];
        return { ...prev, [collectionName]: nextList } as AppData;
      });
      void fbWrite(collectionName, id, record).catch((e) => { console.error('write failed', e); void refresh(); });
    }
  }

  async function remove(collectionName: string, id: string) {
    if (demo) {
      const next = readDemo();
      (next as any)[collectionName] = ((next as any)[collectionName] as any[]).filter((x) => x.id !== id);
      saveDemo(next);
      setData(next);
    } else if (CLOUD === 'supabase') {
      if (user?.role === 'student' && FAST_KEYS.includes(collectionName)) {
        setData((prev) => ({ ...prev, [collectionName]: (((prev as any)[collectionName] || []) as any[]).filter((x) => x.id !== id) } as AppData));
        await sbDeleteRecord(collectionName, id);
        return;
      }
      setData((prev) => ({ ...prev, [collectionName]: (((prev as any)[collectionName] || []) as any[]).filter((x) => x.id !== id) } as AppData));
      void sbDelete(collectionName, id).catch((e) => { console.error('delete failed', e); void refresh(); });
    } else {
      setData((prev) => ({ ...prev, [collectionName]: (((prev as any)[collectionName] || []) as any[]).filter((x) => x.id !== id) } as AppData));
      void fbDelete(collectionName, id).catch((e) => { console.error('delete failed', e); void refresh(); });
    }
  }

  async function changePassword(newPassword: string) {
    if (demo) {
      if (!user) return;
      const d = readDemo();
      const me = d.users.find((u) => u.id === user.id);
      if (me) { me.demoPassword = newPassword; saveDemo(d); setData(d); setUser({ ...me }); }
      return;
    }
    if (CLOUD === 'supabase') { await sbChangePassword(newPassword); return; }
    throw new Error('Password change needs the live account service');
  }

  async function putSettings(s: AppData['settings']) {
    if (demo) {
      const next = readDemo(); next.settings = s; saveDemo(next); setData(next);
    } else if (CLOUD === 'supabase') {
      setData((prev) => ({ ...prev, settings: s } as AppData));
      void sbLoadDoc().then((doc) => { doc.settings = s; return sbSaveDoc(doc); }).catch((e) => { console.error('settings failed', e); void refresh(); });
    } else await fbWrite('settings', 'ledger', s);
  }

  async function grantScore(studentId: string, source: string, points: number, refId: string) {
    if (demo) {
      const next = readDemo();
      if (addScoreOnce(next, { studentId, source, points, refId })) { saveDemo(next); setData(next); }
    } else if (CLOUD === 'supabase') {
      await sbWrite('scores', uid(), { studentId, source, points, refId, createdAt: today() });
    } else {
      await fbWrite('scores', uid(), { studentId, source, points, refId, createdAt: today() });
    }
  }

  async function log(action: string, target: string) {
    await put('logs', { actorId: user?.id || 'system', action, target, createdAt: today() });
  }

  function resetDemo() {
    localStorage.removeItem(KEY);
    setData(seedData());
    setUser(null);
  }

  return <AppCtx.Provider value={{ user, ready, demo, data, login, signup, logout, setUser, saveProfile, changePassword, put, remove, putSettings, grantScore, log, resetDemo }}>{children}</AppCtx.Provider>;
}

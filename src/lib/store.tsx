import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppData, User } from '../types';
import { seedData, PLANNED_LEVELS } from './seed';
import { LEVEL_TASKS } from './levelTasks';
import { buildDailyTasks } from './dailyTasks';
import { UNIT_WORDS } from './unitWords';
import { mergeWords } from './wordFixes';
import { setGrammarOverrides } from './grammar/index';
import { uid, today, addScoreOnce, buildStudentAccount, dailyNotifications, withExpiry, withCurrentLevel, subscriptionDaysLeft, cairoToday, arabicDate } from './domain';
import { isFirebase, fbSignIn, fbSignOut, fbLoadAll, fbWrite, fbDelete } from './firebase';
import { isSupabase, sbSignIn, sbSignOut, sbLoadAll, sbLoadDoc, sbSaveDoc, sbSaveSettings, sbWrite, sbDelete, sbSignUp, sbSignInWithGoogle, sbCurrentUserId, sbCurrentAuth, sbEnsureProfile, sbSaveMyProfile, sbChangePassword, sbUpsertRecord, sbDeleteRecord } from './supabase';
import { englishify } from './translate';

const KEY = 'speakozy-demo-v12';
const CLOUD = isSupabase ? 'supabase' : isFirebase ? 'firebase' : 'demo';
const COLLECTIONS = ['users','levels','sessions','questions','attempts','progress','tasks','taskCompletions','notifications','scores','savedWords','dictionary','certificates','logs','grammarNotes','testimonials','listenClips','notificationReads'];

function emptyData(): AppData {
  return { users: [], levels: [], sessions: [], questions: [], attempts: [], progress: [], tasks: [], taskCompletions: [], notifications: [], scores: [], savedWords: [], dictionary: [], certificates: [], logs: [], grammarNotes: [], testimonials: [], listenClips: [], notificationReads: [], settings: seedData().settings };
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
const DAY_MS = 86400000;
/** One word per day, the same for everybody: single English words that have an Arabic meaning. */
let RAW_DICT: any[] = []; // the live document's dictionary as stored (the daily push picks from the same list)
function wordOfDay(dict: any[], day: string) {
  const pool = (RAW_DICT.length ? RAW_DICT : (dict || [])).filter((w: any) => !w.hidden && /^[A-Za-z]{3,}$/.test(w.word || '') && String(w.arabic || '').trim());
  if (!pool.length) return null;
  const n = Math.floor(new Date(day + 'T00:00:00Z').getTime() / DAY_MS);
  return pool[(n * 7919) % pool.length];
}
function withDailyNotes(d: AppData, user: any): AppData {
  if (!user || user.role !== 'student') return d;
  const reads = new Set(((d as any).notificationReads || []).filter((r: any) => r.studentId === user.id && r.read).map((r: any) => r.notificationId));
  const notes: any[] = [];
  // the last 7 days: today's are always listed, older ones stay until the student taps them
  for (let i = 0; i < 7; i++) {
    const when = new Date(Date.now() - i * DAY_MS);
    const day = cairoToday(when);
    const day0 = Math.floor(new Date(day + 'T00:00:00Z').getTime() / DAY_MS);
    const list: any[] = dailyNotifications(user.id, user.levelId, when);
    const w = wordOfDay(d.dictionary, day);
    if (w) list.push({ id: `daily-wotd-${user.id}-${day}`, targetId: user.id, title: 'كلمة اليوم', body: `${w.word} — ${w.arabic}`, href: '#/dictionary', read: false, createdAt: `${day}T07:00:00.000Z` });
    if (day0 % 3 === 0) list.push({ id: `daily-score-${user.id}-${day}`, targetId: user.id, title: 'اشتغل على نفسك', body: 'اشتغل على نفسك علشان تاخد أعلى سكور — كمّل الشادوينج والكويزات والكلمات.', href: '#/', read: false, createdAt: `${day}T09:00:00.000Z` });
    for (const n of list) { const read = reads.has(n.id); if (i === 0 || !read) notes.push({ ...n, read }); }
  }
  // spaced repetition: remind the student when saved words are due for review
  const nowIso = new Date().toISOString();
  const dueCount = (d.savedWords || []).filter((w: any) => w.studentId === user.id && (!w.nextReview || w.nextReview <= nowIso)).length;
  if (dueCount > 0) {
    const day = nowIso.slice(0, 10);
    const id = `daily-srs-${user.id}-${day}`;
    notes.push({ id, targetId: user.id, title: 'مراجعة الكلمات', body: `عندك ${dueCount} كلمة مستحقة للمراجعة دلوقتي — راجعها قبل ما تنساها.`, href: '#/words', read: reads.has(id), createdAt: nowIso });
  }
  // subscription ending: a daily reminder during the last 7 days
  const left = subscriptionDaysLeft(user.subscriptionEnd);
  if (left !== null && left >= 0 && left <= 7) {
    const day = cairoToday();
    const when = left === 0 ? 'النهارده' : left === 1 ? 'بكرة' : `بعد ${left} أيام`;
    const id = `daily-subend-${user.id}-${day}`;
    notes.push({ id, targetId: user.id, title: 'اشتراكك قرب ينتهي', body: `اشتراكك هينتهي ${when} (آخر يوم ${arabicDate(user.subscriptionEnd)}). جدّد علشان تكمّل من غير توقف.`, href: '#/profile', read: reads.has(id), createdAt: nowIso });
  }
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
  return { ...d, tasks: [...daily, ...((d.tasks || []).filter((t) => !taskIds.has(t.id)))], dictionary: mergeWords(UNIT_WORDS, d.dictionary || []) };
}
function saveDemo(data: AppData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

type Ctx = {
  user: User | null; ready: boolean; demo: boolean; data: AppData;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: (phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
  saveProfile: (updates: { avatar?: string; name?: string; phone?: string; currentLevelId?: string }) => Promise<void>;
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

  async function refresh(): Promise<Record<string, any[]>> {
    if (demo) { setData(withDailyNotes(readDemo(), user)); return {}; }
    const loaded = CLOUD === 'supabase' ? await sbLoadAll(COLLECTIONS) : await fbLoadAll(COLLECTIONS);
    RAW_DICT = Array.isArray((loaded as any).dictionary) ? (loaded as any).dictionary : [];
    setData(withDailyNotes(withLevelTasks(englishify({ ...emptyData(), ...loaded } as AppData)), user));
    return loaded as Record<string, any[]>;
  }

  useEffect(() => {
    (async () => {
      try {
      if (demo) {
        setData(readDemo());
        const savedId = localStorage.getItem('speakozy-user');
        if (savedId) {
          const found = readDemo().users.find((u) => u.id === savedId);
          if (found) setUser(found);
        }
      } else {
        let loaded: Record<string, any[]> = {};
        try { loaded = await refresh(); }
        catch (e) {
          // a brand-new Google user has no student role yet, so the doc load is refused ("not authorized"):
          // create the profile first, then load again
          if (CLOUD === 'supabase' && await sbCurrentAuth()) { await sbEnsureProfile(); loaded = await refresh(); }
          else throw e;
        }
        if (CLOUD === 'supabase') {
          const auth = await sbCurrentAuth();
          if (auth) {
            const match = (list: any[]) => (list || []).find((u: any) => u.id === `auth-${auth.id}` || u.authId === auth.id || (u.email || '').toLowerCase() === auth.email);
            let found = match(loaded.users);
            if (!found) {
              // first sign-in (e.g. Google): create the profile, then reload once
              await sbEnsureProfile();
              loaded = await refresh();
              found = match(loaded.users);
            }
            if (found) {
              // phone typed on the sign-up screen before the Google redirect
              try {
                const ph = localStorage.getItem('speakozy-pending-phone');
                if (ph && !(found as any).phone) { await sbSaveMyProfile({ phone: ph }); (found as any).phone = ph; }
                localStorage.removeItem('speakozy-pending-phone');
              } catch {}
              setUser(found as User);
            }
          }
        }
      }
      } catch (e) { console.error('boot failed', e); }
      finally { setReady(true); }
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
    const fresh = await refresh();
    const authId = CLOUD === 'supabase' ? await sbCurrentUserId() : null;
    const me = (fresh.users || []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase() || u.id === `auth-${authId}`);
    if (!me) throw new Error('User profile not found');
    setUser(me as User);
  }

  /** Redirects to Google; the session is picked up by the boot effect when the page reloads. */
  async function loginWithGoogle(phone?: string) {
    try { if (phone) localStorage.setItem('speakozy-pending-phone', phone); else localStorage.removeItem('speakozy-pending-phone'); } catch {}
    await sbSignInWithGoogle();
  }

  async function signup(name: string, email: string, password: string, phone?: string) {
    if (!demo) {
      await sbSignUp(name.trim(), email.trim(), password);
      // the phone number is stored with the student's profile (needs the save_my_profile update in supabase/migrations)
      if (phone && CLOUD === 'supabase') { try { await sbSaveMyProfile({ phone }); } catch {} }
      const loaded = await refresh();
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

  async function saveProfile(updates: { avatar?: string; name?: string; phone?: string; currentLevelId?: string }) {
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
      void sbWrite(collectionName, id, record).catch((e) => { console.error('write failed', e); try { alert('⚠️ التعديل ماتحفظش — جرّب تاني'); } catch {} void refresh(); });
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
      void sbSaveSettings(s).catch((e) => { console.error('settings failed', e); void refresh(); });
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

  // hidden words (deleted in the admin lesson editor) never reach any page; grammar edits are registered for every reader
  const view = React.useMemo(() => { setGrammarOverrides(data.grammarNotes as any); return { ...data, users: (data.users || []).map(withExpiry), dictionary: (data.dictionary || []).filter((w) => !w.hidden) } as AppData; }, [data]);
  return <AppCtx.Provider value={{ user: user ? withCurrentLevel(withExpiry(user), view.levels) : null, ready, demo, data: view, login, signup, loginWithGoogle, logout, setUser, saveProfile, changePassword, put, remove, putSettings, grantScore, log, resetDemo }}>{children}</AppCtx.Provider>;
}

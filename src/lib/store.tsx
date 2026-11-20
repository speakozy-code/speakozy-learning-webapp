import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AppData, User } from '../types';
import { seedData } from './seed';
import { uid, today, addScoreOnce } from './domain';
import { isFirebase, fbSignIn, fbSignOut, fbLoadAll, fbWrite, fbDelete } from './firebase';
import { isSupabase, sbSignIn, sbSignOut, sbLoadAll, sbLoadDoc, sbSaveDoc, sbWrite, sbDelete } from './supabase';
import { englishify } from './translate';

const KEY = 'speakozy-demo-v9';
const CLOUD = isSupabase ? 'supabase' : isFirebase ? 'firebase' : 'demo';
const COLLECTIONS = ['users','levels','sessions','questions','attempts','progress','tasks','taskCompletions','notifications','scores','savedWords','dictionary','certificates','logs','grammarNotes'];

function emptyData(): AppData {
  return { users: [], levels: [], sessions: [], questions: [], attempts: [], progress: [], tasks: [], taskCompletions: [], notifications: [], scores: [], savedWords: [], dictionary: [], certificates: [], logs: [], grammarNotes: [], settings: seedData().settings };
}

function readDemo(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return englishify(JSON.parse(raw) as AppData);
  } catch {}
  const seeded = seedData();
  saveDemo(seeded);
  return englishify(seeded);
}
function saveDemo(data: AppData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

type Ctx = {
  user: User | null; ready: boolean; demo: boolean; data: AppData;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
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

  async function refresh() {
    if (demo) { setData(readDemo()); return; }
    const loaded = CLOUD === 'supabase' ? await sbLoadAll(COLLECTIONS) : await fbLoadAll(COLLECTIONS);
    setData(englishify({ ...emptyData(), ...loaded } as AppData));
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
    const me = (fresh.users || []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!me) throw new Error('User profile not found');
    setUser(me as User);
  }

  async function logout() {
    if (CLOUD === 'supabase') await sbSignOut(); else if (!demo) await fbSignOut();
    localStorage.removeItem('speakozy-user');
    setUser(null);
  }

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
      await sbWrite(collectionName, id, record);
      await refresh();
    } else {
      await fbWrite(collectionName, id, record);
      await refresh();
    }
  }

  async function remove(collectionName: string, id: string) {
    if (demo) {
      const next = readDemo();
      (next as any)[collectionName] = ((next as any)[collectionName] as any[]).filter((x) => x.id !== id);
      saveDemo(next);
      setData(next);
    } else if (CLOUD === 'supabase') {
      await sbDelete(collectionName, id);
      await refresh();
    } else {
      await fbDelete(collectionName, id);
      await refresh();
    }
  }

  async function putSettings(s: AppData['settings']) {
    if (demo) {
      const next = readDemo(); next.settings = s; saveDemo(next); setData(next);
    } else if (CLOUD === 'supabase') {
      const doc = await sbLoadDoc(); doc.settings = s; await sbSaveDoc(doc);
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

  return <AppCtx.Provider value={{ user, ready, demo, data, login, logout, setUser, put, remove, putSettings, grantScore, log, resetDemo }}>{children}</AppCtx.Provider>;
}

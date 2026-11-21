import { createClient } from '@supabase/supabase-js';
import { seedData } from './seed';

const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://jhcaqlhzfavpjqukaamu.supabase.co';
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_eOd1KcmZDtyduIFaYB0M7A_Y2bhSohK';

export const isSupabase = Boolean(url && anon);
export const sb = isSupabase ? createClient(url, anon) : null;
const DOC_ID = 'academy/main';
const STUDENT_KEYS = ['progress', 'attempts', 'taskCompletions', 'savedWords', 'notificationReads'];
const STUDENT_IGNORED = ['logs', 'dictionary', 'notifications', 'certificates', 'users', 'levels', 'sessions', 'questions', 'settings', 'tasks', 'grammarNotes'];

async function currentRole(): Promise<'admin' | 'student' | null> {
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: role, error } = await sb.rpc('my_role');
  if (error) return null;
  return (role as 'admin' | 'student' | null) || null;
}

async function studentKey(): Promise<string | null> {
  if (!sb) return null;
  const { data } = await sb.rpc('my_student_key');
  return (data as string) || null;
}

export async function sbSignIn(email: string, password: string) {
  if (!sb) throw new Error('supabase-not-configured');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sbSignUp(name: string, email: string, password: string) {
  if (!sb) throw new Error('supabase-not-configured');
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('Confirm your email, then sign in');
  const profile = await sb.rpc('signup_student', { p_name: name, p_email: email, p_uid: uid });
  if (profile.error) throw profile.error;
}

export async function sbCurrentUserId(): Promise<string | null> {
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id || null;
}

export async function sbEnsureProfile(): Promise<void> {
  if (!sb) return;
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user?.email) return;
  const name = (user.user_metadata?.name || user.user_metadata?.full_name || 'Student') as string;
  const { error } = await sb.rpc('signup_student', { p_name: name, p_email: user.email, p_uid: user.id });
  if (error) throw error;
}

export async function sbSignOut() {
  if (sb) await sb.auth.signOut();
}

export async function sbLoadDoc(): Promise<any> {
  if (!sb) return {};
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return seedData() as any;
  const { data, error } = await sb.rpc('load_session_state', { p_doc_id: DOC_ID });
  if (error) throw error;
  const doc = (data && typeof data === 'object' ? data : {}) as any;
  if (!Array.isArray(doc.users) || !Array.isArray(doc.levels)) return seedData() as any;
  return doc;
}

export async function sbSaveDoc(doc: any): Promise<void> {
  if (!sb) return;
  const { error } = await sb.rpc('save_academy_state', { p_doc_id: DOC_ID, p_data: doc });
  if (error) throw error;
}

export async function sbLoadAll(keys: string[]): Promise<Record<string, any[]>> {
  const doc = await sbLoadDoc();
  const out: Record<string, any[]> = {};
  keys.forEach((k) => { out[k] = Array.isArray(doc[k]) ? doc[k] : []; });
  return out;
}

export async function sbWrite(collectionName: string, id: string, record: any) {
  if (!sb) return;
  const role = await currentRole();
  if (role === 'student') {
    if (collectionName === 'scores') {
      const { error } = await sb.rpc('save_student_scores', { p_doc_id: DOC_ID, p_records: [record] });
      if (error) throw error;
      return;
    }
    if (!STUDENT_KEYS.includes(collectionName) || STUDENT_IGNORED.includes(collectionName)) return;
    const key = await studentKey();
    if (!key) return;
    const doc = await sbLoadDoc();
    const list: any[] = (doc[collectionName] || []).filter((x: any) => x && x.studentId === key);
    const idx = list.findIndex((x) => x && x.id === id);
    if (idx >= 0) list[idx] = record; else list.push(record);
    const { error } = await sb.rpc('save_student_state', { p_doc_id: DOC_ID, p_data: { [collectionName]: list } });
    if (error) throw error;
    return;
  }
  const doc = await sbLoadDoc();
  const list: any[] = Array.isArray(doc[collectionName]) ? doc[collectionName] : [];
  const idx = list.findIndex((x) => x && x.id === id);
  if (idx >= 0) list[idx] = record; else list.push(record);
  doc[collectionName] = list;
  await sbSaveDoc(doc);
}

export async function sbDelete(collectionName: string, id: string) {
  if (!sb) return;
  const role = await currentRole();
  if (role === 'student') {
    if (!STUDENT_KEYS.includes(collectionName)) return;
    const key = await studentKey();
    if (!key) return;
    const doc = await sbLoadDoc();
    const list: any[] = (doc[collectionName] || []).filter((x: any) => x && x.studentId === key && x.id !== id);
    const { error } = await sb.rpc('save_student_state', { p_doc_id: DOC_ID, p_data: { [collectionName]: list } });
    if (error) throw error;
    return;
  }
  const doc = await sbLoadDoc();
  doc[collectionName] = (doc[collectionName] || []).filter((x: any) => x && x.id !== id);
  await sbSaveDoc(doc);
}

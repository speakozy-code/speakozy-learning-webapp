import { createClient } from '@supabase/supabase-js';
import { seedData } from './seed';

const url = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabase = Boolean(url && anon);
export const sb = isSupabase ? createClient(url, anon) : null;
const DOC_ID = 'academy/main';

export async function sbSignIn(email: string, password: string) {
  if (!sb) throw new Error('supabase-not-configured');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function sbSignOut() {
  if (sb) await sb.auth.signOut();
}

export async function sbLoadDoc(): Promise<any> {
  if (!sb) return {};
  const { data, error } = await sb.rpc('load_academy_state', { p_doc_id: DOC_ID });
  if (error) throw error;
  const doc = (data && typeof data === 'object' ? data : {}) as any;
  if (!doc || !Array.isArray(doc.users) || doc.users.length === 0) {
    const seeded = seedData();
    const init = await sb.rpc('init_academy_state', { p_doc_id: DOC_ID, p_data: seeded });
    if (init.error) throw init.error;
    return seeded as any;
  }
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
  const doc = await sbLoadDoc();
  const list: any[] = Array.isArray(doc[collectionName]) ? doc[collectionName] : [];
  const idx = list.findIndex((x) => x && x.id === id);
  if (idx >= 0) list[idx] = record; else list.push(record);
  doc[collectionName] = list;
  await sbSaveDoc(doc);
}

export async function sbDelete(collectionName: string, id: string) {
  const doc = await sbLoadDoc();
  doc[collectionName] = (doc[collectionName] || []).filter((x: any) => x && x.id !== id);
  await sbSaveDoc(doc);
}

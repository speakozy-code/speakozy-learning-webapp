import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebase = Boolean(cfg.apiKey && cfg.projectId);
const app = isFirebase ? initializeApp(cfg as any) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function fbSignIn(email: string, password: string) {
  if (!auth) throw new Error('firebase-not-configured');
  return signInWithEmailAndPassword(auth, email, password);
}
export async function fbSignOut() {
  if (auth) await signOut(auth);
}

export async function fbLoadAll(keys: string[]) {
  const out: Record<string, any[]> = {};
  if (!db) return out;
  for (const key of keys) {
    const snap = await getDocs(collection(db, key));
    out[key] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return out;
}

export async function fbWrite(collectionName: string, id: string, value: any) {
  if (!db) return;
  await setDoc(doc(db, collectionName, id), value, { merge: true });
}

export async function fbDelete(collectionName: string, id: string) {
  if (!db) return;
  await deleteDoc(doc(db, collectionName, id));
}

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FS } from '../constants/appConstants';
import type { AppUser } from '../types/models';

export function userFromDoc(docSnap: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>): AppUser | null {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    uid: docSnap.id,
    fullName: data.fullName || '',
    email: data.email || '',
    phone: data.phone || '',
    gender: data.gender || '',
    bloodType: data.bloodType || '',
    city: data.city || '',
    dob: data.dob ? (data.dob as Timestamp).toDate() : null,
    idCardUrl: data.idCardUrl || null,
    profilePhotoUrl: data.profilePhotoUrl || null,
    role: data.role === 'admin' ? 'admin' : 'user',
    isVerified: !!data.isVerified,
    isSuspended: !!data.isSuspended,
    expoPushToken: data.expoPushToken || null,
    profileComplete: !!data.profileComplete,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

export function watchUser(uid: string, callback: (user: AppUser | null) => void): Unsubscribe {
  return onSnapshot(doc(db, FS.users, uid), (snap) => callback(userFromDoc(snap)));
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, FS.users, uid));
  return userFromDoc(snap);
}

export async function saveProfile(uid: string, fields: Record<string, unknown>): Promise<void> {
  // updateDoc's UpdateData<T> generic can't be satisfied by a loosely-typed
  // passthrough object (a known friction point with the modular Firestore
  // SDK's typings) — the caller (CompleteProfileScreen) already builds this
  // object against the real AppUser shape, so the escape hatch is safe here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(doc(db, FS.users, uid), fields as any);

  // Keep the pushTokens/{uid} mirror (see appConstants.ts FS.pushTokens) in
  // sync whenever bloodType changes, so client-side donor matching queries
  // against the current blood type.
  if ('bloodType' in fields) {
    await setDoc(doc(db, FS.pushTokens, uid), { bloodType: fields.bloodType }, { merge: true });
  }
}

export async function saveExpoPushToken(
  uid: string,
  token: string,
  bloodType: string,
  isSuspended: boolean,
): Promise<void> {
  await updateDoc(doc(db, FS.users, uid), { expoPushToken: token });
  await setDoc(
    doc(db, FS.pushTokens, uid),
    { expoPushToken: token, bloodType, isSuspended },
    { merge: true },
  );
}

// ---- Admin operations ----

export function watchAllUsers(callback: (users: AppUser[]) => void): Unsubscribe {
  const q = query(collection(db, FS.users), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => userFromDoc(d)).filter((u): u is AppUser => u !== null)));
}

export async function getAllUsersOnce(): Promise<AppUser[]> {
  return new Promise((resolve, reject) => {
    const unsub = watchAllUsers((users) => {
      unsub();
      resolve(users);
    });
    setTimeout(() => reject(new Error('Timed out loading users')), 15000);
  });
}

export async function setVerified(uid: string, verified: boolean): Promise<void> {
  await updateDoc(doc(db, FS.users, uid), { isVerified: verified });
}

export async function setSuspended(uid: string, suspended: boolean): Promise<void> {
  await updateDoc(doc(db, FS.users, uid), { isSuspended: suspended });
  await setDoc(doc(db, FS.pushTokens, uid), { isSuspended: suspended }, { merge: true });
}

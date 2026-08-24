import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  increment,
  arrayUnion,
  deleteDoc,
  getDoc,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FS, RequestStatus } from '../constants/appConstants';
import type { BloodRequest, NewBloodRequestInput, RequestStatusValue } from '../types/models';

function requestFromDoc(docSnap: QueryDocumentSnapshot<DocumentData>): BloodRequest {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    requesterUid: data.requesterUid || '',
    requesterName: data.requesterName || '',
    patientName: data.patientName || '',
    unitsRequired: data.unitsRequired || 1,
    bloodType: data.bloodType || '',
    hospitalName: data.hospitalName || '',
    location: data.location || '',
    contactNumber: data.contactNumber || '',
    status: (data.status as RequestStatusValue) || RequestStatus.pending,
    viewCount: data.viewCount || 0,
    respondedUids: data.respondedUids || [],
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

/**
 * Creates the request document. The shared onBloodRequestCreated Cloud
 * Function picks this up automatically, finds matching donors, and writes
 * their in-app notifications + an Expo push notification — no client-side
 * matching code needed here.
 */
export async function createRequest(request: NewBloodRequestInput): Promise<string> {
  const docRef = await addDoc(collection(db, FS.bloodRequests), {
    requesterUid: request.requesterUid,
    requesterName: request.requesterName,
    patientName: request.patientName,
    unitsRequired: request.unitsRequired,
    bloodType: request.bloodType,
    hospitalName: request.hospitalName,
    location: request.location,
    contactNumber: request.contactNumber,
    status: RequestStatus.pending,
    viewCount: 0,
    respondedUids: [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function watchMyRequests(uid: string, callback: (requests: BloodRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, FS.bloodRequests),
    where('requesterUid', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(requestFromDoc)));
}

export function watchOpenRequests(callback: (requests: BloodRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, FS.bloodRequests),
    where('status', '==', RequestStatus.pending),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(requestFromDoc)));
}

export function watchRequest(id: string, callback: (request: BloodRequest | null) => void): Unsubscribe {
  return onSnapshot(doc(db, FS.bloodRequests, id), (snap) => {
    callback(snap.exists() ? requestFromDoc(snap as QueryDocumentSnapshot<DocumentData>) : null);
  });
}

export async function getRequestOnce(id: string): Promise<BloodRequest | null> {
  const snap = await getDoc(doc(db, FS.bloodRequests, id));
  return snap.exists() ? requestFromDoc(snap as QueryDocumentSnapshot<DocumentData>) : null;
}

export async function incrementView(requestId: string): Promise<void> {
  await updateDoc(doc(db, FS.bloodRequests, requestId), { viewCount: increment(1) });
}

export async function markResponded(requestId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, FS.bloodRequests, requestId), { respondedUids: arrayUnion(uid) });
}

// ---- Admin operations ----

export function watchAllRequests(callback: (requests: BloodRequest[]) => void): Unsubscribe {
  const q = query(collection(db, FS.bloodRequests), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(requestFromDoc)));
}

export async function updateStatus(requestId: string, status: RequestStatusValue): Promise<void> {
  await updateDoc(doc(db, FS.bloodRequests, requestId), { status });
}

export async function deleteRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, FS.bloodRequests, requestId));
}

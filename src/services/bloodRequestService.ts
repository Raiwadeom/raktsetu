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
import { notifyMatchingDonors, type NotifyResult } from './donorNotificationService';
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
 * Creates the request document, then finds matching donors and pushes to
 * them directly from this device (see donorNotificationService.ts) — this
 * project runs on the free Spark plan, so there's no server-side Cloud
 * Function doing this instead.
 *
 * A notification failure is not thrown: the request itself has already saved
 * successfully by that point, and the caller shouldn't treat "posting a
 * request" as failed just because the notify step hit a problem. It is still
 * *reported* back though - silently claiming donors were alerted when nobody
 * was is the worse failure for an app people use in an emergency.
 */
export interface CreateRequestResult {
  id: string;
  notified: NotifyResult | null;
  notifyError: Error | null;
}

export async function createRequest(request: NewBloodRequestInput): Promise<CreateRequestResult> {
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

  try {
    const notified = await notifyMatchingDonors({
      requestId: docRef.id,
      requesterUid: request.requesterUid,
      bloodType: request.bloodType,
      hospitalName: request.hospitalName,
      unitsRequired: request.unitsRequired,
    });
    return { id: docRef.id, notified, notifyError: null };
  } catch (e) {
    console.warn('Failed to notify matching donors:', e);
    return { id: docRef.id, notified: null, notifyError: e as Error };
  }
}

export function watchMyRequests(uid: string, callback: (requests: BloodRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, FS.bloodRequests),
    where('requesterUid', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(requestFromDoc)),
    // Without an error handler a rejected listener (offline, rules, a missing
    // index) just stops delivering, and the screen sits on its spinner
    // forever. Reporting an empty result at least renders the empty state.
    (e) => {
      console.warn('watchMyRequests failed:', e);
      callback([]);
    },
  );
}

export function watchOpenRequests(callback: (requests: BloodRequest[]) => void): Unsubscribe {
  const q = query(
    collection(db, FS.bloodRequests),
    where('status', '==', RequestStatus.pending),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(requestFromDoc)),
    (e) => {
      console.warn('watchOpenRequests failed:', e);
      callback([]);
    },
  );
}

export function watchRequest(id: string, callback: (request: BloodRequest | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, FS.bloodRequests, id),
    (snap) => {
      callback(snap.exists() ? requestFromDoc(snap as QueryDocumentSnapshot<DocumentData>) : null);
    },
    (e) => {
      console.warn('watchRequest failed:', e);
      callback(null);
    },
  );
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
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(requestFromDoc)),
    (e) => {
      console.warn('watchAllRequests failed:', e);
      callback([]);
    },
  );
}

export async function updateStatus(requestId: string, status: RequestStatusValue): Promise<void> {
  await updateDoc(doc(db, FS.bloodRequests, requestId), { status });
}

export async function deleteRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, FS.bloodRequests, requestId));
}

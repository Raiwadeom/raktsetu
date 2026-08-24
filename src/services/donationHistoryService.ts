import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FS, DonationType } from '../constants/appConstants';
import type { DonationRecord, DonationTypeValue, NewDonationRecordInput } from '../types/models';

function recordFromDoc(docSnap: QueryDocumentSnapshot<DocumentData>): DonationRecord {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    userId: data.userId || '',
    type: (data.type as DonationTypeValue) || DonationType.donated,
    date: data.date ? (data.date as Timestamp).toDate() : new Date(),
    units: data.units || 1,
    hospitalName: data.hospitalName || '',
    note: data.note || null,
    linkedRequestId: data.linkedRequestId || null,
    addedByAdminUid: data.addedByAdminUid || '',
  };
}

export function watchForUser(userId: string, callback: (records: DonationRecord[]) => void): Unsubscribe {
  const q = query(
    collection(db, FS.donationHistory),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(recordFromDoc)));
}

/** Admin-only: adds a donation/receive record, optionally auto-fulfilling a linked request. */
export async function addRecord(record: NewDonationRecordInput): Promise<void> {
  const batch = writeBatch(db);
  const recordRef = doc(collection(db, FS.donationHistory));
  batch.set(recordRef, {
    userId: record.userId,
    type: record.type,
    date: Timestamp.fromDate(record.date),
    units: record.units,
    hospitalName: record.hospitalName,
    note: record.note,
    linkedRequestId: record.linkedRequestId,
    addedByAdminUid: record.addedByAdminUid,
    createdAt: serverTimestamp(),
  });

  if (record.linkedRequestId) {
    const reqRef = doc(db, FS.bloodRequests, record.linkedRequestId);
    batch.update(reqRef, { status: 'fulfilled' });
  }

  await batch.commit();
}

export async function deleteRecord(id: string): Promise<void> {
  await deleteDoc(doc(db, FS.donationHistory, id));
}

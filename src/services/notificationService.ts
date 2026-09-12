import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FS, NotificationType } from '../constants/appConstants';
import type { AppNotification, NotificationTypeValue } from '../types/models';

function notificationFromDoc(docSnap: QueryDocumentSnapshot<DocumentData>): AppNotification {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || '',
    body: data.body || '',
    type: (data.type as NotificationTypeValue) || NotificationType.general,
    relatedRequestId: data.relatedRequestId || null,
    isRead: !!data.isRead,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

function itemsRef(uid: string): CollectionReference<DocumentData> {
  return collection(db, FS.notifications, uid, FS.notificationItems);
}

export function watchNotifications(uid: string, callback: (items: AppNotification[]) => void): Unsubscribe {
  const q = query(itemsRef(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(notificationFromDoc)),
    // A rejected listener otherwise leaves the Alerts tab spinning forever
    // instead of showing its empty state.
    (e) => {
      console.warn('watchNotifications failed:', e);
      callback([]);
    },
  );
}

export function watchUnreadCount(uid: string, callback: (count: number) => void): Unsubscribe {
  const q = query(itemsRef(uid), where('isRead', '==', false));
  return onSnapshot(
    q,
    (snap) => callback(snap.size),
    (e) => {
      console.warn('watchUnreadCount failed:', e);
      callback(0);
    },
  );
}

export async function markAsRead(uid: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, FS.notifications, uid, FS.notificationItems, notificationId), {
    isRead: true,
  });
}

export async function markAllAsRead(uid: string, unreadIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  unreadIds.forEach((id) => {
    batch.update(doc(db, FS.notifications, uid, FS.notificationItems, id), { isRead: true });
  });
  await batch.commit();
}

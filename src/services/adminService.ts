import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * Wraps the admin-only Cloud Functions shared with the rest of the project
 * (functions/src/index.ts) — deleting another user's Auth account and
 * sending a broadcast push both require the Admin SDK, so they're
 * implemented once, server-side.
 */
export async function deleteUserAccount(uid: string): Promise<void> {
  const callable = httpsCallable(functions, 'deleteUserAccount');
  await callable({ uid });
}

export async function broadcastAnnouncement(params: {
  title: string;
  body: string;
  bloodType?: string | null;
}): Promise<void> {
  const callable = httpsCallable(functions, 'broadcastAnnouncement');
  await callable({ title: params.title, body: params.body, bloodType: params.bloodType || null });
}

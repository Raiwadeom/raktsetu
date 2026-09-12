import { collection, doc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { COMPATIBLE_DONOR_TYPES, FS, NotificationType } from '../constants/appConstants';

interface NotifyMatchingDonorsParams {
  requestId: string;
  requesterUid: string;
  bloodType: string;
  hospitalName: string;
  unitsRequired: number;
}

/**
 * Client-side replacement for the (unused, since this project runs on the
 * free Spark plan — see README) onBloodRequestCreated Cloud Function: finds
 * verified, non-suspended donors who can actually give to the requested
 * blood type via the pushTokens/{uid} mirror (see appConstants.ts
 * FS.pushTokens and firestore.rules), writes each an in-app notification,
 * and pushes an Expo notification straight from this device — no server
 * component involved.
 *
 * Matching is on red-cell compatibility (COMPATIBLE_DONOR_TYPES), not on an
 * exact blood-type equality: a request for A+ must reach O-, O+ and A-
 * donors too, and matching exactly would have excluded them.
 *
 * Runs on the *requester's* device right after they post a request. If it
 * throws, the caller (createRequest) swallows the error — the request
 * itself already saved successfully; a notification failure shouldn't be
 * surfaced as if posting the request failed.
 */
export interface NotifyResult {
  /** Donors who got an in-app notification written to their inbox. */
  inAppCount: number;
  /** Of those, how many also had a push token to push to. */
  pushCount: number;
}

export async function notifyMatchingDonors(params: NotifyMatchingDonorsParams): Promise<NotifyResult> {
  const { requestId, requesterUid, bloodType, hospitalName, unitsRequired } = params;

  // Fall back to an exact match if the stored type is somehow off-list, so
  // bad data narrows the audience rather than throwing on an empty 'in'.
  const donorTypes = COMPATIBLE_DONOR_TYPES[bloodType] ?? [bloodType];

  // Suspension is filtered in memory rather than in the query on purpose.
  // Firestore drops documents that are MISSING a filtered field from the
  // result set entirely, so `where('isSuspended','==',false)` silently made
  // every donor whose mirror lacked the field unreachable - and a mirror
  // ends up without it whenever the rules reject the write that would have
  // added it. Absent now reads as not suspended, which is both the truth for
  // these docs and the safe default: an unsuspended donor being missed in an
  // emergency is far worse than a suspended one being messaged.
  const q = query(
    collection(db, FS.pushTokens),
    where('bloodType', 'in', donorTypes as string[]),
  );
  const snap = await getDocs(q);

  const donors = snap.docs
    .filter((d) => d.id !== requesterUid && d.data().isSuspended !== true)
    .map((d) => ({ uid: d.id, expoPushToken: d.data().expoPushToken as string | undefined }));

  if (donors.length === 0) return { inAppCount: 0, pushCount: 0 };

  const title = '🩸 Blood needed urgently';
  // Phrased to hold for every recipient of this batch — most no longer share
  // the requested type exactly, they're just compatible with it.
  const body = `${bloodType} blood needed at ${hospitalName} — ${unitsRequired} unit(s). You're a compatible donor. Tap to view.`;

  // In-app notification docs, batched (Firestore's 500-write batch limit).
  const batchSize = 400;
  for (let i = 0; i < donors.length; i += batchSize) {
    const batch = writeBatch(db);
    for (const donor of donors.slice(i, i + batchSize)) {
      const ref = doc(collection(db, FS.notifications, donor.uid, FS.notificationItems));
      batch.set(ref, {
        title,
        body,
        type: NotificationType.bloodMatch,
        relatedRequestId: requestId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  // The in-app inbox is the notification that actually matters: it is the
  // only one that survives a denied push permission, and it is what the
  // Alerts tab reads. So it is written first and its failure propagates -
  // push below is best-effort on top of it.

  // Expo push, batched 100 per call (Expo's own per-request limit).
  const tokens = donors
    .map((d) => d.expoPushToken)
    .filter((t): t is string => !!t && t.startsWith('ExponentPushToken'));

  const pushChunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    pushChunks.push(tokens.slice(i, i + 100));
  }

  // Counts tickets Expo actually accepted, not messages we handed it.
  let pushCount = 0;

  for (const chunk of pushChunks) {
    const messages = chunk.map((to) => ({
      to,
      title,
      body,
      data: { requestId },
      sound: 'default',
      priority: 'high',
    }));

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        console.warn(`Expo push send failed: HTTP ${res.status}`);
        continue;
      }

      // A successful HTTP status does NOT mean the pushes were delivered.
      // Expo answers 200 and reports per-message outcomes in the body, so
      // checking res.ok alone treats total failure as success - which is
      // exactly how a missing FCM V1 service account key on the Expo project
      // went unnoticed for weeks: every send "succeeded" while every ticket
      // came back {status: 'error', details: {error: 'InvalidCredentials'}}.
      const body = (await res.json()) as {
        data?: { status?: string; message?: string; details?: { error?: string } }[];
        errors?: { message?: string }[];
      };

      if (body.errors?.length) {
        console.warn('Expo push rejected the request:', body.errors.map((e) => e.message).join('; '));
        continue;
      }

      const tickets = body.data ?? [];
      const failed = tickets.filter((t) => t.status === 'error');
      pushCount += tickets.length - failed.length;

      if (failed.length > 0) {
        // Grouped, because one bad credential fails every ticket identically
        // and logging each one buries the single fact that matters.
        const byReason = new Map<string, number>();
        for (const t of failed) {
          const reason = t.details?.error || t.message || 'unknown';
          byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
        }
        const summary = [...byReason].map(([reason, n]) => `${reason} x${n}`).join(', ');
        console.warn(`Expo push: ${failed.length}/${tickets.length} failed - ${summary}`);
      }
    } catch (e) {
      console.warn('Expo push send failed:', e);
    }
  }

  return { inAppCount: donors.length, pushCount };
}

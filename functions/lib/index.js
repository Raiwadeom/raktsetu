"use strict";
/**
 * Cloud Functions for Rakt Setu.
 *
 * These exist because a client app can never (safely):
 *   1. Send a push to another user's device — that requires either the
 *      Admin SDK's FCM messaging API (Flutter client, `fcmToken`) or a
 *      server-side call to Expo's push API (React Native/Expo client,
 *      `expoPushToken`) — both need credentials/infra that can't live on
 *      the device.
 *   2. Delete another user's Firebase Auth account — only the Admin SDK
 *      can do that; a client can only delete *its own* signed-in account.
 *
 * Two client apps share this one Firebase project and this one set of
 * functions: a Flutter app (registers `fcmToken`) and an Expo/React Native
 * app (registers `expoPushToken`, since Expo Go can't use native FCM/APNs
 * directly). Every push send below fans out to whichever token(s) a user
 * actually has — a user is never required to have both.
 *
 * Everything here is deliberately small and single-purpose:
 *  - onBloodRequestCreated: matches donors by blood type and notifies them
 *    (in-app Firestore doc + FCM/Expo push) the moment a request is posted.
 *  - broadcastAnnouncement: admin-only callable to push a manual
 *    announcement to all users or to one blood type.
 *  - deleteUserAccount: admin-only callable that fully removes a user
 *    (Auth account, Firestore doc; see note below about uploaded files).
 *
 * ID cards and profile photos are hosted on Cloudinary (unsigned uploads),
 * not Firebase Storage — Storage isn't used anywhere in this project, which
 * keeps the app on Firebase's free Spark plan. Deleting a user's Cloudinary
 * assets on account deletion would require a *signed* Cloudinary API call
 * (needs the account's API secret, which must stay server-side); that's not
 * wired up here — see README → "Notes & known limitations".
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = exports.broadcastAnnouncement = exports.onBloodRequestCreated = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
const firestore_2 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
const messaging = (0, messaging_1.getMessaging)();
const USERS = "users";
const BLOOD_REQUESTS = "bloodRequests";
const NOTIFICATIONS = "notifications";
const NOTIFICATION_ITEMS = "items";
/** Sends up to 500 tokens per FCM batch, chunking as needed. Used by the
 * Flutter client, which registers a native FCM `fcmToken`. */
async function sendFcmPush(tokens, title, body, data) {
    const validTokens = tokens.filter((t) => !!t);
    if (validTokens.length === 0)
        return;
    const chunks = [];
    for (let i = 0; i < validTokens.length; i += 500) {
        chunks.push(validTokens.slice(i, i + 500));
    }
    for (const chunk of chunks) {
        try {
            const res = await messaging.sendEachForMulticast({
                tokens: chunk,
                notification: { title, body },
                data,
                android: { priority: "high" },
                apns: { payload: { aps: { sound: "default" } } },
            });
            logger.info(`FCM sent: ${res.successCount} ok, ${res.failureCount} failed`);
        }
        catch (err) {
            logger.error("FCM send failed", err);
        }
    }
}
/** Sends up to 100 messages per Expo push API batch (Expo's own limit).
 * Used by the Expo/React Native client, which registers an `expoPushToken`
 * — no FCM/APNs credentials needed on either side for this to work. */
async function sendExpoPush(tokens, title, body, data) {
    const validTokens = tokens.filter((t) => !!t && t.startsWith("ExponentPushToken"));
    if (validTokens.length === 0)
        return;
    const chunks = [];
    for (let i = 0; i < validTokens.length; i += 100) {
        chunks.push(validTokens.slice(i, i + 100));
    }
    for (const chunk of chunks) {
        const messages = chunk.map((to) => ({
            to,
            title,
            body,
            data,
            sound: "default",
            priority: "high",
        }));
        try {
            const res = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messages),
            });
            if (!res.ok) {
                logger.error(`Expo push send failed: HTTP ${res.status}`);
                continue;
            }
            const json = (await res.json());
            const failures = (json.data ?? []).filter((r) => r.status !== "ok");
            logger.info(`Expo push sent: ${chunk.length - failures.length} ok, ${failures.length} failed`);
        }
        catch (err) {
            logger.error("Expo push send failed", err);
        }
    }
}
/** Fans a push out over both channels — each user only needs whichever
 * token their app registered; neither is required. */
async function sendPushToUsers(users, title, body, data) {
    const fcmTokens = users.map((u) => u.fcmToken).filter((t) => !!t);
    const expoTokens = users.map((u) => u.expoPushToken).filter((t) => !!t);
    await Promise.all([
        sendFcmPush(fcmTokens, title, body, data),
        sendExpoPush(expoTokens, title, body, data),
    ]);
}
/**
 * Fires whenever a new blood request is posted. Finds all non-suspended
 * users with a matching blood type (excluding the requester), writes each
 * one an in-app notification, and pushes an FCM notification to their
 * registered device token — this is the SMS replacement.
 */
exports.onBloodRequestCreated = (0, firestore_2.onDocumentCreated)(`${BLOOD_REQUESTS}/{requestId}`, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const request = snap.data();
    const requestId = event.params.requestId;
    // Unverified users never receive match notifications — ID verification
    // is a real access gate, not just a profile badge.
    const matchSnap = await db
        .collection(USERS)
        .where("bloodType", "==", request.bloodType)
        .where("isSuspended", "==", false)
        .where("isVerified", "==", true)
        .get();
    const donors = matchSnap.docs
        .filter((d) => d.id !== request.requesterUid)
        .map((d) => ({ uid: d.id, ...d.data() }));
    if (donors.length === 0) {
        logger.info(`No matching donors for request ${requestId} (${request.bloodType})`);
        return;
    }
    const title = "🩸 Blood needed urgently";
    const body = `${request.bloodType} blood needed at ${request.hospitalName} — ` +
        `${request.unitsRequired} unit(s). Tap to view.`;
    // Write an in-app notification doc for every matched donor.
    const batchSize = 400;
    for (let i = 0; i < donors.length; i += batchSize) {
        const batch = db.batch();
        for (const donor of donors.slice(i, i + batchSize)) {
            const ref = db
                .collection(NOTIFICATIONS)
                .doc(donor.uid)
                .collection(NOTIFICATION_ITEMS)
                .doc();
            batch.set(ref, {
                title,
                body,
                type: "bloodMatch",
                relatedRequestId: requestId,
                isRead: false,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
    }
    await sendPushToUsers(donors, title, body, { requestId });
    logger.info(`Notified ${donors.length} matching donors for request ${requestId}`);
});
/**
 * Admin-only callable: sends a manual announcement (in-app + push) to all
 * users, or to only those with a given blood type.
 */
exports.broadcastAnnouncement = (0, https_1.onCall)(async (request) => {
    await assertIsAdmin(request.auth?.uid);
    const title = String(request.data?.title ?? "").trim();
    const body = String(request.data?.body ?? "").trim();
    const bloodType = request.data?.bloodType ? String(request.data.bloodType) : null;
    if (!title || !body) {
        throw new https_1.HttpsError("invalid-argument", "title and body are required");
    }
    let query = db.collection(USERS).where("role", "==", "user");
    if (bloodType) {
        query = query.where("bloodType", "==", bloodType);
    }
    const snap = await query.get();
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    if (users.length === 0) {
        return { notified: 0 };
    }
    const batchSize = 400;
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = db.batch();
        for (const u of users.slice(i, i + batchSize)) {
            const ref = db.collection(NOTIFICATIONS).doc(u.uid).collection(NOTIFICATION_ITEMS).doc();
            batch.set(ref, {
                title,
                body,
                type: "announcement",
                relatedRequestId: null,
                isRead: false,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
    }
    await sendPushToUsers(users, title, body, {});
    return { notified: users.length };
});
/**
 * Admin-only callable: permanently deletes a user — Firestore doc and the
 * Firebase Auth account itself. (Their Cloudinary-hosted ID card / profile
 * photo are not removed — see the file-level comment above.)
 */
exports.deleteUserAccount = (0, https_1.onCall)(async (request) => {
    await assertIsAdmin(request.auth?.uid);
    const uid = String(request.data?.uid ?? "").trim();
    if (!uid) {
        throw new https_1.HttpsError("invalid-argument", "uid is required");
    }
    if (uid === request.auth?.uid) {
        throw new https_1.HttpsError("failed-precondition", "Admins cannot delete their own account this way.");
    }
    await db.collection(USERS).doc(uid).delete();
    const notifItems = await db
        .collection(NOTIFICATIONS)
        .doc(uid)
        .collection(NOTIFICATION_ITEMS)
        .get();
    if (!notifItems.empty) {
        const batch = db.batch();
        notifItems.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
    }
    await db.collection(NOTIFICATIONS).doc(uid).delete().catch(() => undefined);
    try {
        await auth.deleteUser(uid);
    }
    catch (err) {
        logger.warn(`Auth user ${uid} could not be deleted (may already be gone)`, err);
    }
    return { deleted: true };
});
async function assertIsAdmin(uid) {
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in.");
    }
    const doc = await db.collection(USERS).doc(uid).get();
    if (!doc.exists || doc.data()?.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Admin access required.");
    }
}
//# sourceMappingURL=index.js.map
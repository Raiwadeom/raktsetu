# Rakt Setu (Expo / React Native) 🩸

A cross-platform (Android + iOS) blood donation & request-matching app, built
with **Expo (managed workflow, TypeScript)** so it can be run and iterated on
live via the **Expo Go** app during development.

This is a second client for the same backend as the project's original
Flutter app — same Firebase project, same Firestore data, same Cloud
Functions, same Cloudinary account. Sign up in one app and your account,
blood requests, and notifications all show up in the other.

---

## Contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Firebase setup](#firebase-setup)
- [Cloudinary](#cloudinary)
- [Running the app](#running-the-app)
- [Testing push notifications](#testing-push-notifications)
- [Cloud Functions](#cloud-functions)
- [Firestore security rules](#firestore-security-rules)
- [Seeding the first admin account](#seeding-the-first-admin-account)
- [Data model](#data-model)
- [App icon & splash screen](#app-icon--splash-screen)
- [Notes & known limitations](#notes--known-limitations)

---

## Tech stack

- Expo SDK 53, React Native 0.79, TypeScript (strict)
- **Firebase JS SDK (modular v9+)** — `firebase/auth` (with
  `getReactNativePersistence` for persistent login), `firebase/firestore`,
  `firebase/functions`. Deliberately **not** `@react-native-firebase`, which
  needs native module linking and wouldn't run inside Expo Go.
- **Cloudinary** unsigned uploads for ID cards & profile photos (no Firebase
  Storage, no paid plan, no API secret on the client).
- **expo-notifications** + the **Expo push notification service** for push —
  no FCM/APNs setup needed on the client side.
- React Navigation (native stack + bottom tabs)
- `xlsx` (SheetJS) + `expo-file-system` + `expo-sharing` for the admin's
  Excel export

## Project structure

```
App.tsx, index.ts                 app entry, expo-splash-screen wiring
src/
  types/            models.ts (AppUser, BloodRequest, ...), navigation.ts
                     (React Navigation param lists), firebase-auth-rn.d.ts
                     (a small type-only fix, see comment in the file)
  constants/         theme, app constants, Cloudinary config
  firebase/          config.ts — paste your Firebase Web config here
  services/           one module per concern: auth, users, blood requests,
                       donation history, notifications, Cloudinary upload,
                       Expo push registration, admin (Cloud Functions calls),
                       Excel export
  context/            AuthContext — session state + live profile +
                       push-token registration
  navigation/         RootNavigator (auth-based routing), MainTabs,
                       navigationRef (for notification-tap navigation)
  screens/
    auth/ profile/ home/ requests/ notifications/ admin/
  components/          shared UI pieces
assets/                 app icon / splash / logo (shared with the Flutter app)
```

---

## Firebase setup

This app reuses the **existing** Firebase project (`raktsetu-cede7`) — same
one the Flutter app connects to via `flutterfire configure`. Authentication
(Email/Password) and Firestore are already set up there; nothing to create.

The only thing this app needs that doesn't already exist: a **Web app**
registered in that project (the Flutter app only registered Android/iOS
apps, which have different config values).

1. Firebase Console → your project → ⚙️ **Project settings** → **General** →
   scroll to **Your apps**.
2. If there's no Web app (`</>`) listed yet: **Add app** → Web → give it a
   nickname like "Rakt Setu (Expo)" → **Register app** (no hosting setup
   needed) → copy the `firebaseConfig` object it shows you.
3. Open `src/firebase/config.ts` and paste in the real `apiKey` and `appId`
   (the other fields — `projectId`, `storageBucket`, `messagingSenderId`,
   `authDomain` — are already filled in, since those are shared across every
   app registered in the same project):
   ```ts
   const firebaseConfig: FirebaseOptions = {
     apiKey: 'your-real-web-api-key',
     authDomain: 'raktsetu-cede7.firebaseapp.com',
     projectId: 'raktsetu-cede7',
     storageBucket: 'raktsetu-cede7.firebasestorage.app',
     messagingSenderId: '448453158256',
     appId: 'your-real-web-app-id',
   };
   ```

That's it — no other Firebase console setup is needed for this app to run.

---

## Cloudinary

Already configured with the project's existing account —
`src/constants/cloudinaryConfig.ts` has the real `cloud name` (`qjfczmwo`)
and unsigned upload preset (`rakt_setu_uploads`) already filled in. Nothing
to do here; ID cards/photos uploaded from this app land in the same
Cloudinary account the Flutter app uses.

---

## Running the app

```bash
npm install
npx expo start
```

This prints a **QR code** in the terminal. Scan it with the **Expo Go** app
(Android: Expo Go's built-in scanner; iOS: the regular Camera app) on a phone
on the same Wi-Fi network, and the app loads live. Edit any file and it
hot-reloads on the phone automatically.

```bash
npx expo start --tunnel   # if your phone isn't on the same network/Wi-Fi
```

### Type-checking

```bash
npm run typecheck
```

---

## Testing push notifications

Expo Go works great for everything in this app **except receiving remote
push notifications** — recent Expo SDKs (53+) removed remote push support
from Expo Go on Android (iOS Expo Go still supports it, with caveats). This
only affects *receiving* a push while running inside Expo Go; posting a
blood request, matching, and in-app notifications (the bell/Alerts tab) all
work normally regardless.

To test actual push delivery end-to-end, build a **development build**
instead (a custom version of the app with the same Expo Go-like fast-refresh
workflow, but as your own installable app):

```bash
# Option A — local build (needs Android Studio / Xcode installed)
npx expo run:android
npx expo run:ios

# Option B — cloud build via EAS (no local Android/Xcode setup needed)
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Once installed, run `npx expo start --dev-client` and it connects to that
build the same way Expo Go does — full push notifications included.

---

## Cloud Functions

Cloud Functions are **shared infrastructure** for the whole Firebase
project — they aren't tied to either client app, so there's a single copy
living alongside the Flutter attempt at this project:

```
../raktusetuu/functions/
```

(`raktusetuu` is the sibling Flutter project directory — adjust the path if
your folder layout differs.) That file (`functions/src/index.ts`) already
handles both apps' push channels:

| Function | Trigger | What it does |
|---|---|---|
| `onBloodRequestCreated` | Firestore `onCreate` of `bloodRequests/{id}` | Finds matching, non-suspended donors and writes each an in-app notification, then pushes to **both** channels — FCM for any user with an `fcmToken` (Flutter app) and the [Expo push API](https://exp.host/--/api/v2/push/send) for any user with an `expoPushToken` (this app). A user only needs whichever token their app registered. |
| `broadcastAnnouncement` | Callable (admin-only) | Same dual-channel push, for a manual announcement to all users or one blood type. |
| `deleteUserAccount` | Callable (admin-only) | Deletes the user's Firestore doc and Firebase Auth account. |

Deploy from that folder:

```bash
cd ../raktusetuu/functions
npm install
npm run build
firebase deploy --only functions
```

No changes are needed there for this app to work — `expoPushToken` support
is already wired in.

---

## Firestore security rules

Also shared (one Firestore database, one rules file) — see
`../raktusetuu/firestore.rules`. Relevant to this app:

- `users/{uid}` — the owner can update their own `expoPushToken` (alongside
  the Flutter app's `fcmToken`), but never `role`, `isVerified`, or
  `isSuspended` — only an admin can.
- `notifications/{uid}/items/{id}` — **creation is restricted to Cloud
  Functions only** (the Admin SDK bypasses rules entirely) — a client can
  never write another user's notification, which is the safer of the two
  options the spec allowed for.
- `bloodRequests/{id}` — any signed-in user can create one for themselves;
  the owner or an admin can update/delete it; any other signed-in user may
  only bump `viewCount`/`respondedUids` (the "Can you help?" view/response
  tracking).
- `donationHistory/{id}` — admin-write-only, readable by the owning user and
  admins.

Deploy alongside the functions, from the same sibling folder:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Seeding the first admin account

Admin accounts are **never** created through the normal Sign Up screen —
this app checks `role: "admin"` on the user's Firestore doc before allowing
access to Admin Login, exactly like the Flutter app.

1. **Sign Up** normally in either app with the email/password you want the
   admin to use, then sign in once so the account exists.
2. Promote it to admin — **either**:

   **Option A — Firebase Console**
   Firestore Database → `users` collection → open that user's document →
   add a field `role` (string) with value `admin`.

   **Option B — the included script** (shared with the Flutter project):
   ```bash
   cd ../raktusetuu/scripts
   npm install
   # Download a service account key: Firebase Console → Project Settings →
   # Service Accounts → Generate new private key → save as serviceAccountKey.json
   node seedAdmin.js admin@raktsetu.local
   ```

That account can then use **Admin Login** on this app's login screen.

---

## Data model

```
users/{uid}
  fullName, email, phone, gender, bloodType, city, dob,
  idCardUrl, profilePhotoUrl (Cloudinary secure_url values),
  role ("user"|"admin"), isVerified, isSuspended,
  fcmToken (Flutter app), expoPushToken (this app),
  profileComplete, createdAt

bloodRequests/{requestId}
  requesterUid, requesterName, patientName, unitsRequired, bloodType,
  hospitalName, location, contactNumber,
  status ("pending"|"fulfilled"|"cancelled"),
  viewCount, respondedUids[], createdAt

donationHistory/{id}
  userId, type ("donated"|"received"), date, units, hospitalName,
  note, linkedRequestId, addedByAdminUid

notifications/{uid}/items/{id}
  title, body, type ("bloodMatch"|"announcement"|"verification"|"general"),
  relatedRequestId, isRead, createdAt
```

---

## App icon & splash screen

Configured in `app.json`:
- `icon` / Android `adaptiveIcon` use `assets/app_icon.png`
- The **native** splash (shown for the brief moment before JS loads) uses
  the `expo-splash-screen` config plugin with `assets/splash_logo.png` on a
  deep-red background.
- Immediately after JS loads, `App.tsx` hides that native splash and hands
  off to `src/screens/SplashScreen.tsx` — a custom animated (pulsing
  blood-drop) screen showing the Rakt Setu name and college affiliation for
  ~2.2 seconds, matching the Flutter app's splash behavior, before routing
  to Login or Home.

All three images (`app_icon.png`, `splash_logo.png`, `logo.png` used on the
login screen) are copied from the Flutter app's `assets/images/` so both
apps share identical branding — replace them in both places if you swap in
real artwork later.

---

## Notes & known limitations

- **Blood-type matching is exact-match only**, same as the Flutter app —
  universal-donor logic would be a change to the shared
  `functions/src/index.ts#onBloodRequestCreated`.
- **ID card review is manual** — the admin visually inspects the uploaded
  image/PDF and taps Verify/Reject.
- **Deleting a user doesn't delete their Cloudinary files** — see the
  Cloud Functions file-level comment; would need a signed Cloudinary Admin
  API call from a server context.
- **Expo Go can't receive remote push on Android** (SDK 53+) — see
  [Testing push notifications](#testing-push-notifications) above. Local
  notification handling, matching, and everything else works fine regardless.
- No SMS provider is used anywhere, by design — matching relies entirely on
  in-app notifications and Expo/FCM push.

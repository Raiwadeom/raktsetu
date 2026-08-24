// Firebase Web SDK setup — used instead of @react-native-firebase because
// that package requires native module linking (a custom dev client), which
// is NOT compatible with plain Expo Go. The pure-JS Web SDK works fine
// inside Expo Go for Auth, Firestore, and Cloud Functions.
//
// This connects to the raktsetu-14b03 Firebase project. NOTE: this is a
// DIFFERENT project than raktsetu-cede7, which the Flutter attempt at this
// app and the shared functions/firestore.rules were set up against. This
// app will NOT share users/data with the Flutter app, and blood-request
// matching/push/admin actions won't work until firestore.rules and the
// Cloud Functions are also deployed to raktsetu-14b03 — see README.
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyDsT2tgpCbtj_fPGQk_BgG-mvyua-SpGDk',
  authDomain: 'raktsetu-14b03.firebaseapp.com',
  projectId: 'raktsetu-14b03',
  storageBucket: 'raktsetu-14b03.firebasestorage.app',
  messagingSenderId: '799125597564',
  appId: '1:799125597564:web:bcf08cde52d363f2c048f9',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// On native platforms, Auth needs an explicit persistence layer (AsyncStorage)
// or the session won't survive app restarts. On web, the default works fine.
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if it's already been called once (e.g. Fast
    // Refresh during development) — fall back to the existing instance.
    auth = getAuth(app);
  }
}

const db = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, db, functions };

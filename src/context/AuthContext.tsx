import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import { watchUser, saveExpoPushToken, syncPushTokenMirror, getUser } from '../services/userService';
import * as authService from '../services/authService';
import { registerForPushNotificationsAsync } from '../services/pushNotificationService';
import type { AppUser } from '../types/models';

type AuthStatus = 'unknown' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  appUser: AppUser | null;
  isSignedIn: boolean;
  isAdmin: boolean;
  needsProfileCompletion: boolean;
  needsVerification: boolean;
  signUp: typeof authService.signUp;
  signIn: typeof authService.signIn;
  adminSignIn: typeof authService.adminSignIn;
  sendPasswordReset: typeof authService.sendPasswordReset;
  signOut: typeof authService.signOut;
  deleteOwnAccount: typeof authService.deleteOwnAccount;
  /** Re-fetches the signed-in user's profile doc directly (a one-shot
   * `getDoc`, not the live listener) and pushes it into `appUser`. The
   * `watchUser` snapshot listener normally keeps `appUser` current on its
   * own, but a long-lived dev session (hot reloads, backgrounding, flaky
   * wifi) can leave its underlying stream stalled without erroring — writes
   * still succeed, but the listener stops delivering updates until the app
   * is fully restarted. Call this right after a write whose result the UI
   * needs to react to immediately (e.g. Save & Continue on Complete
   * Profile), instead of trusting the listener to fire in time. */
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const userUnsubRef = useRef<(() => void) | null>(null);
  const pushRegisteredForUid = useRef<string | null>(null);
  // While true, onAuthStateChanged events are ignored entirely. signUp()
  // below sets this around its create-account + immediate-sign-out pair, so
  // the transient auto-signed-in state Firebase produces after account
  // creation never reaches RootNavigator — without this, the app briefly
  // flashes Loading/CompleteProfile before signing back out to Login.
  const suppressAuthUpdatesRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (suppressAuthUpdatesRef.current) return;
      setFirebaseUser(user);

      if (userUnsubRef.current) {
        userUnsubRef.current();
        userUnsubRef.current = null;
      }

      if (!user) {
        setStatus('signedOut');
        setAppUser(null);
        pushRegisteredForUid.current = null;
        return;
      }

      setStatus('signedIn');
      userUnsubRef.current = watchUser(user.uid, setAppUser);
    });

    return () => {
      unsub();
      if (userUnsubRef.current) userUnsubRef.current();
    };
  }, []);

  // Once we know who's signed in (and their profile doc exists), make sure
  // they're findable by donor matching, then register this device for push
  // and save the Expo push token — once per session.
  useEffect(() => {
    if (!appUser || pushRegisteredForUid.current === appUser.uid) return;
    pushRegisteredForUid.current = appUser.uid;

    // Unconditional, and deliberately NOT chained onto push registration:
    // the pushTokens/{uid} mirror is what makes this user visible to donor
    // matching at all, including for the purely in-app notification. Gating
    // it on a push token meant anyone who declined the notification
    // permission prompt silently received nothing — see syncPushTokenMirror.
    syncPushTokenMirror(appUser.uid, appUser.bloodType, appUser.isSuspended).catch((e) =>
      console.warn('Failed to sync donor-matching mirror:', e),
    );

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token && token !== appUser.expoPushToken) {
          saveExpoPushToken(appUser.uid, token, appUser.bloodType).catch((e) =>
            console.warn('Failed to save push token:', e),
          );
        }
      })
      .catch((e) => console.warn('Push registration failed:', e));
  }, [appUser?.uid]);

  const refreshAppUser = async () => {
    if (!firebaseUser) return;
    const u = await getUser(firebaseUser.uid);
    setAppUser(u);
  };

  // Creates the account, then immediately signs back out — new users land on
  // Login and go through Complete Profile on their first real sign-in.
  // Suppressing auth-state updates for the whole span (see
  // suppressAuthUpdatesRef above) means the app's visible state never
  // changes: it was signed-out before this call and is signed-out after.
  const signUp: typeof authService.signUp = async (email, password) => {
    suppressAuthUpdatesRef.current = true;
    try {
      const cred = await authService.signUp(email, password);
      await authService.signOut();
      return cred;
    } catch (e) {
      // Best-effort: don't leave a stray auto-signed-in session behind if
      // signOut() itself failed (e.g. a network drop between the two calls).
      await authService.signOut().catch(() => undefined);
      throw e;
    } finally {
      suppressAuthUpdatesRef.current = false;
    }
  };

  const isSignedIn = status === 'signedIn' && !!firebaseUser;
  const isAdmin = appUser?.role === 'admin';
  const needsProfileCompletion = isSignedIn && appUser != null && !appUser.profileComplete && !isAdmin;
  const needsVerification =
    isSignedIn && appUser != null && appUser.profileComplete && !appUser.isVerified && !isAdmin;

  const value: AuthContextValue = {
    status,
    firebaseUser,
    appUser,
    isSignedIn,
    isAdmin,
    needsProfileCompletion,
    needsVerification,
    signUp,
    signIn: authService.signIn,
    adminSignIn: authService.adminSignIn,
    sendPasswordReset: authService.sendPasswordReset,
    signOut: authService.signOut,
    deleteOwnAccount: authService.deleteOwnAccount,
    refreshAppUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}

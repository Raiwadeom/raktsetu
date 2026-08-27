import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  type UserCredential,
  type AuthError as FirebaseAuthError,
} from 'firebase/auth';
import { doc, deleteDoc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { FS } from '../constants/appConstants';
import { deletePushTokenMirror } from './userService';

export class AuthError extends Error {}

function mapAuthError(e: FirebaseAuthError | Error): string {
  const code = 'code' in e ? e.code : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for this email.';
    case 'auth/invalid-email':
      return 'That email address is invalid.';
    case 'auth/weak-password':
      return 'The password is too weak (minimum 6 characters).';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return e.message || 'Authentication failed. Please try again.';
  }
}

export async function signUp(email: string, password: string): Promise<UserCredential> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const uid = cred.user.uid;
    await setDoc(doc(db, FS.users, uid), {
      fullName: '',
      email: email.trim(),
      phone: '',
      gender: '',
      bloodType: '',
      city: '',
      dob: null,
      idCardUrl: null,
      profilePhotoUrl: null,
      role: 'user',
      isVerified: false,
      isSuspended: false,
      expoPushToken: null,
      profileComplete: false,
      createdAt: serverTimestamp(),
    });
    return cred;
  } catch (e) {
    throw new AuthError(mapAuthError(e as FirebaseAuthError));
  }
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snap = await getDoc(doc(db, FS.users, cred.user.uid));
    if (snap.exists() && snap.data().isSuspended === true) {
      await firebaseSignOut(auth);
      throw new AuthError(
        'Your account has been suspended. Please contact the college administration.',
      );
    }
    return cred;
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new AuthError(mapAuthError(e as FirebaseAuthError));
  }
}

export async function adminSignIn(email: string, password: string): Promise<UserCredential> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const snap = await getDoc(doc(db, FS.users, cred.user.uid));
    const role = snap.exists() ? snap.data().role : null;
    if (!snap.exists() || role !== 'admin') {
      await firebaseSignOut(auth);
      throw new AuthError('This account does not have admin access.');
    }
    if (snap.data()?.isSuspended === true) {
      await firebaseSignOut(auth);
      throw new AuthError('This admin account has been suspended.');
    }
    return cred;
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new AuthError(mapAuthError(e as FirebaseAuthError));
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e) {
    throw new AuthError(mapAuthError(e as FirebaseAuthError));
  }
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

/**
 * Permanently deletes the *currently signed-in* user's own account —
 * their Firestore profile, their in-app notifications, and the Firebase
 * Auth account itself. Unlike the admin-driven deleteUserAccount Cloud
 * Function (which must use the Admin SDK to remove someone *else's* Auth
 * account), a signed-in user can delete their own Auth account directly —
 * no server component needed here.
 *
 * Requires the user's password to re-authenticate first: Firebase refuses
 * to delete an Auth account on a "stale" session (auth/requires-recent-login),
 * and asking for the password again doubles as the "are you sure" gate.
 *
 * Their posted blood requests, and any donation history logged by an
 * admin, are intentionally left in place — same as the admin-driven delete
 * flow — since those are historical records, not personal profile data.
 */
export async function deleteOwnAccount(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new AuthError('You must be signed in to delete your account.');
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  } catch (e) {
    throw new AuthError(mapAuthError(e as FirebaseAuthError));
  }

  const uid = user.uid;

  // Firestore cleanup must happen *before* deleteUser() below — once the
  // Auth account is gone, request.auth is null and these writes would be
  // rejected by the security rules' isOwner()/isSignedIn() checks.
  try {
    const itemsSnap = await getDocs(collection(db, FS.notifications, uid, FS.notificationItems));
    if (!itemsSnap.empty) {
      const batch = writeBatch(db);
      itemsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch {
    // Non-fatal — still proceed with deleting the profile doc and account.
  }

  // The donor-matching mirror is a separate top-level doc, so deleting
  // users/{uid} does not remove it. Left behind it keeps the deleted account
  // matchable: every later request would write notifications into a dead
  // inbox and push to a stale token.
  await deletePushTokenMirror(uid).catch(() => undefined);

  await deleteDoc(doc(db, FS.users, uid)).catch(() => undefined);

  try {
    await deleteUser(user);
  } catch (e) {
    throw new AuthError(mapAuthError(e as FirebaseAuthError));
  }
}

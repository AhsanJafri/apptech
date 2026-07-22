import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/config';
import { UserProfile } from '@/types';

const PLAN_LIMITS = {
  free: 1,
  starter: 1,
  pro: 5,
  business: 20,
};

async function createUserProfile(user: User, displayName?: string): Promise<UserProfile> {
  const profile: UserProfile = {
    id: user.uid,
    email: user.email ?? '',
    displayName: displayName ?? user.displayName ?? undefined,
    plan: 'free',
    domainLimit: PLAN_LIMITS.free,
    emailAlertsEnabled: true,
    telegramAlertsEnabled: false,
    expoPushTokens: [],
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(getFirebaseDb(), 'users', user.uid), {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return profile;
}

async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: uid,
    email: data.email,
    displayName: data.displayName,
    plan: data.plan ?? 'free',
    domainLimit: data.domainLimit ?? PLAN_LIMITS.free,
    telegramChatId: data.telegramChatId,
    emailAlertsEnabled: data.emailAlertsEnabled ?? true,
    telegramAlertsEnabled: data.telegramAlertsEnabled ?? false,
    expoPushTokens: Array.isArray(data.expoPushTokens) ? data.expoPushTokens : [],
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export async function saveExpoPushToken(userId: string, token: string): Promise<void> {
  const ref = doc(getFirebaseDb(), 'users', userId);
  const snap = await getDoc(ref);
  const existing: string[] = snap.exists()
    ? (Array.isArray(snap.data().expoPushTokens) ? snap.data().expoPushTokens : [])
    : [];
  if (existing.includes(token)) return;
  await setDoc(
    ref,
    {
      expoPushTokens: [...existing, token],
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return createUserProfile(credential.user, displayName);
}

export async function signIn(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  const profile = await fetchUserProfile(credential.user.uid);
  if (!profile) {
    return createUserProfile(credential.user);
  }
  return profile;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      unsubscribe();
      if (!user) {
        resolve(null);
        return;
      }
      const profile = await fetchUserProfile(user.uid);
      resolve(profile);
    });
  });
}

export function onAuthChange(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const profile = await fetchUserProfile(user.uid);
      if (profile) {
        callback(profile);
        return;
      }
      callback(await createUserProfile(user));
    } catch {
      // Offline / Firestore unavailable — still restore session from persisted auth
      callback({
        id: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? undefined,
        plan: 'free',
        domainLimit: 1,
        emailAlertsEnabled: true,
        telegramAlertsEnabled: false,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

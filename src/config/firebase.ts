import { initializeApp, getApps } from "firebase/app";
import { getMessaging, onMessage, getToken, isSupported } from "firebase/messaging";
import type { Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function initFirebase() {
  if (!getApps().length) initializeApp(firebaseConfig as any);
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    initFirebase();
    return getMessaging();
  } catch {
    return null;
  }
}

export async function acquireFcmToken(): Promise<string | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.error("[FCM] getFirebaseMessaging returned null (not supported by browser)");
    return null;
  }
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
  if (!vapidKey) {
    console.error("[FCM] VITE_FIREBASE_VAPID_KEY is not set in environment");
  }
  try {
    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (err) {
    console.error("[FCM] getToken failed with error:", err);
    return null;
  }
}

export { onMessage };

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Initialize Firebase Admin SDK
const initializeAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // For emulator environment, use default credentials
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    return initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-word-chaser',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'http://127.0.0.1:9000?ns=demo-word-chaser',
    });
  }

  // For production, use service account credentials
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }

  // Fallback: use default credentials (for environments like Vercel with built-in Firebase support)
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
};

const adminApp = initializeAdminApp();
export const adminDb = getDatabase(adminApp);

export default adminApp;

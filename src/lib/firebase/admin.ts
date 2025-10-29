import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Initialize Firebase Admin SDK when endpoint is first called and cache for subsequent calls
const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    return initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }

  // Use environment variables or default values for unit tests
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-word-chaser',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'http://127.0.0.1:9000?ns=demo-word-chaser',
  });
};

const adminApp = getAdminApp();
export const adminDb = getDatabase(adminApp);

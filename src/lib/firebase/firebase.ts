import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Decide whether to use emulators:
// - Defaults to true for non-production environments
// - Can be forced on/off via NEXT_PUBLIC_USE_EMULATORS
const shouldUseEmulators = (() => {
  const explicit = process.env.NEXT_PUBLIC_USE_EMULATORS;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV !== 'production';
})();

if (shouldUseEmulators) {
  const rtdbHost = process.env.RTD_EMULATOR_HOST || '127.0.0.1';
  const rtdbPort = Number(process.env.RTD_EMULATOR_PORT || 9000);
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

  try {
    connectDatabaseEmulator(db, rtdbHost, rtdbPort);
    connectAuthEmulator(auth, `http://${authHost}`);
    console.log(`🔌 Connected to Firebase emulators (RTDB: ${rtdbHost}:${rtdbPort}, Auth: ${authHost})`);
  } catch (error) {
    console.warn('⚠️ Failed to connect to Firebase emulators:', error);
    console.warn('Make sure emulators are running: npx firebase emulators:start --config src/lib/firebase/config/emulator.json --only database,auth --project demo-word-chaser');
  }
} else {
  console.log('🌐 Using production Firebase services');
}

export default app; 
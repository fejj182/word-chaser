import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  updateProfile,
  User
} from 'firebase/auth';

// Authentication utilities
export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const signUpUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const signInAsGuest = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// Ensure an anonymous session exists and set/update the user's displayName (alias)
export const ensureAnonymousWithAlias = async (alias: string): Promise<User> => {
  const trimmedAlias = alias.trim();
  if (!auth.currentUser) {
    const creds = await signInAnonymously(auth);
    if (trimmedAlias.length > 0) {
      await updateProfile(creds.user, { displayName: trimmedAlias });
    }
    return creds.user;
  }

  const current = auth.currentUser as User;
  if (trimmedAlias.length > 0 && current.displayName !== trimmedAlias) {
    await updateProfile(current, { displayName: trimmedAlias });
  }
  return current;
}; 
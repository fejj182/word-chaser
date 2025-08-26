import { auth } from './firebase';
import { 
  signInAnonymously,
  updateProfile,
  User
} from 'firebase/auth';

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
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
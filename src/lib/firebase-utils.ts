import { auth, db, storage } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

// Firestore utilities
export const createDocument = async (collectionName: string, data: any, docId?: string) => {
  try {
    if (docId) {
      await setDoc(doc(db, collectionName, docId), data);
      return { id: docId, error: null };
    } else {
      const docRef = await addDoc(collection(db, collectionName), data);
      return { id: docRef.id, error: null };
    }
  } catch (error) {
    return { id: null, error: error as Error };
  }
};

export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: new Error('Document not found') };
    }
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const queryDocuments = async (collectionName: string, field: string, operator: any, value: any) => {
  try {
    const q = query(collection(db, collectionName), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { data: documents, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
};

// Storage utilities
export const uploadFile = async (file: File, path: string) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { url: downloadURL, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}; 
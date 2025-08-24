import '@testing-library/jest-dom'

jest.mock('./src/lib/firebase/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}))

jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}))

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
})) 
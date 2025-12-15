import { MuseEntry } from '../types';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, query, where, getDocs, 
  setDoc, doc, orderBy, deleteDoc, getDoc 
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User 
} from "firebase/auth";

// ============================================================================
// 🌍 REAL WORLD IMPLEMENTATION
// ============================================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "daily-muse-c79e7.firebaseapp.com",
  projectId: "daily-muse-c79e7",
  storageBucket: "daily-muse-c79e7.firebasestorage.app",
  messagingSenderId: "15095190640",
  appId: "1:15095190640:web:b384f7da20da42ad8b50b5",
  measurementId: "G-BWL394M80V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const COLLECTION_NAME = 'muses';

// --- AUTH SERVICES ---

export const loginUser = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = () => {
  return signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- DATA SERVICES ---

export const getEntryByDate = async (dateStr: string): Promise<MuseEntry | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, dateStr);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as MuseEntry;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching entry:", error);
    return null;
  }
};

export const getPastEntries = async (todayStr: string): Promise<MuseEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("scheduledDate", "<", todayStr),
      orderBy("scheduledDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as MuseEntry);
  } catch (error) {
    console.error("Error fetching past entries:", error);
    return [];
  }
};

export const getAllEntries = async (): Promise<MuseEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("scheduledDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as MuseEntry);
  } catch (error) {
    console.error("Error fetching all entries:", error);
    return [];
  }
};

export const checkDateConflict = async (dateStr: string): Promise<boolean> => {
  const entry = await getEntryByDate(dateStr);
  return !!entry;
};

export const uploadMuseEntry = async (entry: MuseEntry): Promise<void> => {
  try {
    // We use the scheduledDate as the document ID to ensure easy uniqueness
    // and simplified fetching by date.
    await setDoc(doc(db, COLLECTION_NAME, entry.scheduledDate), {
      ...entry,
      id: entry.scheduledDate
    });
  } catch (error) {
    console.error("Error uploading entry:", error);
    throw error;
  }
};

export const updateEntryDate = async (oldDate: string, newDate: string): Promise<void> => {
  if (oldDate === newDate) return;

  const oldEntry = await getEntryByDate(oldDate);
  if (!oldEntry) throw new Error("Entry not found");

  const conflict = await checkDateConflict(newDate);
  if (conflict) throw new Error("A muse is already scheduled for that date.");

  // Firestore IDs are immutable, so we must create new and delete old
  const newEntry = { ...oldEntry, scheduledDate: newDate, id: newDate };
  
  await uploadMuseEntry(newEntry);
  await deleteEntry(oldDate);
};

export const deleteEntry = async (date: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, date));
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw error;
  }
};
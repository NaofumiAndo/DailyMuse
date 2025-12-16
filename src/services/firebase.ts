import { MuseEntry } from '../types';
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, query, where, getDocs,
  setDoc, doc, orderBy, deleteDoc, getDoc
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User
} from "firebase/auth";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "firebase/storage";

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
export const storage = getStorage(app);

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

// --- STORAGE SERVICES ---

/**
 * Converts base64 string to Blob for uploading
 */
const base64ToBlob = (base64: string): Blob => {
  // Extract the base64 data (remove data:image/jpeg;base64, prefix if present)
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/jpeg' });
};

/**
 * Uploads a base64 image to Firebase Storage and returns the download URL
 */
export const uploadImageToStorage = async (
  base64Image: string,
  path: string
): Promise<string> => {
  try {
    const blob = base64ToBlob(base64Image);
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to storage:", error);
    throw error;
  }
};

/**
 * Deletes an image from Firebase Storage by its path
 */
export const deleteImageFromStorage = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting image from storage:", error);
    // Don't throw - image might already be deleted
  }
};

/**
 * Extracts the storage path from a Firebase Storage URL
 */
const getStoragePathFromUrl = (url: string): string | null => {
  try {
    // Firebase Storage URLs have format:
    // https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg?...
    const match = url.match(/\/o\/(.+?)\?/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    console.error("Error extracting storage path from URL:", error);
    return null;
  }
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
    // Upload images to Storage if they are base64 (start with data:image)
    let titleImageUrl = entry.titleImage;
    let comicImageUrl = entry.comicImage;

    const timestamp = Date.now();

    // Upload title image if it's base64
    if (entry.titleImage.startsWith('data:image')) {
      const titlePath = `muses/${entry.scheduledDate}/title_${timestamp}.jpg`;
      titleImageUrl = await uploadImageToStorage(entry.titleImage, titlePath);
    }

    // Upload comic image if it's base64
    if (entry.comicImage.startsWith('data:image')) {
      const comicPath = `muses/${entry.scheduledDate}/comic_${timestamp}.jpg`;
      comicImageUrl = await uploadImageToStorage(entry.comicImage, comicPath);
    }

    // We use the scheduledDate as the document ID to ensure easy uniqueness
    // and simplified fetching by date.
    await setDoc(doc(db, COLLECTION_NAME, entry.scheduledDate), {
      ...entry,
      titleImage: titleImageUrl,
      comicImage: comicImageUrl,
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
    // Get the entry to find image paths
    const entry = await getEntryByDate(date);

    // Delete images from Storage if they exist
    if (entry) {
      // Only delete if images are Storage URLs (not base64)
      if (entry.titleImage && entry.titleImage.includes('firebasestorage')) {
        const titlePath = getStoragePathFromUrl(entry.titleImage);
        if (titlePath) {
          await deleteImageFromStorage(titlePath);
        }
      }
      if (entry.comicImage && entry.comicImage.includes('firebasestorage')) {
        const comicPath = getStoragePathFromUrl(entry.comicImage);
        if (comicPath) {
          await deleteImageFromStorage(comicPath);
        }
      }
    }

    // Delete the Firestore document
    await deleteDoc(doc(db, COLLECTION_NAME, date));
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw error;
  }
};
import { MuseEntry } from '../types';

/**
 * GitHub-based storage service
 * Saves images and metadata as static files in the repository
 * instead of using cloud databases
 */

const DATA_DIR = '/data/muses';

/**
 * Converts base64 string to blob URL for downloading
 */
const base64ToBlob = (base64: string): Blob => {
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
 * Saves base64 image as a downloadable file
 * This will be used by the creator to save images locally,
 * which they can then commit to GitHub
 */
export const saveImageToLocal = (base64Image: string, filename: string): void => {
  const blob = base64ToBlob(base64Image);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Saves metadata as JSON file for download
 */
export const saveMetadataToLocal = (entry: MuseEntry): void => {
  const json = JSON.stringify(entry, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${entry.scheduledDate}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Gets the URL path for a muse's title image
 */
export const getTitleImagePath = (dateStr: string): string => {
  return `${DATA_DIR}/${dateStr}-title.jpg`;
};

/**
 * Gets the URL path for a muse's comic image
 */
export const getComicImagePath = (dateStr: string): string => {
  return `${DATA_DIR}/${dateStr}-comic.jpg`;
};

/**
 * Gets the URL path for a muse's metadata JSON
 */
export const getMetadataPath = (dateStr: string): string => {
  return `${DATA_DIR}/${dateStr}.json`;
};

/**
 * Fetches a muse entry by date from static JSON files
 */
export const getEntryByDate = async (dateStr: string): Promise<MuseEntry | null> => {
  try {
    const response = await fetch(getMetadataPath(dateStr));
    if (!response.ok) {
      return null;
    }
    const data = await response.json();

    // Convert relative paths to absolute URLs
    return {
      ...data,
      titleImage: getTitleImagePath(dateStr),
      comicImage: getComicImagePath(dateStr)
    };
  } catch (error) {
    console.error(`Error fetching entry for ${dateStr}:`, error);
    return null;
  }
};

/**
 * Gets all muse entries by reading the index file
 */
export const getAllEntries = async (): Promise<MuseEntry[]> => {
  try {
    const response = await fetch(`${DATA_DIR}/index.json`);
    if (!response.ok) {
      return [];
    }
    const dates: string[] = await response.json();

    // Fetch all entries in parallel
    const entries = await Promise.all(
      dates.map(date => getEntryByDate(date))
    );

    // Filter out null entries and sort by date descending
    return entries
      .filter((entry): entry is MuseEntry => entry !== null)
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  } catch (error) {
    console.error('Error fetching all entries:', error);
    return [];
  }
};

/**
 * Gets past entries (before today)
 */
export const getPastEntries = async (todayStr: string): Promise<MuseEntry[]> => {
  const allEntries = await getAllEntries();
  return allEntries.filter(entry => entry.scheduledDate < todayStr);
};

/**
 * Checks if a date already has an entry
 */
export const checkDateConflict = async (dateStr: string): Promise<boolean> => {
  const entry = await getEntryByDate(dateStr);
  return entry !== null;
};

/**
 * Saves a muse entry via the backend API
 * This writes files to public/data/muses/ which can be committed to GitHub
 */
export const saveMuseEntry = async (entry: MuseEntry): Promise<void> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_URL}/api/muses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save muse');
    }

    console.log('Muse saved to GitHub storage successfully!');
  } catch (error) {
    console.error('Error saving muse entry:', error);
    throw error;
  }
};

/**
 * Deletes a muse entry via the backend API
 */
export const deleteMuseEntry = async (dateStr: string): Promise<void> => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_URL}/api/muses/${dateStr}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete muse');
    }

    console.log('Muse deleted from GitHub storage successfully!');
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};

/**
 * Updates an entry's date via the backend API
 */
export const updateEntryDate = async (oldDate: string, newDate: string): Promise<void> => {
  if (oldDate === newDate) return;

  const conflict = await checkDateConflict(newDate);
  if (conflict) throw new Error("A muse is already scheduled for that date.");

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_URL}/api/muses/${oldDate}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newDate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update muse date');
    }

    console.log('Muse date updated in GitHub storage successfully!');
  } catch (error) {
    console.error('Error updating entry date:', error);
    throw error;
  }
};

export interface MuseEntry {
  id?: string;
  // Metadata
  scheduledDate: string; // YYYY-MM-DD
  createdAt: number;
  
  // Comic Data
  title: string;
  episodeNumber: string;
  titleImage: string; // Base64 or URL
  
  characterDescription: string;
  concept: string; // The full story/context
  comicImage: string; // The generated 4-panel comic (Base64 or URL)
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING_TITLE = 'GENERATING_TITLE',
  GENERATING_COMIC = 'GENERATING_COMIC',
  UPLOADING = 'UPLOADING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GenerationError {
  message: string;
}
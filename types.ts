// Comic types
export type ComicType = 'four-panel' | 'daily-comic';

// Panel structure for daily comic template
export interface DailyComicPanel {
  panelNumber: number;
  framing: string;
  situation: string;
  characterAExplanation: string;
  characterBExplanation: string;
  background: string;
  dialogues: Array<{
    character: string;
    text: string;
  }>;
}

// Daily comic template data
export interface DailyComicTemplate {
  characterAName: string;
  characterBName: string;
  characterARefImage: string; // Base64 or URL for Character A
  characterBRefImage: string; // Base64 or URL for Character B
  panels: DailyComicPanel[];
  technicalConstraints: string;
  artStyleDetails: string;
}

export interface MuseEntry {
  id?: string;
  // Metadata
  scheduledDate: string; // YYYY-MM-DD
  createdAt: number;

  // Common fields
  title: string;
  episodeNumber: string;
  titleImage: string; // Base64 or URL (may be empty for daily comics)
  comicImage: string; // The generated comic (Base64 or URL)

  // Type discriminator
  comicType: ComicType;

  // Four-panel specific
  characterDescription?: string;
  concept?: string; // The full story/context

  // Daily comic specific
  dailyComicTemplate?: DailyComicTemplate;
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
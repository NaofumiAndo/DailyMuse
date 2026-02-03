import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateTitleImage, generateComic, refinePromptWithFeedback, editExistingImage, generateDailyComic } from '../services/gemini';
import { saveMuseEntry, checkDateConflict, getAllEntries, deleteMuseEntry, updateEntryDate } from '../services/githubStorage';
import { GenerationStatus, MuseEntry, ComicType, DailyComicPanel, DailyComicTemplate } from '../types';
import { Wand2, CalendarCheck, CheckCircle2, Settings, X, ArrowRight, Image as ImageIcon, ChevronLeft, Loader2, LogOut, Edit2, Save, Sparkles, Plus, Trash2, Upload } from 'lucide-react';

// Simple password authentication
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

// Default values for Daily Comic
const DEFAULT_TECHNICAL_CONSTRAINTS = `High-resolution, clean panel borders, legible text within speech bubbles, consistent lighting across frames. Output as a square image(aspect 1:1). Use Font: Comic Relief.`;

const DEFAULT_ART_STYLE = `You are a comical comic writer that is a master class in minimalist expression. Manages to convey deep emotional resonance through incredibly simple, economic line work.
1. Dynamic Linework: Utilize the "shaggy" lines such as for the grass and animal's fur. This adds texture and a sense of organic movement that contrasts with the clean, rounded edges of the speech bubbles.
2. Watercolor Aesthetic: The use of soft, luminous color washes gives the landscape a dreamlike, nostalgic quality. The sunlight hitting the grass and clouds creates a sense of warmth and peace.
3. The "Ligne Claire" Influence: The style relies on clean, consistent outlines. There is no hatching or cross-hatching for shadow; depth is implied rather than rendered. The focus is entirely on the silhouette and the clarity of the characters' forms.
4. Graphic Shorthand: Use a system of "graphic shorthand" to communicate complex ideas with a single stroke. Example: Ear is literally just the letter "C." The Single-Line Brow: Emotions are dictated by the tilt or curve of a tiny line above the eye. The Floating Eye: they are often simple dots or dashes that move around the face to emphasize a specific gaze or mood.
5. Deceptively Simple Anatomy: The characters are "super-deformed" (a precursor to the modern chibi style), meaning they have large heads and small, simplified bodies. This makes them appear vulnerable and childlike, which grounds the strip's often heavy philosophical themes in a non-threatening, cute aesthetic.`;

// Create empty panel
const createEmptyPanel = (panelNumber: number): DailyComicPanel => ({
  panelNumber,
  framing: '',
  situation: '',
  characterAExplanation: '',
  characterBExplanation: '',
  background: '',
  dialogues: []
});

const Admin: React.FC = () => {
  // Auth & API
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Template Selection
  const [comicType, setComicType] = useState<ComicType>('four-panel');

  // Workflow State
  // Four-panel: 0: Setup (Char & Title), 1: Create Comic, 2: Schedule
  // Daily Comic: 0: Character Reference, 1: Panel Builder, 2: Style Settings, 3: Generate, 4: Schedule
  const [currentStep, setCurrentStep] = useState(0);

  // Four-panel Data State
  const [characterDesc, setCharacterDesc] = useState('');
  const [title, setTitle] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [concept, setConcept] = useState('');

  // Daily Comic Data State
  const [characterAName, setCharacterAName] = useState('Wooly');
  const [characterBName, setCharacterBName] = useState('Mr. Wolf');
  const [characterARefImage, setCharacterARefImage] = useState<string>('');
  const [characterBRefImage, setCharacterBRefImage] = useState<string>('');
  const [panels, setPanels] = useState<DailyComicPanel[]>([
    createEmptyPanel(1)
  ]);
  const [technicalConstraints, setTechnicalConstraints] = useState(DEFAULT_TECHNICAL_CONSTRAINTS);
  const [artStyleDetails, setArtStyleDetails] = useState(DEFAULT_ART_STYLE);

  // File upload refs
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);
  const [isDraggingA, setIsDraggingA] = useState(false);
  const [isDraggingB, setIsDraggingB] = useState(false);

  // Images
  const [generatedTitleImage, setGeneratedTitleImage] = useState<string | null>(null);
  const [generatedComicImage, setGeneratedComicImage] = useState<string | null>(null);

  // Operational State
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [scheduledDate, setScheduledDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [saveError, setSaveError] = useState('');

  // Prompt Refinement State (four-panel only)
  const [feedback, setFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // One-time Instructions State (four-panel only)
  const [oneTimeInstructions, setOneTimeInstructions] = useState('');

  // Management List
  const [existingMuses, setExistingMuses] = useState<MuseEntry[]>([]);

  // Date Editing
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [editError, setEditError] = useState('');

  // Calculate max date (5 years from now) for date inputs
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 5);
    return date.toISOString().split('T')[0];
  };
  const maxDate = getMaxDate();

  // Check Auth Status on Mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('dailyMuse_isAuthenticated') === 'true';
    setIsAuthenticated(isLoggedIn);
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && aistudio.hasSelectedApiKey) {
        const has = await aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadMuses();
  }, [isAuthenticated]);

  const loadMuses = async () => {
    try {
      const muses = await getAllEntries();
      setExistingMuses(muses);
    } catch (e) {
      console.error("Failed to load muses", e);
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && aistudio.openSelectKey) {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('dailyMuse_isAuthenticated', 'true');
      setPassword('');
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dailyMuse_isAuthenticated');
  };

  // --- FILE UPLOAD HANDLERS ---
  const handleFileSelectA = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setGenerationError('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCharacterARefImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelectB = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setGenerationError('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCharacterBRefImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDropA = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingA(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelectA(file);
  }, [handleFileSelectA]);

  const handleDropB = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingB(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelectB(file);
  }, [handleFileSelectB]);

  const handleDragOverA = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingA(true);
  }, []);

  const handleDragOverB = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingB(true);
  }, []);

  const handleDragLeaveA = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingA(false);
  }, []);

  const handleDragLeaveB = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingB(false);
  }, []);

  const handleFileInputChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelectA(file);
  };

  const handleFileInputChangeB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelectB(file);
  };

  // --- PANEL MANAGEMENT ---
  const addPanel = () => {
    // Copy from the last panel's template (excluding dialogues content but keeping structure)
    const lastPanel = panels[panels.length - 1];
    const newPanel: DailyComicPanel = {
      panelNumber: panels.length + 1,
      framing: lastPanel.framing,
      situation: '', // Clear situation as it's likely different per panel
      characterAExplanation: lastPanel.characterAExplanation,
      characterBExplanation: lastPanel.characterBExplanation,
      background: lastPanel.background,
      dialogues: [] // Start with empty dialogues for new panel
    };
    setPanels([...panels, newPanel]);
  };

  const removePanel = (index: number) => {
    if (panels.length <= 1) return;
    const newPanels = panels.filter((_, i) => i !== index).map((p, i) => ({
      ...p,
      panelNumber: i + 1
    }));
    setPanels(newPanels);
  };

  const updatePanel = (index: number, field: keyof DailyComicPanel, value: any) => {
    const newPanels = [...panels];
    newPanels[index] = { ...newPanels[index], [field]: value };
    setPanels(newPanels);
  };

  const addDialogue = (panelIndex: number) => {
    const newPanels = [...panels];
    newPanels[panelIndex].dialogues.push({ character: characterAName || 'Character A', text: '' });
    setPanels(newPanels);
  };

  const removeDialogue = (panelIndex: number, dialogueIndex: number) => {
    const newPanels = [...panels];
    newPanels[panelIndex].dialogues = newPanels[panelIndex].dialogues.filter((_, i) => i !== dialogueIndex);
    setPanels(newPanels);
  };

  const updateDialogue = (panelIndex: number, dialogueIndex: number, field: 'character' | 'text', value: string) => {
    const newPanels = [...panels];
    newPanels[panelIndex].dialogues[dialogueIndex][field] = value;
    setPanels(newPanels);
  };

  // --- STEP 0: TITLE (Four-panel) ---

  const handleGenerateTitle = async () => {
    if (!title || !episodeNumber) return;
    setGenerationError('');
    setStatus(GenerationStatus.GENERATING_TITLE);
    try {
      const imageBytes = await generateTitleImage(title, episodeNumber, characterDesc);
      setGeneratedTitleImage(`data:image/jpeg;base64,${imageBytes}`);
      setStatus(GenerationStatus.IDLE);
    } catch (error: any) {
      console.error("Failed to generate title", error);
      const errorMessage = error?.message || error?.toString() || "Failed to generate title image. Please check your API key and try again.";
      setGenerationError(errorMessage);
      setStatus(GenerationStatus.ERROR);
    }
  };

  // --- STEP 1: COMIC (Four-panel) ---

  const handleGenerateComic = async () => {
    if (!concept) return;
    setGenerationError('');
    setStatus(GenerationStatus.GENERATING_COMIC);
    try {
      const result = await generateComic(concept, characterDesc);
      setGeneratedComicImage(`data:image/jpeg;base64,${result.imageData}`);
      setStatus(GenerationStatus.IDLE);

      if (scheduledDate) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          await fetch(`${API_URL}/api/muses/prompt-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduledDate,
              fullPrompt: result.fullPrompt,
              timestamp: Date.now()
            })
          });
        } catch (historyError) {
          console.error("Failed to save prompt history:", historyError);
        }
      }
    } catch (error: any) {
      console.error("Failed to generate comic", error);
      const errorMessage = error?.message || error?.toString() || "Failed to generate comic. Please check your API key and try again.";
      setGenerationError(errorMessage);
      setStatus(GenerationStatus.ERROR);
    }
  };

  // --- DAILY COMIC GENERATION ---

  const handleGenerateDailyComic = async () => {
    if (!characterARefImage || !characterBRefImage || !characterAName || !characterBName) {
      setGenerationError('Please upload reference images for both characters');
      return;
    }

    setGenerationError('');
    setStatus(GenerationStatus.GENERATING_COMIC);

    try {
      const template: DailyComicTemplate = {
        characterAName,
        characterBName,
        characterARefImage,
        characterBRefImage,
        panels,
        technicalConstraints,
        artStyleDetails
      };

      const result = await generateDailyComic(template);
      setGeneratedComicImage(`data:image/jpeg;base64,${result.imageData}`);
      setStatus(GenerationStatus.IDLE);

      if (scheduledDate) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          await fetch(`${API_URL}/api/muses/prompt-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduledDate,
              fullPrompt: result.fullPrompt,
              timestamp: Date.now()
            })
          });
        } catch (historyError) {
          console.error("Failed to save prompt history:", historyError);
        }
      }
    } catch (error: any) {
      console.error("Failed to generate daily comic", error);
      const errorMessage = error?.message || error?.toString() || "Failed to generate daily comic. Please try again.";
      setGenerationError(errorMessage);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleRegenerateWithTweaks = async () => {
    if (!oneTimeInstructions.trim() || !generatedComicImage) return;
    setGenerationError('');
    setStatus(GenerationStatus.GENERATING_COMIC);
    try {
      const editedImageBytes = await editExistingImage(generatedComicImage, oneTimeInstructions);
      setGeneratedComicImage(`data:image/jpeg;base64,${editedImageBytes}`);
      setStatus(GenerationStatus.IDLE);
      setOneTimeInstructions('');
    } catch (error: any) {
      console.error("Failed to edit image", error);
      const errorMessage = error?.message || error?.toString() || "Failed to edit image. Please try again.";
      setGenerationError(errorMessage);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleRefinePrompt = async () => {
    if (!feedback.trim() || !concept) return;
    setGenerationError('');
    setIsRefining(true);
    try {
      const refinedPrompt = await refinePromptWithFeedback(concept, feedback);
      setConcept(refinedPrompt);
      setFeedback('');
      setGeneratedComicImage(null);
      setIsRefining(false);
    } catch (error: any) {
      console.error("Failed to refine prompt", error);
      const errorMessage = error?.message || error?.toString() || "Failed to refine prompt. Please try again.";
      setGenerationError(errorMessage);
      setIsRefining(false);
    }
  };

  // --- SCHEDULE ---

  const handleSchedule = async () => {
    if (!generatedComicImage || !scheduledDate) return;

    // Four-panel requires title image
    if (comicType === 'four-panel' && !generatedTitleImage) return;

    setSaveError('');
    setDateError('');

    const conflict = await checkDateConflict(scheduledDate);
    if (conflict) {
      setDateError('A comic is already scheduled for this date. Please choose a different date.');
      return;
    }

    setStatus(GenerationStatus.UPLOADING);

    try {
      const entry: MuseEntry = {
        scheduledDate,
        createdAt: Date.now(),
        title,
        episodeNumber,
        titleImage: comicType === 'four-panel' ? generatedTitleImage! : '',
        comicImage: generatedComicImage,
        comicType
      };

      if (comicType === 'four-panel') {
        entry.characterDescription = characterDesc;
        entry.concept = concept;
      } else {
        entry.dailyComicTemplate = {
          characterAName,
          characterBName,
          characterARefImage,
          characterBRefImage,
          panels,
          technicalConstraints,
          artStyleDetails
        };
      }

      await saveMuseEntry(entry);

      setStatus(GenerationStatus.COMPLETE);
      loadMuses();
    } catch (e: any) {
      console.error(e);
      const errorMsg = e?.message || 'Failed to save. Make sure the backend server is running (npm run server).';
      setSaveError(`${errorMsg}`);
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleDelete = async (date: string) => {
    const entry = existingMuses.find(m => m.scheduledDate === date);
    const title = entry?.title || 'Untitled';

    if (confirm(`Are you sure you want to delete the comic "${title}" scheduled for ${date}?\n\nThis action cannot be undone.`)) {
      try {
        await deleteMuseEntry(date);
        await loadMuses();
        alert(`Successfully deleted comic for ${date}`);
      } catch (error) {
        alert(`Failed to delete comic: ${error}`);
        console.error('Delete error:', error);
      }
    }
  };

  const handleStartEdit = (date: string) => {
    setEditingDate(date);
    setNewDate(date);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
    setNewDate('');
    setEditError('');
  };

  const handleSaveDate = async (oldDate: string) => {
    if (!newDate) {
      setEditError('Please select a date');
      return;
    }

    if (oldDate === newDate) {
      handleCancelEdit();
      return;
    }

    try {
      const conflict = await checkDateConflict(newDate);
      if (conflict) {
        setEditError('A comic is already scheduled for this date. Please choose a different date.');
        return;
      }

      await updateEntryDate(oldDate, newDate);
      await loadMuses();
      handleCancelEdit();
      alert(`Successfully changed date from ${oldDate} to ${newDate}`);
    } catch (error: any) {
      console.error(error);
      setEditError(error.message || 'Failed to update date');
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setTitle('');
    setEpisodeNumber('');
    setCharacterDesc('');
    setConcept('');
    setCharacterAName('Wooly');
    setCharacterBName('Mr. Wolf');
    setCharacterARefImage('');
    setCharacterBRefImage('');
    setPanels([createEmptyPanel(1)]);
    setTechnicalConstraints(DEFAULT_TECHNICAL_CONSTRAINTS);
    setArtStyleDetails(DEFAULT_ART_STYLE);
    setGeneratedTitleImage(null);
    setGeneratedComicImage(null);
    setStatus(GenerationStatus.IDLE);
    setScheduledDate('');
    setGenerationError('');
    setSaveError('');
    setFeedback('');
    setOneTimeInstructions('');
  };

  const handleTemplateChange = (type: ComicType) => {
    setComicType(type);
    resetForm();
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    );
  }

  if (!isAuthenticated) {
     return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-10 rounded-sm shadow-xl shadow-stone-200 border border-stone-100">
            <h2 className="text-3xl font-serif text-center mb-6 text-stone-900">Creator Access</h2>

            <div className="space-y-4 mb-8">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full p-4 bg-stone-50 border-b-2 border-stone-200 focus:border-stone-900 outline-none text-sm"
                autoFocus
              />
            </div>

            {loginError && <p className="text-red-500 text-xs text-center mb-4">{loginError}</p>}

            <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-sm font-bold tracking-widest uppercase text-xs hover:bg-stone-800 transition-colors">Enter Studio</button>
        </form>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
       <div className="min-h-[70vh] flex items-center justify-center">
         <div className="text-center">
           <h2 className="text-2xl font-serif mb-4">API Key Required</h2>
           <button onClick={handleSelectKey} className="px-6 py-3 bg-stone-900 text-white rounded-sm font-bold uppercase text-xs">Select API Key</button>
         </div>
       </div>
    )
  }

  // Get step labels based on comic type
  const getStepLabel = () => {
    if (comicType === 'four-panel') {
      if (currentStep === 0) return 'Step 1: Character & Title';
      if (currentStep === 1) return 'Step 2: Generate Comic';
      if (currentStep === 2) return 'Step 3: Publish';
    } else {
      if (currentStep === 0) return 'Step 1: Character Reference';
      if (currentStep === 1) return 'Step 2: Panel Builder';
      if (currentStep === 2) return 'Step 3: Style Settings';
      if (currentStep === 3) return 'Step 4: Generate';
      if (currentStep === 4) return 'Step 5: Schedule';
    }
    return '';
  };

  const totalSteps = comicType === 'four-panel' ? 3 : 5;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">Creator Studio</h1>
          <p className="text-stone-500 text-sm">{getStepLabel()}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowApiSettings(!showApiSettings)} className="text-stone-400 hover:text-stone-900"><Settings className="w-5 h-5"/></button>
          <button onClick={handleLogout} className="text-stone-400 hover:text-red-600"><LogOut className="w-5 h-5"/></button>
        </div>
      </div>

      {showApiSettings && (
         <div className="mb-8 p-4 bg-stone-100 rounded-sm flex justify-between items-center">
             <span className="text-xs font-bold text-stone-600 uppercase">Billing Enabled Key Required for High-Res Gen</span>
             <button onClick={handleSelectKey} className="text-xs bg-white border border-stone-300 px-3 py-1">Switch Key</button>
         </div>
      )}

      {status === GenerationStatus.COMPLETE ? (
         <div className="text-center py-20">
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-700 mb-6"><CheckCircle2 className="w-10 h-10"/></div>
             <h2 className="text-3xl font-serif text-stone-900 mb-4">Comic Scheduled</h2>
             <button onClick={resetForm} className="bg-stone-900 text-white px-8 py-3 rounded-sm font-bold tracking-widest uppercase text-xs">Create Another</button>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

           {/* LEFT COLUMN: CONTROLS */}
           <div className="lg:col-span-5 space-y-8">

              {/* Template Selector */}
              {currentStep === 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Comic Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTemplateChange('four-panel')}
                      className={`flex-1 py-3 px-4 text-sm font-medium rounded-sm border transition-all ${
                        comicType === 'four-panel'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      4-Panel Comic
                    </button>
                    <button
                      onClick={() => handleTemplateChange('daily-comic')}
                      className={`flex-1 py-3 px-4 text-sm font-medium rounded-sm border transition-all ${
                        comicType === 'daily-comic'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      Daily Comic
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="flex space-x-1 mb-8">
                  {Array.from({ length: totalSteps }).map((_, step) => (
                      <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${step <= currentStep ? 'bg-stone-900' : 'bg-stone-200'}`} />
                  ))}
              </div>

              {/* FOUR-PANEL WORKFLOW */}
              {comicType === 'four-panel' && (
                <>
                  {/* STEP 0: SETUP */}
                  {currentStep === 0 && (
                    <div className="space-y-5 animate-in slide-in-from-left-4">
                       <h3 className="text-lg font-serif font-bold">Character & Title</h3>

                       <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Character Concept</label>
                            <input type="text" value={characterDesc} onChange={e => setCharacterDesc(e.target.value)} placeholder="e.g. A young detective with blue hair..." className="w-full p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm" />
                          </div>

                          <div className="flex gap-2">
                            <div className="flex-grow">
                                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm" />
                            </div>
                            <div className="w-24">
                                 <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Episode</label>
                                 <input type="text" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} placeholder="#01" className="w-full p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm" />
                            </div>
                          </div>

                          <button
                            onClick={handleGenerateTitle}
                            disabled={status === GenerationStatus.GENERATING_TITLE || !title || !episodeNumber}
                            className="w-full bg-white border border-stone-900 text-stone-900 py-3 font-bold uppercase text-xs hover:bg-stone-50 flex items-center justify-center disabled:opacity-50"
                          >
                             {status === GenerationStatus.GENERATING_TITLE ? <LoaderWrapper /> : <><ImageIcon className="w-4 h-4 mr-2"/> Generate Title Card</>}
                          </button>

                          {generationError && currentStep === 0 && (
                              <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                                  <p className="text-red-600 text-xs">{generationError}</p>
                              </div>
                          )}

                          {generatedTitleImage && (
                              <div className="mt-6 border-t border-stone-100 pt-4">
                                  <button onClick={() => setCurrentStep(1)} className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center">
                                      Next: Create Comic <ArrowRight className="w-4 h-4 ml-2"/>
                                  </button>
                              </div>
                          )}
                       </div>
                    </div>
                  )}

                  {/* STEP 1: COMIC GENERATION */}
                  {currentStep === 1 && (
                     <div className="space-y-5 animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-serif font-bold">Comic Generation</h3>
                            <button onClick={() => setCurrentStep(0)} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft className="w-4 h-4"/></button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Episode Story / Concept</label>
                            <textarea
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                placeholder="Describe the 4 panels of the comic..."
                                className="w-full h-40 p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm resize-none"
                            />
                        </div>

                        <button
                            onClick={() => handleGenerateComic()}
                            disabled={status === GenerationStatus.GENERATING_COMIC || !concept}
                            className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center disabled:opacity-50"
                        >
                             {status === GenerationStatus.GENERATING_COMIC ? <LoaderWrapper /> : <><Wand2 className="w-4 h-4 mr-2"/> Generate 4-Panel Comic</>}
                        </button>

                        {/* Feedback Section */}
                        {generatedComicImage && (
                            <div className="border-t border-stone-200 pt-4 space-y-4">
                                {/* Quick Fixes */}
                                <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider">Quick Fixes (One-time only)</label>
                                        <span className="text-[10px] text-amber-600 font-medium">Won't change base prompt</span>
                                    </div>
                                    <textarea
                                        value={oneTimeInstructions}
                                        onChange={(e) => setOneTimeInstructions(e.target.value)}
                                        placeholder="e.g., 'Fix spelling in panel 2' or 'Make text bigger in panel 3'"
                                        className="w-full h-16 p-3 bg-white border border-amber-300 focus:border-amber-500 outline-none text-xs resize-none"
                                    />
                                    <button
                                        onClick={handleRegenerateWithTweaks}
                                        disabled={status === GenerationStatus.GENERATING_COMIC || !oneTimeInstructions.trim()}
                                        className="w-full bg-amber-600 text-white py-2 font-medium text-xs hover:bg-amber-700 flex items-center justify-center disabled:opacity-50"
                                    >
                                        {status === GenerationStatus.GENERATING_COMIC ? <LoaderWrapper /> : <><Edit2 className="w-3 h-3 mr-2"/> Apply Quick Fix to Image</>}
                                    </button>
                                </div>

                                {/* Permanent Update */}
                                <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 space-y-3">
                                    <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">Update Base Prompt (Permanent)</label>
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="e.g., 'Make the character more expressive' or 'Simplify the story'"
                                        className="w-full h-20 p-3 bg-white border border-blue-300 focus:border-blue-500 outline-none text-xs resize-none"
                                    />
                                    <button
                                        onClick={handleRefinePrompt}
                                        disabled={isRefining || !feedback.trim()}
                                        className="w-full bg-blue-600 text-white py-2 font-medium text-xs hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isRefining ? <LoaderWrapper /> : <><Sparkles className="w-3 h-3 mr-2"/> Update Prompt with AI</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {generationError && currentStep === 1 && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                                <p className="text-red-600 text-xs">{generationError}</p>
                            </div>
                        )}

                        {generatedComicImage && (
                            <div className="mt-6 border-t border-stone-100 pt-4">
                                 <button onClick={() => setCurrentStep(2)} className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center">
                                      Review & Schedule <ArrowRight className="w-4 h-4 ml-2"/>
                                 </button>
                            </div>
                        )}
                     </div>
                  )}

                  {/* STEP 2: PUBLISH */}
                  {currentStep === 2 && (
                      <div className="space-y-5 animate-in slide-in-from-right-4">
                          <h3 className="text-lg font-serif font-bold">Final Review</h3>
                          <button onClick={() => setCurrentStep(1)} className="text-stone-500 hover:text-stone-900 text-xs font-bold uppercase flex items-center"><ChevronLeft className="w-3 h-3 mr-1"/> Back to Comic</button>

                          <div className="bg-stone-50 p-5 border border-stone-200">
                              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Schedule Date</label>
                              <input
                                  type="date"
                                  value={scheduledDate}
                                  max={maxDate}
                                  onChange={(e) => {
                                      setScheduledDate(e.target.value);
                                      setDateError('');
                                  }}
                                  className="w-full p-3 bg-white border border-stone-200 focus:border-stone-900 outline-none mb-2"
                              />
                              {dateError && <p className="text-red-500 text-xs mb-3">{dateError}</p>}
                              {saveError && <p className="text-red-500 text-xs mb-3">{saveError}</p>}
                              <button
                                  onClick={handleSchedule}
                                  disabled={!scheduledDate || status === GenerationStatus.UPLOADING}
                                  className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center disabled:opacity-50"
                              >
                                   {status === GenerationStatus.UPLOADING ? <LoaderWrapper /> : <><CalendarCheck className="w-4 h-4 mr-2"/> Publish Comic</>}
                              </button>
                          </div>
                      </div>
                  )}
                </>
              )}

              {/* DAILY COMIC WORKFLOW */}
              {comicType === 'daily-comic' && (
                <>
                  {/* STEP 0: CHARACTER REFERENCE */}
                  {currentStep === 0 && (
                    <div className="space-y-5 animate-in slide-in-from-left-4">
                      <h3 className="text-lg font-serif font-bold">Character Reference</h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Character A Name</label>
                            <input
                              type="text"
                              value={characterAName}
                              onChange={e => setCharacterAName(e.target.value)}
                              placeholder="e.g., Wooly"
                              className="w-full p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Character B Name</label>
                            <input
                              type="text"
                              value={characterBName}
                              onChange={e => setCharacterBName(e.target.value)}
                              placeholder="e.g., Mr. Wolf"
                              className="w-full p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="flex-grow">
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm" />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Episode</label>
                            <input type="text" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} placeholder="#01" className="w-full p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-sm" />
                          </div>
                        </div>

                        {/* Character A Reference Image */}
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{characterAName} Reference Image</label>
                          <div
                            onDrop={handleDropA}
                            onDragOver={handleDragOverA}
                            onDragLeave={handleDragLeaveA}
                            onClick={() => fileInputRefA.current?.click()}
                            className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all ${
                              isDraggingA
                                ? 'border-stone-900 bg-stone-100'
                                : characterARefImage
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-stone-300 hover:border-stone-400 bg-stone-50'
                            }`}
                          >
                            <input
                              ref={fileInputRefA}
                              type="file"
                              accept="image/*"
                              onChange={handleFileInputChangeA}
                              className="hidden"
                            />
                            {characterARefImage ? (
                              <div className="space-y-2">
                                <div className="w-24 h-24 mx-auto overflow-hidden rounded border border-stone-200">
                                  <img src={characterARefImage} alt={`${characterAName} reference`} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-xs text-green-700 font-medium">Click to change</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-6 h-6 mx-auto text-stone-400" />
                                <p className="text-xs text-stone-500">
                                  <span className="font-medium text-stone-700">Upload</span> or drag
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Character B Reference Image */}
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{characterBName} Reference Image</label>
                          <div
                            onDrop={handleDropB}
                            onDragOver={handleDragOverB}
                            onDragLeave={handleDragLeaveB}
                            onClick={() => fileInputRefB.current?.click()}
                            className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all ${
                              isDraggingB
                                ? 'border-stone-900 bg-stone-100'
                                : characterBRefImage
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-stone-300 hover:border-stone-400 bg-stone-50'
                            }`}
                          >
                            <input
                              ref={fileInputRefB}
                              type="file"
                              accept="image/*"
                              onChange={handleFileInputChangeB}
                              className="hidden"
                            />
                            {characterBRefImage ? (
                              <div className="space-y-2">
                                <div className="w-24 h-24 mx-auto overflow-hidden rounded border border-stone-200">
                                  <img src={characterBRefImage} alt={`${characterBName} reference`} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-xs text-green-700 font-medium">Click to change</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-6 h-6 mx-auto text-stone-400" />
                                <p className="text-xs text-stone-500">
                                  <span className="font-medium text-stone-700">Upload</span> or drag
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {generationError && currentStep === 0 && (
                          <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                            <p className="text-red-600 text-xs">{generationError}</p>
                          </div>
                        )}

                        {characterARefImage && characterBRefImage && characterAName && characterBName && (
                          <div className="mt-6 border-t border-stone-100 pt-4">
                            <button onClick={() => setCurrentStep(1)} className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center">
                              Next: Panel Builder <ArrowRight className="w-4 h-4 ml-2"/>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 1: PANEL BUILDER */}
                  {currentStep === 1 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif font-bold">Panel Builder</h3>
                        <button onClick={() => setCurrentStep(0)} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft className="w-4 h-4"/></button>
                      </div>

                      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        {panels.map((panel, panelIndex) => (
                          <div key={panelIndex} className="bg-white border border-stone-200 rounded-sm p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-bold text-stone-700">Panel {panel.panelNumber}</h4>
                              {panels.length > 1 && (
                                <button
                                  onClick={() => removePanel(panelIndex)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Framing</label>
                              <input
                                type="text"
                                value={panel.framing}
                                onChange={(e) => updatePanel(panelIndex, 'framing', e.target.value)}
                                placeholder="e.g., Wide shot of characters lying on grass"
                                className="w-full p-2 bg-stone-50 border border-stone-200 focus:border-stone-900 outline-none text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Situation</label>
                              <input
                                type="text"
                                value={panel.situation}
                                onChange={(e) => updatePanel(panelIndex, 'situation', e.target.value)}
                                placeholder="e.g., Character A looking at Character B"
                                className="w-full p-2 bg-stone-50 border border-stone-200 focus:border-stone-900 outline-none text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">{characterAName || 'Char A'}</label>
                                <input
                                  type="text"
                                  value={panel.characterAExplanation}
                                  onChange={(e) => updatePanel(panelIndex, 'characterAExplanation', e.target.value)}
                                  placeholder="Expression/pose..."
                                  className="w-full p-2 bg-stone-50 border border-stone-200 focus:border-stone-900 outline-none text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">{characterBName || 'Char B'}</label>
                                <input
                                  type="text"
                                  value={panel.characterBExplanation}
                                  onChange={(e) => updatePanel(panelIndex, 'characterBExplanation', e.target.value)}
                                  placeholder="Expression/pose..."
                                  className="w-full p-2 bg-stone-50 border border-stone-200 focus:border-stone-900 outline-none text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Background</label>
                              <input
                                type="text"
                                value={panel.background}
                                onChange={(e) => updatePanel(panelIndex, 'background', e.target.value)}
                                placeholder="e.g., Grassy river bank with blue sky"
                                className="w-full p-2 bg-stone-50 border border-stone-200 focus:border-stone-900 outline-none text-xs"
                              />
                            </div>

                            {/* Dialogues */}
                            <div className="border-t border-stone-100 pt-3">
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-[10px] font-bold text-stone-400 uppercase">Dialogues</label>
                                <button
                                  onClick={() => addDialogue(panelIndex)}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {panel.dialogues.map((dialogue, dialogueIndex) => (
                                  <div key={dialogueIndex} className="flex gap-2 items-start">
                                    <select
                                      value={dialogue.character}
                                      onChange={(e) => updateDialogue(panelIndex, dialogueIndex, 'character', e.target.value)}
                                      className="w-28 p-2 bg-stone-50 border border-stone-200 text-xs"
                                    >
                                      <option value={characterAName || 'Character A'}>{characterAName || 'Character A'}</option>
                                      <option value={characterBName || 'Character B'}>{characterBName || 'Character B'}</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={dialogue.text}
                                      onChange={(e) => updateDialogue(panelIndex, dialogueIndex, 'text', e.target.value)}
                                      placeholder="Dialogue text..."
                                      className="flex-1 p-2 bg-stone-50 border border-stone-200 focus:border-stone-900 outline-none text-xs"
                                    />
                                    <button
                                      onClick={() => removeDialogue(panelIndex, dialogueIndex)}
                                      className="text-red-400 hover:text-red-600 p-1"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                                {panel.dialogues.length === 0 && (
                                  <p className="text-xs text-stone-400 italic">No dialogues added</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={addPanel}
                        className="w-full border-2 border-dashed border-stone-300 hover:border-stone-400 py-3 text-stone-500 hover:text-stone-700 text-sm font-medium flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Panel
                      </button>

                      <div className="mt-6 border-t border-stone-100 pt-4">
                        <button onClick={() => setCurrentStep(2)} className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center">
                          Next: Style Settings <ArrowRight className="w-4 h-4 ml-2"/>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: STYLE SETTINGS */}
                  {currentStep === 2 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif font-bold">Style Settings</h3>
                        <button onClick={() => setCurrentStep(1)} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft className="w-4 h-4"/></button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Technical Constraints</label>
                          <textarea
                            value={technicalConstraints}
                            onChange={(e) => setTechnicalConstraints(e.target.value)}
                            className="w-full h-32 p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-xs resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Art Style Details</label>
                          <textarea
                            value={artStyleDetails}
                            onChange={(e) => setArtStyleDetails(e.target.value)}
                            className="w-full h-64 p-4 bg-white border border-stone-200 focus:border-stone-900 outline-none text-xs resize-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setTechnicalConstraints(DEFAULT_TECHNICAL_CONSTRAINTS)}
                            className="text-xs text-stone-500 hover:text-stone-700 underline"
                          >
                            Reset Technical
                          </button>
                          <button
                            onClick={() => setArtStyleDetails(DEFAULT_ART_STYLE)}
                            className="text-xs text-stone-500 hover:text-stone-700 underline"
                          >
                            Reset Art Style
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-stone-100 pt-4">
                        <button onClick={() => setCurrentStep(3)} className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center">
                          Next: Generate <ArrowRight className="w-4 h-4 ml-2"/>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: GENERATE */}
                  {currentStep === 3 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif font-bold">Generate Comic</h3>
                        <button onClick={() => setCurrentStep(2)} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft className="w-4 h-4"/></button>
                      </div>

                      <div className="bg-stone-50 p-4 rounded-sm border border-stone-200">
                        <h4 className="text-xs font-bold text-stone-600 uppercase mb-3">Summary</h4>
                        <ul className="text-xs text-stone-600 space-y-1">
                          <li><strong>Characters:</strong> {characterAName} & {characterBName}</li>
                          <li><strong>Panels:</strong> {panels.length}</li>
                          <li><strong>Title:</strong> {title || 'Not set'}</li>
                          <li><strong>Episode:</strong> {episodeNumber || 'Not set'}</li>
                        </ul>
                      </div>

                      <button
                        onClick={handleGenerateDailyComic}
                        disabled={status === GenerationStatus.GENERATING_COMIC}
                        className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center disabled:opacity-50"
                      >
                        {status === GenerationStatus.GENERATING_COMIC ? <LoaderWrapper /> : <><Wand2 className="w-4 h-4 mr-2"/> Generate Comic</>}
                      </button>

                      {generatedComicImage && (
                        <button
                          onClick={handleGenerateDailyComic}
                          disabled={status === GenerationStatus.GENERATING_COMIC}
                          className="w-full bg-white border border-stone-900 text-stone-900 py-3 font-bold uppercase text-xs hover:bg-stone-50 flex items-center justify-center disabled:opacity-50"
                        >
                          {status === GenerationStatus.GENERATING_COMIC ? <LoaderWrapper /> : <><Wand2 className="w-4 h-4 mr-2"/> Generate Again</>}
                        </button>
                      )}

                      {generationError && currentStep === 3 && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
                          <p className="text-red-600 text-xs">{generationError}</p>
                        </div>
                      )}

                      {generatedComicImage && (
                        <div className="mt-6 border-t border-stone-100 pt-4">
                          <button onClick={() => setCurrentStep(4)} className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center">
                            Next: Schedule <ArrowRight className="w-4 h-4 ml-2"/>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4: SCHEDULE */}
                  {currentStep === 4 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif font-bold">Schedule</h3>
                        <button onClick={() => setCurrentStep(3)} className="p-2 hover:bg-stone-100 rounded-full"><ChevronLeft className="w-4 h-4"/></button>
                      </div>

                      <div className="bg-stone-50 p-5 border border-stone-200">
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Schedule Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          max={maxDate}
                          onChange={(e) => {
                            setScheduledDate(e.target.value);
                            setDateError('');
                          }}
                          className="w-full p-3 bg-white border border-stone-200 focus:border-stone-900 outline-none mb-2"
                        />
                        {dateError && <p className="text-red-500 text-xs mb-3">{dateError}</p>}
                        {saveError && <p className="text-red-500 text-xs mb-3">{saveError}</p>}
                        <button
                          onClick={handleSchedule}
                          disabled={!scheduledDate || status === GenerationStatus.UPLOADING}
                          className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center disabled:opacity-50"
                        >
                          {status === GenerationStatus.UPLOADING ? <LoaderWrapper /> : <><CalendarCheck className="w-4 h-4 mr-2"/> Publish Comic</>}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

           </div>

           {/* RIGHT COLUMN: PREVIEW */}
           <div className="lg:col-span-7">
               <div className="sticky top-8 bg-stone-100 border border-stone-200 p-8 min-h-[600px] flex flex-col items-center justify-center">

                   <div className="w-full max-w-[500px] space-y-6">

                       {/* Title Card (Four-panel only) */}
                       {comicType === 'four-panel' && generatedTitleImage && (
                           <div className="shadow-lg bg-white p-2 animate-in fade-in zoom-in-95 duration-500">
                               <div className="aspect-square w-full bg-white overflow-hidden">
                                   <img src={generatedTitleImage} className="w-full h-full object-cover" alt="Title" />
                               </div>
                           </div>
                       )}

                       {/* Comic Strip */}
                       {generatedComicImage && (
                           <div className="shadow-lg bg-white p-2 animate-in fade-in zoom-in-95 duration-700 delay-100">
                               <div className="aspect-square w-full bg-white overflow-hidden">
                                   <img src={generatedComicImage} className="w-full h-full object-cover" alt="Comic" />
                               </div>
                           </div>
                       )}

                       {/* Character Reference Preview (Daily Comic) */}
                       {comicType === 'daily-comic' && !generatedComicImage && (characterARefImage || characterBRefImage) && (
                           <div className="grid grid-cols-2 gap-4">
                               {characterARefImage && (
                                   <div className="shadow-lg bg-white p-2">
                                       <div className="aspect-square w-full bg-stone-50 overflow-hidden">
                                           <img src={characterARefImage} className="w-full h-full object-cover" alt={`${characterAName} Reference`} />
                                       </div>
                                       <p className="text-xs text-center text-stone-500 mt-2">{characterAName}</p>
                                   </div>
                               )}
                               {characterBRefImage && (
                                   <div className="shadow-lg bg-white p-2">
                                       <div className="aspect-square w-full bg-stone-50 overflow-hidden">
                                           <img src={characterBRefImage} className="w-full h-full object-cover" alt={`${characterBName} Reference`} />
                                       </div>
                                       <p className="text-xs text-center text-stone-500 mt-2">{characterBName}</p>
                                   </div>
                               )}
                           </div>
                       )}

                       {!generatedTitleImage && !generatedComicImage && !characterARefImage && !characterBRefImage && (
                           <div className="text-stone-400 text-center py-20">
                               <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20"/>
                               <p className="text-sm font-serif italic">Preview Canvas</p>
                           </div>
                       )}

                   </div>

               </div>
           </div>

        </div>
      )}

      {/* Post Management Section */}
      <div className="mt-20 pt-10 border-t border-stone-200">
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">Published Comics</h3>
                  <p className="text-xs text-stone-500 mt-1">Manage your scheduled and published entries</p>
              </div>
              <div className="text-xs text-stone-400 font-mono">
                  {existingMuses.length} {existingMuses.length === 1 ? 'entry' : 'entries'}
              </div>
          </div>

          {existingMuses.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 border border-stone-200 rounded-sm">
                  <p className="text-stone-400 text-sm font-serif italic">No comics published yet</p>
                  <p className="text-stone-500 text-xs mt-2">Create your first comic above to get started</p>
              </div>
          ) : (
              <div className="max-h-[1200px] overflow-y-auto border border-stone-200 rounded-sm bg-stone-50 p-4">
                <div className="space-y-2">
                  {existingMuses.map(m => (
              <div key={m.scheduledDate} className="py-3 border-b border-stone-100">
                  {editingDate === m.scheduledDate ? (
                      // Edit Mode
                      <div className="bg-blue-50 border-2 border-blue-300 rounded-sm p-4 space-y-3">
                          <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Editing Date</p>
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-stone-100 overflow-hidden flex-shrink-0 rounded border border-stone-200">
                                  <img src={m.titleImage || m.comicImage || (m as any).imageUrl} className="w-full h-full object-cover"/>
                              </div>
                              <div className="flex-grow">
                                  <label className="block text-xs font-bold text-stone-600 mb-1">New Date:</label>
                                  <input
                                      type="date"
                                      value={newDate}
                                      max={maxDate}
                                      onChange={(e) => {
                                          setNewDate(e.target.value);
                                          setEditError('');
                                      }}
                                      className="w-full p-3 text-sm bg-white border-2 border-blue-300 focus:border-blue-500 outline-none rounded"
                                  />
                                  <p className="text-xs text-stone-500 mt-1">Original: {m.scheduledDate} - {m.title || 'Untitled'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button
                                      onClick={() => handleSaveDate(m.scheduledDate)}
                                      className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded font-medium text-sm"
                                      title="Save new date"
                                  >
                                      <Save className="w-4 h-4 inline mr-1"/>
                                      Save
                                  </button>
                                  <button
                                      onClick={handleCancelEdit}
                                      className="px-4 py-2 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 rounded font-medium text-sm"
                                      title="Cancel editing"
                                  >
                                      <X className="w-4 h-4 inline mr-1"/>
                                      Cancel
                                  </button>
                              </div>
                          </div>
                          {editError && (
                              <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 p-2 rounded">{editError}</p>
                          )}
                      </div>
                  ) : (
                      // View Mode
                      <div className="flex items-center justify-between hover:bg-stone-50 px-3 py-2 rounded-sm transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-stone-100 overflow-hidden rounded border border-stone-200">
                                  <img src={m.titleImage || m.comicImage || (m as any).imageUrl} className="w-full h-full object-cover"/>
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-stone-900">{m.scheduledDate}</p>
                                  <p className="text-xs text-stone-500">{m.title || 'Untitled'} {m.comicType === 'daily-comic' && <span className="text-blue-500">(Daily)</span>}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <button
                                  onClick={() => handleStartEdit(m.scheduledDate)}
                                  className="px-3 py-2 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 rounded text-xs font-medium transition-all"
                                  title="Change date"
                              >
                                  <Edit2 className="w-3.5 h-3.5 inline mr-1"/>
                                  Edit Date
                              </button>
                              <button
                                  onClick={() => handleDelete(m.scheduledDate)}
                                  className="px-3 py-2 text-white bg-red-500 hover:bg-red-600 border border-red-500 hover:border-red-600 rounded text-xs font-medium transition-all"
                                  title="Delete entry"
                              >
                                  <X className="w-3.5 h-3.5 inline mr-1"/>
                                  Delete
                              </button>
                          </div>
                      </div>
                  )}
              </div>
                  ))}
                </div>
              </div>
          )}
      </div>

    </div>
  );
};

const LoaderWrapper = () => (
    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default Admin;

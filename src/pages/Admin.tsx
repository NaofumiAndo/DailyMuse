import React, { useState, useEffect } from 'react';
import { generateTitleImage, generateComic } from '../services/gemini';
import { saveMuseEntry, checkDateConflict, getAllEntries, deleteMuseEntry, updateEntryDate } from '../services/githubStorage';
import { GenerationStatus, MuseEntry } from '../types';
import { Wand2, CalendarCheck, CheckCircle2, Settings, X, ArrowRight, Image as ImageIcon, ChevronLeft, Loader2, LogOut, Edit2, Save } from 'lucide-react';

// Simple password authentication
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

const Admin: React.FC = () => {
  // Auth & API
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Workflow State
  // 0: Setup (Char & Title), 1: Create Comic, 2: Schedule
  const [currentStep, setCurrentStep] = useState(0); 

  // Data State
  const [characterDesc, setCharacterDesc] = useState('');
  const [title, setTitle] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [concept, setConcept] = useState('');
  
  // Images
  const [generatedTitleImage, setGeneratedTitleImage] = useState<string | null>(null);
  const [generatedComicImage, setGeneratedComicImage] = useState<string | null>(null);
  
  // Operational State
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [scheduledDate, setScheduledDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [generationError, setGenerationError] = useState('');

  // Management List
  const [existingMuses, setExistingMuses] = useState<MuseEntry[]>([]);

  // Date Editing
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [editError, setEditError] = useState('');

  // Check Auth Status on Mount
  useEffect(() => {
    // Check if user is already logged in (from localStorage)
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

  // --- STEP 0: TITLE ---

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

  // --- STEP 1: COMIC ---

  const handleGenerateComic = async () => {
    if (!concept) return;
    setGenerationError('');
    setStatus(GenerationStatus.GENERATING_COMIC);
    try {
      const imageBytes = await generateComic(concept, characterDesc);
      setGeneratedComicImage(`data:image/jpeg;base64,${imageBytes}`);
      setStatus(GenerationStatus.IDLE);
    } catch (error: any) {
      console.error("Failed to generate comic", error);
      const errorMessage = error?.message || error?.toString() || "Failed to generate comic. Please check your API key and try again.";
      setGenerationError(errorMessage);
      setStatus(GenerationStatus.ERROR);
    }
  };

  // --- STEP 2: SCHEDULE ---

  const handleSchedule = async () => {
    if (!generatedTitleImage || !generatedComicImage || !scheduledDate) return;

    const conflict = await checkDateConflict(scheduledDate);
    if (conflict) {
      setDateError('❌ A comic is already scheduled for this date. Please choose a different date.');
      return;
    }

    setStatus(GenerationStatus.UPLOADING);

    try {
      await saveMuseEntry({
        scheduledDate,
        createdAt: Date.now(),
        title,
        episodeNumber,
        titleImage: generatedTitleImage,
        characterDescription: characterDesc,
        concept,
        comicImage: generatedComicImage
      });

      setStatus(GenerationStatus.COMPLETE);
      loadMuses();
    } catch (e) {
      console.error(e);
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
        alert(`✅ Successfully deleted comic for ${date}`);
      } catch (error) {
        alert(`❌ Failed to delete comic: ${error}`);
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
        setEditError('❌ A comic is already scheduled for this date. Please choose a different date.');
        return;
      }

      await updateEntryDate(oldDate, newDate);
      await loadMuses();
      handleCancelEdit();
      alert(`✅ Successfully changed date from ${oldDate} to ${newDate}`);
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
    setGeneratedTitleImage(null);
    setGeneratedComicImage(null);
    setStatus(GenerationStatus.IDLE);
    setScheduledDate('');
    setGenerationError('');
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-stone-900">Creator Studio</h1>
          <p className="text-stone-500 text-sm">
            {currentStep === 0 && 'Step 1: Character & Title'}
            {currentStep === 1 && 'Step 2: Generate Comic'}
            {currentStep === 2 && 'Step 3: Publish'}
          </p>
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
             <h2 className="text-3xl font-serif text-stone-900 mb-4">Muse Scheduled</h2>
             <button onClick={resetForm} className="bg-stone-900 text-white px-8 py-3 rounded-sm font-bold tracking-widest uppercase text-xs">Create Another</button>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* LEFT COLUMN: CONTROLS */}
           <div className="lg:col-span-5 space-y-8">
              
              {/* Progress Indicator */}
              <div className="flex space-x-1 mb-8">
                  {[0, 1, 2].map(step => (
                      <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${step <= currentStep ? 'bg-stone-900' : 'bg-stone-200'}`} />
                  ))}
              </div>

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
                        className="w-full bg-white border border-stone-900 text-stone-900 py-3 font-bold uppercase text-xs hover:bg-stone-50 flex items-center justify-center"
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
                        onClick={handleGenerateComic}
                        disabled={status === GenerationStatus.GENERATING_COMIC || !concept}
                        className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center"
                    >
                         {status === GenerationStatus.GENERATING_COMIC ? <LoaderWrapper /> : <><Wand2 className="w-4 h-4 mr-2"/> Generate 4-Panel Comic</>}
                    </button>

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
                              onChange={(e) => {
                                  setScheduledDate(e.target.value);
                                  setDateError('');
                              }}
                              className="w-full p-3 bg-white border border-stone-200 focus:border-stone-900 outline-none mb-2"
                          />
                          {dateError && <p className="text-red-500 text-xs mb-3">{dateError}</p>}
                          <button 
                              onClick={handleSchedule}
                              disabled={!scheduledDate || status === GenerationStatus.UPLOADING}
                              className="w-full bg-stone-900 text-white py-3 font-bold uppercase text-xs hover:bg-stone-800 flex items-center justify-center"
                          >
                               {status === GenerationStatus.UPLOADING ? <LoaderWrapper /> : <><CalendarCheck className="w-4 h-4 mr-2"/> Publish Comic</>}
                          </button>
                      </div>
                  </div>
              )}

           </div>

           {/* RIGHT COLUMN: PREVIEW */}
           <div className="lg:col-span-7">
               <div className="sticky top-8 bg-stone-100 border border-stone-200 p-8 min-h-[600px] flex flex-col items-center justify-center">
                   
                   <div className="w-full max-w-[500px] space-y-6">
                       
                       {/* Title Card */}
                       {generatedTitleImage && (
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

                       {!generatedTitleImage && !generatedComicImage && (
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
              <div className="space-y-2">
                  {existingMuses.map(m => (
              <div key={m.scheduledDate} className="py-3 border-b border-stone-100">
                  {editingDate === m.scheduledDate ? (
                      // Edit Mode
                      <div className="space-y-2">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-stone-100 overflow-hidden flex-shrink-0">
                                  <img src={m.titleImage || m.comicImage || (m as any).imageUrl} className="w-full h-full object-cover"/>
                              </div>
                              <div className="flex-grow">
                                  <input
                                      type="date"
                                      value={newDate}
                                      onChange={(e) => {
                                          setNewDate(e.target.value);
                                          setEditError('');
                                      }}
                                      className="w-full p-2 text-sm bg-white border border-stone-900 focus:border-stone-900 outline-none"
                                  />
                                  <p className="text-xs text-stone-500 mt-1">{m.title || 'Untitled'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button
                                      onClick={() => handleSaveDate(m.scheduledDate)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                                      title="Save"
                                  >
                                      <Save className="w-4 h-4"/>
                                  </button>
                                  <button
                                      onClick={handleCancelEdit}
                                      className="p-2 text-stone-400 hover:bg-stone-50 rounded"
                                      title="Cancel"
                                  >
                                      <X className="w-4 h-4"/>
                                  </button>
                              </div>
                          </div>
                          {editError && (
                              <p className="text-red-500 text-xs pl-16">{editError}</p>
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
                                  <p className="text-xs text-stone-500">{m.title || 'Untitled'}</p>
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
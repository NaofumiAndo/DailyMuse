import React, { useState, useEffect } from 'react';
import { generateTitleImage, generateComic } from '../services/gemini';
import { uploadMuseEntry, checkDateConflict, getAllEntries, deleteEntry, loginUser, logoutUser, subscribeToAuth } from '../services/firebase';
import { GenerationStatus, MuseEntry } from '../types';
import { Wand2, CalendarCheck, CheckCircle2, Settings, X, ArrowRight, Image as ImageIcon, ChevronLeft, Loader2, LogOut } from 'lucide-react';

const Admin: React.FC = () => {
  // Auth & API
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
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
  const [uploadError, setUploadError] = useState('');
  
  // Management List
  const [existingMuses, setExistingMuses] = useState<MuseEntry[]>([]);

  // Check Auth Status on Mount
  useEffect(() => {
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToAuth((user) => {
        setIsAuthenticated(!!user);
        setAuthLoading(false);
      });
    } catch (err) {
      console.error("Auth subscription failed", err);
      setAuthLoading(false);
    }
    return () => unsubscribe();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await loginUser(email, password);
      // Auth state listener will update isAuthenticated
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setLoginError("Incorrect email or password.");
      } else if (error.code === 'auth/too-many-requests') {
        setLoginError("Too many attempts. Please try again later.");
      } else {
        setLoginError(error.message || "Failed to sign in.");
      }
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  // --- STEP 0: TITLE ---

  const handleGenerateTitle = async () => {
    if (!title || !episodeNumber) return;
    setStatus(GenerationStatus.GENERATING_TITLE);
    try {
      const imageBytes = await generateTitleImage(title, episodeNumber, characterDesc);
      setGeneratedTitleImage(`data:image/jpeg;base64,${imageBytes}`);
      setStatus(GenerationStatus.IDLE);
    } catch (error) {
      console.error("Failed to generate title", error);
      setStatus(GenerationStatus.ERROR);
    }
  };

  // --- STEP 1: COMIC ---

  const handleGenerateComic = async () => {
    if (!concept) return;
    setStatus(GenerationStatus.GENERATING_COMIC);
    try {
      const imageBytes = await generateComic(concept, characterDesc);
      setGeneratedComicImage(`data:image/jpeg;base64,${imageBytes}`);
      setStatus(GenerationStatus.IDLE);
    } catch (error) {
      console.error("Failed to generate comic", error);
      setStatus(GenerationStatus.ERROR);
    }
  };

  // --- STEP 2: SCHEDULE ---

  const handleSchedule = async () => {
    if (!generatedTitleImage || !generatedComicImage || !scheduledDate) return;

    const conflict = await checkDateConflict(scheduledDate);
    if (conflict) {
      setDateError('A muse is already scheduled for this date.');
      return;
    }

    setStatus(GenerationStatus.UPLOADING);
    setUploadError('');

    try {
      await uploadMuseEntry({
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
      setUploadError('');
      loadMuses();
    } catch (e: any) {
      console.error('Upload failed:', e);
      setStatus(GenerationStatus.ERROR);

      // Set user-friendly error message
      if (e.message && e.message.includes('Storage rules')) {
        setUploadError('Firebase Storage access denied. Please update your storage rules to allow public read. Check the browser console for details.');
      } else if (e.message) {
        setUploadError(e.message);
      } else {
        setUploadError('Upload failed. Please check the browser console for details.');
      }
    }
  };

  const handleDelete = async (date: string) => {
    if (confirm("Delete this entry?")) {
      await deleteEntry(date);
      loadMuses();
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
    setDateError('');
    setUploadError('');
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
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Admin Email" 
                className="w-full p-4 bg-stone-50 border-b-2 border-stone-200 focus:border-stone-900 outline-none text-sm" 
              />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                className="w-full p-4 bg-stone-50 border-b-2 border-stone-200 focus:border-stone-900 outline-none text-sm" 
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

      {status === GenerationStatus.ERROR && uploadError ? (
         <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-sm">
           <h3 className="text-red-800 font-bold mb-2">Upload Failed</h3>
           <p className="text-red-700 text-sm mb-4">{uploadError}</p>
           <button
             onClick={() => {setStatus(GenerationStatus.IDLE); setUploadError('');}}
             className="bg-red-600 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-red-700"
           >
             Dismiss
           </button>
         </div>
      ) : null}

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

      {/* Legacy Management Table */}
      <div className="mt-20 pt-10 border-t border-stone-200">
          <h3 className="text-lg font-serif mb-6">Existing Schedules</h3>
          {existingMuses.map(m => (
              <div key={m.scheduledDate} className="flex items-center justify-between py-3 border-b border-stone-100">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-stone-100 overflow-hidden">
                          <img src={m.titleImage || m.comicImage || (m as any).imageUrl} className="w-full h-full object-cover"/>
                      </div>
                      <div>
                          <p className="text-sm font-bold">{m.scheduledDate}</p>
                          <p className="text-xs text-stone-500">{m.title || 'Untitled'}</p>
                      </div>
                  </div>
                  <button onClick={() => handleDelete(m.scheduledDate)} className="text-stone-400 hover:text-red-500"><X className="w-4 h-4"/></button>
              </div>
          ))}
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
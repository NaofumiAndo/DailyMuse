import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Save, ImagePlus, Upload, X } from 'lucide-react';

interface StoryEntry {
  id: string;
  narration: string;
  illustration: string;
  createdAt: number;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

const StoryAtlas: React.FC = () => {
  // Auth state
  const [isCreatorMode, setIsCreatorMode] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Story data
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Creator form
  const [narration, setNarration] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [characterRef, setCharacterRef] = useState<string | null>(null);
  const [characterRefPreview, setCharacterRefPreview] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
    loadCharacterRef();
  }, []);

  const loadStories = async () => {
    try {
      const response = await fetch('/data/story-atlas/entries.json');
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    }
    setLoading(false);
  };

  const loadCharacterRef = async () => {
    try {
      const response = await fetch('/data/story-atlas/character-ref.json');
      if (response.ok) {
        const data = await response.json();
        setCharacterRef(data.imageData);
        setCharacterRefPreview(data.imageData);
      }
    } catch (error) {
      console.log('No character reference found');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsCreatorMode(true);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Incorrect password');
    }
  };

  const handleCharacterImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setCharacterRef(imageData);
        setCharacterRefPreview(imageData);
        saveCharacterRef(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCharacterImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setCharacterRef(imageData);
        setCharacterRefPreview(imageData);
        saveCharacterRef(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveCharacterRef = async (imageData: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/story-atlas/character-ref`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      });
      alert('✅ Character reference updated!');
    } catch (error) {
      console.error('Error saving character ref:', error);
      alert('❌ Failed to save character reference');
    }
  };

  const handleGenerateIllustration = async () => {
    if (!narration.trim()) {
      alert('Please enter narration first');
      return;
    }

    setGeneratingImage(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/story-atlas/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narration,
          characterRef
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();

      // Add new entry to the list
      const newEntry: StoryEntry = {
        id: Date.now().toString(),
        narration,
        illustration: data.illustration,
        createdAt: Date.now(),
      };

      setEntries([...entries, newEntry]);
      setNarration('');
      alert('✅ Story entry added!');
    } catch (error) {
      console.error('Error generating illustration:', error);
      alert('❌ Failed to generate illustration');
    }
    setGeneratingImage(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-serif text-stone-900 mb-2">Story: Atlas</h1>
          <p className="text-stone-500 text-sm">An illustrated narrative journey</p>
        </div>
      </div>

      {/* Creator Login Button (fixed position) */}
      {!isCreatorMode && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              const pw = prompt('Enter creator password:');
              if (pw === ADMIN_PASSWORD) {
                setIsCreatorMode(true);
              } else if (pw) {
                alert('Incorrect password');
              }
            }}
            className="flex items-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-full shadow-lg hover:bg-stone-800 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Creator Mode</span>
          </button>
        </div>
      )}

      {/* Creator Panel */}
      {isCreatorMode && (
        <div className="bg-blue-50 border-b-2 border-blue-300 py-6">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-blue-900">✏️ Creator Mode</h2>
              <button
                onClick={() => setIsCreatorMode(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Exit Creator Mode
              </button>
            </div>

            {/* Character Reference Upload */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-700 mb-2">Character Reference (drag & drop or click to upload)</label>
              <div
                onDrop={handleCharacterImageDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative border-2 border-dashed border-blue-300 rounded-sm p-4 bg-white hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('character-upload')?.click()}
              >
                {characterRefPreview ? (
                  <div className="flex items-center gap-4">
                    <img src={characterRefPreview} alt="Character reference" className="w-24 h-24 object-cover rounded border border-stone-200" />
                    <div>
                      <p className="text-sm font-medium text-green-700">✓ Character reference set</p>
                      <p className="text-xs text-stone-500">This character will be used in all illustrations</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-stone-400" />
                    <p className="text-sm text-stone-600">Drop character image here or click to browse</p>
                  </div>
                )}
                <input
                  id="character-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCharacterImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Narration Input */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-700 mb-2">Narration</label>
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Write the next part of the story..."
                className="w-full h-32 p-4 border-2 border-blue-200 rounded-sm focus:border-blue-400 outline-none"
              />
            </div>

            <button
              onClick={handleGenerateIllustration}
              disabled={generatingImage || !narration.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  Generate Illustration & Add
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Story Entries */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-stone-400 font-serif italic text-lg">The story has yet to begin...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {entries.map((entry, index) => (
              <div key={entry.id} className="flex flex-col md:flex-row gap-8 items-start">
                {/* Illustration */}
                <div className="w-full md:w-1/2">
                  <div className="aspect-square bg-white border border-stone-200 shadow-lg overflow-hidden">
                    <img
                      src={entry.illustration}
                      alt={`Illustration ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Narration */}
                <div className="w-full md:w-1/2 pt-4">
                  <div className="prose prose-stone max-w-none">
                    <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {entry.narration}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <p className="text-xs text-stone-400">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryAtlas;

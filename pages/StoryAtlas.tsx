import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Save, ImagePlus, Upload, X, Trash2, Pencil } from 'lucide-react';

interface StoryEntry {
  id: string;
  narration: string;
  illustration: string;
  createdAt: number;
}

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const BASE_PATH = import.meta.env.BASE_URL || '/';

// Helper function to get full path for assets
const getAssetPath = (path: string) => {
  if (path.startsWith('data:')) return path; // Skip data URLs
  return `${BASE_PATH}${path.replace(/^\//, '')}`.replace(/\/+/g, '/');
};

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
  const [artStyle, setArtStyle] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewNarration, setPreviewNarration] = useState('');
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editedNarration, setEditedNarration] = useState('');
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);
  const [replacementImage, setReplacementImage] = useState<string | null>(null);
  const [generatingReplacement, setGeneratingReplacement] = useState(false);
  const [replacementArtStyle, setReplacementArtStyle] = useState('');

  useEffect(() => {
    loadStories();
    loadCharacterRef();
    loadArtStyle();
  }, []);

  const loadStories = async () => {
    try {
      const url = `${BASE_PATH}data/story-atlas/entries.json`.replace(/\/+/g, '/');
      const response = await fetch(url);
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
      const url = `${BASE_PATH}data/story-atlas/character-ref.json`.replace(/\/+/g, '/');
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCharacterRef(data.imageData);
        setCharacterRefPreview(data.imageData);
      }
    } catch (error) {
      console.log('No character reference found');
    }
  };

  const loadArtStyle = async () => {
    try {
      const url = `${BASE_PATH}data/story-atlas/art-style.json`.replace(/\/+/g, '/');
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setArtStyle(data.artStyle || '');
      }
    } catch (error) {
      console.log('No art style found');
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

  const saveArtStyle = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${API_URL}/api/story-atlas/art-style`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artStyle }),
      });
      alert('✅ Art style saved!');
    } catch (error) {
      console.error('Error saving art style:', error);
      alert('❌ Failed to save art style');
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
          characterRef,
          artStyle
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();

      // Set preview instead of adding to entries immediately
      setPreviewImage(data.illustration);
      setPreviewNarration(narration);
    } catch (error) {
      console.error('Error generating illustration:', error);
      alert('❌ Failed to generate illustration');
    }
    setGeneratingImage(false);
  };

  const handleSubmitEntry = async () => {
    if (!previewImage || !previewNarration) return;

    setSubmittingEntry(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/story-atlas/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narration: previewNarration,
          illustration: previewImage
        }),
      });

      if (!response.ok) throw new Error('Submit failed');

      // Clear form and preview
      setNarration('');
      setPreviewImage(null);
      setPreviewNarration('');

      alert('✅ Story entry added!');

      // Reload stories to get the persisted version
      await loadStories();
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('❌ Failed to submit entry');
    }
    setSubmittingEntry(false);
  };

  const handleCancelPreview = () => {
    setPreviewImage(null);
    setPreviewNarration('');
  };

  const handleStartEdit = (id: string, currentNarration: string) => {
    setEditingEntryId(id);
    setEditedNarration(currentNarration);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditedNarration('');
  };

  const handleSaveEdit = async () => {
    if (!editingEntryId || !editedNarration.trim()) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/story-atlas/entries/${editingEntryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narration: editedNarration }),
      });

      if (!response.ok) throw new Error('Update failed');

      // Update the entry in the local state
      setEntries(entries.map(e =>
        e.id === editingEntryId
          ? { ...e, narration: editedNarration }
          : e
      ));

      setEditingEntryId(null);
      setEditedNarration('');
      alert('✅ Narration updated successfully');
    } catch (error) {
      console.error('Error updating narration:', error);
      alert('❌ Failed to update narration');
    }
  };

  const handleStartReplacement = (id: string) => {
    setReplacingImageId(id);
    setReplacementArtStyle(artStyle); // Initialize with current default art style
  };

  const handleGenerateReplacement = async (narration: string) => {
    setGeneratingReplacement(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/story-atlas/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narration,
          characterRef,
          artStyle: replacementArtStyle
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setReplacementImage(data.illustration);
    } catch (error) {
      console.error('Error generating replacement:', error);
      alert('❌ Failed to generate replacement image');
    }
    setGeneratingReplacement(false);
  };

  const handleConfirmReplacement = async () => {
    if (!replacingImageId || !replacementImage) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/story-atlas/entries/${replacingImageId}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ illustration: replacementImage }),
      });

      if (!response.ok) throw new Error('Update failed');

      // Update the entry in local state
      setEntries(entries.map(e =>
        e.id === replacingImageId
          ? { ...e, illustration: replacementImage }
          : e
      ));

      setReplacingImageId(null);
      setReplacementImage(null);
      alert('✅ Image replaced successfully');

      // Reload to get persisted version
      await loadStories();
    } catch (error) {
      console.error('Error replacing image:', error);
      alert('❌ Failed to replace image');
    }
  };

  const handleCancelReplacement = () => {
    setReplacingImageId(null);
    setReplacementImage(null);
    setReplacementArtStyle('');
  };

  const handleDeleteEntry = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const confirmText = `Are you sure you want to delete this story entry?\n\n"${entry.narration.substring(0, 100)}..."\n\nThis cannot be undone.`;

    if (!confirm(confirmText)) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/story-atlas/entries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setEntries(entries.filter(e => e.id !== id));
      alert('✅ Story entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('❌ Failed to delete entry');
    }
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

            {/* Art Style Settings */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-stone-700 mb-2">Art Style (optional - will be applied to all future illustrations)</label>
              <div className="flex flex-col gap-2">
                <textarea
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value)}
                  placeholder="e.g., watercolor, oil painting, anime style, cinematic lighting, dramatic shadows, soft pastels..."
                  className="w-full h-24 px-4 py-3 border-2 border-blue-200 rounded-sm focus:border-blue-400 outline-none text-sm resize-y"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button
                    onClick={saveArtStyle}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Art Style
                  </button>
                </div>
              </div>
              {artStyle && (
                <p className="text-xs text-green-700 mt-2">✓ Current style: "{artStyle}"</p>
              )}
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
                  Generating Preview...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  Generate Preview
                </>
              )}
            </button>

            {/* Preview Section */}
            {previewImage && (
              <div className="mt-6 p-6 bg-white border-2 border-green-300 rounded-sm">
                <h3 className="text-lg font-bold text-green-900 mb-4">📸 Preview</h3>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Preview Image */}
                  <div className="w-full md:w-1/2">
                    <div className="aspect-square bg-stone-100 border border-stone-200 shadow-lg overflow-hidden">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Preview Narration */}
                  <div className="w-full md:w-1/2 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-2">Narration:</label>
                      <p className="text-stone-700 leading-relaxed whitespace-pre-wrap font-serif" style={{ fontFamily: '"Crimson Text", "Georgia", serif' }}>
                        {previewNarration}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={handleSubmitEntry}
                        disabled={submittingEntry}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {submittingEntry ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Submit to Website
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelPreview}
                        disabled={submittingEntry}
                        className="flex items-center gap-2 px-4 py-3 bg-stone-500 text-white rounded-sm hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <div key={entry.id} className="relative border-2 border-transparent hover:border-stone-200 transition-all rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Illustration */}
                  <div className="w-full md:w-1/2">
                    {replacingImageId === entry.id && replacementImage ? (
                      // Replacement Preview
                      <div>
                        <div className="aspect-square bg-white border-2 border-green-400 shadow-lg overflow-hidden mb-4">
                          <img
                            src={replacementImage}
                            alt="New illustration preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-bold text-green-700 mb-2">New Image Preview:</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmReplacement}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 text-sm font-medium"
                          >
                            <Save className="w-4 h-4" />
                            Replace Image
                          </button>
                          <button
                            onClick={handleCancelReplacement}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-500 text-white rounded-sm hover:bg-stone-600 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : replacingImageId === entry.id && !replacementImage ? (
                      // Art Style Input Form
                      <div>
                        <div className="aspect-square bg-white border border-stone-200 shadow-lg overflow-hidden mb-4">
                          <img
                            src={getAssetPath(entry.illustration)}
                            alt={`Illustration ${index + 1}`}
                            className="w-full h-full object-cover opacity-50"
                          />
                        </div>
                        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-sm">
                          <label className="block text-xs font-bold text-purple-900 mb-2">Art Style for Replacement:</label>
                          <textarea
                            value={replacementArtStyle}
                            onChange={(e) => setReplacementArtStyle(e.target.value)}
                            placeholder="e.g., watercolor, oil painting, anime style, cinematic lighting..."
                            className="w-full h-24 px-4 py-3 border-2 border-purple-200 rounded-sm focus:border-purple-400 outline-none text-sm resize-y mb-3"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGenerateReplacement(entry.narration)}
                              disabled={generatingReplacement}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {generatingReplacement ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <ImagePlus className="w-4 h-4" />
                                  Generate New Image
                                </>
                              )}
                            </button>
                            <button
                              onClick={handleCancelReplacement}
                              disabled={generatingReplacement}
                              className="flex items-center gap-2 px-4 py-2 bg-stone-500 text-white rounded-sm hover:bg-stone-600 text-sm disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Normal View
                      <div>
                        <div className="aspect-square bg-white border border-stone-200 shadow-lg overflow-hidden">
                          <img
                            src={getAssetPath(entry.illustration)}
                            alt={`Illustration ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Narration */}
                  <div className="w-full md:w-1/2">
                    {editingEntryId === entry.id ? (
                      // Edit Mode
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-2">Edit Narration:</label>
                        <textarea
                          value={editedNarration}
                          onChange={(e) => setEditedNarration(e.target.value)}
                          className="w-full h-48 p-4 border-2 border-blue-300 rounded-sm focus:border-blue-400 outline-none font-serif text-lg leading-relaxed"
                          style={{ fontFamily: '"Crimson Text", "Georgia", serif' }}
                        />
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 text-sm font-medium"
                          >
                            <Save className="w-4 h-4" />
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-500 text-white rounded-sm hover:bg-stone-600 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="prose prose-stone max-w-none">
                          <p className="text-stone-700 leading-relaxed whitespace-pre-wrap font-serif text-lg" style={{ fontFamily: '"Crimson Text", "Georgia", serif' }}>
                            {entry.narration}
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
                          <p className="text-xs text-stone-400">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>

                          {/* Edit, Replace Image, and Delete buttons - Creator mode only */}
                          {isCreatorMode && (
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => handleStartEdit(entry.id, entry.narration)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 shadow-md transition-all text-xs font-medium"
                                title="Edit narration"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit Text
                              </button>
                              <button
                                onClick={() => handleStartReplacement(entry.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 shadow-md transition-all text-xs font-medium"
                                title="Replace image"
                              >
                                <ImagePlus className="w-3 h-3" />
                                Replace Image
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 shadow-md transition-all text-xs font-medium"
                                title="Delete this entry"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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

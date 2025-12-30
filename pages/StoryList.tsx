import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, LogOut, Edit2, Save, X } from 'lucide-react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface Story {
  id: string;
  title: string;
  description: string;
  path: string;
  coverColor: string;
}

const StoryList: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [password, setPassword] = useState('');
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Load stories
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stories`);
      const data = await response.json();
      setStories(data);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === 'create') {
      setIsCreator(true);
      setPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsCreator(false);
    setEditingStoryId(null);
  };

  const handleStartEdit = (story: Story) => {
    setEditingStoryId(story.id);
    setEditTitle(story.title);
    setEditDescription(story.description);
  };

  const handleCancelEdit = () => {
    setEditingStoryId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveEdit = async (storyId: string) => {
    if (!editTitle.trim() || !editDescription.trim()) {
      alert('Title and description cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/stories/${storyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription
        })
      });

      if (response.ok) {
        await loadStories();
        setEditingStoryId(null);
        setEditTitle('');
        setEditDescription('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update story');
      }
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Failed to update story');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400">Loading stories...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200 py-12">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-serif text-stone-900 mb-2">Stories</h1>
            <p className="text-stone-500 text-sm">Illustrated narratives and tales</p>
          </div>

          {/* Creator Mode Toggle */}
          <div className="flex items-center gap-3">
            {!isCreator ? (
              <>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Password"
                  className="px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-stone-900"
                />
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-sm hover:bg-stone-800 transition-colors text-sm"
                >
                  <Lock className="w-4 h-4" />
                  Creator
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Story List */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div key={story.id} className="relative">
              {editingStoryId === story.id ? (
                // Edit Mode
                <div className="bg-white border-2 border-blue-500 rounded-sm overflow-hidden p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-2">
                        Story Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-blue-500 resize-y"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(story.id)}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-stone-400 text-white rounded-sm hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <Link
                    to={story.path}
                    className="group block bg-white border border-stone-200 rounded-sm overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Cover */}
                    <div className={`h-64 bg-gradient-to-br ${story.coverColor} flex items-center justify-center relative overflow-hidden`}>
                      <BookOpen className="w-20 h-20 text-white/20 absolute" />
                      <div className="relative z-10 text-center px-6">
                        <h2 className="text-2xl font-serif text-white font-bold mb-2">
                          {story.title}
                        </h2>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <p className="text-stone-600 text-sm leading-relaxed">
                        {story.description}
                      </p>
                      <div className="mt-4 flex items-center text-stone-900 font-medium text-sm group-hover:text-blue-600 transition-colors">
                        <span>Read Story</span>
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </Link>

                  {/* Edit Button (Creator Mode) */}
                  {isCreator && (
                    <button
                      onClick={() => handleStartEdit(story)}
                      className="absolute top-4 right-4 z-10 p-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors shadow-lg"
                      title="Edit story metadata"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <p className="text-stone-400 font-serif italic text-lg">No stories yet...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryList;

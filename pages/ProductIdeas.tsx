import React, { useState, useEffect } from 'react';
import { Lock, LogOut, Wand2, RefreshCw, Save, Lightbulb, TrendingUp, AlertTriangle, Search } from 'lucide-react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

interface ProductIdea {
  id: string;
  idea: string;
  image: string;
  pros: string[];
  cons: string[];
  similarProducts: string[];
  createdAt: number;
}

const ProductIdeas: React.FC = () => {
  const [isCreator, setIsCreator] = useState(false);
  const [password, setPassword] = useState('');

  // Creator form
  const [ideaText, setIdeaText] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [analyzingIdea, setAnalyzingIdea] = useState(false);

  // Submitted ideas
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      const url = import.meta.env.DEV
        ? `${API_URL}/api/product-ideas`
        : `${import.meta.env.BASE_URL}data/product-ideas.json`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      }
    } catch (error) {
      console.error('Error loading product ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsCreator(true);
      setPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsCreator(false);
  };

  const handleGenerateImage = async () => {
    if (!ideaText.trim()) {
      alert('Please enter a product idea first');
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await fetch(`${API_URL}/api/product-ideas/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaText })
      });

      if (!response.ok) throw new Error('Image generation failed');

      const data = await response.json();
      setPreviewImage(data.image);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('❌ Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!previewImage || !ideaText.trim()) {
      alert('Please generate an image first');
      return;
    }

    setAnalyzingIdea(true);
    try {
      const response = await fetch(`${API_URL}/api/product-ideas/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: ideaText,
          image: previewImage
        })
      });

      if (!response.ok) throw new Error('Submit failed');

      // Reload ideas
      await loadIdeas();

      // Reset form
      setIdeaText('');
      setPreviewImage(null);

      alert('✅ Product idea submitted!');
    } catch (error) {
      console.error('Error submitting idea:', error);
      alert('❌ Failed to submit product idea');
    } finally {
      setAnalyzingIdea(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewImage(null);
  };

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Page Header */}
        <div className="bg-white border-b border-stone-200 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-5xl font-serif text-stone-900 mb-2">Product Ideas</h1>
            <p className="text-stone-500 text-sm">AI-powered product concept exploration</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="max-w-md mx-auto bg-white p-8 rounded-sm shadow-lg border border-stone-200">
            <h2 className="text-2xl font-serif text-stone-900 mb-6 text-center">Creator Access</h2>
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter Password"
                className="w-full px-4 py-3 border border-stone-300 rounded-sm focus:outline-none focus:border-stone-900"
                autoFocus
              />
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-sm hover:bg-stone-800 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-serif text-stone-900 mb-2">Product Ideas</h1>
            <p className="text-stone-500 text-sm">AI-powered product concept exploration</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Creator Studio */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Input & Generation */}
          <div className="bg-white border border-stone-200 rounded-sm p-6">
            <h2 className="text-2xl font-serif text-stone-900 mb-4">Create New Idea</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                  Product Idea
                </label>
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="Describe your product idea in detail..."
                  className="w-full px-4 py-3 border border-stone-300 rounded-sm focus:outline-none focus:border-stone-900 resize-y"
                  rows={5}
                />
              </div>

              {!previewImage ? (
                <button
                  onClick={handleGenerateImage}
                  disabled={generatingImage || !ideaText.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingImage ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Image
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-green-500 rounded-sm p-2 bg-green-50">
                    <img src={previewImage} alt="Preview" className="w-full rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleGenerateImage}
                      disabled={generatingImage}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 disabled:opacity-50 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={analyzingIdea}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {analyzingIdea ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Submit
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={handleCancelPreview}
                    className="w-full px-4 py-2 bg-stone-400 text-white rounded-sm hover:bg-stone-500 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Instructions */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-sm p-6">
            <h3 className="text-xl font-serif text-stone-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              How It Works
            </h3>
            <ol className="space-y-3 text-sm text-stone-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Describe your product idea in detail in the text area</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Click "Generate Image" to create a visual representation using AI</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Review the image - regenerate if needed</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Click "Submit" to analyze the idea with AI</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <span>View AI-generated pros, cons, and similar existing products</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Submitted Ideas */}
        <div>
          <h2 className="text-3xl font-serif text-stone-900 mb-6">Submitted Ideas</h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-stone-400">Loading ideas...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12 bg-white border border-stone-200 rounded-sm">
              <Lightbulb className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <p className="text-stone-400 text-sm">No product ideas yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {ideas.map((idea) => (
                <div key={idea.id} className="bg-white border border-stone-200 rounded-sm overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Image */}
                    <div>
                      <img
                        src={idea.image}
                        alt="Product concept"
                        className="w-full rounded border border-stone-200"
                      />
                      <div className="mt-4 p-4 bg-stone-50 rounded text-sm text-stone-700">
                        <p className="font-bold text-xs text-stone-500 uppercase tracking-wider mb-2">Idea</p>
                        <p>{idea.idea}</p>
                      </div>
                    </div>

                    {/* Pros & Cons */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="flex items-center gap-2 text-lg font-bold text-green-700 mb-3">
                          <TrendingUp className="w-5 h-5" />
                          Pros
                        </h4>
                        <ul className="space-y-2">
                          {idea.pros.map((pro, idx) => (
                            <li key={idx} className="flex gap-2 text-sm">
                              <span className="text-green-600 flex-shrink-0">✓</span>
                              <span className="text-stone-700">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="flex items-center gap-2 text-lg font-bold text-red-700 mb-3">
                          <AlertTriangle className="w-5 h-5" />
                          Cons
                        </h4>
                        <ul className="space-y-2">
                          {idea.cons.map((con, idx) => (
                            <li key={idx} className="flex gap-2 text-sm">
                              <span className="text-red-600 flex-shrink-0">✗</span>
                              <span className="text-stone-700">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Similar Products */}
                    <div>
                      <h4 className="flex items-center gap-2 text-lg font-bold text-blue-700 mb-3">
                        <Search className="w-5 h-5" />
                        Similar Products
                      </h4>
                      <ul className="space-y-3">
                        {idea.similarProducts.map((product, idx) => (
                          <li key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            {typeof product === 'string' ? (
                              <div className="text-stone-700">{product}</div>
                            ) : (
                              <>
                                <div className="font-bold text-blue-900 mb-1">{product.name}</div>
                                <div className="text-stone-600">{product.description}</div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductIdeas;

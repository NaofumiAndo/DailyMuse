import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  description: string;
  path: string;
  coverColor: string;
}

const stories: Story[] = [
  {
    id: 'atlas',
    title: 'Atlas: The Boy Who Held the Sky',
    description: 'An illustrated narrative journey following a boy with dreams as vast as the heavens.',
    path: '/story/atlas',
    coverColor: 'from-blue-900 to-purple-900'
  }
];

const StoryList: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-serif text-stone-900 mb-2">Stories</h1>
          <p className="text-stone-500 text-sm">Illustrated narratives and tales</p>
        </div>
      </div>

      {/* Story List */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <Link
              key={story.id}
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

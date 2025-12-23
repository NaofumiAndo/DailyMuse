import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEntryByDate } from '../services/githubStorage';
import { MuseEntry } from '../types';
import { ArrowRight, Loader2 } from 'lucide-react';

const Home: React.FC = () => {
  const [entry, setEntry] = useState<MuseEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToday = async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const data = await getEntryByDate(today);
      setEntry(data);
      setLoading(false);
    };
    fetchToday();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 text-stone-800 animate-spin mb-4" />
        <p className="text-stone-500 font-serif italic text-sm tracking-wide">Fetching today's episode...</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-1 mx-auto bg-stone-200"></div>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 leading-tight">To be continued...</h1>
          <p className="text-stone-500 font-light leading-relaxed">
            No episode scheduled for today. Explore the archives.
          </p>
          <div className="pt-4">
            <Link to="/archive" className="inline-flex items-center px-8 py-3 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 text-sm font-bold tracking-widest uppercase">
              View Archive
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle legacy data fallback
  const titleImg = entry.titleImage;
  const comicImg = entry.comicImage || (entry as any).imageUrl || (entry as any).panels?.[0]?.imageUrl;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-32">
      
      {/* Header Info */}
      <div className="text-center mb-12 space-y-2">
          <p className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">
              {new Date(entry.scheduledDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-serif text-stone-900">{entry.title || 'Untitled'}</h1>
          <p className="text-stone-500 font-mono text-xs">{entry.episodeNumber}</p>
      </div>

      <div className="space-y-8">
        
        {/* Title Card */}
        {titleImg && (
            <div className="shadow-2xl shadow-stone-200 bg-white p-2">
                <div className="aspect-square w-full bg-stone-100 overflow-hidden">
                    <img src={titleImg} alt={entry.title} className="w-full h-full object-cover" />
                </div>
            </div>
        )}

        {/* 4-Panel Comic */}
        {comicImg && (
            <div className="bg-white shadow-lg shadow-stone-200 border border-stone-100 p-2">
                <div className="aspect-square w-full bg-stone-50 overflow-hidden">
                    <img src={comicImg} alt="Comic" className="w-full h-full object-cover" />
                </div>
            </div>
        )}

      </div>

      {entry.concept && (
        <div className="mt-12 text-center max-w-xl mx-auto">
             <div className="w-8 h-px bg-stone-300 mx-auto mb-6"></div>
             <p className="font-serif text-stone-500 italic leading-relaxed text-sm">
                 "{entry.concept}"
             </p>
        </div>
      )}

      <div className="mt-16 text-center border-t border-stone-200 pt-8">
         <Link to="/archive" className="text-stone-500 hover:text-stone-900 font-bold uppercase tracking-widest text-xs inline-flex items-center">
             Full Archive <ArrowRight className="w-4 h-4 ml-2"/>
         </Link>
      </div>

    </div>
  );
};

export default Home;
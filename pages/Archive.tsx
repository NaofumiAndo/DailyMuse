import React, { useEffect, useState } from 'react';
import { getPastEntries } from '../services/firebase';
import { MuseEntry } from '../types';
import { Loader2 } from 'lucide-react';

const Archive: React.FC = () => {
  const [entries, setEntries] = useState<MuseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchive = async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const data = await getPastEntries(today);
      setEntries(data);
      setLoading(false);
    };

    fetchArchive();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center mb-16 space-y-4 text-center">
        <h1 className="text-4xl font-serif text-stone-900">The Collection</h1>
        <div className="w-12 h-px bg-stone-300"></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-stone-800 animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-sm border border-stone-200 max-w-2xl mx-auto shadow-sm">
          <p className="text-stone-400 font-serif italic text-lg">The archive is waiting for its first memory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {entries.map((entry) => {
            // Priority: Title Image -> Comic Image -> Legacy Image
            const thumbnail = entry.titleImage || entry.comicImage || (entry as any).imageUrl || (entry as any).panels?.[0]?.imageUrl;
            const title = entry.title || 'Untitled';
            const subtitle = entry.episodeNumber ? `${entry.episodeNumber}` : (entry as any).concept;

            return (
                <div key={entry.scheduledDate} className="group flex flex-col bg-white transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                
                {/* Image Container */}
                <div className="aspect-square overflow-hidden bg-stone-100 border border-stone-200 relative mb-4">
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 transition-colors z-10 duration-500" />
                    <img 
                    src={thumbnail} 
                    alt={title} 
                    className="w-full h-full object-cover filter contrast-[1.02] transform group-hover:scale-105 transition-transform duration-700"
                    />
                </div>

                {/* Text Content */}
                <div className="flex flex-col flex-grow text-center px-4">
                    <div className="mb-2 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
                    {new Date(entry.scheduledDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h3 className="font-serif text-lg text-stone-900 font-bold mb-1">{title}</h3>
                    <p className="font-serif text-sm text-stone-500 italic line-clamp-2 leading-relaxed group-hover:text-stone-900 transition-colors">
                    {subtitle}
                    </p>
                </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Archive;
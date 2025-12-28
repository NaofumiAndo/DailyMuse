import React, { useEffect, useState } from 'react';
import { getPastEntries } from '../services/githubStorage';
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
          {entries.map((entry) => {
            const titleImg = entry.titleImage;
            const comicImg = entry.comicImage || (entry as any).imageUrl || (entry as any).panels?.[0]?.imageUrl;
            const title = entry.title || 'Untitled';
            const subtitle = entry.episodeNumber ? `${entry.episodeNumber}` : (entry as any).concept;

            return (
                <div key={entry.scheduledDate} className="group flex flex-col bg-white">

                {/* Text Header */}
                <div className="flex flex-col text-center mb-6">
                    <div className="mb-2 text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
                    {new Date(entry.scheduledDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h3 className="font-serif text-2xl text-stone-900 font-bold mb-1">{title}</h3>
                    <p className="font-mono text-xs text-stone-500">
                    {subtitle}
                    </p>
                </div>

                {/* Images Container */}
                <div className="space-y-6">
                    {/* Title Image */}
                    {titleImg && (
                        <div className="shadow-2xl shadow-stone-200 bg-white p-2 transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-square w-full bg-stone-100 overflow-hidden">
                                <img
                                    src={titleImg}
                                    alt={`${title} - Title Card`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    {/* Comic Image */}
                    {comicImg && (
                        <div className="bg-white shadow-lg shadow-stone-200 border border-stone-100 p-2 transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-square w-full bg-stone-50 overflow-hidden">
                                <img
                                    src={comicImg}
                                    alt={`${title} - Comic`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Concept Quote */}
                {entry.concept && (
                    <div className="mt-8 text-center max-w-xl mx-auto">
                        <div className="w-8 h-px bg-stone-300 mx-auto mb-4"></div>
                        <p className="font-serif text-stone-500 italic leading-relaxed text-sm">
                            "{entry.concept}"
                        </p>
                    </div>
                )}
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Archive;
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Tv,
  Film,
  Clapperboard,
  Play,
  X,
  Star
} from 'lucide-react';
import { LiveStream, SeriesItem, VodStream } from '../types';
import { SmartPoster } from './SmartPoster';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveStreams: LiveStream[];
  vodStreams: VodStream[];
  seriesList: SeriesItem[];
  onPlayLive: (stream: LiveStream) => void;
  onPlayMovie: (movie: VodStream) => void;
  onSelectSeries: (series: SeriesItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  liveStreams,
  vodStreams,
  seriesList,
  onPlayLive,
  onPlayMovie,
  onSelectSeries,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'movies' | 'series'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredLive = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return liveStreams.filter(s => (s.name || '').toLowerCase().includes(q)).slice(0, 30);
  }, [liveStreams, query]);

  const filteredMovies = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return vodStreams.filter(m => (m.name || '').toLowerCase().includes(q)).slice(0, 30);
  }, [vodStreams, query]);

  const filteredSeries = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return seriesList.filter(s => (s.name || '').toLowerCase().includes(q)).slice(0, 30);
  }, [seriesList, query]);

  const totalResults = filteredLive.length + filteredMovies.length + filteredSeries.length;

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-lg p-6 animate-fadeIn select-none pointer-events-auto"
    >
      <div className="glass-modal max-w-3xl w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Search Input Bar */}
        <div className="p-5 border-b border-white/10 flex items-center space-x-3 bg-black/40">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            placeholder="Kanal, film veya dizi adı yazın..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm font-semibold focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/10 rounded-md transition-colors"
            >
              Temizle
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-2 px-5 py-2.5 bg-black/20 border-b border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Tümü ({totalResults})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'live' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Canlı TV ({filteredLive.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'movies' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmler ({filteredMovies.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('series')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'series' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Diziler ({filteredSeries.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {!query.trim() ? (
            <div className="py-16 text-center text-gray-500 text-xs flex flex-col items-center">
              <Search className="w-12 h-12 stroke-[1.5] text-gray-600 mb-2" />
              <span>Aramak istediğiniz kanal, film veya dizi adını yazın...</span>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              "{query}" ile eşleşen içerik bulunamadı.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Canlı Kanallar */}
              {(activeTab === 'all' || activeTab === 'live') && filteredLive.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                    Canlı Kanallar ({filteredLive.length})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredLive.map(s => (
                      <div
                        key={s.stream_id}
                        onClick={() => {
                          onPlayLive(s);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Tv className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">{s.name}</span>
                        </div>
                        <Play className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 flex-shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filmler */}
              {(activeTab === 'all' || activeTab === 'movies') && filteredMovies.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block mb-2">
                    Filmler ({filteredMovies.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {filteredMovies.map(m => (
                      <div
                        key={m.stream_id}
                        onClick={() => {
                          onPlayMovie(m);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center space-x-2.5 cursor-pointer group transition-colors"
                      >
                        <div className="w-8 h-11 bg-black rounded overflow-hidden flex-shrink-0">
                          <SmartPoster
                            initialUrl={m.stream_icon}
                            title={m.name}
                            isSeries={false}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-white truncate">{m.name}</p>
                          {m.rating && (
                            <span className="text-[10px] text-yellow-400 font-bold flex items-center space-x-1">
                              <Star className="w-2.5 h-2.5 fill-yellow-400" />
                              <span>{m.rating}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diziler */}
              {(activeTab === 'all' || activeTab === 'series') && filteredSeries.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block mb-2">
                    Diziler ({filteredSeries.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {filteredSeries.map(s => (
                      <div
                        key={s.series_id}
                        onClick={() => {
                          onSelectSeries(s);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center space-x-2.5 cursor-pointer group transition-colors"
                      >
                        <div className="w-8 h-11 bg-black rounded overflow-hidden flex-shrink-0">
                          <SmartPoster
                            initialUrl={s.cover}
                            title={s.name}
                            isSeries={true}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                          <span className="text-[10px] text-gray-400">{s.genre || 'Dizi'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

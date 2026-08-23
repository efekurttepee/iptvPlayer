import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Heart,
  Play,
  ArrowLeft,
  Tv,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Category, LiveStream } from '../types';
import { StorageService } from '../services/storage';
import { translateCategory } from '../utils/categoryTranslator';

interface LiveTvViewProps {
  categories: Category[];
  streams: LiveStream[];
  onBack: () => void;
  onPlayStream: (stream: LiveStream) => void;
}

export const LiveTvView: React.FC<LiveTvViewProps> = ({
  categories,
  streams,
  onBack,
  onPlayStream,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(() => StorageService.getFavorites().live);
  const [visibleLimit, setVisibleLimit] = useState(80);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(() => streams[0] || null);

  useEffect(() => {
    setVisibleLimit(80);
  }, [selectedCategoryId, searchQuery, onlyFavorites]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      setVisibleLimit(prev => Math.min(prev + 60, filteredStreams.length));
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (e: React.MouseEvent, streamId: number) => {
    e.stopPropagation();
    const isFav = StorageService.toggleFavorite('live', streamId);
    if (isFav) {
      setFavorites([...favorites, streamId]);
    } else {
      setFavorites(favorites.filter(id => id !== streamId));
    }
  };

  // Filter Streams
  const filteredStreams = useMemo(() => {
    return streams.filter(stream => {
      // Category filter
      if (selectedCategoryId !== 'all' && stream.category_id !== selectedCategoryId) {
        return false;
      }
      // Favorites filter
      if (onlyFavorites && !favorites.includes(stream.stream_id)) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return stream.name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [streams, selectedCategoryId, onlyFavorites, favorites, searchQuery]);

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col p-6 overflow-hidden select-none animate-fadeIn">
      {/* Üst Başlık & Arama Barı */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
            title="Ana Menüye Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping inline-block mr-1" />
              <span>Canlı TV Yayınları</span>
            </h1>
            <p className="text-xs text-gray-400">
              Toplam {filteredStreams.length} kanal listeleniyor
            </p>
          </div>
        </div>

        {/* Arama & Favori Butonları */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kanal adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white placeholder-gray-400 text-xs rounded-xl pl-9 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-cyan-400 border border-white/10"
            />
          </div>

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
              onlyFavorites
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/15'
            }`}
          >
            <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-red-400' : ''}`} />
            <span>Favoriler ({favorites.length})</span>
          </button>
        </div>
      </div>

      {/* 3 Sütunlu Canlı TV Arayüzü: Kategoriler | Kanallar | Önizleme */}
      <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
        
        {/* 1. Sütun: Kategoriler (3 Kolon) */}
        <div className="col-span-3 glass-panel rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
            Kategoriler
          </span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {/* Tüm Kanallar */}
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                selectedCategoryId === 'all'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Tv className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Tüm Kanallar</span>
              </div>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                {streams.length}
              </span>
            </button>

            {/* Dinamik Kategoriler */}
            {categories.map((cat) => {
              const count = streams.filter(s => s.category_id === cat.category_id).length;
              const isSelected = selectedCategoryId === cat.category_id;
              return (
                <button
                  key={cat.category_id}
                  onClick={() => setSelectedCategoryId(cat.category_id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="truncate mr-2">{translateCategory(cat.category_name)}</span>
                  <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Sütun: Kanal Listesi (5 Kolon) */}
        <div className="col-span-5 glass-panel rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2 flex justify-between">
            <span>Kanal Listesi</span>
            <span>{filteredStreams.length} Kanal</span>
          </span>

          <div onScroll={handleScroll} className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredStreams.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                <Tv className="w-12 h-12 mb-2 stroke-[1.5] text-gray-500" />
                <span className="text-xs font-medium">Bu kriterlere uygun kanal bulunamadı.</span>
              </div>
            ) : (
              filteredStreams.slice(0, visibleLimit).map((stream) => {
                const isSelected = selectedStream?.stream_id === stream.stream_id;
                const isFav = favorites.includes(stream.stream_id);
                return (
                  <div
                    key={stream.stream_id}
                    onClick={() => setSelectedStream(stream)}
                    onDoubleClick={() => onPlayStream(stream)}
                    className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-300 shadow-md'
                        : 'bg-white/[0.03] border-transparent hover:bg-white/[0.07] text-gray-200'
                    }`}
                  >
                    {/* Logo & Kanal Adı */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-8 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        {stream.stream_icon ? (
                          <img
                            src={stream.stream_icon}
                            alt=""
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full items-center justify-center"
                          style={{ display: stream.stream_icon ? 'none' : 'flex' }}
                        >
                          <Tv className="w-4 h-4 text-cyan-400" />
                        </div>
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold truncate text-white">
                          {stream.name}
                        </p>
                        <span className="text-[10px] text-gray-400">Canlı Akış</span>
                      </div>
                    </div>

                    {/* Aksiyonlar: Favori & Oynat */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleToggleFavorite(e, stream.stream_id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors ${
                          isFav ? 'text-red-400' : 'text-gray-400 hover:text-red-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-400' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayStream(stream);
                        }}
                        className="w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                        title="Oynat"
                      >
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Sütun: Kanal Detay & Önizleme (4 Kolon) */}
        <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col justify-between min-h-0">
          {selectedStream ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Kanal Logo & Başlık */}
                <div className="w-full h-44 rounded-xl bg-black/60 border border-white/10 flex flex-col items-center justify-center p-4 relative overflow-hidden mb-4 shadow-inner">
                  {selectedStream.stream_icon ? (
                    <img
                      src={selectedStream.stream_icon}
                      alt={selectedStream.name}
                      className="max-h-24 max-w-[80%] object-contain drop-shadow-lg"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="flex flex-col items-center justify-center"
                    style={{ display: selectedStream.stream_icon ? 'none' : 'flex' }}
                  >
                    <Tv className="w-16 h-16 text-cyan-400 mb-2" />
                  </div>
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                    CANLI YAYIN
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mb-1">{selectedStream.name}</h2>
                <div className="flex items-center space-x-2 text-xs text-gray-400 mb-4">
                  <span className="bg-white/10 px-2 py-0.5 rounded text-[11px]">HD 1080p</span>
                  <span>•</span>
                  <span>HLS / TS Akışı</span>
                </div>

                {/* EPG Bilgisi / Yayın Akışı */}
                <div className="bg-white/[0.04] p-3.5 rounded-xl border border-white/10 mb-4">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                    Şu Anda Yayında:
                  </span>
                  <p className="text-xs font-semibold text-white">Canlı Yayın Akışı</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Yayın akışı bilgileri sunucudan anlık olarak yükleniyor.
                  </p>
                </div>
              </div>

              {/* Tam Ekran Oynat Butonu */}
              <button
                onClick={() => onPlayStream(selectedStream)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Yayını Başlat (Tam Ekran)</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6">
              <Tv className="w-16 h-16 stroke-[1.5] text-cyan-500/40 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-white mb-1">Kanal Seçin</h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Yayın akışını başlatmak için sol listeden dilediğiniz kanala tıklayın veya çift tıklayın.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

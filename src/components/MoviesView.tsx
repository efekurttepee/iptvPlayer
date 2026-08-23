import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Heart,
  Play,
  ArrowLeft,
  Film,
  Star,
  Clock,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  User,
  X
} from 'lucide-react';
import { Category, ResumeRecord, VodInfo, VodStream } from '../types';
import { StorageService } from '../services/storage';
import { translateCategory } from '../utils/categoryTranslator';

interface MoviesViewProps {
  categories: Category[];
  streams: VodStream[];
  onBack: () => void;
  onPlayMovie: (movie: VodStream, resumeRecord?: ResumeRecord | null) => void;
  fetchMovieInfo?: (streamId: number | string) => Promise<VodInfo | null>;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  categories,
  streams,
  onBack,
  onPlayMovie,
  fetchMovieInfo,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(() => StorageService.getFavorites().movies);
  const [selectedMovie, setSelectedMovie] = useState<VodStream | null>(null);
  const [movieDetail, setMovieDetail] = useState<VodInfo | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(60);

  useEffect(() => {
    setVisibleLimit(60);
  }, [selectedCategoryId, searchQuery, onlyFavorites]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      setVisibleLimit(prev => Math.min(prev + 40, filteredStreams.length));
    }
  };

  // Resume positions dictionary
  const resumeRecords = useMemo(() => {
    return StorageService.getAllResumeRecords();
  }, [streams]);

  const handleToggleFavorite = (e: React.MouseEvent, streamId: number) => {
    e.stopPropagation();
    const isFav = StorageService.toggleFavorite('movies', streamId);
    if (isFav) {
      setFavorites([...favorites, streamId]);
    } else {
      setFavorites(favorites.filter(id => id !== streamId));
    }
  };

  const handleSelectMovie = async (movie: VodStream) => {
    setSelectedMovie(movie);
    if (fetchMovieInfo) {
      setIsLoadingDetail(true);
      try {
        const detail = await fetchMovieInfo(movie.stream_id);
        setMovieDetail(detail);
      } catch (e) {
        console.warn('Failed to load movie details:', e);
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs} sa ${mins} dk`;
    }
    return `${mins} dk ${secs} sn`;
  };

  const filteredStreams = useMemo(() => {
    return streams.filter(movie => {
      if (selectedCategoryId !== 'all' && movie.category_id !== selectedCategoryId) {
        return false;
      }
      if (onlyFavorites && !favorites.includes(movie.stream_id)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return movie.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [streams, selectedCategoryId, onlyFavorites, favorites, searchQuery]);

  // Check if selected movie has resume record
  const selectedResume = selectedMovie ? resumeRecords[`movie_${selectedMovie.stream_id}`] : null;

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col p-6 overflow-hidden select-none animate-fadeIn">
      {/* Header Bar */}
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
              <Film className="w-6 h-6 text-purple-400" />
              <span>Filmler (VOD)</span>
            </h1>
            <p className="text-xs text-gray-400">
              Toplam {filteredStreams.length} film listeleniyor
            </p>
          </div>
        </div>

        {/* Search & Favorites */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Film adı veya oyuncu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white placeholder-gray-400 text-xs rounded-xl pl-9 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-white/10"
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

      {/* 2 Kolonlu Düzen: Sol Kategoriler | Sağ Film Kartları Izgarası */}
      <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
        
        {/* Kategoriler (3 Kolon) */}
        <div className="col-span-3 glass-panel rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
            Film Kategorileri
          </span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                selectedCategoryId === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Film className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Tüm Filmler</span>
              </div>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                {streams.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = streams.filter(s => s.category_id === cat.category_id).length;
              const isSelected = selectedCategoryId === cat.category_id;
              return (
                <button
                  key={cat.category_id}
                  onClick={() => setSelectedCategoryId(cat.category_id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
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

        {/* Film Kartları Izgarası (9 Kolon) */}
        <div className="col-span-9 glass-panel rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden">
          <div onScroll={handleScroll} className="flex-1 overflow-y-auto pr-1">
            {filteredStreams.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <Film className="w-16 h-16 mb-2 stroke-[1.5] text-gray-500" />
                <span className="text-sm font-medium">Bu kategoride film bulunamadı.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredStreams.slice(0, visibleLimit).map((movie) => {
                  const resume = resumeRecords[`movie_${movie.stream_id}`];
                  const isFav = favorites.includes(movie.stream_id);
                  return (
                    <div
                      key={movie.stream_id}
                      onClick={() => handleSelectMovie(movie)}
                      className="group relative rounded-xl bg-cardDark border border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 flex flex-col"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] w-full bg-black/50 overflow-hidden">
                        {movie.stream_icon ? (
                          <img
                            src={movie.stream_icon}
                            alt={movie.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Film className="w-10 h-10" />
                          </div>
                        )}

                        {/* IMDb Puanı */}
                        {movie.rating && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-yellow-500/40 text-yellow-400 text-[11px] font-extrabold flex items-center space-x-1 shadow">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            <span>{typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}</span>
                          </div>
                        )}

                        {/* Favori Butonu */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, movie.stream_id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-red-400 transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-400 text-red-400' : ''}`} />
                        </button>

                        {/* 🎯 Kaldığı Yer İlerleme Çubuğu */}
                        {resume && resume.percentage > 0 && resume.percentage < 95 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/80">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                              style={{ width: `${resume.percentage}%` }}
                            />
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Film Başlığı */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs font-bold text-white line-clamp-2 leading-tight">
                          {movie.name}
                        </p>
                        {resume && (
                          <span className="text-[10px] text-cyan-300 font-semibold mt-1 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>%{resume.percentage} izlendi</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 🎯 FİLM DETAY VE BAŞLATMA MODALI */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn">
          <div className="glass-modal max-w-2xl w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header & Poster */}
            <div className="relative h-60 w-full bg-black flex items-end p-6 overflow-hidden">
              {/* Arka plan afişi */}
              {selectedMovie.stream_icon && (
                <img
                  src={movieDetail?.info?.cover_big || selectedMovie.stream_icon}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-30 filter blur-sm scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-[#0d1424]/60 to-transparent" />

              {/* Kapat Butonu */}
              <button
                onClick={() => setSelectedMovie(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-gray-300 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 flex space-x-5 items-end">
                <div className="w-24 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black flex-shrink-0">
                  <img
                    src={selectedMovie.stream_icon}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white drop-shadow-md mb-1.5">
                    {selectedMovie.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                    {movieDetail?.info?.genre && (
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 font-semibold">
                        {movieDetail.info.genre}
                      </span>
                    )}
                    {movieDetail?.info?.duration && (
                      <span className="flex items-center space-x-1 text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{movieDetail.info.duration}</span>
                      </span>
                    )}
                    {movieDetail?.info?.releasedate && (
                      <span className="flex items-center space-x-1 text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{movieDetail.info.releasedate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {movieDetail?.info?.plot && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Konu Özeti
                  </span>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {movieDetail.info.plot}
                  </p>
                </div>
              )}

              {movieDetail?.info?.cast && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Oyuncular & Ekip
                  </span>
                  <p className="text-xs text-gray-300">
                    {movieDetail.info.cast}
                  </p>
                </div>
              )}

              {/* 🎯 Kaldığı Yer Bilgi Kartı */}
              {selectedResume && selectedResume.currentTime > 10 && (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Daha önce izlemeye başladınız
                      </span>
                      <span className="text-[11px] text-cyan-300 font-mono">
                        Son Kalınan: {formatDuration(selectedResume.currentTime)} (%{selectedResume.percentage})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Aksiyon Butonları */}
            <div className="p-5 border-t border-white/10 bg-black/40 flex items-center justify-end space-x-3">
              {selectedResume && selectedResume.currentTime > 10 ? (
                <>
                  <button
                    onClick={() => {
                      const movie = selectedMovie;
                      const resume = selectedResume;
                      setSelectedMovie(null);
                      onPlayMovie(movie, resume);
                    }}
                    className="py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/30 flex items-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Kaldığın Yerden Devam Et ({formatDuration(selectedResume.currentTime)})</span>
                  </button>

                  <button
                    onClick={() => {
                      const movie = selectedMovie;
                      StorageService.removeResumePosition(`movie_${movie.stream_id}`);
                      setSelectedMovie(null);
                      onPlayMovie(movie, null);
                    }}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs transition-colors flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Baştan Başla</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    const movie = selectedMovie;
                    setSelectedMovie(null);
                    onPlayMovie(movie, null);
                  }}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-xl shadow-purple-500/30 flex items-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Filmi İzle</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

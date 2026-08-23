import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Heart,
  Play,
  ArrowLeft,
  Clapperboard,
  Star,
  Clock,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { Category, EpisodeInfo, ResumeRecord, SeriesInfoResponse, SeriesItem } from '../types';
import { StorageService } from '../services/storage';
import { translateCategory } from '../utils/categoryTranslator';

interface SeriesViewProps {
  categories: Category[];
  seriesList: SeriesItem[];
  onBack: () => void;
  onPlayEpisode: (
    series: SeriesItem,
    episode: EpisodeInfo,
    seasonNum: number | string,
    allEpisodes: EpisodeInfo[],
    resumeRecord?: ResumeRecord | null
  ) => void;
  fetchSeriesInfo?: (seriesId: number | string) => Promise<SeriesInfoResponse | null>;
}

export const SeriesView: React.FC<SeriesViewProps> = ({
  categories,
  seriesList,
  onBack,
  onPlayEpisode,
  fetchSeriesInfo,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(() => StorageService.getFavorites().series);
  const [visibleLimit, setVisibleLimit] = useState(60);

  useEffect(() => {
    setVisibleLimit(60);
  }, [selectedCategoryId, searchQuery, onlyFavorites]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      setVisibleLimit(prev => Math.min(prev + 40, filteredSeries.length));
    }
  };

  // Selected Series & Season
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [seriesDetail, setSeriesDetail] = useState<SeriesInfoResponse | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const resumeRecords = useMemo(() => {
    return StorageService.getAllResumeRecords();
  }, [seriesList]);

  const handleToggleFavorite = (e: React.MouseEvent, seriesId: number) => {
    e.stopPropagation();
    const isFav = StorageService.toggleFavorite('series', seriesId);
    if (isFav) {
      setFavorites([...favorites, seriesId]);
    } else {
      setFavorites(favorites.filter(id => id !== seriesId));
    }
  };

  const handleSelectSeries = async (series: SeriesItem) => {
    setSelectedSeries(series);
    if (fetchSeriesInfo) {
      setIsLoadingDetail(true);
      try {
        const detail = await fetchSeriesInfo(series.series_id);
        setSeriesDetail(detail);
        if (detail?.seasons && detail.seasons.length > 0) {
          setSelectedSeason(detail.seasons[0].season_number);
        }
      } catch (e) {
        console.warn('Failed to fetch series info:', e);
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

  const filteredSeries = useMemo(() => {
    return seriesList.filter(item => {
      if (selectedCategoryId !== 'all' && item.category_id !== selectedCategoryId) {
        return false;
      }
      if (onlyFavorites && !favorites.includes(item.series_id)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [seriesList, selectedCategoryId, onlyFavorites, favorites, searchQuery]);

  // Current Season Episodes
  const currentEpisodes = useMemo(() => {
    if (!seriesDetail?.episodes) return [];
    return seriesDetail.episodes[String(selectedSeason)] || [];
  }, [seriesDetail, selectedSeason]);

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col p-6 overflow-hidden select-none animate-fadeIn">
      {/* Header */}
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
              <Clapperboard className="w-6 h-6 text-red-400" />
              <span>Diziler</span>
            </h1>
            <p className="text-xs text-gray-400">
              Toplam {filteredSeries.length} dizi listeleniyor
            </p>
          </div>
        </div>

        {/* Search & Favorites */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Dizi adı veya tür ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white placeholder-gray-400 text-xs rounded-xl pl-9 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-red-400 border border-white/10"
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

      {/* Grid Layout: Kategoriler | Dizi Izgarası */}
      <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">
        
        {/* Kategoriler (3 Kolon) */}
        <div className="col-span-3 glass-panel rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
            Dizi Kategorileri
          </span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                selectedCategoryId === 'all'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Clapperboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Tüm Diziler</span>
              </div>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                {seriesList.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = seriesList.filter(s => s.category_id === cat.category_id).length;
              const isSelected = selectedCategoryId === cat.category_id;
              return (
                <button
                  key={cat.category_id}
                  onClick={() => setSelectedCategoryId(cat.category_id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30'
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

        {/* Dizi Kartları Izgarası (9 Kolon) */}
        <div className="col-span-9 glass-panel rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden">
          <div onScroll={handleScroll} className="flex-1 overflow-y-auto pr-1">
            {filteredSeries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                <Clapperboard className="w-16 h-16 mb-2 stroke-[1.5] text-gray-500" />
                <span className="text-sm font-medium">Bu kategoride dizi bulunamadı.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredSeries.slice(0, visibleLimit).map((series) => {
                  const isFav = favorites.includes(series.series_id);
                  return (
                    <div
                      key={series.series_id}
                      onClick={() => handleSelectSeries(series)}
                      className="group relative rounded-xl bg-cardDark border border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/20 flex flex-col"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] w-full bg-black/50 overflow-hidden">
                        {series.cover ? (
                          <img
                            src={series.cover}
                            alt={series.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Clapperboard className="w-10 h-10" />
                          </div>
                        )}

                        {/* Puan */}
                        {series.rating && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-yellow-500/40 text-yellow-400 text-[11px] font-extrabold flex items-center space-x-1 shadow">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            <span>{typeof series.rating === 'number' ? series.rating.toFixed(1) : series.rating}</span>
                          </div>
                        )}

                        {/* Favori */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, series.series_id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-red-400 transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-400 text-red-400' : ''}`} />
                        </button>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Başlık */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs font-bold text-white line-clamp-2 leading-tight">
                          {series.name}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">
                          {series.genre || 'Dizi'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 🎯 DİZİ & BÖLÜM SEÇİM MODALI */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn">
          <div className="glass-modal max-w-4xl w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header & Banner */}
            <div className="relative h-56 w-full bg-black flex items-end p-6 overflow-hidden">
              {selectedSeries.cover && (
                <img
                  src={selectedSeries.cover}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-sm scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1424] via-[#0d1424]/70 to-transparent" />

              <button
                onClick={() => setSelectedSeries(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-gray-300 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 flex space-x-5 items-end">
                <div className="w-24 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black flex-shrink-0">
                  <img
                    src={selectedSeries.cover}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white drop-shadow-md mb-1">
                    {selectedSeries.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
                    {selectedSeries.genre && (
                      <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md border border-red-500/30 font-semibold">
                        {selectedSeries.genre}
                      </span>
                    )}
                    {selectedSeries.releaseDate && (
                      <span className="flex items-center space-x-1 text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{selectedSeries.releaseDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sezon Seçici & Bölümler */}
            <div className="p-6 overflow-hidden flex flex-col flex-1 min-h-0">
              
              {/* Sezon Sekmeleri */}
              <div className="flex items-center space-x-2 pb-3 border-b border-white/10 overflow-x-auto mb-4">
                {seriesDetail?.seasons && seriesDetail.seasons.length > 0 ? (
                  seriesDetail.seasons.map((s) => (
                    <button
                      key={s.season_number}
                      onClick={() => setSelectedSeason(s.season_number)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                        selectedSeason === s.season_number
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30'
                          : 'bg-white/10 text-gray-300 hover:bg-white/15'
                      }`}
                    >
                      {s.name || `${s.season_number}. Sezon`} ({s.episode_count || 'Bölümler'})
                    </button>
                  ))
                ) : (
                  <button className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white">
                    1. Sezon
                  </button>
                )}
              </div>

              {/* Bölüm Listesi */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {currentEpisodes.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-xs">
                    Bu sezona ait bölüm bilgisi bulunamadı veya yükleniyor...
                  </div>
                ) : (
                  currentEpisodes.map((ep) => {
                    const recordKey = `series_${selectedSeries.series_id}_s${selectedSeason}_e${ep.episode_num}`;
                    const resume = resumeRecords[recordKey];
                    return (
                      <div
                        key={ep.id}
                        onClick={() => {
                          const series = selectedSeries;
                          setSelectedSeries(null);
                          onPlayEpisode(series, ep, selectedSeason, currentEpisodes, resume);
                        }}
                        className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 flex items-center justify-between cursor-pointer transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all shadow-md">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>

                          <div className="truncate flex-1">
                            <p className="text-xs font-bold text-white group-hover:text-red-300 transition-colors truncate">
                              {ep.title}
                            </p>
                            {ep.info?.plot && (
                              <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                                {ep.info.plot}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 🎯 Kaldığı Süre & Toplam Süre */}
                        <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
                          {resume && resume.currentTime > 10 && resume.percentage < 95 && (
                            <span className="text-[11px] text-cyan-300 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(resume.currentTime)} (%{resume.percentage})</span>
                            </span>
                          )}

                          {ep.info?.duration && (
                            <span className="text-xs text-gray-400 font-mono">
                              {ep.info.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

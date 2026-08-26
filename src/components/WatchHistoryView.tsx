import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Play,
  Trash2,
  ArrowLeft,
  Film,
  Clapperboard,
  Clock,
  Calendar,
  Search,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { ResumeRecord } from '../types';
import { SmartPoster } from './SmartPoster';

interface WatchHistoryViewProps {
  historyItems: ResumeRecord[];
  onBack: () => void;
  onPlayItem: (item: ResumeRecord) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export const WatchHistoryView: React.FC<WatchHistoryViewProps> = ({
  historyItems,
  onBack,
  onPlayItem,
  onRemoveItem,
  onClearAll,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'series'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '00:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Bugün, ${timeStr}`;
    }
    return `${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  };

  // Sort by most recently watched (descending timestamp)
  const sortedItems = useMemo(() => {
    return [...historyItems].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [historyItems]);

  const filteredItems = useMemo(() => {
    return sortedItems.filter((item) => {
      // Type tab filter
      if (activeTab === 'movies' && item.type !== 'movie') return false;
      if (activeTab === 'series' && item.type !== 'episode') return false;
      
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(q);
        const subTitleMatch = item.subTitle?.toLowerCase().includes(q);
        return titleMatch || subTitleMatch;
      }
      return true;
    });
  }, [sortedItems, activeTab, searchQuery]);

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col p-6 overflow-hidden select-none animate-fadeIn">
      {/* Üst Bar */}
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
              <RotateCcw className="w-6 h-6 text-emerald-400" />
              <span>İzleme Geçmişi & Tekrar İzle</span>
            </h1>
            <p className="text-xs text-gray-400">
              Son izlediğiniz tüm film ve dizi bölümleri en son izlenene göre sıralanır
            </p>
          </div>
        </div>

        {/* Filtreler, Arama & Temizle */}
        <div className="flex items-center space-x-3">
          {/* Arama */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Geçmişte ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/10 text-white placeholder-gray-400 text-xs rounded-xl pl-9 pr-4 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-white/10"
            />
          </div>

          {/* Sekmeler */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'all' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tümü ({sortedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                activeTab === 'movies' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Filmler</span>
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                activeTab === 'series' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Diziler</span>
            </button>
          </div>

          {/* Tümünü Temizle */}
          {sortedItems.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Tüm izleme geçmişinizi silmek istediğinize emin misiniz?')) {
                  onClearAll();
                }
              }}
              className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Geçmişi Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* İçerik Izgarası */}
      <div className="flex-1 glass-panel rounded-2xl p-5 min-h-0 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
            <RotateCcw className="w-16 h-16 mb-3 stroke-[1.5] text-emerald-500/40 animate-pulse" />
            <h3 className="text-base font-bold text-white mb-1">İzleme Geçmişi Boş</h3>
            <p className="text-xs text-gray-400 max-w-sm text-center">
              İzlediğiniz film ve dizi bölümleri otomatik olarak burada listelenecek ve nerede kaldıysanız oradan devam edebileceksiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const isMovie = item.type === 'movie';
              return (
                <div
                  key={item.id}
                  onClick={() => onPlayItem(item)}
                  className="group relative rounded-2xl bg-cardDark/90 border border-white/10 hover:border-emerald-500/50 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/20 flex flex-col"
                >
                  {/* Poster & Önizleme */}
                  <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
                    <SmartPoster
                      initialUrl={item.cover}
                      title={item.title}
                      isSeries={!isMovie}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Tür Rozeti */}
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1">
                      {isMovie ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 shadow">
                          <Film className="w-3 h-3" />
                          <span>FİLM</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-red-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 shadow">
                          <Clapperboard className="w-3 h-3" />
                          <span>DİZİ</span>
                        </span>
                      )}
                    </div>

                    {/* Silme Butonu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-gray-300 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                      title="Geçmişten Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 🎯 Kaldığı Yer İlerleme Çubuğu */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/80">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
                        style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                      />
                    </div>

                    {/* Hover Play Butonu */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 transform scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Detaylar & Süre Bilgileri */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                        {item.title}
                      </h4>
                      {item.subTitle && (
                        <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5 font-medium">
                          {item.subTitle}
                        </p>
                      )}
                    </div>

                    {/* Süre Bilgileri Kutusu */}
                    <div className="bg-white/[0.04] p-2.5 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
                      
                      {/* Nerede Kalındı */}
                      <div className="flex justify-between items-center text-emerald-400 font-semibold">
                        <span className="flex items-center space-x-1 text-gray-400 font-medium">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>Kalınan Yer:</span>
                        </span>
                        <span className="font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {formatTime(item.currentTime)}
                        </span>
                      </div>

                      {/* Toplam Süre */}
                      <div className="flex justify-between items-center text-gray-300">
                        <span className="text-gray-400 font-medium">Toplam Süre:</span>
                        <span className="font-mono font-bold">{formatTime(item.duration)}</span>
                      </div>

                      {/* İlerleme Oranı & Son İzleme */}
                      <div className="flex justify-between items-center pt-1 border-t border-white/5 text-[10px] text-gray-400">
                        <span className="text-cyan-300 font-semibold">%{item.percentage} tamamlandı</span>
                        <span>{formatDate(item.updatedAt)}</span>
                      </div>

                    </div>

                    {/* Devam Et Butonu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayItem(item);
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Kaldığı Yerden İzle ({formatTime(item.currentTime)})</span>
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

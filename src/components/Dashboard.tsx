import React from 'react';
import {
  Play,
  Film,
  Tv,
  History,
  Settings,
  ListVideo,
  Clapperboard,
  RotateCcw,
  Sparkles,
  Clock,
  X
} from 'lucide-react';
import { ResumeRecord, UserInfo, ViewMode, XtreamCredentials } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewMode) => void;
  activePlaylist: XtreamCredentials | null;
  userInfo: UserInfo | null;
  recentWatches: ResumeRecord[];
  onResumeItem: (item: ResumeRecord) => void;
  onDismissRecent?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  activePlaylist,
  userInfo,
  recentWatches,
  onResumeItem,
  onDismissRecent,
}) => {
  // Format expiration date
  const formatExpDate = () => {
    if (!userInfo?.exp_date) return 'Sınırsız';
    const timestamp = parseInt(userInfo.exp_date, 10);
    if (isNaN(timestamp) || timestamp <= 0) return 'Sınırsız';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-[calc(100vh-120px)] flex flex-col justify-between px-10 py-3 overflow-hidden select-none">
      {/* Ana Kartlar Izgarası (Grid Layout matching screenshot) */}
      <div className="w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-12 gap-5 h-[420px] lg:h-[460px] max-w-7xl mx-auto w-full">
          
          {/* 1. CANLI TV (Büyük Sol Kart - 4 Kolon, Tam Yükseklik) */}
          <div
            onClick={() => onNavigate('live')}
            role="button"
            tabIndex={0}
            className="col-span-4 h-full rounded-2xl card-live-tv p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.01] group relative overflow-hidden"
          >
            {/* Özel Sade Canlı TV İkonu */}
            <div className="w-24 h-24 mb-6 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>

            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-wide">
              Canlı TV
            </h2>
          </div>

          {/* Sağ Alan (8 Kolon: Üstte Filmler & Diziler, Altta Küçük Kartlar) */}
          <div className="col-span-8 h-full flex flex-col gap-4">
            
            {/* Üst Satır: FİLMLER & DİZİLER */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              
              {/* 2. FİLMLER */}
              <div
                onClick={() => onNavigate('movies')}
                role="button"
                tabIndex={0}
                className="h-full rounded-2xl card-movies p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.01] group relative overflow-hidden"
              >
                <div className="w-20 h-20 mb-4 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Film className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-wide">
                  Filmler
                </h2>
              </div>

              {/* 3. DİZİLER */}
              <div
                onClick={() => onNavigate('series')}
                role="button"
                tabIndex={0}
                className="h-full rounded-2xl card-series p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.01] group relative overflow-hidden"
              >
                <div className="w-20 h-20 mb-4 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Clapperboard className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-wide">
                  Diziler
                </h2>
              </div>
            </div>

            {/* Alt Satır: TEKRAR İZLE, AYARLAR, HESAP DEĞİŞTİR */}
            <div className="grid grid-cols-3 gap-4 h-24 lg:h-28">
              
              {/* 4. TEKRAR İZLE */}
              <div
                onClick={() => onNavigate('catchup')}
                role="button"
                tabIndex={0}
                className="h-full rounded-xl card-sub-green px-4 flex items-center justify-center space-x-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-base font-semibold text-white tracking-wide">
                  Tekrar İzle
                </span>
              </div>

              {/* 5. AYARLAR */}
              <div
                onClick={() => onNavigate('settings')}
                role="button"
                tabIndex={0}
                className="h-full rounded-xl card-sub-green px-4 flex items-center justify-center space-x-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-base font-semibold text-white tracking-wide">
                  Ayarlar
                </span>
              </div>

              {/* 6. HESAP DEĞİŞTİR */}
              <div
                onClick={() => onNavigate('playlists')}
                role="button"
                tabIndex={0}
                className="h-full rounded-xl card-sub-green px-4 flex items-center justify-center space-x-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <ListVideo className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-base font-semibold text-white tracking-wide">
                  Hesap Değiştir
                </span>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Alt Durum Çubuğu (Footer matching screenshot) */}
      <footer className="w-full max-w-7xl mx-auto flex items-center justify-between text-xs font-medium text-gray-400 pt-2 pb-1 border-t border-white/[0.06]">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-white/90 font-semibold">Mevcut Çalma Listesi:</span>
            <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {activePlaylist?.name || activePlaylist?.username || 'Giriş Yapılmadı'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-white/90 font-semibold">Abonelik Bitiş Tarihi:</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {formatExpDate()}
            </span>
          </div>
        </div>

        <div className="text-gray-400 font-medium tracking-wider">
          v 1.0.4
        </div>
      </footer>
    </div>
  );
};

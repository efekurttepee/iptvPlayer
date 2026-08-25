import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  MessageSquare,
  RefreshCw,
  Layers,
  Minus,
  Square,
  X
} from 'lucide-react';
import { UserInfo } from '../types';

interface HeaderProps {
  userInfo?: UserInfo | null;
  onOpenSearch: () => void;
  onOpenAccount: () => void;
  onOpenNotifications: () => void;
  onRefreshData: () => void;
  onOpenPlaylists: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userInfo,
  onOpenSearch,
  onOpenAccount,
  onOpenNotifications,
  onRefreshData,
  onOpenPlaylists,
  isRefreshing = false,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Format time: 23:37
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);

      // Format Turkish date: Salı, 25 Ağustos 2026
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const dayName = days[now.getDay()];
      const day = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      setDateStr(`${dayName}, ${day} ${monthName} ${year}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    (window as any).electronAPI?.minimize();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximize();
  };

  const handleClose = () => {
    (window as any).electronAPI?.close();
  };

  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

  return (
    <header
      onDoubleClick={handleMaximize}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className={`relative w-full px-8 pt-4 pb-2 flex items-center justify-between z-30 select-none cursor-default ${
        isMac ? 'pl-24' : 'pl-8'
      }`}
    >
      {/* Sol Alan: Logo, Tarih ve Canlı Saat */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center space-x-6"
      >
        {/* Özel IPTV Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="relative w-11 h-9 border border-white/20 rounded-xl flex flex-col items-center justify-center bg-[#151922]">
            <span className="text-[11px] font-black tracking-widest text-white leading-none">IPTV</span>
            <span className="text-[7px] font-bold text-gray-400 mt-0.5 tracking-wider">PRO</span>
          </div>
        </div>

        {/* Tarih ve Dijital Saat */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-400 tracking-wide">
            {dateStr || 'Salı, 25 Ağustos 2026'}
          </span>
          <span className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-none">
            {timeStr || '18:21'}
          </span>
        </div>
      </div>

      {/* Sağ Alan: İşlem İkonları & Pencere Kontrolleri */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center space-x-3 pointer-events-auto"
      >
        <div className="flex items-center space-x-1.5 bg-[#151821] p-1.5 rounded-full border border-[#242938]">
          {/* Arama */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSearch();
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Ara (Kanal, Film, Dizi)"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Profil / Hesap Bilgisi */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAccount();
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Hesap & Abonelik Bilgileri"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <User className="w-4.5 h-4.5" />
          </button>

          {/* Bildirimler / Mesajlar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNotifications();
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Duyurular & Bildirimler"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </button>

          {/* Listeyi Yenile */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRefreshData();
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="İçerik Listesini Yenile"
            disabled={isRefreshing}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer ${
              isRefreshing ? 'animate-spin text-white' : ''
            }`}
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>

          {/* Çalma Listeleri / Hesap Değiştir */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPlaylists();
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Çalma Listeleri & Hesap Değiştir"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <Layers className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Electron Pencere Kontrolleri */}
        {(window as any).electronAPI?.isElectron && (
          <div
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="flex items-center space-x-1 ml-3 pl-3 border-l border-white/10"
          >
            <button
              type="button"
              onClick={handleMinimize}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleMaximize}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

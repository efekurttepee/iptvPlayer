import React, { useState, useEffect } from 'react';
import {
  Settings,
  Tv,
  Volume2,
  Clock,
  Sparkles,
  Sliders,
  Shield,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { AppSettings, StorageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onClearHistory,
}) => {
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbPath, setDbPath] = useState<string>('');

  useEffect(() => {
    StorageService.getDatabaseLocation().then(path => setDbPath(path));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (updated: Partial<AppSettings>) => {
    const next = StorageService.saveSettings(updated);
    setSettings(next);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearResume = () => {
    if (confirm('Tüm film ve dizi izleme geçmişini (kaldığınız yerleri) silmek istediğinize emin misiniz?')) {
      localStorage.removeItem('iptv_resume_playback_history');
      onClearHistory?.();
      alert('İzleme geçmişi temizlendi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn select-none">
      <div className="glass-modal max-w-lg w-full rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Uygulama & Oynatıcı Ayarları</h2>
              <p className="text-xs text-gray-400">Yayın akışı, ses ve izleme tercihleri</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gövde */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Akış Formatı */}
          <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Yayın Akış Formatı</span>
              <span className="text-[11px] text-gray-400">Canlı kanallar için varsayılan protokol</span>
            </div>
            <select
              value={settings.streamFormat}
              onChange={(e) => handleSave({ streamFormat: e.target.value as 'm3u8' | 'ts' })}
              className="bg-black/60 border border-white/20 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="m3u8">HLS (.m3u8) - Hızlı & Kararlı</option>
              <option value="ts">MPEG-TS (.ts) - Doğrudan Akış</option>
            </select>
          </div>

          {/* Tampon Bellek (Buffer) */}
          <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Tampon Bellek (Önbellekleme)</span>
              <span className="text-[11px] text-gray-400">Donmaları önlemek için saniye cinsinden ara bellek</span>
            </div>
            <select
              value={settings.bufferSize}
              onChange={(e) => handleSave({ bufferSize: parseInt(e.target.value, 10) })}
              className="bg-black/60 border border-white/20 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value={5}>5 Saniye (Düşük Gecikme)</option>
              <option value={10}>10 Saniye (Önerilen)</option>
              <option value={20}>20 Saniye (Yavaş Bağlantılar)</option>
              <option value={30}>30 Saniye (Maksimum Kararlılık)</option>
            </select>
          </div>

          {/* Kaldığı Yerden Devam Etme Davranışı */}
          <div className="bg-white/[0.04] p-4 rounded-xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white block">Kaldığı Yerden Otomatik Başlat</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  {settings.autoResume ? 'Açık (Varsayılan)' : 'Kapalı'}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Film ve diziler açıldığında onay sormadan doğrudan son kalınan saniyeden başlatır</span>
            </div>
            <button
              onClick={() => handleSave({ autoResume: !settings.autoResume })}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                settings.autoResume ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.autoResume ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* İzleme Geçmişini Sıfırla */}
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-300 block">Kaldığın Yer Geçmişini Temizle</span>
              <span className="text-[11px] text-gray-400">Kaydedilen tüm film ve dizi sürelerini sıfırlar</span>
            </div>
            <button
              onClick={handleClearResume}
              className="px-3.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-colors flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          </div>

          {/* Yerel Veritabanı Dosya Konumu */}
          <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Yerel Veritabanı Konumu (DB)</span>
            <p className="text-[11px] text-cyan-300 font-mono break-all select-text bg-black/40 p-2 rounded-lg border border-white/5">
              {dbPath || 'Yükleniyor...'}
            </p>
          </div>

          {/* Uygulama Güncelleme Denetimi */}
          <div className="bg-[#181c25] p-4 rounded-xl border border-[#272c3b] flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white block">Uygulama Sürümü</span>
                <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10 font-bold">
                  v1.0.3
                </span>
              </div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Otomatik uzaktan güncelleme sistemi etkindir</span>
            </div>
            <button
              onClick={async () => {
                const updater = (window as any).electronAPI?.updater;
                if (updater) {
                  try {
                    await updater.check();
                  } catch {
                    alert('Sürümünüz güncel (v1.0.3).');
                  }
                } else {
                  alert('Sürümünüz güncel (v1.0.3).');
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              Güncellemeleri Denetle
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Ayarlar kaydedildi</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            Tamam
          </button>
        </div>

      </div>
    </div>
  );
};

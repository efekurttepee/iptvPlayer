import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  RotateCw,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface UpdateData {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

export const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateData | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const electronUpdater = (window as any).electronAPI?.updater;
    if (!electronUpdater) return;

    // Listen for available updates
    const unsubAvailable = electronUpdater.onAvailable((data: any) => {
      setUpdateAvailable({
        version: data.version,
        releaseDate: data.releaseDate,
        releaseNotes: data.releaseNotes,
      });
      setIsDismissed(false);
    });

    // Listen for download progress
    const unsubProgress = electronUpdater.onProgress((data: any) => {
      setDownloadProgress(data.percent);
      setIsDownloading(true);
    });

    // Listen for download complete
    const unsubDownloaded = electronUpdater.onDownloaded((data: any) => {
      setIsDownloaded(true);
      setIsDownloading(false);
      setDownloadProgress(100);
    });

    // Listen for error
    const unsubError = electronUpdater.onError?.((err: any) => {
      setIsDownloading(false);
      console.warn('Updater download error:', err);
    });

    // Check on startup
    electronUpdater.check().catch(() => {});

    return () => {
      unsubAvailable?.();
      unsubProgress?.();
      unsubDownloaded?.();
      unsubError?.();
    };
  }, []);

  if (!updateAvailable || isDismissed) return null;

  const handleStartDownload = () => {
    setIsDownloading(true);
    (window as any).electronAPI?.updater?.download?.();
  };

  const handleInstallAndRestart = () => {
    (window as any).electronAPI?.updater?.install?.();
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%] glass-modal rounded-2xl border border-cyan-500/40 p-4 shadow-2xl shadow-cyan-500/30 animate-fadeIn pointer-events-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-extrabold text-white">Yeni Güncelleme Mevcut!</h4>
              <span className="text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                v{updateAvailable.version}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 line-clamp-2">
              {updateAvailable.releaseNotes || 'Yeni özellikler, kanal optimizasyonları ve hata düzeltmeleri.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="w-7 h-7 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          title="Daha Sonra Hatırlat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* İndirme İlerleme Çubuğu */}
      {isDownloading && downloadProgress !== null && (
        <div className="mt-3 space-y-1.5">
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-mono">
            <span>İndiriliyor...</span>
            <span className="text-cyan-400 font-bold">%{downloadProgress}</span>
          </div>
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="mt-3.5 flex items-center justify-end space-x-2.5">
        <button
          onClick={() => setIsDismissed(true)}
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold transition-colors"
        >
          Daha Sonra
        </button>

        {isDownloaded ? (
          <button
            onClick={handleInstallAndRestart}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/30 flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Yeniden Başlat ve Kur</span>
          </button>
        ) : isDownloading ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-xl bg-cyan-600/50 text-white/80 text-xs font-bold flex items-center space-x-1.5 cursor-wait"
          >
            <RotateCw className="w-4 h-4 animate-spin" />
            <span>İndiriliyor...</span>
          </button>
        ) : (
          <button
            onClick={handleStartDownload}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/30 flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Şimdi Güncelle ve İndir</span>
          </button>
        )}
      </div>
    </div>
  );
};

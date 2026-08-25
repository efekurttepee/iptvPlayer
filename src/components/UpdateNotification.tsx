import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  RotateCw,
  X,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface UpdateData {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface UpToDateData {
  version: string;
  message?: string;
}

export const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateData | null>(null);
  const [upToDateInfo, setUpToDateInfo] = useState<UpToDateData | null>(null);
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
      setUpToDateInfo(null);
      setIsDismissed(false);
    });

    // Listen for up-to-date notification (Every launch or check)
    const unsubNotAvailable = electronUpdater.onNotAvailable((data: any) => {
      setUpToDateInfo({
        version: data.version || '1.0.3',
        message: data.message || 'Sürümünüz güncel.',
      });

      // Auto-dismiss "Sürümünüz Güncel" toast after 4.5 seconds
      setTimeout(() => {
        setUpToDateInfo((prev) => (prev ? null : null));
      }, 4500);
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

    // Automatically check on startup
    electronUpdater.check().catch(() => {});

    return () => {
      unsubAvailable?.();
      unsubNotAvailable?.();
      unsubProgress?.();
      unsubDownloaded?.();
      unsubError?.();
    };
  }, []);

  const handleStartDownload = () => {
    setIsDownloading(true);
    (window as any).electronAPI?.updater?.download?.();
  };

  const handleInstallAndRestart = () => {
    (window as any).electronAPI?.updater?.install?.();
  };

  return (
    <>
      {/* 1. Sürüm Güncel Bildirimi (Otomatik Açılışta veya Denetlemede Sağ Üst Toast) */}
      {upToDateInfo && !updateAvailable && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-3 bg-[#161a23] border border-[#2b3244] px-4 py-3 rounded-xl shadow-xl animate-fadeIn pointer-events-auto max-w-sm">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] text-gray-200 border border-white/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 pr-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white">Sürümünüz Güncel</span>
              <span className="text-[10px] font-bold bg-white/10 text-gray-300 border border-white/10 px-1.5 py-0.2 rounded">
                v{upToDateInfo.version}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">En son IPTV Player Pro sürümünü kullanıyorsunuz.</p>
          </div>
          <button
            onClick={() => setUpToDateInfo(null)}
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Yeni Sürüm Mevcut Bildirimi (Açılışta veya Denetlemede Üst Banner) */}
      {updateAvailable && !isDismissed && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%] bg-[#141720] rounded-xl border border-[#272c3b] p-4 shadow-2xl animate-fadeIn pointer-events-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white">Yeni Güncelleme Mevcut!</h4>
                  <span className="text-[10px] font-bold bg-white/10 text-gray-300 border border-white/10 px-2 py-0.5 rounded-full">
                    v{updateAvailable.version}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {updateAvailable.releaseNotes || 'Yeni özellikler ve kararlılık iyileştirmeleri.'}
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
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>İndiriliyor...</span>
                <span className="text-gray-200 font-bold">%{downloadProgress}</span>
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
      )}
    </>
  );
};

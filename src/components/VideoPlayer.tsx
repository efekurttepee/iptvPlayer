import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  SkipForward,
  Layers,
  Settings,
  List,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ActivePlayingItem, EpisodeInfo, LiveStream, ResumeRecord } from '../types';
import { StorageService } from '../services/storage';

interface VideoPlayerProps {
  item: ActivePlayingItem;
  onClose: () => void;
  onSelectNextEpisode?: (episode: EpisodeInfo) => void;
  onSelectChannel?: (channel: LiveStream) => void;
  channelList?: LiveStream[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  item,
  onClose,
  onSelectNextEpisode,
  onSelectChannel,
  channelList,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 🔊 Volume Memory (Kanal / Dizi / Filme Özel Ses Hafızası)
  const initialVol = StorageService.getVolumeForItem(item.id);
  const [volume, setVolume] = useState(() => initialVol.volume);
  const [isMuted, setIsMuted] = useState(() => initialVol.isMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'fit' | 'fill' | '16:9' | '4:3'>('fit');
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resume Prompt & Auto-Resume State
  const [resumePrompt, setResumePrompt] = useState<ResumeRecord | null>(null);
  const [autoResumeToast, setAutoResumeToast] = useState<ResumeRecord | null>(null);
  const [hasDecidedResume, setHasDecidedResume] = useState(false);
  const pendingSeekRef = useRef<number | null>(null);

  const isLive = item.type === 'live';

  // Format seconds to HH:MM:SS
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

  // Check for existing resume timestamp on load
  useEffect(() => {
    if (isLive) {
      setHasDecidedResume(true);
      return;
    }

    const settings = StorageService.getSettings();
    const saved = StorageService.getResumePosition(item.id);

    if (saved && saved.currentTime > 10) {
      if (settings.autoResume) {
        // Otomatik kaldığı yerden başlat
        pendingSeekRef.current = saved.currentTime;
        setAutoResumeToast(saved);
        setHasDecidedResume(true);
        // Toast'ı 5 saniye sonra kaldır
        const timer = setTimeout(() => setAutoResumeToast(null), 5000);
        return () => clearTimeout(timer);
      } else {
        // Kullanıcıya sor
        setResumePrompt(saved);
      }
    } else {
      setHasDecidedResume(true);
    }
  }, [item.id, isLive]);

  // Video Stream Setup (Hls.js or Native HTML5)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = item.url;
    const isHls = streamUrl.includes('.m3u8') || isLive;

    const settings = StorageService.getSettings();
    const saved = StorageService.getResumePosition(item.id);
    const resumeTime = (saved && saved.currentTime > 5 && settings.autoResume) ? saved.currentTime : -1;

    let hasAppliedInitialSeek = false;

    const applyPendingSeek = () => {
      if (hasAppliedInitialSeek) return;
      if (pendingSeekRef.current !== null && video) {
        hasAppliedInitialSeek = true;
        const target = pendingSeekRef.current;
        pendingSeekRef.current = null;
        try {
          video.currentTime = target;
          setCurrentTime(target);
        } catch (e) {
          console.warn('Seek notice:', e);
        }
      } else if (resumeTime > 0 && !isHls && video) {
        hasAppliedInitialSeek = true;
        try {
          video.currentTime = resumeTime;
          setCurrentTime(resumeTime);
        } catch (e) {}
      }
      setIsLoading(false);
    };

    let retryCount = 0;

    const safePlay = () => {
      if (!video) return;
      const p = video.play();
      if (p !== undefined) {
        p.catch((err: any) => {
          if (err?.name !== 'AbortError') {
            console.warn('Playback notice:', err);
          }
        });
      }
    };

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      applyPendingSeek();
    };

    const handleDurationChange = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      applyPendingSeek();
    };

    const handleSeeked = () => {
      setIsLoading(false);
      if (video) setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('seeked', handleSeeked);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        startPosition: resumeTime > 0 ? resumeTime : -1,
        backBufferLength: 60,
        manifestLoadingMaxRetry: 3,
        levelLoadingMaxRetry: 3,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setErrorMessage(null);
        applyPendingSeek();
        safePlay();
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_e, data) => {
        setIsLoading(false);
        if (data?.details?.totalduration) {
          setDuration(data.details.totalduration);
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              retryCount++;
              if (retryCount <= 2) {
                hls.startLoad();
              } else {
                setErrorMessage('Bu yayın akışına ulaşılamıyor (Yayın çevrimdışı veya adres geçersiz).');
                setIsLoading(false);
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setErrorMessage('Yayın akışı başlatılamadı. Yayın adresi geçersiz veya çevrimdışı.');
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      // Native MP4 / MKV / HLS in Safari
      video.src = streamUrl;
      video.load();
      safePlay();
    }

    const onNativeError = () => {
      setIsLoading(false);
      setErrorMessage('Video oynatılamadı. Yayın adresi geçersiz veya sunucu çevrimdışı.');
    };

    video.addEventListener('error', onNativeError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', onNativeError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [item.url, isLive]);

  // Save Resume Playback Checkpoint periodically
  const saveCurrentProgress = useCallback(() => {
    if (isLive || !videoRef.current) return;
    const time = videoRef.current.currentTime;
    const dur = videoRef.current.duration;

    if (dur > 0 && time > 5) {
      StorageService.saveResumePosition({
        id: item.id,
        streamId: item.streamId,
        type: item.type === 'episode' ? 'episode' : 'movie',
        title: item.title,
        subTitle: item.subTitle,
        url: item.url,
        seriesId: item.seriesId,
        seasonNum: item.seasonNum,
        episodeNum: item.episodeNum,
        cover: item.cover,
        extension: item.extension,
        currentTime: Math.floor(time),
        duration: Math.floor(dur),
        percentage: Math.round((time / dur) * 100),
      });
    }
  }, [item, isLive]);

  // Periodic Save interval (every 4 seconds)
  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(saveCurrentProgress, 4000);
    return () => {
      clearInterval(interval);
      saveCurrentProgress();
    };
  }, [saveCurrentProgress, isLive]);

  // Handle Resume Prompt Decisions
  const handleApplyResume = () => {
    if (resumePrompt && videoRef.current) {
      const target = resumePrompt.currentTime;
      try {
        videoRef.current.currentTime = target;
        setCurrentTime(target);
      } catch (e) {}
      if (hlsRef.current) {
        try {
          hlsRef.current.startLoad(target);
        } catch {}
      }
    }
    setResumePrompt(null);
    setHasDecidedResume(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleStartFromBeginning = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    StorageService.removeResumePosition(item.id);
    setResumePrompt(null);
    setHasDecidedResume(true);
    videoRef.current?.play().catch(() => {});
  };

  // Video Event Handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (isLoading && video.currentTime > 0) {
      setIsLoading(false);
    }
    if (!isNaN(video.duration)) {
      setDuration(video.duration);
    }
    if (video.buffered.length > 0) {
      setBufferedEnd(video.buffered.end(video.buffered.length - 1));
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play()?.catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      saveCurrentProgress();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      saveCurrentProgress();
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      saveCurrentProgress();
    }
  };

  // 🔊 Synchronize volume when changing channel/video
  useEffect(() => {
    const volData = StorageService.getVolumeForItem(item.id);
    setVolume(volData.volume);
    setIsMuted(volData.isMuted);
    if (videoRef.current) {
      videoRef.current.volume = volData.volume;
      videoRef.current.muted = volData.isMuted;
    }
  }, [item.id]);

  const handleVolumeChange = (newVol: number) => {
    const vol = Math.max(0, Math.min(1, newVol));
    const muted = vol === 0;
    setVolume(vol);
    setIsMuted(muted);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = muted;
    }
    StorageService.saveVolumeForItem(item.id, vol, muted);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted && volume === 0) {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
        StorageService.saveVolumeForItem(item.id, 0.5, false);
      } else {
        StorageService.saveVolumeForItem(item.id, volume, newMuted);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Auto Hide Controls
  const triggerControlsActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSidebar && !resumePrompt) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      triggerControlsActivity();
      if (resumePrompt) {
        if (e.key === 'Enter') handleApplyResume();
        if (e.key === 'Escape') handleStartFromBeginning();
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(volume - 0.05);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
          e.preventDefault();
          if (showSidebar) {
            setShowSidebar(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            saveCurrentProgress();
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, showSidebar, resumePrompt, saveCurrentProgress, onClose]);

  // Aspect ratio class helper
  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case 'fill':
        return 'w-full h-full object-fill';
      case '16:9':
        return 'w-full h-full object-contain aspect-video';
      case '4:3':
        return 'w-full h-full object-contain aspect-[4/3]';
      case 'fit':
      default:
        return 'w-full h-full object-contain';
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerControlsActivity}
      onClick={triggerControlsActivity}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className={getAspectRatioStyle()}
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => {
          if (isPlaying) setIsLoading(true);
        }}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onError={() => {
          setIsLoading(false);
          setErrorMessage('Yayın akışı yüklenirken bir hata oluştu.');
        }}
        onClick={togglePlay}
      />

      {/* 🎯 Otomatik Kaldığı Yerden Devam Bildirimi (Floating Toast) */}
      {autoResumeToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md border border-cyan-500/50 px-5 py-2.5 rounded-2xl shadow-2xl shadow-cyan-500/20 flex items-center space-x-3 text-xs animate-fadeIn pointer-events-auto">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>Kaldığınız Yerden Devam Ediliyor:</span>
          </div>
          <span className="text-white font-mono font-bold bg-white/10 px-2 py-0.5 rounded">
            {formatTime(autoResumeToast.currentTime)} (%{autoResumeToast.percentage})
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) videoRef.current.currentTime = 0;
              StorageService.removeResumePosition(item.id);
              setAutoResumeToast(null);
            }}
            className="px-2.5 py-1 bg-white/15 hover:bg-red-500/30 hover:border-red-500/50 border border-transparent rounded-xl text-gray-200 hover:text-white font-bold text-[11px] transition-all flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Baştan Başla</span>
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && !errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
          <span className="text-white text-sm font-semibold tracking-wider">Yayın Yükleniyor...</span>
        </div>
      )}

      {/* Center Play Button when paused and ready */}
      {!isPlaying && !isLoading && !errorMessage && !resumePrompt && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer group bg-black/20"
        >
          <div className="w-20 h-20 rounded-full bg-cyan-500/30 hover:bg-cyan-500/50 border border-cyan-400/50 backdrop-blur-md flex items-center justify-center text-white transition-all transform group-hover:scale-110 shadow-2xl shadow-cyan-500/30">
            <Play className="w-10 h-10 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Yayın Açılamadı</h3>
          <p className="text-sm text-gray-300 max-w-md mb-6">{errorMessage}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setErrorMessage(null);
                setIsLoading(true);
                videoRef.current?.load();
              }}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors"
            >
              Tekrar Dene
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      )}

      {/* 🎯 RESUME PLAYBACK MODAL PROMPT (Kaldığı Yerden Devam Et Diyaloğu) */}
      {resumePrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-6 animate-fadeIn">
          <div className="glass-modal max-w-md w-full p-6 rounded-2xl border border-cyan-500/30 shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/40 animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-1">
              Kaldığınız Yerden Devam Edin
            </h3>
            <p className="text-xs text-cyan-300 font-medium mb-4">
              {item.title} {item.subTitle ? `• ${item.subTitle}` : ''}
            </p>

            <div className="w-full bg-white/[0.06] p-4 rounded-xl border border-white/10 mb-6 flex flex-col space-y-2">
              <div className="flex justify-between text-xs text-gray-300 font-semibold">
                <span>Son Kalınan Yer:</span>
                <span className="text-cyan-400 font-mono font-bold text-sm">
                  {formatTime(resumePrompt.currentTime)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Toplam Süre:</span>
                <span className="font-mono">{formatTime(resumePrompt.duration)}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ width: `${resumePrompt.percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-400 text-right font-medium">
                %{resumePrompt.percentage} tamamlandı
              </span>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex w-full space-x-3">
              <button
                onClick={handleApplyResume}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Kaldığım Yerden Devam Et</span>
              </button>

              <button
                onClick={handleStartFromBeginning}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Baştan Başla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY KONTROLLERİ */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-6 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* ÜST BAR (Geri Butonu, Başlık, Bölüm/Kanal Çekmecesi) */}
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                saveCurrentProgress();
                onClose();
              }}
              className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95"
              title="Geri Dön (Esc)"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                {isLive && (
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-widest animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>CANLI</span>
                  </span>
                )}
                <h1 className="text-lg lg:text-xl font-extrabold text-white drop-shadow-md">
                  {item.title}
                </h1>
              </div>
              {item.subTitle && (
                <p className="text-xs text-cyan-300 font-medium drop-shadow">{item.subTitle}</p>
              )}
            </div>
          </div>

          {/* Sağ Üst Butonlar (Kanal / Bölüm Listesi Çekmecesi) */}
          <div className="flex items-center space-x-2">
            {(channelList || item.allEpisodes) && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`px-3.5 py-2 rounded-xl backdrop-blur-md border border-white/15 text-xs font-bold flex items-center space-x-2 transition-all ${
                  showSidebar ? 'bg-cyan-500 text-white' : 'bg-black/60 hover:bg-black/80 text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span>{isLive ? 'Kanal Listesi' : 'Bölüm Listesi'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ALT BAR (Oynatıcı Kontrolleri) */}
        <div className="flex flex-col space-y-3 pointer-events-auto bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 rounded-2xl backdrop-blur-sm border border-white/5">
          
          {/* İlerleme Çubuğu (Seek Bar) - VOD & Diziler için */}
          {!isLive && (
            <div className="w-full flex items-center space-x-3 group">
              <span className="text-xs font-mono font-medium text-gray-300 min-w-[50px] text-right">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center">
                {/* Buffered bar */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-white/20 rounded-full pointer-events-none"
                  style={{ width: `${duration > 0 ? (bufferedEnd / duration) * 100 : 0}%` }}
                />

                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-cyan-400 group-hover:h-2.5 transition-all"
                />
              </div>

              <span className="text-xs font-mono font-medium text-gray-400 min-w-[50px]">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Kontrol Butonları Satırı */}
          <div className="flex items-center justify-between">
            {/* Sol Kontroller: Oynat, Geri/İleri 10sn, Ses */}
            <div className="flex items-center space-x-3">
              {/* Oynat / Duraklat */}
              <button
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center transition-all shadow-lg shadow-cyan-500/40 hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                )}
              </button>

              {/* 10sn Geri */}
              {!isLive && (
                <button
                  onClick={() => handleSkip(-10)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
                  title="10 Saniye Geri Sar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* 10sn İleri */}
              {!isLive && (
                <button
                  onClick={() => handleSkip(10)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
                  title="10 Saniye İleri Sar"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}

              {/* Ses Kontrolü */}
              <div className="flex items-center space-x-2 ml-2 group/vol">
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>

            {/* Sağ Kontroller: En Boy Oranı, Tam Ekran */}
            <div className="flex items-center space-x-3">
              {/* En Boy Oranı Değiştirici */}
              <button
                onClick={() => {
                  const ratios: Array<'fit' | 'fill' | '16:9' | '4:3'> = ['fit', 'fill', '16:9', '4:3'];
                  const next = ratios[(ratios.indexOf(aspectRatio) + 1) % ratios.length];
                  setAspectRatio(next);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold transition-colors"
                title="Görüntü Boyutlandırma"
              >
                {aspectRatio === 'fit' && 'Sığdır'}
                {aspectRatio === 'fill' && 'Doldur'}
                {aspectRatio === '16:9' && '16:9'}
                {aspectRatio === '4:3' && '4:3'}
              </button>

              {/* Tam Ekran */}
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
                title="Tam Ekran (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* YAN ÇEKMECE (Sidebar: Canlı Kanallar veya Dizi Bölümleri) */}
      {showSidebar && (
        <div className="absolute top-0 right-0 bottom-0 w-80 lg:w-96 glass-modal z-40 p-4 flex flex-col animate-slideLeft border-l border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <h3 className="text-base font-bold text-white">
              {isLive ? 'Kanallar' : 'Bölümler'}
            </h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg"
            >
              Kapat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {/* Canlı Kanallar Listesi */}
            {isLive && channelList && channelList.map((ch) => (
              <div
                key={ch.stream_id}
                onClick={() => {
                  onSelectChannel?.(ch);
                  setShowSidebar(false);
                }}
                className={`p-2.5 rounded-xl flex items-center space-x-3 cursor-pointer transition-all ${
                  item.streamId === ch.stream_id
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-200'
                }`}
              >
                {ch.stream_icon ? (
                  <img src={ch.stream_icon} alt="" className="w-10 h-7 object-contain rounded bg-black/40 p-0.5" />
                ) : (
                  <div className="w-10 h-7 rounded bg-white/10 flex items-center justify-center text-xs font-bold">
                    TV
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{ch.name}</p>
                </div>
              </div>
            ))}

            {/* Dizi Bölümleri Listesi */}
            {!isLive && item.allEpisodes && item.allEpisodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => {
                  onSelectNextEpisode?.(ep);
                  setShowSidebar(false);
                }}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  item.streamId === ep.id
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Play className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{ep.title}</span>
                </div>
                {ep.info?.duration && (
                  <span className="text-[11px] text-gray-400 font-mono">{ep.info.duration}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

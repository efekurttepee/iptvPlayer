import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  List,
  Sparkles,
  AlertCircle,
  Tv,
  Search,
  X,
  Radio
} from 'lucide-react';
import { ActivePlayingItem, Category, EpisodeInfo, LiveStream, ResumeRecord } from '../types';
import { StorageService } from '../services/storage';
import { translateCategory } from '../utils/categoryTranslator';

interface VideoPlayerProps {
  item: ActivePlayingItem;
  onClose: () => void;
  onSelectNextEpisode?: (episode: EpisodeInfo) => void;
  onSelectChannel?: (channel: LiveStream) => void;
  channelList?: LiveStream[];
  categories?: Category[];
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  item,
  onClose,
  onSelectNextEpisode,
  onSelectChannel,
  channelList,
  categories,
}) => {
  const isMac = typeof navigator !== 'undefined' && (navigator.platform?.includes('Mac') || navigator.userAgent?.includes('Mac'));
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Volume Memory
  const initialVol = StorageService.getVolumeForItem(item.id);
  const [volume, setVolume] = useState(() => initialVol.volume);
  const [isMuted, setIsMuted] = useState(() => initialVol.isMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'fit' | 'fill' | '16:9' | '4:3'>('fit');
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drawer Category & Search States
  const [drawerCategory, setDrawerCategory] = useState<string>('all');
  const [drawerSearch, setDrawerSearch] = useState<string>('');

  // Resume Prompt & Auto-Resume State
  const [resumePrompt, setResumePrompt] = useState<ResumeRecord | null>(null);
  const [autoResumeToast, setAutoResumeToast] = useState<ResumeRecord | null>(null);
  const [, setHasDecidedResume] = useState(false);
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
        pendingSeekRef.current = saved.currentTime;
        setAutoResumeToast(saved);
        setHasDecidedResume(true);
        const timer = setTimeout(() => setAutoResumeToast(null), 5000);
        return () => clearTimeout(timer);
      } else {
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

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = item.url;
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('type=m3u8') || isLive;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (pendingSeekRef.current !== null) {
          video.currentTime = pendingSeekRef.current;
          pendingSeekRef.current = null;
        }
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setIsLoading(false);
              setErrorMessage('Yayın akışı başlatılamadı. Lütfen sunucu bağlantınızı veya yayını kontrol edin.');
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (pendingSeekRef.current !== null) {
          video.currentTime = pendingSeekRef.current;
          pendingSeekRef.current = null;
        }
        video.play().catch(() => setIsPlaying(false));
      });
    } else {
      video.src = streamUrl;
      video.load();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [item.url, isLive]);

  // Volume synchronization
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Activity timer for controls visibility
  const triggerControlsActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSidebar && !resumePrompt) {
        setShowControls(false);
      }
    }, 4000);
  }, [isPlaying, showSidebar, resumePrompt]);

  const saveCurrentProgress = useCallback(() => {
    if (!isLive && duration > 0 && currentTime > 5) {
      StorageService.saveResumePosition({
        id: item.id,
        title: item.title,
        subTitle: item.subTitle,
        type: item.type,
        currentTime,
        duration,
        percentage: Math.min(100, Math.round((currentTime / duration) * 100)),
        lastWatched: Date.now(),
        poster: item.poster,
        streamId: item.streamId,
        seriesId: item.seriesId,
        seasonNum: item.seasonNum,
        episodeNum: item.episodeNum,
      });
    }
  }, [isLive, duration, currentTime, item]);

  // Periodic progress saving (every 5 seconds)
  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(saveCurrentProgress, 5000);
    return () => clearInterval(interval);
  }, [isLive, saveCurrentProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
    triggerControlsActivity();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!isLive && videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current && !isLive) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    triggerControlsActivity();
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    StorageService.saveVolumeForItem(item.id, newVol, newVol === 0);
    triggerControlsActivity();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    StorageService.saveVolumeForItem(item.id, volume, nextMuted);
    triggerControlsActivity();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
    triggerControlsActivity();
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current && !isLive) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
    triggerControlsActivity();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (resumePrompt) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.05));
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (showSidebar) {
            setShowSidebar(false);
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

  // Drawer Channel Filtering
  const filteredChannels = useMemo(() => {
    if (!channelList) return [];
    let list = channelList;
    if (drawerCategory !== 'all') {
      list = list.filter((ch) => String(ch.category_id) === String(drawerCategory));
    }
    if (drawerSearch.trim()) {
      const q = drawerSearch.toLowerCase();
      list = list.filter((ch) => (ch.name || '').toLowerCase().includes(q));
    }
    return list;
  }, [channelList, drawerCategory, drawerSearch]);

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

      {/* Kaldığı Yerden Devam Bildirimi */}
      {autoResumeToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-[#161a23] border border-[#2c3244] px-5 py-2.5 rounded-xl shadow-2xl flex items-center space-x-3 text-xs animate-fadeIn pointer-events-auto">
          <div className="flex items-center space-x-1.5 text-blue-400 font-bold">
            <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
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
            className="px-2.5 py-1 bg-white/10 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 rounded-lg text-gray-200 hover:text-white font-medium text-[11px] transition-all flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Baştan Başla</span>
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && !errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
          <span className="text-white text-xs font-semibold tracking-wider">Yayın Yükleniyor...</span>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-50">
          <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Yayın Açılamadı</h3>
          <p className="text-xs text-gray-400 max-w-md mb-5">{errorMessage}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setErrorMessage(null);
                setIsLoading(true);
                videoRef.current?.load();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Tekrar Dene
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY KONTROLLERİ */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-6 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* ÜST BAR (Geri Butonu, Başlık, Bölüm/Kanal Çekmecesi) - macOS Trafik Işıkları Uyumlu */}
        <div
          className={`flex items-center justify-between pointer-events-auto w-full transition-all ${
            isMac ? 'pl-24 pt-2' : 'pl-0 pt-0'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <button
              type="button"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              onClick={(e) => {
                e.stopPropagation();
                saveCurrentProgress();
                onClose();
              }}
              className="w-10 h-10 rounded-full bg-[#151922] hover:bg-[#1f2430] text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer z-50 pointer-events-auto shadow-lg"
              title="Geri Dön (Esc)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                {isLive && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>CANLI</span>
                  </span>
                )}
                <h1 className="text-base lg:text-lg font-bold text-white drop-shadow">
                  {item.title}
                </h1>
              </div>
              {item.subTitle && (
                <p className="text-xs text-gray-300 font-medium">{item.subTitle}</p>
              )}
            </div>
          </div>

          {/* Sağ Üst Butonlar (Kanal / Bölüm Listesi Çekmecesi) */}
          <div className="flex items-center space-x-2">
            {(channelList || item.allEpisodes) && (
              <button
                type="button"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                onClick={() => setShowSidebar(!showSidebar)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                  showSidebar
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-[#151922] hover:bg-[#1f2430] border-[#2c3244] text-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                <span>{isLive ? 'Kanal Listesi' : 'Bölüm Listesi'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ALT BAR (Oynatıcı Kontrolleri) */}
        <div className="flex flex-col space-y-3 pointer-events-auto bg-[#13161f]/95 p-4 rounded-xl border border-[#242836] shadow-2xl">
          
          {/* İlerleme Çubuğu - VOD & Diziler için */}
          {!isLive && (
            <div className="w-full flex items-center space-x-3 group">
              <span className="text-xs font-mono font-medium text-gray-300 min-w-[50px] text-right">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <span className="text-xs font-mono font-medium text-gray-400 min-w-[50px]">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Kontrol Butonları */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Oynat / Duraklat */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4.5 h-4.5 fill-white" />
                ) : (
                  <Play className="w-4.5 h-4.5 fill-white ml-0.5" />
                )}
              </button>

              {/* 10sn Geri */}
              {!isLive && (
                <button
                  onClick={() => handleSkip(-10)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
                  title="10 Saniye Geri Sar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* 10sn İleri */}
              {!isLive && (
                <button
                  onClick={() => handleSkip(10)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
                  title="10 Saniye İleri Sar"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}

              {/* Ses Kontrolü */}
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
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
                  className="w-20 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Sağ Kontroller */}
            <div className="flex items-center space-x-3">
              {/* En Boy Oranı */}
              <button
                onClick={() => {
                  const ratios: Array<'fit' | 'fill' | '16:9' | '4:3'> = ['fit', 'fill', '16:9', '4:3'];
                  const next = ratios[(ratios.indexOf(aspectRatio) + 1) % ratios.length];
                  setAspectRatio(next);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold transition-colors"
              >
                {aspectRatio === 'fit' && 'Sığdır'}
                {aspectRatio === 'fill' && 'Doldur'}
                {aspectRatio === '16:9' && '16:9'}
                {aspectRatio === '4:3' && '4:3'}
              </button>

              {/* Tam Ekran */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 flex items-center justify-center transition-colors"
                title="Tam Ekran (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* YAN ÇEKMECE (Kategori Filtreli & Aramalı Kanal Listesi) */}
      {showSidebar && (
        <div className="absolute top-0 right-0 bottom-0 w-84 lg:w-96 bg-[#13161f] z-50 p-4 flex flex-col animate-slideLeft border-l border-[#242836] shadow-2xl">
          {/* Çekmece Başlığı & Kapat Butonu */}
          <div className="flex items-center justify-between pb-3 border-b border-[#242836] mb-3">
            <div className="flex items-center space-x-2">
              <Tv className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                {isLive ? `Kanallar (${filteredChannels.length})` : 'Bölümler'}
              </h3>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Canlı Yayın Çekmecesi İçin: Arama ve Kategori Filtresi */}
          {isLive && (
            <div className="space-y-2.5 mb-3">
              {/* Arama Kutusu */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Kanal ara..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full bg-[#181c25] border border-[#272c3b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Kategori Butonları (Yatay Kaydırılabilir) */}
              {categories && categories.length > 0 && (
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => setDrawerCategory('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      drawerCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#181c25] text-gray-400 hover:text-white border border-[#272c3b]'
                    }`}
                  >
                    Tümü ({channelList?.length || 0})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.category_id}
                      type="button"
                      onClick={() => setDrawerCategory(cat.category_id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        drawerCategory === cat.category_id
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#181c25] text-gray-400 hover:text-white border border-[#272c3b]'
                      }`}
                    >
                      {translateCategory(cat.category_name)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kanal Listesi */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {isLive && filteredChannels.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-500">
                Kanal bulunamadı.
              </div>
            )}

            {isLive && filteredChannels.map((ch) => {
              const isCurrent = item.streamId === ch.stream_id;
              return (
                <div
                  key={ch.stream_id}
                  onClick={() => {
                    onSelectChannel?.(ch);
                  }}
                  className={`p-2 rounded-xl flex items-center space-x-2.5 cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-blue-600/20 border-blue-500/50 text-white'
                      : 'bg-[#181c25] hover:bg-[#202532] border-[#272c3b] text-gray-300'
                  }`}
                >
                  {/* Kanal Logosu */}
                  <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ch.stream_icon ? (
                      <img
                        src={ch.stream_icon}
                        alt=""
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Tv className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-blue-300' : 'text-gray-200'}`}>
                      {ch.name}
                    </p>
                  </div>

                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                  )}
                </div>
              );
            })}

            {/* Dizi Bölümleri Listesi */}
            {!isLive && item.allEpisodes && item.allEpisodes.map((ep) => (
              <div
                key={ep.id}
                onClick={() => {
                  onSelectNextEpisode?.(ep);
                  setShowSidebar(false);
                }}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                  item.streamId === ep.id
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-[#181c25] hover:bg-[#202532] border-[#272c3b] text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Play className="w-3.5 h-3.5 text-blue-400" />
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

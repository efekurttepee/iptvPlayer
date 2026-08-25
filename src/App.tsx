import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivePlayingItem,
  Category,
  EpisodeInfo,
  LiveStream,
  ResumeRecord,
  SeriesInfoResponse,
  SeriesItem,
  ServerInfo,
  UserInfo,
  ViewMode,
  VodInfo,
  VodStream,
  XtreamCredentials
} from './types';
import { XtreamApiClient, cleanErrorMessage } from './services/xtreamApi';
import { StorageService } from './services/storage';

// Components
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LiveTvView } from './components/LiveTvView';
import { MoviesView } from './components/MoviesView';
import { SeriesView } from './components/SeriesView';
import { VideoPlayer } from './components/VideoPlayer';
import { PlaylistsModal } from './components/PlaylistsModal';
import { AccountModal } from './components/AccountModal';
import { SettingsModal } from './components/SettingsModal';
import { SearchModal } from './components/SearchModal';
import { WatchHistoryView } from './components/WatchHistoryView';
import { UpdateNotification } from './components/UpdateNotification';
import { MessageSquare, Download, X, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // App State
  const [activePlaylist, setActivePlaylist] = useState<XtreamCredentials | null>(() =>
    StorageService.getActiveCredential()
  );
  const [apiClient, setApiClient] = useState<XtreamApiClient | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  // Content Data
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [vodStreams, setVodStreams] = useState<VodStream[]>([]);
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);

  // Navigation & Player State
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activePlayingItem, setActivePlayingItem] = useState<ActivePlayingItem | null>(null);
  const [recentWatches, setRecentWatches] = useState<ResumeRecord[]>(() =>
    StorageService.getRecentWatchList(10)
  );

  // Modals
  const [isPlaylistsOpen, setIsPlaylistsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Refresh Recent Watches
  const refreshRecentWatches = useCallback(() => {
    setRecentWatches(StorageService.getRecentWatchList(10));
  }, []);

  // Load Active Playlist & Content
  const loadPlaylistData = useCallback(async (cred: XtreamCredentials) => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const client = new XtreamApiClient(cred);
      setApiClient(client);

      const auth = await client.authenticate();
      setUserInfo(auth.user_info);
      setServerInfo(auth.server_info);

      // Fetch Categories & Streams in parallel
      const [liveCats, liveStrs, vodCats, vodStrs, serCats, sList] = await Promise.all([
        client.getLiveCategories(),
        client.getLiveStreams(),
        client.getVodCategories(),
        client.getVodStreams(),
        client.getSeriesCategories(),
        client.getSeries(),
      ]);

      setLiveCategories(liveCats);
      setLiveStreams(liveStrs);
      setVodCategories(vodCats);
      setVodStreams(vodStrs);
      setSeriesCategories(serCats);
      setSeriesList(sList);
      refreshRecentWatches();
    } catch (err: any) {
      console.error('Playlist load error:', err);
      setConnectionError(cleanErrorMessage(err) || 'IPTV sunucusuna bağlanılamadı.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshRecentWatches]);

  // Initial Boot
  useEffect(() => {
    const bootApp = async () => {
      await StorageService.initLocalDb();
      StorageService.purgeOrphanedResumeRecords();
      refreshRecentWatches();

      const saved = StorageService.getActiveCredential();
      if (saved && saved.id !== 'demo_account') {
        setActivePlaylist(saved);
        loadPlaylistData(saved);
      } else {
        if (saved?.id === 'demo_account') {
          StorageService.removeCredential('demo_account');
        }
        setIsPlaylistsOpen(true);
      }
    };

    bootApp();
  }, [loadPlaylistData, refreshRecentWatches]);

  // Change Playlist
  const handleSelectPlaylist = (cred: XtreamCredentials) => {
    setActivePlaylist(cred);
    StorageService.setActiveCredentialId(cred.id || '');
    setViewMode('dashboard');
    loadPlaylistData(cred);
    refreshRecentWatches();
  };

  // Refresh Content Data
  const handleRefreshData = async () => {
    if (!activePlaylist) return;
    setIsRefreshing(true);
    await loadPlaylistData(activePlaylist);
    refreshRecentWatches();
    setIsRefreshing(false);
  };

  // Helper to ensure streams route via proxy in browser mode
  const ensureStreamUrl = (rawUrl: string): string => {
    if (!rawUrl) return '';
    const isElectron = !!(window as any).electronAPI?.http;
    if (isElectron) return rawUrl;
    if (rawUrl.startsWith('http://localhost') || rawUrl.startsWith('/api/proxy')) return rawUrl;
    return `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  // Play Live Stream
  const handlePlayLiveStream = (stream: LiveStream) => {
    if (!apiClient) return;
    const raw = stream.direct_source || apiClient.getLiveStreamUrl(stream.stream_id, StorageService.getSettings().streamFormat);
    const url = ensureStreamUrl(raw);
    setActivePlayingItem({
      id: `live_${stream.stream_id}`,
      streamId: stream.stream_id,
      title: stream.name,
      subTitle: 'Canlı TV Yayını',
      type: 'live',
      url,
      cover: stream.stream_icon,
    });
  };

  // Play Movie
  const handlePlayMovie = (movie: VodStream, _resumeRecord?: ResumeRecord | null) => {
    if (!apiClient) return;
    const raw = movie.direct_source || apiClient.getMovieStreamUrl(movie.stream_id, movie.container_extension || 'mp4');
    const url = ensureStreamUrl(raw);
    setActivePlayingItem({
      id: `movie_${movie.stream_id}`,
      streamId: movie.stream_id,
      title: movie.name,
      subTitle: 'Film (VOD)',
      type: 'movie',
      url,
      cover: movie.stream_icon,
      extension: movie.container_extension,
    });
  };

  // Play Series Episode
  const handlePlayEpisode = (
    series: SeriesItem,
    episode: EpisodeInfo,
    seasonNum: number | string,
    allEpisodes: EpisodeInfo[],
    _resumeRecord?: ResumeRecord | null
  ) => {
    if (!apiClient) return;
    const raw = (episode as any).direct_source || apiClient.getEpisodeStreamUrl(episode.id, episode.container_extension || 'mp4');
    const url = ensureStreamUrl(raw);
    setActivePlayingItem({
      id: `series_${series.series_id}_s${seasonNum}_e${episode.episode_num}`,
      streamId: episode.id,
      title: series.name,
      subTitle: `${seasonNum}. Sezon ${episode.episode_num}. Bölüm: ${episode.title}`,
      type: 'episode',
      url,
      cover: series.cover,
      extension: episode.container_extension,
      seriesId: series.series_id,
      seasonNum,
      episodeNum: episode.episode_num,
      allEpisodes,
    });
  };

  // Resume item directly from Dashboard shelf or Watch History
  const handleResumeRecentItem = (item: ResumeRecord) => {
    const raw = item.url || (apiClient
      ? (item.type === 'movie'
          ? apiClient.getMovieStreamUrl(item.streamId, item.extension || 'mp4')
          : apiClient.getEpisodeStreamUrl(item.streamId, item.extension || 'mp4'))
      : '');

    if (!raw) return;
    const url = ensureStreamUrl(raw);

    setActivePlayingItem({
      id: item.id,
      streamId: item.streamId,
      title: item.title,
      subTitle: item.subTitle || (item.type === 'movie' ? 'Film (VOD)' : 'Dizi Bölümü'),
      type: item.type === 'movie' ? 'movie' : 'episode',
      url,
      cover: item.cover,
      extension: item.extension,
      seriesId: item.seriesId,
      seasonNum: item.seasonNum,
      episodeNum: item.episodeNum,
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-background text-white select-none overflow-hidden font-sans">
      
      {/* Uzaktan Otomatik Güncelleme Bildirimi */}
      <UpdateNotification />

      {/* Header Bar */}
      <Header
        userInfo={userInfo}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onRefreshData={handleRefreshData}
        onOpenPlaylists={() => setIsPlaylistsOpen(true)}
        isRefreshing={isRefreshing}
      />

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="mx-8 my-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{connectionError}</span>
          </div>
          <button
            onClick={() => setIsPlaylistsOpen(true)}
            className="underline font-bold hover:text-white"
          >
            Hesap Bilgilerini Düzenle
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 min-h-0 relative">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-sm font-bold text-gray-300 tracking-wider">
              IPTV Verileri Yükleniyor...
            </span>
          </div>
        ) : (
          <>
            {viewMode === 'dashboard' && (
              <Dashboard
                onNavigate={(view) => {
                  if (view === 'playlists') setIsPlaylistsOpen(true);
                  else if (view === 'settings') setIsSettingsOpen(true);
                  else setViewMode(view);
                }}
                activePlaylist={activePlaylist}
                userInfo={userInfo}
                recentWatches={recentWatches}
                onResumeItem={handleResumeRecentItem}
                onDismissRecent={(id) => {
                  StorageService.removeResumePosition(id);
                  refreshRecentWatches();
                }}
              />
            )}

            {viewMode === 'live' && (
              <LiveTvView
                categories={liveCategories}
                streams={liveStreams}
                onBack={() => setViewMode('dashboard')}
                onPlayStream={handlePlayLiveStream}
              />
            )}

            {viewMode === 'movies' && (
              <MoviesView
                categories={vodCategories}
                streams={vodStreams}
                onBack={() => setViewMode('dashboard')}
                onPlayMovie={handlePlayMovie}
                fetchMovieInfo={(id) => apiClient?.getVodInfo(id) || Promise.resolve(null)}
              />
            )}

            {viewMode === 'series' && (
              <SeriesView
                categories={seriesCategories}
                seriesList={seriesList}
                onBack={() => setViewMode('dashboard')}
                onPlayEpisode={handlePlayEpisode}
                fetchSeriesInfo={(id) => apiClient?.getSeriesInfo(id) || Promise.resolve(null)}
              />
            )}

            {viewMode === 'catchup' && (
              <WatchHistoryView
                historyItems={recentWatches}
                onBack={() => setViewMode('dashboard')}
                onPlayItem={handleResumeRecentItem}
                onRemoveItem={(id) => {
                  StorageService.removeResumePosition(id);
                  refreshRecentWatches();
                }}
                onClearAll={() => {
                  StorageService.clearAllResumePositions();
                  refreshRecentWatches();
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Fullscreen Video Player */}
      {activePlayingItem && (
        <VideoPlayer
          item={activePlayingItem}
          channelList={activePlayingItem.type === 'live' ? liveStreams : undefined}
          categories={activePlayingItem.type === 'live' ? liveCategories : undefined}
          onClose={() => {
            setActivePlayingItem(null);
            refreshRecentWatches();
          }}
          onSelectChannel={(ch) => handlePlayLiveStream(ch)}
          onSelectNextEpisode={(ep) => {
            if (activePlayingItem.seriesId && apiClient) {
              const url = apiClient.getEpisodeStreamUrl(ep.id, ep.container_extension || 'mp4');
              setActivePlayingItem({
                ...activePlayingItem,
                id: `series_${activePlayingItem.seriesId}_s${activePlayingItem.seasonNum}_e${ep.episode_num}`,
                streamId: ep.id,
                title: activePlayingItem.title,
                subTitle: `${activePlayingItem.seasonNum}. Sezon ${ep.episode_num}. Bölüm: ${ep.title}`,
                url,
              });
            }
          }}
        />
      )}

      {/* Modals */}
      <PlaylistsModal
        isOpen={isPlaylistsOpen}
        onClose={() => setIsPlaylistsOpen(false)}
        onSelectPlaylist={handleSelectPlaylist}
        activePlaylistId={activePlaylist?.id || null}
      />

      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        userInfo={userInfo}
        serverInfo={serverInfo}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={refreshRecentWatches}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        liveStreams={liveStreams}
        vodStreams={vodStreams}
        seriesList={seriesList}
        onPlayLive={handlePlayLiveStream}
        onPlayMovie={handlePlayMovie}
        onSelectSeries={(s) => {
          setViewMode('series');
        }}
      />

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn select-none">
          <div className="glass-modal max-w-md w-full rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-bold text-white">Bildirimler</h3>
              </div>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center">
              <p className="text-xs text-gray-300">Yeni bir duyuru veya bildirim bulunmuyor.</p>
            </div>
          </div>
        </div>
      )}

      {/* Downloads / Recordings Modal */}
      {isDownloadsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fadeIn select-none">
          <div className="glass-modal max-w-md w-full rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">İndirilenler & Kayıtlar</h3>
              </div>
              <button
                onClick={() => setIsDownloadsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-center">
              <p className="text-xs text-gray-300">Henüz çevrimdışı indirilmiş bir içerik bulunmuyor.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

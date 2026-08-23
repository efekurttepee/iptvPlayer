import {
  Category,
  EpisodeInfo,
  LiveStream,
  SeriesInfoResponse,
  SeriesItem,
  VodInfo,
  VodStream,
  XtreamAuthResponse,
  XtreamCredentials,
} from '../types';
import { M3uParser, ParsedM3uResult } from './m3uParser';
import { translateCategory } from '../utils/categoryTranslator';

export function cleanErrorMessage(err: any): string {
  let msg = typeof err === 'string' ? err : (err?.message || String(err || ''));
  if (msg.includes("Error invoking remote method 'http:request': Error: ")) {
    msg = msg.split("Error invoking remote method 'http:request': Error: ").pop() || msg;
  }
  if (msg.startsWith('Error: ')) {
    msg = msg.substring(7);
  }
  return msg.trim();
}

async function iptvRequest<T = any>(url: string, options: any = {}): Promise<T> {
  const electronHttp = (window as any).electronAPI?.http;
  if (electronHttp) {
    let res;
    try {
      res = await electronHttp.request(url, options);
    } catch (err: any) {
      throw new Error(cleanErrorMessage(err));
    }
    if (!res.ok) {
      throw new Error(`Sunucu Hatası (${res.status}): ${res.statusText || 'Bağlantı reddedildi'}`);
    }
    if (typeof res.data === 'string') {
      const trimmed = res.data.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          return JSON.parse(trimmed);
        } catch {
          return trimmed as unknown as T;
        }
      }
      return trimmed as unknown as T;
    }
    return res.data;
  }

  // Browser Fallback (e.g. when testing in regular browser tab like Opera GX)
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, options);
    if (!res.ok) throw new Error(`HTTP Hata: ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  } catch {
    // Direct fetch fallback
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP Hata: ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  }
}

export class XtreamApiClient {
  public credentials: XtreamCredentials;
  private serverUrl: string;
  private username: string;
  private password: string;
  private isM3uMode: boolean;
  private m3uCache: ParsedM3uResult | null = null;

  constructor(credentials: XtreamCredentials) {
    this.credentials = credentials;
    
    // Check if M3U URL has embedded Xtream credentials (e.g. get.php?username=...&password=...)
    const extracted = XtreamApiClient.extractXtreamFromUrl(credentials.m3uUrl || credentials.serverUrl);
    if (extracted && (!credentials.username || !credentials.password)) {
      this.credentials = {
        ...credentials,
        serverUrl: extracted.serverUrl,
        username: extracted.username,
        password: extracted.password,
        type: 'xtream',
      };
    }

    this.serverUrl = this.formatServerUrl(this.credentials.serverUrl || this.credentials.m3uUrl || '');
    this.username = encodeURIComponent(this.credentials.username || '');
    this.password = encodeURIComponent(this.credentials.password || '');
    this.isM3uMode = this.credentials.type === 'm3u' || (!this.credentials.username && !this.credentials.password);
  }

  public static extractXtreamFromUrl(rawUrl: string): { serverUrl: string; username: string; password: string } | null {
    if (!rawUrl) return null;
    try {
      let urlStr = rawUrl.trim();
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        urlStr = 'http://' + urlStr;
      }
      const url = new URL(urlStr);
      const username = url.searchParams.get('username') || url.searchParams.get('user');
      const password = url.searchParams.get('password') || url.searchParams.get('pass');
      if (username && password) {
        return {
          serverUrl: `${url.protocol}//${url.host}`,
          username,
          password,
        };
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  public formatServerUrl(url: string): string {
    let cleaned = url.trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'http://' + cleaned;
    }
    return cleaned.replace(/\/+$/, '');
  }

  private getApiUrl(action?: string, extraParams: Record<string, string | number> = {}): string {
    const base = `${this.serverUrl}/player_api.php?username=${this.username}&password=${this.password}`;
    const params = new URLSearchParams();
    if (action) {
      params.append('action', action);
    }
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        params.append(k, String(v));
      }
    });
    const query = params.toString();
    return query ? `${base}&${query}` : base;
  }

  // Load Raw M3U Playlist if in passwordless M3U mode
  private async loadM3uData(): Promise<ParsedM3uResult> {
    if (this.m3uCache) return this.m3uCache;
    const url = this.credentials.m3uUrl || this.credentials.serverUrl;
    const text = await iptvRequest<string>(url);
    this.m3uCache = M3uParser.parse(text, url);
    return this.m3uCache;
  }

  // Authentication & Account info
  async authenticate(): Promise<XtreamAuthResponse> {
    if (this.isM3uMode) {
      // In passwordless M3U mode, test downloading M3U content
      await this.loadM3uData();
      return {
        user_info: {
          username: this.credentials.name || 'M3U Kullanıcısı',
          status: 'Active',
          exp_date: '0',
          is_trial: '0',
          active_cons: '1',
          created_at: String(Math.floor(Date.now() / 1000)),
          max_connections: '1',
          allowed_output_formats: ['m3u8', 'ts'],
        },
        server_info: {
          url: this.serverUrl,
          port: '',
          https_port: '',
          server_protocol: 'http',
          rtmp_port: '',
          timezone: 'Europe/Istanbul',
          timestamp_now: Math.floor(Date.now() / 1000),
          time_now: new Date().toISOString(),
        }
      };
    }

    try {
      const data = await iptvRequest<any>(this.getApiUrl());
      if (!data.user_info || data.user_info.auth === 0) {
        throw new Error(data.user_info?.message || 'Geçersiz kullanıcı adı veya şifre.');
      }
      return data;
    } catch (err: any) {
      console.error('API connection failed:', err);
      throw new Error(err.message || 'IPTV sunucusuna bağlanılamadı. Lütfen sunucu adresi (.xyz:80), kullanıcı adı ve şifrenizi kontrol edin.');
    }
  }

  // Live TV
  async getLiveCategories(): Promise<Category[]> {
    if (this.isM3uMode) {
      const data = await this.loadM3uData();
      return data.liveCategories;
    }
    try {
      const data = await iptvRequest<Category[]>(this.getApiUrl('get_live_categories'));
      return Array.isArray(data)
        ? data.map(c => ({ ...c, category_name: translateCategory(c.category_name) }))
        : [];
    } catch {
      return [];
    }
  }

  async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    if (this.isM3uMode) {
      const data = await this.loadM3uData();
      if (categoryId && categoryId !== 'all') {
        return data.liveStreams.filter(s => s.category_id === categoryId);
      }
      return data.liveStreams;
    }
    try {
      const data = await iptvRequest<LiveStream[]>(this.getApiUrl('get_live_streams', categoryId ? { category_id: categoryId } : {}));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  // Movies (VOD)
  async getVodCategories(): Promise<Category[]> {
    if (this.isM3uMode) {
      const data = await this.loadM3uData();
      return data.vodCategories;
    }
    try {
      const data = await iptvRequest<Category[]>(this.getApiUrl('get_vod_categories'));
      return Array.isArray(data)
        ? data.map(c => ({ ...c, category_name: translateCategory(c.category_name) }))
        : [];
    } catch {
      return [];
    }
  }

  async getVodStreams(categoryId?: string): Promise<VodStream[]> {
    if (this.isM3uMode) {
      const data = await this.loadM3uData();
      if (categoryId && categoryId !== 'all') {
        return data.vodStreams.filter(s => s.category_id === categoryId);
      }
      return data.vodStreams;
    }
    try {
      const data = await iptvRequest<VodStream[]>(this.getApiUrl('get_vod_streams', categoryId ? { category_id: categoryId } : {}));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async getVodInfo(vodId: number | string): Promise<VodInfo | null> {
    if (this.isM3uMode) return null;
    try {
      return await iptvRequest<VodInfo>(this.getApiUrl('get_vod_info', { vod_id: vodId }));
    } catch {
      return null;
    }
  }

  // Series
  async getSeriesCategories(): Promise<Category[]> {
    if (this.isM3uMode) {
      const data = await this.loadM3uData();
      return data.seriesCategories;
    }
    try {
      const data = await iptvRequest<Category[]>(this.getApiUrl('get_series_categories'));
      return Array.isArray(data)
        ? data.map(c => ({ ...c, category_name: translateCategory(c.category_name) }))
        : [];
    } catch {
      return [];
    }
  }

  async getSeries(categoryId?: string): Promise<SeriesItem[]> {
    if (this.isM3uMode) {
      const data = await this.loadM3uData();
      if (categoryId && categoryId !== 'all') {
        return data.seriesList.filter(s => s.category_id === categoryId);
      }
      return data.seriesList;
    }
    try {
      const data = await iptvRequest<SeriesItem[]>(this.getApiUrl('get_series', categoryId ? { category_id: categoryId } : {}));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async getSeriesInfo(seriesId: number | string): Promise<SeriesInfoResponse | null> {
    if (this.isM3uMode) {
      const data = await this.loadM3uData();
      const id = Number(seriesId);
      const seriesItem = data.seriesList.find(s => s.series_id === id);
      const episodes = (data.seriesEpisodesMap && data.seriesEpisodesMap[id]) || [];
      
      const episodesBySeason: Record<string, EpisodeInfo[]> = {};
      const seasonsSet = new Set<number>();
      
      episodes.forEach(ep => {
        const s = String(ep.season || 1);
        seasonsSet.add(ep.season || 1);
        if (!episodesBySeason[s]) episodesBySeason[s] = [];
        episodesBySeason[s].push(ep);
      });

      const seasons = Array.from(seasonsSet).sort((a, b) => a - b).map(sNum => ({
        id: sNum,
        season_number: sNum,
        name: `${sNum}. Sezon`,
        overview: '',
        air_date: '',
        episode_count: episodesBySeason[String(sNum)]?.length || 0,
        cover: seriesItem?.cover || '',
      }));

      return {
        seasons: seasons.length > 0 ? seasons : [{ id: 1, season_number: 1, name: '1. Sezon', overview: '', air_date: '', episode_count: episodes.length, cover: seriesItem?.cover || '' }],
        info: {
          name: seriesItem?.name || '',
          cover: seriesItem?.cover || '',
          plot: seriesItem?.plot || '',
          genre: seriesItem?.genre || '',
          releaseDate: seriesItem?.releaseDate || '',
          rating: seriesItem?.rating || '4.5',
          rating_5based: 4.5,
          episode_run_time: '45',
          backdrop_path: [],
          youtube_trailer: '',
        },
        episodes: episodesBySeason,
      };
    }
    try {
      return await iptvRequest<SeriesInfoResponse>(this.getApiUrl('get_series_info', { series_id: seriesId }));
    } catch {
      return null;
    }
  }

  private wrapStreamUrl(rawUrl: string): string {
    const isElectron = !!(window as any).electronAPI?.http;
    if (isElectron) return rawUrl;
    // In web browser (Opera GX / Chrome), route stream via Vite proxy to bypass CORS & ISP DNS blocks
    return `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
  }

  // Stream URL Builders
  getLiveStreamUrl(streamId: number | string, extension: string = 'm3u8'): string {
    const raw = `${this.serverUrl}/live/${this.username}/${this.password}/${streamId}.${extension}`;
    return this.wrapStreamUrl(raw);
  }

  getMovieStreamUrl(streamId: number | string, extension: string = 'mp4'): string {
    const raw = `${this.serverUrl}/movie/${this.username}/${this.password}/${streamId}.${extension}`;
    return this.wrapStreamUrl(raw);
  }

  getEpisodeStreamUrl(streamId: number | string, extension: string = 'mp4'): string {
    const raw = `${this.serverUrl}/series/${this.username}/${this.password}/${streamId}.${extension}`;
    return this.wrapStreamUrl(raw);
  }
}

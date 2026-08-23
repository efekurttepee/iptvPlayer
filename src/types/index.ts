export type PlaylistType = 'xtream' | 'm3u';

export interface XtreamCredentials {
  id?: string;
  name: string;
  type?: PlaylistType;
  serverUrl: string;
  username?: string;
  password?: string;
  m3uUrl?: string;
  lastLogin?: number;
}

export interface UserInfo {
  username: string;
  password?: string;
  message?: string;
  auth?: number;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface ServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now: number;
  time_now: string;
}

export interface XtreamAuthResponse {
  user_info: UserInfo;
  server_info: ServerInfo;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string | number;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface VodInfo {
  info: {
    tmdb_id?: string;
    name?: string;
    o_name?: string;
    cover_big?: string;
    movie_image?: string;
    releasedate?: string;
    youtube_trailer?: string;
    director?: string;
    actors?: string;
    cast?: string;
    description?: string;
    plot?: string;
    age?: string;
    country?: string;
    genre?: string;
    duration_secs?: number;
    duration?: string;
    rating?: string | number;
    backdrop_path?: string[];
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
  };
}

export interface SeriesItem {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface EpisodeInfo {
  id: string | number;
  episode_num: number | string;
  title: string;
  container_extension: string;
  info: {
    name?: string;
    duration_secs?: number;
    duration?: string;
    video?: any;
    audio?: any;
    bitrate?: number;
    rating?: number;
    season?: number | string;
    plot?: string;
    releasedate?: string;
    movie_image?: string;
  };
}

export interface SeriesInfoResponse {
  seasons: Array<{
    air_date?: string;
    episode_count?: number;
    id?: number;
    name?: string;
    overview?: string;
    poster_path?: string;
    season_number: number;
    cover?: string;
    cover_big?: string;
  }>;
  info: {
    name?: string;
    cover?: string;
    plot?: string;
    cast?: string;
    director?: string;
    genre?: string;
    releaseDate?: string;
    rating?: string;
    rating_5based?: number;
    backdrop_path?: string[];
    youtube_trailer?: string;
    episode_run_time?: string;
  };
  episodes: {
    [seasonNumber: string]: EpisodeInfo[];
  };
}

export interface ResumeRecord {
  id: string; // unique identifier (e.g. "movie_1234" or "series_567_s1_e3")
  streamId: number | string;
  type: 'movie' | 'episode';
  title: string;
  subTitle?: string;
  url?: string;
  direct_source?: string;
  accountId?: string;
  seriesId?: number | string;
  seasonNum?: number | string;
  episodeNum?: number | string;
  cover?: string;
  extension?: string;
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number;
}

export type ViewMode = 
  | 'dashboard'
  | 'live'
  | 'movies'
  | 'series'
  | 'catchup'
  | 'settings'
  | 'playlists'
  | 'favorites'
  | 'history';

export interface ActivePlayingItem {
  id: string;
  streamId: number | string;
  title: string;
  subTitle?: string;
  type: 'live' | 'movie' | 'episode';
  url: string;
  cover?: string;
  extension?: string;
  seriesId?: number | string;
  seasonNum?: number | string;
  episodeNum?: number | string;
  allEpisodes?: EpisodeInfo[];
}

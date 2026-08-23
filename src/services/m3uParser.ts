import { Category, LiveStream, SeriesItem, VodStream, EpisodeInfo } from '../types';
import { translateCategory } from '../utils/categoryTranslator';

export interface ParsedM3uResult {
  liveCategories: Category[];
  liveStreams: LiveStream[];
  vodCategories: Category[];
  vodStreams: VodStream[];
  seriesCategories: Category[];
  seriesList: SeriesItem[];
  seriesEpisodesMap?: Record<number, EpisodeInfo[]>;
}

export class M3uParser {
  static parse(content: string, baseUrl?: string): ParsedM3uResult {
    const lines = content.split(/\r?\n/);
    
    const liveCatsMap = new Map<string, Category>();
    const vodCatsMap = new Map<string, Category>();
    const seriesCatsMap = new Map<string, Category>();

    const liveStreams: LiveStream[] = [];
    const vodStreams: VodStream[] = [];
    const seriesList: SeriesItem[] = [];
    const seriesEpisodesMap: Record<number, EpisodeInfo[]> = {};

    // Series deduplication map: seriesKey -> SeriesItem
    const seriesMap = new Map<string, SeriesItem>();

    let currentExtinf: string | null = null;
    let streamCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#EXTINF:')) {
        currentExtinf = line;
      } else if (!line.startsWith('#') && currentExtinf) {
        streamCount++;
        let streamUrl = line;
        if (baseUrl && !streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) {
          try {
            streamUrl = new URL(streamUrl, baseUrl).toString();
          } catch {
            // Keep original if resolution fails
          }
        }
        const info = this.parseExtinf(currentExtinf);

        const rawGroup = (info.groupTitle || 'Genel').trim();
        const groupTitle = translateCategory(rawGroup);
        const name = (info.title || `Yayın ${streamCount}`).trim();
        const icon = info.tvgLogo || '';
        
        const lowerGroup = rawGroup.toLowerCase();
        const lowerUrl = streamUrl.toLowerCase();
        const lowerName = name.toLowerCase();

        // Check if stream is a direct video file (VOD)
        const isVideoFileUrl = lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mkv') || lowerUrl.endsWith('.avi') || lowerUrl.endsWith('.mov') || lowerUrl.endsWith('.webm');
        const isXtreamMovieUrl = lowerUrl.includes('/movie/');
        const isXtreamSeriesUrl = lowerUrl.includes('/series/');

        // 1. Check for Live TV Channel clues in title, group or URL
        const isTvChannel =
          lowerGroup.includes('kanal') ||
          lowerGroup.includes('kanalları') ||
          lowerGroup.includes('canlı') ||
          lowerGroup.includes('live') ||
          lowerGroup.includes('ulusal') ||
          lowerGroup.includes('haber') ||
          lowerGroup.includes('spor') ||
          lowerGroup.includes('24/7') ||
          lowerName.includes(' tv') ||
          lowerName.endsWith('tv') ||
          lowerName.includes('box office') ||
          lowerName.includes('filmbox') ||
          lowerName.includes('moviesmart') ||
          lowerName.includes('bein') ||
          lowerName.includes('trt') ||
          lowerName.includes('(576p)') ||
          lowerName.includes('(720p)') ||
          lowerName.includes('(1080p)') ||
          lowerUrl.includes('/live/');

        // 2. Series Detection: Must have season & episode number (e.g. Dexter - Sezon 1 - Bölüm 12, S01 E01) OR /series/ path
        const seasonEpRegex = /(?:S(\d{1,2})[\s._-]*E(?:P)?(\d{1,2}))|(?:\b(\d{1,2})\.\s*Sezon[\s._-]*(\d{1,2})\.\s*Bölüm\b)|(?:\bSezon\s*(\d{1,2})[\s._-]*Bölüm\s*(\d{1,2})\b)|(?:\bSeason\s*(\d{1,2})[\s._-]*Episode\s*(\d{1,2})\b)/i;
        const seasonEpMatch = name.match(seasonEpRegex);
        const isSeriesByPattern = !!seasonEpMatch || isXtreamSeriesUrl;
        const isSeriesGroup = (lowerGroup.includes('dizi') || lowerGroup.includes('series') || lowerGroup.includes('season')) && !isTvChannel;
        const isSeries = (isSeriesByPattern || isSeriesGroup) && !isTvChannel;

        // 3. Movie (VOD) Detection: Must be a video file /movie/ OR movie/film/vod category, AND NOT a TV channel
        const isMovieByUrl = isVideoFileUrl || isXtreamMovieUrl;
        const isMovieGroup = (lowerGroup.includes('film') || lowerGroup.includes('vod') || lowerGroup.includes('movie') || lowerGroup.includes('sinema')) && !isTvChannel;
        const isMovie = (isMovieByUrl || isMovieGroup) && !isSeries && !isTvChannel;

        if (isSeries) {
          // Parse series title and episode details
          let seriesName = name;
          let seasonNum = 1;
          let episodeNum = 1;
          let episodeTitle = name;

          if (seasonEpMatch) {
            seasonNum = parseInt(seasonEpMatch[1] || seasonEpMatch[3] || seasonEpMatch[5] || seasonEpMatch[7] || '1', 10);
            episodeNum = parseInt(seasonEpMatch[2] || seasonEpMatch[4] || seasonEpMatch[6] || seasonEpMatch[8] || '1', 10);
            const matchIndex = seasonEpMatch.index || 0;
            if (matchIndex > 0) {
              seriesName = name.substring(0, matchIndex).replace(/[-:\s]+$/, '').trim();
            }
            const afterMatch = name.substring(matchIndex + seasonEpMatch[0].length).replace(/^[-:\s]+/, '').trim();
            episodeTitle = afterMatch || `${seasonNum}. Sezon ${episodeNum}. Bölüm`;
          }

          const catId = `ser_cat_${this.hashString(groupTitle)}`;
          if (!seriesCatsMap.has(catId)) {
            seriesCatsMap.set(catId, {
              category_id: catId,
              category_name: groupTitle,
              parent_id: 0,
            });
          }

          const seriesKey = `${catId}_${seriesName.toLowerCase()}`;
          let seriesEntry = seriesMap.get(seriesKey);

          if (!seriesEntry) {
            seriesEntry = {
              num: seriesList.length + 1,
              name: seriesName,
              series_id: streamCount,
              cover: icon,
              plot: `${seriesName} dizisi bölümleri`,
              cast: '',
              director: '',
              genre: groupTitle,
              releaseDate: '',
              last_modified: '',
              rating: '',
              rating_5based: 4.5,
              backdrop_path: [],
              youtube_trailer: '',
              episode_run_time: '45',
              category_id: catId,
            };
            seriesMap.set(seriesKey, seriesEntry);
            seriesList.push(seriesEntry);
            seriesEpisodesMap[seriesEntry.series_id] = [];
          }

          const epInfo: EpisodeInfo & { direct_source?: string } = {
            id: streamCount,
            episode_num: episodeNum,
            title: episodeTitle,
            container_extension: isVideoFileUrl ? 'mp4' : 'm3u8',
            info: {
              name: episodeTitle,
              plot: `${seriesName} - ${seasonNum}. Sezon ${episodeNum}. Bölüm`,
              duration: '45:00',
              duration_secs: 2700,
              movie_image: icon,
            },
            season: seasonNum,
            direct_source: streamUrl,
          };

          if (!seriesEpisodesMap[seriesEntry.series_id]) {
            seriesEpisodesMap[seriesEntry.series_id] = [];
          }
          seriesEpisodesMap[seriesEntry.series_id].push(epInfo);

        } else if (isMovie) {
          // Actual On-Demand Movie (VOD)
          const catId = `vod_cat_${this.hashString(groupTitle)}`;
          if (!vodCatsMap.has(catId)) {
            vodCatsMap.set(catId, {
              category_id: catId,
              category_name: groupTitle,
              parent_id: 0,
            });
          }

          vodStreams.push({
            num: vodStreams.length + 1,
            name,
            stream_type: 'movie',
            stream_id: streamCount,
            stream_icon: icon,
            rating: '',
            rating_5based: 4.5,
            added: '',
            category_id: catId,
            container_extension: isVideoFileUrl ? 'mp4' : 'm3u8',
            custom_sid: '',
            direct_source: streamUrl,
          });
        } else {
          // CANLI TV YAYINI (Live TV Channel)
          // (beIN Box Office, FilmBox, MovieSmart, Sinema TV, Haber, Spor, Ulusal vb. hepsi buraya gider)
          let liveCategoryName = groupTitle;
          if (liveCategoryName === 'Sinema & Film' || liveCategoryName === 'Sinema') {
            liveCategoryName = 'Sinema Kanalları';
          } else if (liveCategoryName === 'Diziler' || liveCategoryName === 'Dizi') {
            liveCategoryName = 'Dizi Kanalları';
          }

          const catId = `live_cat_${this.hashString(liveCategoryName)}`;
          if (!liveCatsMap.has(catId)) {
            liveCatsMap.set(catId, {
              category_id: catId,
              category_name: liveCategoryName,
              parent_id: 0,
            });
          }

          liveStreams.push({
            num: liveStreams.length + 1,
            name,
            stream_type: 'live',
            stream_id: streamCount,
            stream_icon: icon,
            epg_channel_id: info.tvgId || '',
            added: '',
            category_id: catId,
            custom_sid: '',
            tv_archive: 0,
            direct_source: streamUrl,
          });
        }

        currentExtinf = null;
      }
    }

    return {
      liveCategories: Array.from(liveCatsMap.values()),
      liveStreams,
      vodCategories: Array.from(vodCatsMap.values()),
      vodStreams,
      seriesCategories: Array.from(seriesCatsMap.values()),
      seriesList,
      seriesEpisodesMap,
    };
  }

  private static parseExtinf(extinf: string) {
    const tvgId = this.extractAttribute(extinf, 'tvg-id') || this.extractAttribute(extinf, 'tvg-name');
    const tvgLogo = this.extractAttribute(extinf, 'tvg-logo');
    const groupTitle = this.extractAttribute(extinf, 'group-title');

    // Title is everything after the last comma
    const commaIndex = extinf.lastIndexOf(',');
    const title = commaIndex !== -1 ? extinf.substring(commaIndex + 1).trim() : '';

    return { tvgId, tvgLogo, groupTitle, title };
  }

  private static extractAttribute(line: string, attrName: string): string | null {
    const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
    const match = line.match(regex);
    return match ? match[1] : null;
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

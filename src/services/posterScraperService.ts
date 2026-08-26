import { cleanMediaTitle } from '../utils/titleCleaner';
import { getLocalPoster, saveLocalPoster } from './localPosterCache';

// In-flight request deduplication map (Aynı anda birden fazla kart aynı filmi arıyorsa tek istek atılır)
const inFlightRequests = new Map<string, Promise<string | null>>();

/**
 * 1. Apple iTunes Search API (Filmler ve Diziler için %100 Sıfır API Key, Yüksek Kalite 600x600)
 */
async function searchITunes(cleanTitle: string, isSeries: boolean): Promise<string | null> {
  try {
    const entity = isSeries ? 'tvSeason' : 'movie';
    // Önce Türkiye mağazasında Türkçe afiş ara
    const trUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=${entity}&limit=1&country=TR`;
    const res = await fetch(trUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const artwork = data.results[0].artworkUrl100 || data.results[0].artworkUrl60;
        if (artwork) {
          return artwork.replace(/\/\d+x\d+bb?\./, '/600x600bb.');
        }
      }
    }

    // Türkiye mağazasında bulunamadıysa Global (US) mağazasında ara
    const usUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=${entity}&limit=1&country=US`;
    const resUs = await fetch(usUrl);
    if (resUs.ok) {
      const dataUs = await resUs.json();
      if (dataUs.results && dataUs.results.length > 0) {
        const artwork = dataUs.results[0].artworkUrl100 || dataUs.results[0].artworkUrl60;
        if (artwork) {
          return artwork.replace(/\/\d+x\d+bb?\./, '/600x600bb.');
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 2. TVMaze API (Diziler için %100 Sıfır API Key, Orijinal Dizi Afişleri)
 */
async function searchTVMaze(cleanTitle: string): Promise<string | null> {
  try {
    const url = `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.image && (data.image.original || data.image.medium)) {
      return data.image.original || data.image.medium;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 3. Wikipedia / Wikimedia API (Nadir Türk Dizileri ve Filmleri İçin %100 Sıfır Key)
 */
async function searchWikipedia(cleanTitle: string): Promise<string | null> {
  try {
    const url = `https://tr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.query && data.query.pages) {
      const pages = Object.values(data.query.pages) as any[];
      if (pages.length > 0 && pages[0].thumbnail && pages[0].thumbnail.source) {
        return pages[0].thumbnail.source;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Ana Akıllı Afiş Arama Fonksiyonu (Waterfall: Local Cache -> iTunes -> TVMaze -> Wikipedia)
 * %100 Sıfır API Key gerektirir ve tamamen yerel önbellek ile çalışır.
 */
export async function getSmartMediaPoster(rawTitle: string, isSeries = false): Promise<string | null> {
  const { cleanTitle } = cleanMediaTitle(rawTitle);
  if (!cleanTitle || cleanTitle.length < 2) return null;

  // 1. Önce Local Cache'e bak (0ms)
  const cached = getLocalPoster(cleanTitle);
  if (cached) {
    return cached;
  }

  // İstek tekilleştirme (aynı anda birden fazla kart aynı başlığı soruyorsa)
  const requestKey = `${cleanTitle}_${isSeries}`;
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const fetchPromise = (async () => {
    try {
      // 2. Dizi ise önce TVMaze ve iTunes ara
      if (isSeries) {
        const tvmaze = await searchTVMaze(cleanTitle);
        if (tvmaze) {
          saveLocalPoster(cleanTitle, tvmaze, 'tvmaze');
          return tvmaze;
        }

        const itunes = await searchITunes(cleanTitle, true);
        if (itunes) {
          saveLocalPoster(cleanTitle, itunes, 'itunes');
          return itunes;
        }
      } else {
        // Film ise önce iTunes ara
        const itunes = await searchITunes(cleanTitle, false);
        if (itunes) {
          saveLocalPoster(cleanTitle, itunes, 'itunes');
          return itunes;
        }
      }

      // 3. Bulunamadıysa Wikipedia üzerinden Türkçe afiş ara
      const wiki = await searchWikipedia(cleanTitle);
      if (wiki) {
        saveLocalPoster(cleanTitle, wiki, 'custom');
        return wiki;
      }

      return null;
    } finally {
      inFlightRequests.delete(requestKey);
    }
  })();

  inFlightRequests.set(requestKey, fetchPromise);
  return fetchPromise;
}

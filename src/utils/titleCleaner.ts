export interface CleanedMediaInfo {
  cleanTitle: string;
  season?: number;
  episode?: number;
  year?: number;
}

/**
 * IPTV kanal, film ve dizi isimlerindeki gürültüleri (çözünürlük, dublaj, IPTV sağlayıcı ön ekleri)
 * temizleyerek saf arama başlığına dönüştürür.
 */
export function cleanMediaTitle(rawTitle: string): CleanedMediaInfo {
  if (!rawTitle) return { cleanTitle: '' };

  let title = rawTitle.trim();

  // 0. IPTV Sağlayıcı ön eklerini temizle (Örn: "TR | Inception", "VIP: Oppenheimer", "NETFLIX - Stranger Things")
  title = title.replace(/^(TR|VIP|4K|FHD|HD|NETFLIX|DISNEY\+|EXXEN|BLUTV|AMAZON|PRIME|TOD|GAIN|BEIN|APPLE\s*TV\+?)\s*[:|/\-]\s*/gi, '');

  // 1. Yıl bilgisini yakala (Örn: "Dune (2021)" -> 2021)
  let year: number | undefined;
  const yearMatch = title.match(/[\(\[\s](19\d\d|20\d\d)[\)\]\s]/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  // 2. Sezon & Bölüm bilgisini yakala (S01E05 veya 1. Sezon 5. Bölüm)
  let season: number | undefined;
  let episode: number | undefined;
  const seMatch = title.match(/s(\d+)[\s._-]*e(\d+)/i);
  if (seMatch) {
    season = parseInt(seMatch[1], 10);
    episode = parseInt(seMatch[2], 10);
  } else {
    const trSezMatch = title.match(/(\d+)\.\s*sezon/i);
    const trBolMatch = title.match(/(\d+)\.\s*bölüm/i);
    if (trSezMatch) season = parseInt(trSezMatch[1], 10);
    if (trBolMatch) episode = parseInt(trBolMatch[1], 10);
  }

  // 3. İsimden gereksiz IPTV etiketlerini ve parantez içlerini temizle
  title = title
    // Sezon / Bölüm kalıpları
    .replace(/s\d+[\s._-]*e\d+/gi, '')
    .replace(/\b\d+\.\s*(sezon|bölüm)\b/gi, '')
    .replace(/season\s*\d+/gi, '')
    .replace(/episode\s*\d+/gi, '')
    // Çözünürlük ve Format Etiketleri
    .replace(/\b(2160p|1080p|720p|480p|360p|4k|uhd|fhd|hd|sd|hevc|h264|h265|x264|x265|10bit|hdr|hdr10|bluray|web-dl|webrip|dvdrip|remux)\b/gi, '')
    // Dil ve Ses Etiketleri
    .replace(/\b(tr-eng|tr\/eng|eng-tr|dual|multi|dublaj|altyazı|altyazılı|türkçe|english|ac3|dts|aac|ddp5\.1|5\.1|7\.1)\b/gi, '')
    // Parantez içi açıklamalar [1080p] (TR Dublaj) (2021) vb.
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    // Noktaları boşluğa çevir (Örn: "Breaking.Bad.2008" -> "Breaking Bad")
    .replace(/[._]/g, ' ')
    // Özel karakter ve ayraç temizliği
    .replace(/[-:|/\\+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    cleanTitle: title,
    season,
    episode,
    year,
  };
}

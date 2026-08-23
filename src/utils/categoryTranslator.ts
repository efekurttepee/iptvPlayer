/**
 * Automatic Category Translator and Normalizer for IPTV & M3U Channels
 * Translates English, mixed or generic category names into clean Turkish.
 */

const DIRECT_TRANSLATIONS: Record<string, string> = {
  // Main Broadcast Types
  'news': 'Haber',
  'entertainment': 'Eğlence',
  'sports': 'Spor',
  'sport': 'Spor',
  'football': 'Futbol & Spor',
  'movies': 'Sinema & Film',
  'movie': 'Sinema & Film',
  'cinema': 'Sinema & Film',
  'films': 'Filmler',
  'music': 'Müzik',
  'documentary': 'Belgesel',
  'documentaries': 'Belgesel',
  'kids': 'Çocuk',
  'children': 'Çocuk',
  'animation': 'Animasyon & Çizgi Film',
  'general': 'Genel & Ulusal',
  'undefined': 'Genel',
  'other': 'Diğer',
  'religious': 'Dini & Kültür',
  'religion': 'Dini & Kültür',
  'islamic': 'Dini Yayınlar',
  'series': 'Diziler',
  'education': 'Eğitim',
  'science': 'Bilim & Teknoloji',
  'comedy': 'Komedi',
  'action': 'Aksiyon',
  'drama': 'Dram',
  'horror': 'Korku & Gerilim',
  'sci-fi': 'Bilim Kurgu',
  'science fiction': 'Bilim Kurgu',
  'adventure': 'Macera',
  'romance': 'Romantik',
  'crime': 'Polisiye & Suç',
  'thriller': 'Gerilim',
  'family': 'Aile',
  'history': 'Tarih',
  'lifestyle': 'Yaşam & Moda',
  'cooking': 'Yemek & Mutfak',
  'food': 'Yemek & Mutfak',
  'travel': 'Gezi & Seyahat',
  'outdoor': 'Doğa & Macera',
  'business': 'Ekonomi & Finans',
  'finance': 'Ekonomi & Finans',
  'weather': 'Hava Durumu',
  'culture': 'Kültür & Sanat',
  'local': 'Yerel Kanallar',
  'regional': 'Bölgesel Kanallar',
  'international': 'Uluslararası',
  'classic': 'Klasikler',
  'reality': 'Reality Show',
  'legislative': 'Meclis & Resmi',
  'shop': 'Alışveriş',
  'shopping': 'Alışveriş',
  'radio': 'Radyo',
  'auto': 'Otomotiv',
  'gaming': 'Oyun & Espor',
  'xxx': 'Yetişkin (+18)',
  'adult': 'Yetişkin (+18)',
  'all': 'Tüm Kanallar',
  'turkey': 'Türkiye Ulusal',
  'turkish': 'Türkçe Kanallar',
};

export function translateCategory(rawName: string): string {
  if (!rawName) return 'Genel';
  
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct dictionary match
  if (DIRECT_TRANSLATIONS[lower]) {
    return DIRECT_TRANSLATIONS[lower];
  }

  // 2. Keyword replacement inside strings (e.g. "TR: News", "VIP | Sports", "Turkey Entertainment")
  let translated = trimmed;

  const keywords = [
    { en: /\bnews\b/gi, tr: 'Haber' },
    { en: /\bentertainment\b/gi, tr: 'Eğlence' },
    { en: /\bsports?\b/gi, tr: 'Spor' },
    { en: /\bmovies?\b/gi, tr: 'Sinema' },
    { en: /\bcinema\b/gi, tr: 'Sinema' },
    { en: /\bfilms?\b/gi, tr: 'Film' },
    { en: /\bmusic\b/gi, tr: 'Müzik' },
    { en: /\bdocumentar(y|ies)\b/gi, tr: 'Belgesel' },
    { en: /\bkids?\b/gi, tr: 'Çocuk' },
    { en: /\bchildren\b/gi, tr: 'Çocuk' },
    { en: /\banimation\b/gi, tr: 'Animasyon' },
    { en: /\bseries\b/gi, tr: 'Diziler' },
    { en: /\bcomedy\b/gi, tr: 'Komedi' },
    { en: /\baction\b/gi, tr: 'Aksiyon' },
    { en: /\bdrama\b/gi, tr: 'Dram' },
    { en: /\bhorror\b/gi, tr: 'Korku' },
    { en: /\bsci-?fi\b/gi, tr: 'Bilim Kurgu' },
    { en: /\badventure\b/gi, tr: 'Macera' },
    { en: /\bromance\b/gi, tr: 'Romantik' },
    { en: /\bcrime\b/gi, tr: 'Polisiye' },
    { en: /\bthriller\b/gi, tr: 'Gerilim' },
    { en: /\bfamily\b/gi, tr: 'Aile' },
    { en: /\bhistory\b/gi, tr: 'Tarih' },
    { en: /\blifestyle\b/gi, tr: 'Yaşam' },
    { en: /\bcooking\b/gi, tr: 'Yemek' },
    { en: /\bfood\b/gi, tr: 'Mutfak' },
    { en: /\btravel\b/gi, tr: 'Gezi' },
    { en: /\bbusiness\b/gi, tr: 'Ekonomi' },
    { en: /\bfinance\b/gi, tr: 'Finans' },
    { en: /\bweather\b/gi, tr: 'Hava Durumu' },
    { en: /\bculture\b/gi, tr: 'Kültür' },
    { en: /\blocal\b/gi, tr: 'Yerel' },
    { en: /\binternational\b/gi, tr: 'Uluslararası' },
    { en: /\breligious?\b/gi, tr: 'Dini' },
    { en: /\beducation\b/gi, tr: 'Eğitim' },
    { en: /\bscience\b/gi, tr: 'Bilim' },
    { en: /\bgeneral\b/gi, tr: 'Genel' },
    { en: /\bundefined\b/gi, tr: 'Genel' },
    { en: /\bother\b/gi, tr: 'Diğer' },
  ];

  for (const { en, tr } of keywords) {
    if (en.test(translated)) {
      translated = translated.replace(en, tr);
    }
  }

  // Clean double spaces or dangling hyphens
  translated = translated.replace(/\s+/g, ' ').trim();

  return translated || 'Genel';
}

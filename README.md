# 📺 IPTV Player Pro

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-34-47848F.svg)](https://www.electronjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**IPTV Player Pro**, modern masaüstü platformları (Windows `.exe` ve macOS `.dmg`) için geliştirilmiş, yüksek performanslı, şık cam efektli (Glassmorphism) ve **Kaldığı Yerden Devam Etme (Resume Playback)** özellikli profesyonel bir IPTV oynatıcı uygulamasıdır.

---

## ✨ Temel Özellikler

1. **🔗 Çift Giriş Modu (Xtream Codes API & M3U URL Desteği)**:
   - 🔐 **Xtream Codes API**: Sunucu adresi, kullanıcı adı ve şifre ile tam kütüphane senkronizasyonu.
   - 📄 **M3U / M3U8 Linki**: Tek bir çalma listesi URL'si veya yerel dosya ile şifresiz anında yükleme.
   - 🔄 **Çoklu Çalma Listesi**: Birden fazla hesabı kaydedip tek tıkla aralarında geçiş yapabilme.

2. **⏱️ Akıllı Kaldığı Yerden Devam Etme (Resume Playback)**:
   - İzlenen tüm Film ve Dizi bölümlerinin tam kaldığı saniye, dakika ve yüzde oranı yerel veritabanında kalıcı olarak saklanır.
   - Video açıldığında otomatik olarak kalınan saniyeden başlar veya tercihinize göre onay sorar.
   - Özel **"Tekrar İzle"** geçmiş ekranı ile son izlenen tüm içerikleri tek ekranda yönetebilme.

3. **📺 Canlı TV & Gelişmiş EPG Görünümü**:
   - Ulusal, Haber, Spor, Sinema, Belgesel, Çocuk vb. kategori filtreleri.
   - Hızlı kanal arama ve favorilere ekleme.
   - Anlık yayın akışı (EPG) ve kanal önizleme paneli.

4. **🎬 Filmler (VOD) & 🍿 Diziler (Series)**:
   - IMDb puanları, afişler, süre bilgileri ve film detay modalları.
   - Diziler için akıllı sezon ve bölüm gruplama motoru (`S01 E01`, `1. Sezon 1. Bölüm` otomatik regex eşleme).
   - Bölüm bittiğinde sonraki bölüme tek tıkla geçiş.

5. **⚡ 60 FPS Ultra Akıcı Performans (Lazy Chunk Rendering)**:
   - On binlerce kanal ve film içeren devasa çalma listelerinde dahi DOM yükü oluşturmayan akıllı sonsuz kaydırma motoru.
   - Anında arama ve kategoriler arası takılmasız geçiş.

6. **🔊 İçeriğe Özel Ses Seviyesi Hafızası**:
   - Her kanal, film ve dizi için ayarladığınız ses seviyesi (`%40`, `%80`, `Mute`) yerel veritabanında hatırlanır.

7. **🌐 Otomatik Türkçe Kategori Çevirisi**:
   - Uluslararası ve yabancı kategorileri (`News` ➔ `Haber`, `Entertainment` ➔ `Eğlence`, `Documentary` ➔ `Belgesel` vb.) otomatik olarak Türkçeleştirir.

8. **🚀 Uzaktan Otomatik Güncelleme (Auto-Updater)**:
   - `electron-updater` entegrasyonu ile GitHub Releases üzerinden tek tıkla güncelleme denetleme, arka planda indirme ve otomatik yeniden başlatıp kurma.

---

## ⌨️ Klavye Kısayolları

| Tuş | İşlev |
| :--- | :--- |
| `Boşluk (Space)` / `K` | Oynat / Duraklat |
| `Sol Ok (←)` / `Sağ Ok (→)` | 10 Saniye Geri / İleri Sar |
| `Yukarı (↑)` / `Aşağı (↓)` | Sesi Artır / Azalt (%5) |
| `M` | Sesi Kapat / Aç (Mute) |
| `F` | Tam Ekran Moduna Geç / Çık |
| `Esc` | Oynatıcıyı Kapat ve İlerlemeyi Kaydet |

---

## 🛠️ Kurulum ve Geliştirme

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- npm

### 1. Projeyi Klonlayın ve Bağımlılıkları Yükleyin
```bash
git clone https://github.com/efekurttepee/iptvPlayer.git
cd iptvPlayer
npm install
```

### 2. Geliştirici Modunda Çalıştırın (Desktop)
```bash
npm run electron:dev
```

---

## 📦 Masaüstü Paketleme (.exe & .dmg)

### macOS İçin Paketleme (`.dmg` & `.zip`)
```bash
npm run dist:mac
```
*Çıktı: `release/IPTV Player Pro-1.0.1.dmg`*

### Windows İçin Paketleme (`.exe` Installer & Portable)
```bash
npm run dist:win
```
*Çıktı: `release/IPTV Player Pro Setup 1.0.1.exe` (NSIS Installer) ve `release/IPTV Player Pro 1.0.1.exe` (Portable)*

---

## 💾 Yerel Veritabanı Mimarisi (Local DB)

Tüm kullanıcı verileri işletim sisteminizin yerel veri dizininde fiziksel bir JSON veritabanı dosyasında (`iptv_player_data.json`) tutulur:

- **Windows:** `%APPDATA%\IPTV Player Pro\iptv_player_data.json`
- **macOS:** `~/Library/Application Support/IPTV Player Pro/iptv_player_data.json`

Saklanan veriler:
* Kayıtlı IPTV hesapları ve M3U linkleri
* İzleme geçmişi ve kalınan saniyeler
* Favori kanallar ve filmler
* Ses seviyesi ve uygulama ayarları

---

## 📁 Proje Yapısı

```text
iptvPlayer/
├── electron/
│   ├── main.cjs            # Electron ana süreç & pencere yönetimi
│   ├── preload.cjs         # Güvenli context bridge IPC köprüsü
│   ├── httpClient.cjs      # Yerel HTTP soket köprüsü (CORS & ISP bypass)
│   ├── database.cjs        # Fiziksel yerel dosya veritabanı motoru
│   └── updater.cjs         # GitHub Auto-Updater motoru
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Üst bar, canlı saat, arama ve pencere kontrolleri
│   │   ├── Dashboard.tsx       # 6 ana kategori kartı & durum paneli
│   │   ├── LiveTvView.tsx      # Canlı TV kategorileri, kanal listesi ve önizleme
│   │   ├── MoviesView.tsx      # Filmler, IMDb puanı, afişler ve detay modalı
│   │   ├── SeriesView.tsx      # Diziler, sezonlar ve bölüm seçici
│   │   ├── VideoPlayer.tsx     # Kaldığı yerden devam etme özellikli video oynatıcı
│   │   ├── PlaylistsModal.tsx  # Çalma listesi & hesap yönetim modalı
│   │   ├── WatchHistoryView.tsx# İzleme geçmişi ve tekrar izle ekranı
│   │   ├── AccountModal.tsx    # Abonelik ve paket bilgileri
│   │   └── SettingsModal.tsx   # Oynatıcı, ses hafızası ve güncelleme ayarları
│   ├── services/
│   │   ├── xtreamApi.ts        # Xtream Codes API istemcisi & ağ köprüsü
│   │   ├── m3uParser.ts        # M3U / M3U8 ayrıştırıcı & dizi regex motoru
│   │   └── storage.ts          # Yerel veritabanı & senkronizasyon servisi
│   ├── utils/
│   │   └── categoryTranslator.ts # Otomatik Türkçe kategori çevirmeni
│   ├── types/
│   │   └── index.ts            # TypeScript arayüz ve tipleri
│   ├── App.tsx                 # Ana uygulama ve görünüm yönlendiricisi
│   └── index.css               # Cam efektleri, degradeler ve stiller
├── package.json                # Paket yapılandırması & Electron-Builder ayarları
└── vite.config.ts              # Vite derleme & geliştirme proxy yapılandırması
```

---

## 📄 Lisans
Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

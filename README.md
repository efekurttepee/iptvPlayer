## ✨ Özellikler

1. **2 Farklı Giriş / Çalma Listesi Seçeneği**:
   - 🔐 **1. Seçenek (Xtream Codes API - Kullanıcı Adı & Şifreli)**: Sunucu adresi (`http://domain.xyz:80`), kullanıcı adı ve şifre ile doğrudan giriş.
   - 🔗 **2. Seçenek (M3U Çalma Listesi - Şifresiz / Tek Link ile Giriş)**: Kullanıcı adı ve şifreye gerek olmadan doğrudan tek bir M3U / M3U8 bağlantı linki girerek tüm canlı TV, film ve dizileri yükleme.
   - Çoklu çalma listesi desteği (farklı IPTV hesaplarını/linklerini kaydedip tek tıkla aralarında geçiş yapabilme).
2. **Canlı TV (Live TV)**:
   - Kategori filtreleme (Ulusal, Spor, Sinema, Belgesel, Müzik vb.).
   - Kanal arama ve favorilere ekleme.
   - Anlık yayın akışı (EPG) ve kanal önizleme paneli.
3. **🎯 Özel İstek: "Kaldığı Yerden Devam Et" (Resume Playback)**:
   - Filmler ve Dizi bölümleri izlenirken kalınan saniye, dakika ve saat otomatik olarak kaydedilir.
   - İçerik tekrar açıldığında *"Kaldığınız yerden devam etmek ister misiniz? (01:24:15 - %45)"* onay penceresi açılır.
   - **[Kaldığım Yerden Devam Et]** veya **[Baştan Başla]** seçenekleri.
   - Ana ekranda ve kategori sayfalarında izleme ilerleme çubuğu gösterilir.
4. **Diziler (Series)**:
   - Sezon seçici (1. Sezon, 2. Sezon...).
   - Bölüm listesi, bölüm süreleri ve sonraki bölüme otomatik geçiş.
5. **Gelişmiş Video Oynatıcı**:
   - `Hls.js` + HTML5 motoru ile `.m3u8`, `.ts`, `.mp4` ve `.mkv` formatlarını kesintisiz oynatma.
   - Klavye kısayolları (Boşluk/K: Duraklat, Sol/Sağ: 10sn Sarma, Yukarı/Aşağı: Ses, F: Tam Ekran, M: Sessiz, Esc: Geri).
   - Oynatıcı içi hızlı kanal / bölüm listesi çekmecesi.
6. **Windows `.exe` Çıktısı**:
   - `electron-builder` ile tek tıkla çalışan taşınabilir **Portable `.exe`** ve kurulum sağlayan **Installer `.exe`**.

---

## 🚀 Uzaktan Otomatik Güncelleme Sistemi (Dayınız & Kullanıcılar İçin)

Uygulamaya **otomatik uzaktan güncelleme sistemi (`electron-updater`)** entegre edilmiştir. 

### Güncelleme Mantığı Nasıl Çalışır?
1. Dayınız uygulamayı açtığında program arka planda yeni sürüm olup olmadığını kontrol eder.
2. Yeni sürüm bulduğunda ekranın üstünde şık bir bildirim penceresi açılır:
   * **"🎉 Yeni Güncelleme Mevcut! (v1.0.2)"**
   * **[Şimdi Güncelle ve İndir]** butonu
3. Dayınız butona bastığında:
   * Yeni `.exe` arka planda indirilir ve yüzde çubuğu (`%65 indiriliyor...`) gösterilir.
   * İndirme bittiğinde **[Yeniden Başlat ve Kur]** butonu çıkar.
   * Tıkladığında program 2 saniyede kendini kapatır, günceller ve yeni sürümle anında tekrar açılır!

### İleride Güncelleme Yayınlama (Nasıl Yapılır?):
1. `package.json` dosyasındaki versiyonu artırın (örn: `"version": "1.0.2"`).
2. Yeni sürümün Windows kurulum dosyasını oluşturun:
   ```bash
   npm run dist:win
   ```
3. GitHub Releases'e veya kendi sunucunuza `IPTV Player Pro Setup 1.0.2.exe` ve `latest.yml` dosyasını yükleyin.
4. Programı kullanan herkes otomatik olarak güncellemeyi alacaktır!

---

## 🚀 Çalıştırma ve Geliştirme (MacBook & Windows)

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm

### 1. MacBook Üzerinde Canlı Test (Geliştirici Modu)
MacBook'unuzda doğrudan masaüstü uygulamasını açıp test etmek için:
```bash
npm run electron:dev
```
*(Uygulama anında masaüstü penceresi olarak açılır; Canlı TV, Film, Dizi, Xtream girişi ve Kaldığı Yerden Devam Etme özelliklerini doğrudan test edebilirsiniz.)*

### 2. MacBook İçin Paketleme (.dmg ve .app)
MacBook üzerinde bağımsız bir uygulama (`.app` veya `.dmg`) olarak derlemek için:
```bash
npm run dist:mac
```
*Derlenen uygulama `release/mac-arm64/IPTV Player Pro.app` veya `release/IPTV Player Pro-1.0.1-arm64.dmg` olarak hazır olur.*

---

## 💾 Yerel Veritabanı & Kalıcı Depolama (Local DB)

Uygulamanın ihtiyaç duyduğu tüm veriler güvenli bir yerel JSON veritabanı dosyasında (`iptv_player_data.json`) doğrudan programın çalışma/kurulum dizininde saklanır:
- 🔑 **IPTV Hesapları & Profiller** (Sunucu adresi `.xyz:80`, kullanıcı adı, şifre)
- ⏱️ **Kaldığı Yer İzleme Geçmişi** (Her film ve dizi için son kalınan tam saniye, süre ve yüzde)
- ❤️ **Favoriler Listesi** (Canlı TV, Film ve Dizi favorileri)
- ⚙️ **Kullanıcı Ayarları** (Tampon bellek, akış protokolü, otomatik devam etme tercihi)

---

## 📦 Windows Kurulum Dosyası (İleri > İleri Setup Sihirbazı)

Uygulamanın Windows için klasik adım adım kurulum sihirbazını (NSIS Setup Wizard) üretmek için:

```bash
npm run dist:win
```

Bu komut çalıştığında `release/` klasörü altına:
* 🛠️ **`IPTV Player Pro Setup 1.0.1.exe`** (Klasik "İleri > İleri > Kurulum Dizini Seç > Masaüstü Kısayolu Oluştur > Kur" adım adım kurulum sihirbazı)
* ⚡ **`IPTV Player Pro 1.0.1.exe`** (Kurulumsuz doğrudan çalışan taşınabilir Portable `.exe`)
üretilecektir.

---

## 📁 Proje Dizin Yapısı

```
iptvPlayer/
├── electron/
│   ├── main.cjs        # Electron ana süreç & IPTV CORS / User-Agent proxy motoru
│   └── preload.cjs     # Güvenli context bridge IPC köprüsü
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Canlı saat, tarih, IPTV logosu ve üst bar
│   │   ├── Dashboard.tsx     # Görseldeki 6 renkli ana kart (Canlı TV, Filmler, Diziler...)
│   │   ├── LiveTvView.tsx    # Canlı TV kategorileri, kanal listesi ve önizleme
│   │   ├── MoviesView.tsx    # Filmler, IMDb puanı, afişler ve detay modalı
│   │   ├── SeriesView.tsx    # Diziler, sezonlar ve bölüm seçici
│   │   ├── VideoPlayer.tsx   # Kaldığı yerden devam etme özellikli video oynatıcı
│   │   ├── PlaylistsModal.tsx# Xtream Codes giriş & hesap yönetimi
│   │   ├── AccountModal.tsx  # Abonelik ve paket bilgileri
│   │   ├── SettingsModal.tsx # Oynatıcı ve tampon bellek ayarları
│   │   └── SearchModal.tsx   # Canlı TV, Film ve Dizi genel arama modalı
│   ├── services/
│   │   ├── xtreamApi.ts      # Xtream Codes API istemcisi & Demo veri seti
│   │   └── storage.ts        # Kaldığı yeri saklama (Resume storage) ve favoriler
│   ├── types/
│   │   └── index.ts          # TypeScript veri modelleri
│   ├── App.tsx               # Ana uygulama ve görünüm yönlendiricisi
│   ├── index.css             # Degrade kartlar, cam efektleri ve stiller
│   └── main.tsx              # React mount noktası
├── package.json              # Paket ve Electron-Builder yapılandırması
├── tsconfig.json             # TypeScript yapılandırması
└── vite.config.ts            # Vite derleme yapılandırması
```

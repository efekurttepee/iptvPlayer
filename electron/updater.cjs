const { autoUpdater } = require('electron-updater');
const { ipcMain, app } = require('electron');
const https = require('https');
const http = require('http');

class AppUpdater {
  constructor() {
    this.mainWindow = null;
    this.updateInfo = null;
    this.isDownloading = false;
    this.isDownloaded = false;

    // Configure autoUpdater
    autoUpdater.autoDownload = false; // Let user confirm before downloading
    autoUpdater.autoInstallOnAppQuit = true;

    this.setupListeners();
    this.setupIpc();
  }

  setMainWindow(window) {
    this.mainWindow = window;
    // Auto check updates 2.5 seconds after app startup
    setTimeout(() => {
      this.checkOnStartup();
    }, 2500);
  }

  async checkOnStartup() {
    try {
      if (app.isPackaged) {
        await autoUpdater.checkForUpdates();
      } else {
        // In development mode, notify that app is up to date for UI preview
        this.sendToWindow('updater:not-available', {
          status: 'latest',
          version: app.getVersion(),
          message: 'Sürümünüz güncel.',
        });
      }
    } catch (err) {
      console.warn('Auto update check on startup error:', err?.message || err);
    }
  }

  setupListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.sendToWindow('updater:status', { status: 'checking', message: 'Güncellemeler denetleniyor...' });
    });

function cleanReleaseNotes(notes) {
  if (!notes) return 'Yeni özellikler, kanal optimizasyonları ve hata düzeltmeleri.';
  if (Array.isArray(notes)) {
    notes = notes.map((n) => n.note || n).join(' ');
  }
  return String(notes)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/#{1,6}\s?/g, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

    autoUpdater.on('update-available', (info) => {
      this.updateInfo = info;
      this.sendToWindow('updater:available', {
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: cleanReleaseNotes(info.releaseNotes),
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      this.sendToWindow('updater:not-available', {
        status: 'latest',
        version: app.getVersion(),
        message: 'Uygulamanız güncel.',
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendToWindow('updater:progress', {
        percent: Math.round(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.isDownloaded = true;
      this.sendToWindow('updater:downloaded', {
        status: 'downloaded',
        version: info.version,
        message: 'Güncelleme başarıyla indirildi. Yüklemek için yeniden başlatın.',
      });
    });

    autoUpdater.on('error', (err) => {
      console.warn('AutoUpdater error:', err?.message || err);
      this.sendToWindow('updater:error', {
        status: 'error',
        message: err?.message || 'Güncelleme kontrol edilirken bir hata oluştu.',
      });
    });
  }

  setupIpc() {
    ipcMain.handle('updater:check', async () => {
      if (!app.isPackaged) {
        this.sendToWindow('updater:not-available', {
          status: 'latest',
          version: app.getVersion(),
          message: 'Sürümünüz güncel.',
        });
        return {
          currentVersion: app.getVersion(),
          isPackaged: false,
          status: 'latest',
          message: 'Geliştirme modunda çalışıyor (Sürüm Güncel).',
        };
      }
      try {
        const result = await autoUpdater.checkForUpdates();
        return {
          currentVersion: app.getVersion(),
          updateInfo: result?.updateInfo || null,
        };
      } catch (err) {
        return {
          currentVersion: app.getVersion(),
          error: err.message,
        };
      }
    });

    ipcMain.handle('updater:download', async () => {
      this.isDownloading = true;
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (err) {
        this.isDownloading = false;
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle('updater:install', () => {
      try {
        setImmediate(() => {
          autoUpdater.quitAndInstall(true, true);
        });
      } catch (err) {
        console.error('quitAndInstall fallback error:', err);
        app.relaunch();
        app.exit(0);
      }
    });

    ipcMain.handle('updater:get-version', () => {
      return app.getVersion();
    });

    // Custom Remote JSON version check endpoint (Works without GitHub too!)
    ipcMain.handle('updater:check-custom-url', async (_event, customJsonUrl) => {
      return new Promise((resolve) => {
        if (!customJsonUrl) {
          resolve({ error: 'URL belirtilmedi' });
          return;
        }

        const client = customJsonUrl.startsWith('https') ? https : http;
        client.get(customJsonUrl, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const currentVer = app.getVersion();
              const hasNewVersion = this.compareVersions(parsed.version, currentVer) > 0;
              resolve({
                currentVersion: currentVer,
                remoteVersion: parsed.version,
                hasNewVersion,
                downloadUrl: parsed.downloadUrl,
                releaseNotes: parsed.releaseNotes,
                mandatory: parsed.mandatory || false,
              });
            } catch (e) {
              resolve({ error: 'JSON yanıtı okunamadı' });
            }
          });
        }).on('error', (err) => {
          resolve({ error: err.message });
        });
      });
    });
  }

  sendToWindow(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const p1 = v1.replace(/^v/, '').split('.').map(Number);
    const p2 = v2.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }
}

module.exports = new AppUpdater();

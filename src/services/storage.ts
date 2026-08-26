import { ResumeRecord, XtreamCredentials } from '../types';

const STORAGE_KEYS = {
  CREDENTIALS: 'iptv_credentials_list',
  ACTIVE_CREDENTIAL_ID: 'iptv_active_credential_id',
  RESUME_HISTORY: 'iptv_resume_playback_history',
  FAVORITES: 'iptv_favorites',
  SETTINGS: 'iptv_settings',
};

export interface AppSettings {
  streamFormat: 'm3u8' | 'ts';
  bufferSize: number;
  autoResume: boolean;
  theme: 'dark';
  playerVolume: number;
  openSubtitles: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  streamFormat: 'm3u8',
  bufferSize: 10,
  autoResume: true,
  theme: 'dark',
  playerVolume: 80,
  openSubtitles: true,
};

// Electron Database Bridge Helper
const getElectronDb = () => {
  return (window as any).electronAPI?.db || null;
};

export const StorageService = {
  // Initialize and synchronize with local database file
  async initLocalDb(): Promise<void> {
    const electronDb = getElectronDb();
    if (electronDb) {
      try {
        const fullData = await electronDb.getAll();
        if (fullData) {
          if (fullData.accounts && fullData.accounts.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(fullData.accounts));
          }
          if (fullData.activeAccountId) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_CREDENTIAL_ID, fullData.activeAccountId);
          }
          if (fullData.resumeHistory && Object.keys(fullData.resumeHistory).length > 0) {
            localStorage.setItem(STORAGE_KEYS.RESUME_HISTORY, JSON.stringify(fullData.resumeHistory));
          }
          if (fullData.favorites) {
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(fullData.favorites));
          }
          if (fullData.settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(fullData.settings));
          }
        }
      } catch (e) {
        console.error('Failed to sync from electron DB:', e);
      }
    }
  },

  async getDatabaseLocation(): Promise<string> {
    const electronDb = getElectronDb();
    if (electronDb) {
      return await electronDb.getPath();
    }
    return 'Web Tarayıcısı Depolama Alanı (localStorage)';
  },

  // Credentials & Profiles
  getSavedCredentials(): XtreamCredentials[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCredential(cred: XtreamCredentials): XtreamCredentials {
    const list = this.getSavedCredentials();
    const id = cred.id || `cred_${Date.now()}`;
    const newCred = { ...cred, id, lastLogin: Date.now() };
    
    const existingIndex = list.findIndex(c => c.id === id || (c.serverUrl === cred.serverUrl && c.username === cred.username));
    if (existingIndex >= 0) {
      list[existingIndex] = newCred;
    } else {
      list.push(newCred);
    }
    
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(list));
    this.setActiveCredentialId(newCred.id);

    // Save to local file DB
    getElectronDb()?.set('accounts', list);
    getElectronDb()?.set('activeAccountId', newCred.id);

    return newCred;
  },

  removeCredential(id: string) {
    const list = this.getSavedCredentials().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(list));
    if (this.getActiveCredentialId() === id) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CREDENTIAL_ID);
      getElectronDb()?.set('activeAccountId', null);
    }
    getElectronDb()?.set('accounts', list);

    // 🧹 Clean up resume history records that belonged to the deleted playlist
    const allResume = this.getAllResumeRecords();
    let changed = false;
    Object.keys(allResume).forEach(k => {
      if (allResume[k]?.accountId === id || list.length === 0) {
        delete allResume[k];
        changed = true;
      }
    });
    if (changed || list.length === 0) {
      localStorage.setItem(STORAGE_KEYS.RESUME_HISTORY, JSON.stringify(allResume));
      getElectronDb()?.set('resumeHistory', allResume);
    }
  },

  getActiveCredential(): XtreamCredentials | null {
    const id = this.getActiveCredentialId();
    if (!id) return null;
    const list = this.getSavedCredentials();
    return list.find(c => c.id === id) || null;
  },

  getActiveCredentialId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CREDENTIAL_ID);
  },

  setActiveCredentialId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CREDENTIAL_ID, id);
    getElectronDb()?.set('activeAccountId', id);
  },

  // Resume Playback (Kaldığı Yerden Devam Etme)
  getAllResumeRecords(): Record<string, ResumeRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESUME_HISTORY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  getResumePosition(recordId: string): ResumeRecord | null {
    const all = this.getAllResumeRecords();
    const record = all[recordId];
    if (!record) return null;
    if (record.percentage >= 95) return null;
    if (record.currentTime < 5) return null;
    return record;
  },

  saveResumePosition(record: Omit<ResumeRecord, 'updatedAt'>) {
    const all = this.getAllResumeRecords();
    const percentage = record.duration > 0 ? Math.round((record.currentTime / record.duration) * 100) : 0;
    const activeAccountId = this.getActiveCredentialId() || undefined;

    all[record.id] = {
      ...record,
      accountId: record.accountId || activeAccountId,
      percentage,
      updatedAt: Date.now(),
    };
    
    // Limit storage to last 200 items
    const keys = Object.keys(all);
    if (keys.length > 200) {
      const sortedKeys = keys.sort((a, b) => (all[b]?.updatedAt || 0) - (all[a]?.updatedAt || 0));
      const trimmed: Record<string, ResumeRecord> = {};
      sortedKeys.slice(0, 200).forEach(k => {
        trimmed[k] = all[k];
      });
      localStorage.setItem(STORAGE_KEYS.RESUME_HISTORY, JSON.stringify(trimmed));
      getElectronDb()?.set('resumeHistory', trimmed);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.RESUME_HISTORY, JSON.stringify(all));
    getElectronDb()?.set('resumeHistory', all);
  },

  removeResumePosition(recordId: string) {
    const all = this.getAllResumeRecords();
    delete all[recordId];
    localStorage.setItem(STORAGE_KEYS.RESUME_HISTORY, JSON.stringify(all));
    getElectronDb()?.set('resumeHistory', all);
  },

  clearAllResumePositions() {
    localStorage.removeItem(STORAGE_KEYS.RESUME_HISTORY);
    getElectronDb()?.set('resumeHistory', {});
  },

  getRecentWatchList(limit = 100): ResumeRecord[] {
    const activeId = this.getActiveCredentialId();
    if (!activeId) return [];
    const all = this.getAllResumeRecords();
    const sorted = Object.values(all)
      .filter(r => r.currentTime > 5 && r.accountId === activeId)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    // Her dizi için en son izlenen bölümü tut (Örn: 3. bölümden 5. bölüme geçince 5. bölüm gösterilir)
    const seenSeries = new Set<string | number>();
    const deduplicated: ResumeRecord[] = [];

    for (const record of sorted) {
      if (record.type === 'episode' && record.seriesId) {
        if (!seenSeries.has(record.seriesId)) {
          seenSeries.add(record.seriesId);
          deduplicated.push(record);
        }
      } else {
        deduplicated.push(record);
      }
    }

    return deduplicated.slice(0, limit);
  },

  // 🧹 Purge orphaned/legacy resume records
  purgeOrphanedResumeRecords(): void {
    const all = this.getAllResumeRecords();
    const credIds = new Set(this.getSavedCredentials().map(c => c.id));
    let modified = false;
    Object.keys(all).forEach(k => {
      if (!all[k]?.accountId || !credIds.has(all[k].accountId)) {
        delete all[k];
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEYS.RESUME_HISTORY, JSON.stringify(all));
      getElectronDb()?.set('resumeHistory', all);
    }
  },

  // Favorites
  getFavorites(): { live: number[]; movies: number[]; series: number[] } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : { live: [], movies: [], series: [] };
    } catch {
      return { live: [], movies: [], series: [] };
    }
  },

  toggleFavorite(type: 'live' | 'movies' | 'series', id: number): boolean {
    const favs = this.getFavorites();
    const list = favs[type] || [];
    const index = list.indexOf(id);
    let isNowFav = false;
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(id);
      isNowFav = true;
    }
    favs[type] = list;
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
    getElectronDb()?.set('favorites', favs);
    return isNowFav;
  },

  isFavorite(type: 'live' | 'movies' | 'series', id: number): boolean {
    const favs = this.getFavorites();
    return (favs[type] || []).includes(id);
  },

  // App Settings
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<AppSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    getElectronDb()?.set('settings', updated);
    return updated;
  },

  // 🔊 Volume Memory (Kanal / Film / Diziye Özel ve Genel Ses Seviyesi Hafızası)
  getVolumeForItem(itemId?: string): { volume: number; isMuted: boolean } {
    try {
      const settings = this.getSettings();
      const defaultVol = typeof settings.playerVolume === 'number' ? settings.playerVolume / 100 : 0.8;
      
      // If itemId provided, check item-specific volume first
      if (itemId) {
        const itemVolStr = localStorage.getItem(`iptv_vol_${itemId}`);
        if (itemVolStr) {
          const parsed = JSON.parse(itemVolStr);
          return {
            volume: typeof parsed.volume === 'number' ? parsed.volume : defaultVol,
            isMuted: Boolean(parsed.isMuted),
          };
        }
      }

      // Check global last saved volume
      const globalVolStr = localStorage.getItem('iptv_global_volume');
      if (globalVolStr) {
        const parsed = JSON.parse(globalVolStr);
        return {
          volume: typeof parsed.volume === 'number' ? parsed.volume : defaultVol,
          isMuted: Boolean(parsed.isMuted),
        };
      }

      return { volume: defaultVol, isMuted: false };
    } catch {
      return { volume: 0.8, isMuted: false };
    }
  },

  saveVolumeForItem(itemId: string, volume: number, isMuted: boolean): void {
    try {
      const payload = { volume, isMuted, updatedAt: Date.now() };
      // Save global volume
      localStorage.setItem('iptv_global_volume', JSON.stringify(payload));
      // Save item-specific volume (kanal/film/dizi için)
      if (itemId) {
        localStorage.setItem(`iptv_vol_${itemId}`, JSON.stringify(payload));
      }
      this.saveSettings({ playerVolume: Math.round(volume * 100) });
      getElectronDb()?.set(`vol_${itemId}`, payload);
      getElectronDb()?.set('global_volume', payload);
    } catch (e) {
      console.warn('Failed to save volume:', e);
    }
  }
};

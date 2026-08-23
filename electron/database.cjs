const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class LocalDatabase {
  constructor() {
    this.dbPath = this.getDatabasePath();
    this.data = this.loadData();
  }

  getDatabasePath() {
    // 1. Check if running as portable or near executable directory
    const appDir = path.dirname(app.getPath('exe'));
    const localDbPath = path.join(appDir, 'iptv_player_data.json');

    // In production, try saving alongside app or in userData
    try {
      if (app.isPackaged) {
        fs.accessSync(appDir, fs.constants.W_OK);
        return localDbPath;
      }
    } catch {
      // If program files is read-only without admin, fallback to appData
    }

    const userDataDir = app.getPath('userData');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    return path.join(userDataDir, 'iptv_player_data.json');
  }

  loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading local DB:', e);
    }
    return {
      accounts: [],
      activeAccountId: null,
      resumeHistory: {},
      favorites: { live: [], movies: [], series: [] },
      settings: {
        streamFormat: 'm3u8',
        bufferSize: 10,
        autoResume: true,
        theme: 'dark',
        playerVolume: 80,
      },
    };
  }

  saveData() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving local DB:', e);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.saveData();
    return this.data[key];
  }

  getAll() {
    return this.data;
  }

  setAll(newData) {
    this.data = { ...this.data, ...newData };
    this.saveData();
    return this.data;
  }

  getPath() {
    return this.dbPath;
  }
}

module.exports = new LocalDatabase();

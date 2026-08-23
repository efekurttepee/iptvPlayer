const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0b101b',
    autoHideMenuBar: true,
    show: false,
    frame: process.platform === 'darwin' ? false : true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Critical for IPTV mixed-content and CORS on arbitrary streams
      allowRunningInsecureContent: true,
    },
  });

  // Modify headers for all external IPTV streams to avoid CORS & User-Agent blocks
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const url = details.url;
    // Don't modify localhost dev server requests
    if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      details.requestHeaders['User-Agent'] = 'IPTVSmartersPro/3.1.5.1 (Windows NT 10.0; Win64; x64)';
      delete details.requestHeaders['Origin'];
      delete details.requestHeaders['Referer'];
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = Object.assign({}, details.responseHeaders);
    responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, OPTIONS, HEAD'];
    responseHeaders['Access-Control-Allow-Headers'] = ['*'];
    callback({ responseHeaders });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    appUpdater.setMainWindow(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const localDb = require('./database.cjs');
const appUpdater = require('./updater.cjs');

// IPC Handlers
ipcMain.handle('app:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('app:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('app:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('app:is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle('app:toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return mainWindow.isFullScreen();
  }
  return false;
});

// Local Database IPC Handlers
ipcMain.handle('db:get', (_event, key) => {
  return localDb.get(key);
});

ipcMain.handle('db:set', (_event, key, value) => {
  return localDb.set(key, value);
});

ipcMain.handle('db:getAll', () => {
  return localDb.getAll();
});

ipcMain.handle('db:setAll', (_event, data) => {
  return localDb.setAll(data);
});

ipcMain.handle('db:getPath', () => {
  return localDb.getPath();
});

const { nativeRequest } = require('./httpClient.cjs');

// Native HTTP Proxy IPC Handler (Bypasses all CORS, SSL errors & Chromium blocks)
ipcMain.handle('http:request', async (_event, targetUrl, options) => {
  return await nativeRequest(targetUrl, options);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

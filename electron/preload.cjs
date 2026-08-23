const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close'),
  isFullscreen: () => ipcRenderer.invoke('app:is-fullscreen'),
  toggleFullscreen: () => ipcRenderer.invoke('app:toggle-fullscreen'),
  isElectron: true,
  db: {
    get: (key) => ipcRenderer.invoke('db:get', key),
    set: (key, value) => ipcRenderer.invoke('db:set', key, value),
    getAll: () => ipcRenderer.invoke('db:getAll'),
    setAll: (data) => ipcRenderer.invoke('db:setAll', data),
    getPath: () => ipcRenderer.invoke('db:getPath'),
  },
  http: {
    request: (url, options) => ipcRenderer.invoke('http:request', url, options),
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    checkCustomUrl: (url) => ipcRenderer.invoke('updater:check-custom-url', url),
    onStatus: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('updater:status', handler);
      return () => ipcRenderer.removeListener('updater:status', handler);
    },
    onAvailable: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('updater:available', handler);
      return () => ipcRenderer.removeListener('updater:available', handler);
    },
    onNotAvailable: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('updater:not-available', handler);
      return () => ipcRenderer.removeListener('updater:not-available', handler);
    },
    onProgress: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('updater:progress', handler);
      return () => ipcRenderer.removeListener('updater:progress', handler);
    },
    onDownloaded: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('updater:downloaded', handler);
      return () => ipcRenderer.removeListener('updater:downloaded', handler);
    },
    onError: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('updater:error', handler);
      return () => ipcRenderer.removeListener('updater:error', handler);
    },
  }
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close'),
  isFullscreen: () => ipcRenderer.invoke('app:is-fullscreen'),
  toggleFullscreen: () => ipcRenderer.invoke('app:toggle-fullscreen'),
  isElectron: true,
});

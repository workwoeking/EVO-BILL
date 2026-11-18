const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printInvoice: (options) => ipcRenderer.invoke('print-invoice', options),
  saveBackupDialog: (defaultName) => ipcRenderer.invoke('save-backup-dialog', defaultName),
  openBackupDialog: () => ipcRenderer.invoke('open-backup-dialog'),
});

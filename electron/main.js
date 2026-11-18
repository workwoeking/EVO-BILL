const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    frame: false, // Frameless for modern custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0b0b0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    // Open DevTools in dev mode if needed
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Native Printer IPC handlers
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('print-invoice', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  try {
    await mainWindow.webContents.print({
      silent: options.silent || false,
      printBackground: true,
      deviceName: options.printerName || '',
      pageSize: options.pageSize || 'A4',
      margins: {
        marginType: 'custom',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Native file dialogs for backup/restore
ipcMain.handle('save-backup-dialog', async (event, defaultName) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Backup EVO BILL Data',
    defaultPath: defaultName || 'evo-bill-backup.json',
    filters: [{ name: 'JSON Data', extensions: ['json'] }],
  });
  return result;
});

ipcMain.handle('open-backup-dialog', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Restore EVO BILL Data',
    properties: ['openFile'],
    filters: [{ name: 'JSON Data', extensions: ['json'] }],
  });
  return result;
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

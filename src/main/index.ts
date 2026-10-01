import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { StorageManager } from './storage.js';
import { CatalogManager } from './catalogManager.js';
import { InstallManager } from './installManager.js';
import { DownloadManager } from './downloadManager.js';
import { ProcessManager } from './processManager.js';
import { GameManager } from './gameManager.js';
import { SystemStorageInfo } from '../shared/types.js';

let mainWindow: BrowserWindow | null = null;

const storageManager = new StorageManager();
const catalogManager = new CatalogManager(storageManager);
const installManager = new InstallManager(storageManager);
const downloadManager = new DownloadManager(storageManager, installManager, () => mainWindow);
const processManager = new ProcessManager(storageManager, () => mainWindow);
const gameManager = new GameManager(storageManager);

async function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Custom frameless title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0b0e14',
    show: false,
    icon: path.join(__dirname, '../../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(__dirname, '../renderer/index.html');
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  // Window Controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow?.isMaximized() || false;
  });

  // Catalog
  ipcMain.handle('catalog:get', async () => {
    return await catalogManager.fetchCatalog();
  });

  // Installed Games
  ipcMain.handle('installed:get-all', () => {
    return gameManager.getInstalledGames();
  });

  ipcMain.handle('game:uninstall', async (_event, gameId: string) => {
    return await gameManager.uninstallGame(gameId);
  });

  ipcMain.handle('game:open-folder', (_event, gameId: string) => {
    gameManager.openGameFolder(gameId);
  });

  // Downloads
  ipcMain.handle('download:start', async (_event, game, isUpdate, targetVersion) => {
    downloadManager.startDownload(game, isUpdate, targetVersion);
    return true;
  });

  ipcMain.handle('download:pause', (_event, gameId: string) => {
    downloadManager.pauseDownload(gameId);
    return true;
  });

  ipcMain.handle('download:resume', (_event, gameId: string) => {
    downloadManager.resumeDownload(gameId);
    return true;
  });

  ipcMain.handle('download:cancel', (_event, gameId: string) => {
    downloadManager.cancelDownload(gameId);
    return true;
  });

  ipcMain.handle('download:get-active', () => {
    return downloadManager.getActiveDownloads();
  });

  // Game Launching
  ipcMain.handle('game:launch', (_event, gameId: string) => {
    return processManager.launchGame(gameId);
  });

  // Settings
  ipcMain.handle('settings:get', () => {
    return storageManager.getSettings();
  });

  ipcMain.handle('settings:update', (_event, partialSettings) => {
    return storageManager.updateSettings(partialSettings);
  });

  ipcMain.handle('storage:get-info', async (): Promise<SystemStorageInfo> => {
    const settings = storageManager.getSettings();
    const defaultInstallLoc = settings.defaultInstallLocation || storageManager.getDefaultInstallDir();
    
    let totalPyraGamesBytes = 0;
    const installed = storageManager.getInstalledGames();
    for (const g of Object.values(installed)) {
      totalPyraGamesBytes += g.sizeOnDisk || 0;
    }

    return {
      totalSpaceBytes: 1024 * 1024 * 1024 * 500, // 500 GB mock disk info
      freeSpaceBytes: 1024 * 1024 * 1024 * 320,  // 320 GB free
      pyraGamesBytes: totalPyraGamesBytes,
      defaultInstallLocation: defaultInstallLoc,
    };
  });

  ipcMain.handle('storage:select-folder', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Game Installation Folder',
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  downloadManager.dispose();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

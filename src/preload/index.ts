import { contextBridge, ipcRenderer } from 'electron';
import { Game, DownloadItem, LauncherSettings, SystemStorageInfo, GameProcessStatus } from '../shared/types.js';

const pyraAPI = {
  // Catalog
  getCatalog: (): Promise<{ games: Game[]; isOffline: boolean }> => ipcRenderer.invoke('catalog:get'),

  // Installed Games
  getInstalledGames: () => ipcRenderer.invoke('installed:get-all'),
  uninstallGame: (gameId: string): Promise<boolean> => ipcRenderer.invoke('game:uninstall', gameId),
  openGameFolder: (gameId: string): Promise<void> => ipcRenderer.invoke('game:open-folder', gameId),

  // Downloads
  startDownload: (game: Game, isUpdate: boolean = false, targetVersion?: string): Promise<boolean> =>
    ipcRenderer.invoke('download:start', game, isUpdate, targetVersion),
  pauseDownload: (gameId: string): Promise<boolean> => ipcRenderer.invoke('download:pause', gameId),
  resumeDownload: (gameId: string): Promise<boolean> => ipcRenderer.invoke('download:resume', gameId),
  cancelDownload: (gameId: string): Promise<boolean> => ipcRenderer.invoke('download:cancel', gameId),
  getActiveDownloads: (): Promise<DownloadItem[]> => ipcRenderer.invoke('download:get-active'),

  // Launching
  launchGame: (gameId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('game:launch', gameId),

  // Settings & Storage
  getSettings: (): Promise<LauncherSettings> => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: Partial<LauncherSettings>): Promise<LauncherSettings> =>
    ipcRenderer.invoke('settings:update', settings),
  getStorageInfo: (): Promise<SystemStorageInfo> => ipcRenderer.invoke('storage:get-info'),
  selectInstallFolder: (): Promise<string | null> => ipcRenderer.invoke('storage:select-folder'),

  // Window Controls
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  windowIsMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),

  // Events
  onDownloadProgress: (callback: (item: DownloadItem) => void) => {
    const handler = (_event: any, item: DownloadItem) => callback(item);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  },

  onGameStatusChanged: (callback: (status: GameProcessStatus) => void) => {
    const handler = (_event: any, status: GameProcessStatus) => callback(status);
    ipcRenderer.on('game:status-changed', handler);
    return () => ipcRenderer.removeListener('game:status-changed', handler);
  },
};

contextBridge.exposeInMainWorld('pyraAPI', pyraAPI);

export type PyraAPI = typeof pyraAPI;

export interface Game {
  id: string;
  name: string;
  version: string;
  description: string;
  shortDescription: string;
  genre: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  icon: string;
  banner: string;
  screenshots: string[];
  downloadUrl: string;
  size: number; // in bytes
  executable: string;
  featured?: boolean;
  rating?: number;
  tags?: string[];
}

export interface InstalledGame {
  id: string;
  installedVersion: string;
  installPath: string;
  installedAt: string; // ISO date
  lastPlayed: string | null; // ISO date or null
  playTimeMinutes: number;
  sizeOnDisk: number;
  executable?: string;
}

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'extracting'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface DownloadItem {
  gameId: string;
  gameName: string;
  status: DownloadStatus;
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  progressPercent: number;
  error?: string | null;
  isUpdate: boolean;
  targetVersion: string;
  icon?: string;
}

export interface LauncherSettings {
  startWithWindows: boolean;
  minimizeToTrayOnGameStart: boolean;
  closeLauncherOnGameStart: boolean;
  startMinimized: boolean;
  defaultInstallLocation: string;
  maxSimultaneousDownloads: number;
  bandwidthLimitKbps: number; // 0 = unlimited
  theme: 'dark';
  uiScale: number;
  customCatalogUrl?: string;
}

export interface SystemStorageInfo {
  totalSpaceBytes: number;
  freeSpaceBytes: number;
  pyraGamesBytes: number;
  defaultInstallLocation: string;
}

export interface GameProcessStatus {
  gameId: string;
  isRunning: boolean;
  pid?: number;
  startedAt?: string;
}

export interface IPCChannels {
  // Catalog
  GET_CATALOG: 'catalog:get';
  CATALOG_UPDATED: 'catalog:updated';

  // Installed Games & Storage
  GET_INSTALLED_GAMES: 'installed:get-all';
  INSTALLED_GAMES_UPDATED: 'installed:updated';
  UNINSTALL_GAME: 'game:uninstall';
  OPEN_GAME_FOLDER: 'game:open-folder';

  // Downloads
  START_DOWNLOAD: 'download:start';
  PAUSE_DOWNLOAD: 'download:pause';
  RESUME_DOWNLOAD: 'download:resume';
  CANCEL_DOWNLOAD: 'download:cancel';
  GET_ACTIVE_DOWNLOADS: 'download:get-active';
  DOWNLOAD_PROGRESS: 'download:progress';
  DOWNLOAD_COMPLETED: 'download:completed';

  // Game Launching
  LAUNCH_GAME: 'game:launch';
  GAME_STATUS_CHANGED: 'game:status-changed';

  // Settings & System
  GET_SETTINGS: 'settings:get';
  UPDATE_SETTINGS: 'settings:update';
  GET_STORAGE_INFO: 'storage:get-info';
  SELECT_INSTALL_FOLDER: 'storage:select-folder';

  // Window Controls
  WINDOW_MINIMIZE: 'window:minimize';
  WINDOW_MAXIMIZE: 'window:maximize';
  WINDOW_CLOSE: 'window:close';
  WINDOW_IS_MAXIMIZED: 'window:is-maximized';
}

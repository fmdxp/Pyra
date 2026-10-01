import React, { createContext, useContext, useState, useEffect } from 'react';
import { Game, InstalledGame, DownloadItem, LauncherSettings, SystemStorageInfo, GameProcessStatus } from '../../shared/types';
import { NavigationPage } from '../types';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface LauncherContextType {
  catalog: Game[];
  installedGames: Record<string, InstalledGame>;
  downloads: Record<string, DownloadItem>;
  runningGames: Record<string, GameProcessStatus>;
  isOffline: boolean;
  activePage: NavigationPage;
  selectedGameId: string | null;
  selectedGame: Game | null;
  settings: LauncherSettings | null;
  storageInfo: SystemStorageInfo | null;
  toasts: Toast[];

  navigateTo: (page: NavigationPage, gameId?: string) => void;
  refreshCatalog: () => Promise<void>;
  refreshInstalled: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshStorage: () => Promise<void>;

  startDownload: (game: Game, isUpdate?: boolean) => Promise<void>;
  pauseDownload: (gameId: string) => Promise<void>;
  resumeDownload: (gameId: string) => Promise<void>;
  cancelDownload: (gameId: string) => Promise<void>;

  launchGame: (gameId: string) => Promise<void>;
  uninstallGame: (gameId: string) => Promise<boolean>;
  openGameFolder: (gameId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<LauncherSettings>) => Promise<void>;
  selectInstallFolder: () => Promise<string | null>;
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const LauncherContext = createContext<LauncherContextType | null>(null);

export const LauncherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<Game[]>([]);
  const [installedGames, setInstalledGames] = useState<Record<string, InstalledGame>>({});
  const [downloads, setDownloads] = useState<Record<string, DownloadItem>>({});
  const [runningGames, setRunningGames] = useState<Record<string, GameProcessStatus>>({});
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [settings, setSettings] = useState<LauncherSettings | null>(null);
  const [storageInfo, setStorageInfo] = useState<SystemStorageInfo | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const navigateTo = (page: NavigationPage, gameId?: string) => {
    setActivePage(page);
    if (gameId) {
      setSelectedGameId(gameId);
    }
  };

  const refreshCatalog = async () => {
    try {
      const result = await window.pyraAPI.getCatalog();
      setCatalog(result.games || []);
      setIsOffline(result.isOffline || false);
    } catch (e) {
      console.error('Failed to fetch catalog:', e);
      setIsOffline(true);
    }
  };

  const refreshInstalled = async () => {
    try {
      const data = await window.pyraAPI.getInstalledGames();
      setInstalledGames(data || {});
    } catch (e) {
      console.error('Failed to fetch installed games:', e);
    }
  };

  const refreshSettings = async () => {
    try {
      const s = await window.pyraAPI.getSettings();
      setSettings(s);
    } catch (e) {
      console.error('Failed to get settings:', e);
    }
  };

  const refreshStorage = async () => {
    try {
      const info = await window.pyraAPI.getStorageInfo();
      setStorageInfo(info);
    } catch (e) {
      console.error('Failed to get storage info:', e);
    }
  };

  // Initial Load
  useEffect(() => {
    refreshCatalog();
    refreshInstalled();
    refreshSettings();
    refreshStorage();

    // Sync active downloads on boot
    window.pyraAPI.getActiveDownloads().then((items) => {
      const map: Record<string, DownloadItem> = {};
      items.forEach((item) => (map[item.gameId] = item));
      setDownloads(map);
    });

    // Subscriptions
    const unsubProgress = window.pyraAPI.onDownloadProgress((item) => {
      setDownloads((prev) => {
        const next = { ...prev, [item.gameId]: item };
        if (item.status === 'completed') {
          refreshInstalled();
          refreshStorage();
          addToast(`Finished installing ${item.gameName}!`, 'success');
        } else if (item.status === 'error') {
          addToast(`Download failed for ${item.gameName}: ${item.error}`, 'error');
        }
        return next;
      });
    });

    const unsubGameStatus = window.pyraAPI.onGameStatusChanged((status) => {
      setRunningGames((prev) => ({ ...prev, [status.gameId]: status }));
      if (status.isRunning) {
        addToast(`Game launched!`, 'info');
      } else {
        refreshInstalled();
      }
    });

    return () => {
      unsubProgress();
      unsubGameStatus();
    };
  }, []);

  const startDownload = async (game: Game, isUpdate: boolean = false) => {
    try {
      await window.pyraAPI.startDownload(game, isUpdate);
      addToast(`Started downloading ${game.name}...`, 'info');
    } catch (e: any) {
      addToast(`Could not start download: ${e.message}`, 'error');
    }
  };

  const pauseDownload = async (gameId: string) => {
    await window.pyraAPI.pauseDownload(gameId);
    addToast('Download paused', 'info');
  };

  const resumeDownload = async (gameId: string) => {
    await window.pyraAPI.resumeDownload(gameId);
    addToast('Resuming download...', 'info');
  };

  const cancelDownload = async (gameId: string) => {
    await window.pyraAPI.cancelDownload(gameId);
    setDownloads((prev) => {
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
    addToast('Download cancelled', 'info');
  };

  const launchGame = async (gameId: string) => {
    const res = await window.pyraAPI.launchGame(gameId);
    if (!res.success) {
      addToast(`Launch failed: ${res.error}`, 'error');
    }
  };

  const uninstallGame = async (gameId: string): Promise<boolean> => {
    const success = await window.pyraAPI.uninstallGame(gameId);
    if (success) {
      await refreshInstalled();
      await refreshStorage();
      addToast('Game uninstalled successfully', 'success');
    } else {
      addToast('Failed to uninstall game', 'error');
    }
    return success;
  };

  const openGameFolder = async (gameId: string) => {
    await window.pyraAPI.openGameFolder(gameId);
  };

  const updateSettings = async (newSettings: Partial<LauncherSettings>) => {
    const updated = await window.pyraAPI.updateSettings(newSettings);
    setSettings(updated);
    addToast('Settings updated', 'success');
  };

  const selectInstallFolder = async () => {
    const pathStr = await window.pyraAPI.selectInstallFolder();
    if (pathStr) {
      await updateSettings({ defaultInstallLocation: pathStr });
      await refreshStorage();
    }
    return pathStr;
  };

  const selectedGame = catalog.find((g) => g.id === selectedGameId) || catalog[0] || null;

  return (
    <LauncherContext.Provider
      value={{
        catalog,
        installedGames,
        downloads,
        runningGames,
        isOffline,
        activePage,
        selectedGameId,
        selectedGame,
        settings,
        storageInfo,
        toasts,

        navigateTo,
        refreshCatalog,
        refreshInstalled,
        refreshSettings,
        refreshStorage,

        startDownload,
        pauseDownload,
        resumeDownload,
        cancelDownload,

        launchGame,
        uninstallGame,
        openGameFolder,
        updateSettings,
        selectInstallFolder,
        addToast,
      }}
    >
      {children}
    </LauncherContext.Provider>
  );
};

export const useLauncher = () => {
  const ctx = useContext(LauncherContext);
  if (!ctx) throw new Error('useLauncher must be used within LauncherProvider');
  return ctx;
};

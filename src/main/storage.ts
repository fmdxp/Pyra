import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { InstalledGame, LauncherSettings, Game } from '../shared/types.js';

export class StorageManager {
  private appDataDir: string;
  private gamesDir: string;
  private installedFile: string;
  private settingsFile: string;
  private catalogCacheFile: string;

  constructor() {
    // Windows: %APPDATA%/Pyra
    const baseAppData = app?.getPath('userData') || path.join(process.env.APPDATA || process.cwd(), 'Pyra');
    this.appDataDir = baseAppData;
    
    // Windows: %LOCALAPPDATA%/Pyra/games
    const localAppData = process.env.LOCALAPPDATA || baseAppData;
    this.gamesDir = path.join(localAppData, 'Pyra', 'games');

    this.installedFile = path.join(this.appDataDir, 'installed.json');
    this.settingsFile = path.join(this.appDataDir, 'settings.json');
    this.catalogCacheFile = path.join(this.appDataDir, 'catalog_cache.json');

    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.appDataDir)) {
      fs.mkdirSync(this.appDataDir, { recursive: true });
    }
    if (!fs.existsSync(this.gamesDir)) {
      fs.mkdirSync(this.gamesDir, { recursive: true });
    }
  }

  public getAppDataDir(): string {
    return this.appDataDir;
  }

  public getDefaultInstallDir(): string {
    return this.gamesDir;
  }

  // --- Installed Games ---
  public getInstalledGames(): Record<string, InstalledGame> {
    try {
      if (fs.existsSync(this.installedFile)) {
        const raw = fs.readFileSync(this.installedFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read installed.json:', err);
    }
    return {};
  }

  public saveInstalledGame(game: InstalledGame): void {
    const installed = this.getInstalledGames();
    installed[game.id] = game;
    try {
      fs.writeFileSync(this.installedFile, JSON.stringify(installed, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write installed.json:', err);
    }
  }

  public removeInstalledGame(gameId: string): void {
    const installed = this.getInstalledGames();
    if (installed[gameId]) {
      delete installed[gameId];
      try {
        fs.writeFileSync(this.installedFile, JSON.stringify(installed, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to update installed.json:', err);
      }
    }
  }

  // --- Settings ---
  public getSettings(): LauncherSettings {
    const defaults: LauncherSettings = {
      startWithWindows: false,
      minimizeToTrayOnGameStart: true,
      closeLauncherOnGameStart: false,
      startMinimized: false,
      defaultInstallLocation: this.gamesDir,
      maxSimultaneousDownloads: 2,
      bandwidthLimitKbps: 0,
      theme: 'dark',
      uiScale: 1.0,
    };

    try {
      if (fs.existsSync(this.settingsFile)) {
        const raw = fs.readFileSync(this.settingsFile, 'utf-8');
        return { ...defaults, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Failed to read settings.json:', err);
    }
    return defaults;
  }

  public updateSettings(partialSettings: Partial<LauncherSettings>): LauncherSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partialSettings };
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save settings.json:', err);
    }
    return updated;
  }

  // --- Catalog Cache ---
  public getCachedCatalog(): Game[] | null {
    try {
      if (fs.existsSync(this.catalogCacheFile)) {
        const raw = fs.readFileSync(this.catalogCacheFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read catalog cache:', err);
    }
    return null;
  }

  public saveCatalogCache(games: Game[]): void {
    try {
      fs.writeFileSync(this.catalogCacheFile, JSON.stringify(games, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save catalog cache:', err);
    }
  }
}

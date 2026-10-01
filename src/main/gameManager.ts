import fs from 'fs';
import { shell } from 'electron';
import { StorageManager } from './storage.js';

export class GameManager {
  private storageManager: StorageManager;

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
  }

  public async uninstallGame(gameId: string): Promise<boolean> {
    const installedGames = this.storageManager.getInstalledGames();
    const target = installedGames[gameId];
    if (!target) return false;

    // Delete game folder if it exists
    if (fs.existsSync(target.installPath)) {
      try {
        fs.rmSync(target.installPath, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to remove game folder for ${gameId}:`, err);
        return false;
      }
    }

    // Remove from storage
    this.storageManager.removeInstalledGame(gameId);
    return true;
  }

  public openGameFolder(gameId: string): void {
    const installedGames = this.storageManager.getInstalledGames();
    const target = installedGames[gameId];
    if (target && fs.existsSync(target.installPath)) {
      shell.openPath(target.installPath);
    }
  }

  public getInstalledGames() {
    return this.storageManager.getInstalledGames();
  }
}

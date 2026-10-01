import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { StorageManager } from './storage.js';
import { InstalledGame } from '../shared/types.js';

export class InstallManager {
  private storageManager: StorageManager;

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
  }

  public async extractAndInstall(
    gameId: string,
    archivePath: string,
    targetInstallDir: string,
    version: string,
    executable: string
  ): Promise<InstalledGame> {
    const gameFolder = path.join(targetInstallDir, gameId);

    if (!fs.existsSync(gameFolder)) {
      fs.mkdirSync(gameFolder, { recursive: true });
    }

    // Security Check: Zip Slip Prevention during extraction
    const zip = new AdmZip(archivePath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      const entryPath = entry.entryName;
      const resolvedPath = path.resolve(gameFolder, entryPath);
      const relative = path.relative(gameFolder, resolvedPath);

      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`[Security Violation] Zip Slip attempt detected in archive entry: ${entryPath}`);
      }
    }

    // Safely extract contents
    zip.extractAllTo(gameFolder, true);

    // Calculate total size on disk
    const sizeOnDisk = this.calculateDirectorySize(gameFolder);

    const installedMetadata: InstalledGame = {
      id: gameId,
      installedVersion: version,
      installPath: gameFolder,
      installedAt: new Date().toISOString(),
      lastPlayed: null,
      playTimeMinutes: 0,
      sizeOnDisk,
    };

    // Save metadata in installed.json
    this.storageManager.saveInstalledGame(installedMetadata);

    // Remove temp zip file
    try {
      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(archivePath);
      }
    } catch (e) {
      console.warn('Failed to delete temp archive file:', e);
    }

    return installedMetadata;
  }

  private calculateDirectorySize(dirPath: string): number {
    let size = 0;
    if (!fs.existsSync(dirPath)) return 0;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        size += this.calculateDirectorySize(fullPath);
      } else {
        size += stat.size;
      }
    }
    return size;
  }
}

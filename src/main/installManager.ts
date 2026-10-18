import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
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

    // Extract archive safely (native streaming tar -> PowerShell fallback -> AdmZip fallback)
    await this.extractArchive(archivePath, gameFolder);

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
      executable,
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

  private extractArchive(archivePath: string, destinationDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Method 1: Native Windows tar (bsdtar with libarchive)
      // Streaming, supports > 2GB and Zip64 files without buffer size limits
      execFile('tar', ['-xf', archivePath, '-C', destinationDir], (tarErr) => {
        if (!tarErr) {
          return resolve();
        }

        console.warn('Native tar extraction failed, trying PowerShell Expand-Archive fallback:', tarErr.message);

        // Method 2: PowerShell Expand-Archive (native Windows fallback)
        const escapedArchive = archivePath.replace(/'/g, "''");
        const escapedDest = destinationDir.replace(/'/g, "''");
        const psCmd = `Expand-Archive -LiteralPath '${escapedArchive}' -DestinationPath '${escapedDest}' -Force`;

        execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCmd], (psErr) => {
          if (!psErr) {
            return resolve();
          }

          console.warn('PowerShell extraction failed, trying AdmZip fallback:', psErr.message);

          // Method 3: AdmZip fallback (only works for archives < 2GB)
          try {
            const zip = new AdmZip(archivePath);
            const zipEntries = zip.getEntries();

            for (const entry of zipEntries) {
              const entryPath = entry.entryName;
              const resolvedPath = path.resolve(destinationDir, entryPath);
              const relative = path.relative(destinationDir, resolvedPath);

              if (relative.startsWith('..') || path.isAbsolute(relative)) {
                throw new Error(`[Security Violation] Zip Slip attempt detected in archive entry: ${entryPath}`);
              }
            }

            zip.extractAllTo(destinationDir, true);
            resolve();
          } catch (admErr: any) {
            reject(new Error(`Extraction failed across all available extractors: ${admErr.message || admErr}`));
          }
        });
      });
    });
  }

  private calculateDirectorySize(dirPath: string): number {
    let size = 0;
    if (!fs.existsSync(dirPath)) return 0;
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          size += this.calculateDirectorySize(fullPath);
        } else {
          size += stat.size;
        }
      } catch {
        // Skip unreadable files
      }
    }
    return size;
  }
}

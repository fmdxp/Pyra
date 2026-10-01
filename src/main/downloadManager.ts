import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { BrowserWindow } from 'electron';
import { DownloadItem, DownloadStatus, Game } from '../shared/types.js';
import { InstallManager } from './installManager.js';
import { StorageManager } from './storage.js';

interface InternalDownloadTask {
  item: DownloadItem;
  game: Game;
  tempFilePath: string;
  targetDir: string;
  req?: http.ClientRequest;
  writeStream?: fs.WriteStream;
  lastSpeedCheckBytes: number;
  lastSpeedCheckTime: number;
}

export class DownloadManager {
  private activeDownloads: Map<string, InternalDownloadTask> = new Map();
  private tempDownloadsDir: string;
  private installManager: InstallManager;
  private storageManager: StorageManager;
  private mainWindowProvider: () => BrowserWindow | null;
  private speedTimer: NodeJS.Timeout | null = null;

  constructor(
    storageManager: StorageManager,
    installManager: InstallManager,
    mainWindowProvider: () => BrowserWindow | null
  ) {
    this.storageManager = storageManager;
    this.installManager = installManager;
    this.mainWindowProvider = mainWindowProvider;
    this.tempDownloadsDir = path.join(storageManager.getAppDataDir(), 'temp_downloads');

    if (!fs.existsSync(this.tempDownloadsDir)) {
      fs.mkdirSync(this.tempDownloadsDir, { recursive: true });
    }

    this.startSpeedMonitor();
  }

  public startDownload(game: Game, isUpdate: boolean = false, targetVersion?: string): void {
    if (this.activeDownloads.has(game.id)) {
      const existing = this.activeDownloads.get(game.id)!;
      if (existing.item.status === 'paused') {
        this.resumeDownload(game.id);
      }
      return;
    }

    const settings = this.storageManager.getSettings();
    const targetDir = settings.defaultInstallLocation || this.storageManager.getDefaultInstallDir();
    const tempFilePath = path.join(this.tempDownloadsDir, `${game.id}.zip.part`);

    const item: DownloadItem = {
      gameId: game.id,
      gameName: game.name,
      status: 'downloading',
      downloadedBytes: 0,
      totalBytes: game.size || 0,
      speedBytesPerSec: 0,
      etaSeconds: 0,
      progressPercent: 0,
      isUpdate,
      targetVersion: targetVersion || game.version,
      icon: game.icon,
    };

    const task: InternalDownloadTask = {
      item,
      game,
      tempFilePath,
      targetDir,
      lastSpeedCheckBytes: 0,
      lastSpeedCheckTime: Date.now(),
    };

    this.activeDownloads.set(game.id, task);
    this.executeDownload(task, 0, game.downloadUrl, 0);
  }

  public pauseDownload(gameId: string): void {
    const task = this.activeDownloads.get(gameId);
    if (!task || task.item.status !== 'downloading') return;

    if (task.req) {
      task.req.destroy();
      task.req = undefined;
    }
    if (task.writeStream) {
      task.writeStream.close();
      task.writeStream = undefined;
    }

    task.item.status = 'paused';
    task.item.speedBytesPerSec = 0;
    task.item.etaSeconds = 0;
    this.notifyProgress(task.item);
  }

  public resumeDownload(gameId: string): void {
    const task = this.activeDownloads.get(gameId);
    if (!task || task.item.status !== 'paused') return;

    let existingSize = 0;
    if (fs.existsSync(task.tempFilePath)) {
      existingSize = fs.statSync(task.tempFilePath).size;
    }

    task.item.status = 'downloading';
    task.item.downloadedBytes = existingSize;
    task.lastSpeedCheckBytes = existingSize;
    task.lastSpeedCheckTime = Date.now();

    this.executeDownload(task, existingSize, task.game.downloadUrl, 0);
  }

  public cancelDownload(gameId: string): void {
    const task = this.activeDownloads.get(gameId);
    if (!task) return;

    if (task.req) {
      task.req.destroy();
    }
    if (task.writeStream) {
      task.writeStream.close();
    }

    if (fs.existsSync(task.tempFilePath)) {
      try {
        fs.unlinkSync(task.tempFilePath);
      } catch (e) {
        console.warn('Failed to delete temp file on cancel:', e);
      }
    }

    task.item.status = 'cancelled';
    this.notifyProgress(task.item);
    this.activeDownloads.delete(gameId);
  }

  public getActiveDownloads(): DownloadItem[] {
    return Array.from(this.activeDownloads.values()).map((t) => t.item);
  }

  private executeDownload(
    task: InternalDownloadTask,
    offsetBytes: number,
    targetUrlStr: string,
    redirectCount: number = 0
  ) {
    if (redirectCount > 10) {
      task.item.status = 'error';
      task.item.error = 'Too many HTTP redirects';
      this.notifyProgress(task.item);
      return;
    }

    let url: URL;
    try {
      url = new URL(targetUrlStr);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error(`Unsupported protocol: ${url.protocol}`);
      }
    } catch (err: any) {
      task.item.status = 'error';
      task.item.error = `Invalid URL: ${err.message}`;
      this.notifyProgress(task.item);
      return;
    }

    const client = url.protocol === 'https:' ? https : http;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PyraLauncher/1.0',
      'Accept': '*/*',
    };

    if (offsetBytes > 0) {
      headers['Range'] = `bytes=${offsetBytes}-`;
    }

    const req = client.get(url, { headers }, (res) => {
      // Handle HTTP 301, 302, 303, 307, 308 Redirects (Crucial for GitHub Releases, Cloudflare R2, AWS S3!)
      if (
        res.statusCode === 301 ||
        res.statusCode === 302 ||
        res.statusCode === 303 ||
        res.statusCode === 307 ||
        res.statusCode === 308
      ) {
        const redirectLocation = res.headers.location;
        if (!redirectLocation) {
          task.item.status = 'error';
          task.item.error = `HTTP Redirect ${res.statusCode} missing Location header`;
          this.notifyProgress(task.item);
          return;
        }

        const nextUrl = new URL(redirectLocation, url).toString();
        this.executeDownload(task, offsetBytes, nextUrl, redirectCount + 1);
        return;
      }

      if (res.statusCode !== 200 && res.statusCode !== 206) {
        task.item.status = 'error';
        task.item.error = `HTTP Error ${res.statusCode}`;
        this.notifyProgress(task.item);
        return;
      }

      const contentLength = res.headers['content-length'];
      if (contentLength && offsetBytes === 0) {
        task.item.totalBytes = parseInt(contentLength, 10);
      } else if (res.headers['content-range']) {
        const parts = res.headers['content-range'].split('/');
        if (parts[1]) {
          task.item.totalBytes = parseInt(parts[1], 10);
        }
      }

      task.writeStream = fs.createWriteStream(task.tempFilePath, {
        flags: offsetBytes > 0 ? 'a' : 'w',
      });

      res.on('data', (chunk: Buffer) => {
        task.item.downloadedBytes += chunk.length;
        if (task.item.totalBytes > 0) {
          task.item.progressPercent = Math.min(
            99,
            Math.round((task.item.downloadedBytes / task.item.totalBytes) * 100)
          );
        }
        this.notifyProgress(task.item);
      });

      res.pipe(task.writeStream);

      task.writeStream.on('finish', () => {
        task.writeStream?.close();
        if (task.item.status === 'downloading') {
          this.handleDownloadComplete(task);
        }
      });

      task.writeStream.on('error', (err) => {
        task.item.status = 'error';
        task.item.error = err.message;
        this.notifyProgress(task.item);
      });
    });

    req.on('error', (err) => {
      if (task.item.status === 'downloading') {
        task.item.status = 'error';
        task.item.error = err.message;
        this.notifyProgress(task.item);
      }
    });

    task.req = req;
  }

  private async handleDownloadComplete(task: InternalDownloadTask) {
    task.item.status = 'extracting';
    task.item.progressPercent = 99;
    task.item.speedBytesPerSec = 0;
    task.item.etaSeconds = 0;
    this.notifyProgress(task.item);

    try {
      await this.installManager.extractAndInstall(
        task.game.id,
        task.tempFilePath,
        task.targetDir,
        task.item.targetVersion,
        task.game.executable
      );

      task.item.status = 'completed';
      task.item.progressPercent = 100;
      this.notifyProgress(task.item);

      setTimeout(() => {
        this.activeDownloads.delete(task.game.id);
      }, 2000);
    } catch (err: any) {
      console.error('Extraction failed:', err);
      task.item.status = 'error';
      task.item.error = `Extraction failed: ${err.message || err}`;
      this.notifyProgress(task.item);
    }
  }

  private startSpeedMonitor() {
    this.speedTimer = setInterval(() => {
      const now = Date.now();
      for (const task of this.activeDownloads.values()) {
        if (task.item.status === 'downloading') {
          const timeDiffSec = (now - task.lastSpeedCheckTime) / 1000;
          const bytesDiff = task.item.downloadedBytes - task.lastSpeedCheckBytes;

          if (timeDiffSec > 0) {
            task.item.speedBytesPerSec = Math.max(0, Math.round(bytesDiff / timeDiffSec));
            const remainingBytes = task.item.totalBytes - task.item.downloadedBytes;
            if (task.item.speedBytesPerSec > 0 && remainingBytes > 0) {
              task.item.etaSeconds = Math.round(remainingBytes / task.item.speedBytesPerSec);
            } else {
              task.item.etaSeconds = 0;
            }
          }

          task.lastSpeedCheckBytes = task.item.downloadedBytes;
          task.lastSpeedCheckTime = now;
          this.notifyProgress(task.item);
        }
      }
    }, 1000);
  }

  private notifyProgress(item: DownloadItem) {
    const win = this.mainWindowProvider();
    if (win && !win.isDestroyed()) {
      win.webContents.send('download:progress', item);
    }
  }

  public dispose() {
    if (this.speedTimer) {
      clearInterval(this.speedTimer);
    }
  }
}

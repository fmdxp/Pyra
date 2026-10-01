import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { BrowserWindow } from 'electron';
import { StorageManager } from './storage.js';
import { GameProcessStatus } from '../shared/types.js';

export class ProcessManager {
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private storageManager: StorageManager;
  private mainWindowProvider: () => BrowserWindow | null;

  constructor(storageManager: StorageManager, mainWindowProvider: () => BrowserWindow | null) {
    this.storageManager = storageManager;
    this.mainWindowProvider = mainWindowProvider;
  }

  public launchGame(gameId: string): { success: boolean; error?: string } {
    if (this.activeProcesses.has(gameId)) {
      return { success: false, error: 'Game is already running' };
    }

    const installedGames = this.storageManager.getInstalledGames();
    const installed = installedGames[gameId];

    if (!installed) {
      return { success: false, error: 'Game is not installed' };
    }

    if (!fs.existsSync(installed.installPath)) {
      return { success: false, error: 'Game install directory not found' };
    }

    // Look for .exe or .bat
    const items = fs.readdirSync(installed.installPath);
    let exeFile = items.find((i) => i.endsWith('.exe') || i.endsWith('.bat'));
    
    if (!exeFile) {
      return { success: false, error: 'No executable found in game directory' };
    }

    const exePath = path.join(installed.installPath, exeFile);

    try {
      let proc: ChildProcess;

      if (process.platform === 'win32' && exeFile.endsWith('.bat')) {
        proc = spawn('cmd.exe', ['/c', exePath], {
          cwd: installed.installPath,
          detached: false,
          stdio: 'ignore',
        });
      } else {
        proc = spawn(exePath, [], {
          cwd: installed.installPath,
          detached: false,
          stdio: 'ignore',
        });
      }

      const pid = proc.pid;
      this.activeProcesses.set(gameId, proc);

      // Update last played timestamp
      installed.lastPlayed = new Date().toISOString();
      this.storageManager.saveInstalledGame(installed);

      // Notify renderer that game is running
      this.notifyGameStatus({
        gameId,
        isRunning: true,
        pid,
        startedAt: installed.lastPlayed,
      });

      // Handle launcher settings (minimize / close on launch)
      const settings = this.storageManager.getSettings();
      const mainWin = this.mainWindowProvider();
      if (mainWin && !mainWin.isDestroyed()) {
        if (settings.minimizeToTrayOnGameStart) {
          mainWin.minimize();
        } else if (settings.closeLauncherOnGameStart) {
          mainWin.close();
        }
      }

      proc.on('exit', () => {
        this.activeProcesses.delete(gameId);
        this.notifyGameStatus({
          gameId,
          isRunning: false,
        });

        // Restore window if minimized
        if (mainWin && !mainWin.isDestroyed() && mainWin.isMinimized()) {
          mainWin.restore();
          mainWin.focus();
        }
      });

      proc.on('error', (err) => {
        console.error(`Error launching game ${gameId}:`, err);
        this.activeProcesses.delete(gameId);
        this.notifyGameStatus({
          gameId,
          isRunning: false,
        });
      });

      return { success: true };
    } catch (err: any) {
      console.error(`Failed to spawn game ${gameId}:`, err);
      return { success: false, error: err.message || 'Failed to start process' };
    }
  }

  public isGameRunning(gameId: string): boolean {
    return this.activeProcesses.has(gameId);
  }

  public getRunningGames(): GameProcessStatus[] {
    const list: GameProcessStatus[] = [];
    for (const [gameId, proc] of this.activeProcesses.entries()) {
      list.push({
        gameId,
        isRunning: true,
        pid: proc.pid,
      });
    }
    return list;
  }

  private notifyGameStatus(status: GameProcessStatus) {
    const win = this.mainWindowProvider();
    if (win && !win.isDestroyed()) {
      win.webContents.send('game:status-changed', status);
    }
  }
}

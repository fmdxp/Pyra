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

    // Resolve Executable Path
    let targetExePath: string | null = null;

    // Method 1: Check configured executable path from metadata (e.g. "Drag'n Wash/DragNWash.exe")
    if (installed.executable) {
      const explicitPath = path.join(installed.installPath, installed.executable);
      if (fs.existsSync(explicitPath) && fs.statSync(explicitPath).isFile()) {
        targetExePath = explicitPath;
      }
    }

    // Method 2: Recursive search for any .exe or .bat file inside installed directory
    if (!targetExePath) {
      targetExePath = this.findExecutableRecursive(installed.installPath);
    }

    if (!targetExePath || !fs.existsSync(targetExePath)) {
      return {
        success: false,
        error: `Could not find executable in "${installed.installPath}". Please check game folder structure.`,
      };
    }

    const gameCwd = path.dirname(targetExePath);
    const exeFileName = path.basename(targetExePath);

    try {
      let proc: ChildProcess;

      if (process.platform === 'win32' && exeFileName.endsWith('.bat')) {
        proc = spawn('cmd.exe', ['/c', targetExePath], {
          cwd: gameCwd,
          detached: false,
          stdio: 'ignore',
        });
      } else {
        proc = spawn(targetExePath, [], {
          cwd: gameCwd,
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

      // Handle launcher window preferences
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

  private findExecutableRecursive(dirPath: string): string | null {
    if (!fs.existsSync(dirPath)) return null;

    try {
      const items = fs.readdirSync(dirPath);

      // Check files in current directory first
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && (item.endsWith('.exe') || item.endsWith('.bat'))) {
          // Ignore uninstaller binaries
          if (!item.toLowerCase().includes('unins') && !item.toLowerCase().includes('setup')) {
            return fullPath;
          }
        }
      }

      // Check subdirectories
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const found = this.findExecutableRecursive(fullPath);
          if (found) return found;
        }
      }
    } catch (e) {
      console.warn('Error during recursive executable search:', e);
    }

    return null;
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

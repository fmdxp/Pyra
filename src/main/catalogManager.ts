import http from 'http';
import https from 'https';
import { StorageManager } from './storage.js';
import { Game } from '../shared/types.js';

export class CatalogManager {
  private storageManager: StorageManager;
  // Default production catalog URL (backed by Vercel API or raw GitHub CDN)
  private defaultCatalogUrl: string =
    'https://raw.githubusercontent.com/pyra-launcher/assets/main/catalog.json';

  constructor(storageManager: StorageManager) {
    this.storageManager = storageManager;
  }

  public async fetchCatalog(): Promise<{ games: Game[]; isOffline: boolean }> {
    const settings = this.storageManager.getSettings();
    const catalogUrl = settings.customCatalogUrl && settings.customCatalogUrl.trim().length > 0
      ? settings.customCatalogUrl.trim()
      : this.defaultCatalogUrl;

    try {
      const rawCatalog = await this.fetchJson<any>(catalogUrl);
      
      // Parse games list (supporting { games: [...] } or direct array [...])
      let rawGames: any[] = [];
      if (Array.isArray(rawCatalog)) {
        rawGames = rawCatalog;
      } else if (rawCatalog && Array.isArray(rawCatalog.games)) {
        rawGames = rawCatalog.games;
      }

      // Validate catalog schema & sanitize entries
      const validatedGames = this.validateAndSanitizeCatalog(rawGames);

      if (validatedGames.length > 0) {
        this.storageManager.saveCatalogCache(validatedGames);
        return { games: validatedGames, isOffline: false };
      }
    } catch (err) {
      console.warn(`[Pyra Catalog] Failed to fetch catalog from ${catalogUrl}:`, err);
    }

    // Offline fallback to local disk cache
    const cached = this.storageManager.getCachedCatalog();
    if (cached && cached.length > 0) {
      return { games: cached, isOffline: true };
    }

    return { games: [], isOffline: true };
  }

  private validateAndSanitizeCatalog(rawGames: any[]): Game[] {
    const validGames: Game[] = [];

    for (const item of rawGames) {
      if (!item || typeof item !== 'object') continue;

      // Required fields check
      if (!item.id || typeof item.id !== 'string') continue;
      if (!item.name || typeof item.name !== 'string') continue;
      if (!item.downloadUrl || typeof item.downloadUrl !== 'string') continue;

      // Sanitize ID (alphanumeric and hyphens only)
      const sanitizedId = item.id.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      if (!sanitizedId) continue;

      // Executable security check (no path traversal, no leading slashes)
      let exec = item.executable || `${sanitizedId}.exe`;
      exec = exec.replace(/\\/g, '/').replace(/^\/+/, '');
      if (exec.includes('..')) {
        console.warn(`[Security Alert] Rejected game ${sanitizedId} due to unsafe executable path: ${item.executable}`);
        continue;
      }

      // Validate downloadUrl format
      try {
        const parsedUrl = new URL(item.downloadUrl);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          console.warn(`[Security Alert] Rejected game ${sanitizedId} due to invalid protocol: ${parsedUrl.protocol}`);
          continue;
        }
      } catch (e) {
        console.warn(`[Security Alert] Invalid download URL for game ${sanitizedId}`);
        continue;
      }

      const game: Game = {
        id: sanitizedId,
        name: String(item.name).trim(),
        version: String(item.version || '1.0.0').trim(),
        description: String(item.description || '').trim(),
        shortDescription: String(item.shortDescription || item.description || '').trim(),
        genre: String(item.genre || 'Action').trim(),
        developer: String(item.developer || 'Unknown').trim(),
        publisher: String(item.publisher || 'Pyra').trim(),
        releaseDate: String(item.releaseDate || new Date().toISOString().split('T')[0]),
        icon: String(item.icon || ''),
        banner: String(item.banner || item.icon || ''),
        screenshots: Array.isArray(item.screenshots) ? item.screenshots.map(String) : [],
        downloadUrl: item.downloadUrl,
        size: typeof item.size === 'number' && item.size > 0 ? item.size : 15728640,
        executable: exec,
        featured: Boolean(item.featured),
        rating: typeof item.rating === 'number' ? item.rating : 4.8,
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      };

      validGames.push(game);
    }

    return validGames;
  }

  private fetchJson<T>(urlStr: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.get(
        url,
        {
          headers: {
            'User-Agent': 'PyraLauncher/1.0',
            Accept: 'application/json',
          },
          timeout: 5000,
        },
        (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            reject(new Error(`HTTP Error Status: ${res.statusCode}`));
            return;
          }

          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout fetching remote catalog'));
      });
    });
  }
}

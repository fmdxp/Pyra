import React from 'react';
import { Folder, HardDrive, Monitor, Shield, Sparkles, FolderOpen } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';

export const SettingsPage: React.FC = () => {
  const { settings, storageInfo, updateSettings, selectInstallFolder, openGameFolder, installedGames, catalog } = useLauncher();

  if (!settings) {
    return (
      <div className="page-container">
        <h2>Loading settings...</h2>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const installedList = Object.values(installedGames).map((inst) => ({
    ...inst,
    game: catalog.find((g) => g.id === inst.id),
  }));

  return (
    <div className="page-container" style={{ gap: 32 }}>
      <div className="section-title">
        <span>Launcher Settings</span>
      </div>

      {/* General Settings */}
      <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Monitor size={20} color="var(--accent-purple)" /> General Preferences
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Start launcher with Windows</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Automatically open Pyra when you log in</div>
            </div>
            <input
              type="checkbox"
              checked={settings.startWithWindows}
              onChange={(e) => updateSettings({ startWithWindows: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Minimize launcher when game starts</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Minimize Pyra to taskbar/tray during gameplay</div>
            </div>
            <input
              type="checkbox"
              checked={settings.minimizeToTrayOnGameStart}
              onChange={(e) => updateSettings({ minimizeToTrayOnGameStart: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Close launcher when game starts</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fully exit Pyra when a game executable launches</div>
            </div>
            <input
              type="checkbox"
              checked={settings.closeLauncherOnGameStart}
              onChange={(e) => updateSettings({ closeLauncherOnGameStart: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }}
            />
          </label>
        </div>
      </section>

      {/* Downloads Settings */}
      <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Folder size={20} color="var(--accent-cyan)" /> Downloads & Installation
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Catalog API Endpoint (Hosted Production Server)</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={settings.customCatalogUrl || ''}
                placeholder="https://my-pyra-backend.vercel.app/api/catalog (Default if empty)"
                onChange={(e) => updateSettings({ customCatalogUrl: e.target.value })}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => updateSettings({ customCatalogUrl: '' })}
              >
                Reset Default
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Pyra fetches game catalog metadata and version updates securely via HTTPS from this endpoint.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Default Install Location</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                readOnly
                value={settings.defaultInstallLocation}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                }}
              />
              <button className="btn btn-secondary" onClick={selectInstallFolder}>
                <FolderOpen size={16} /> Change Location
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Max Simultaneous Downloads</div>
              <select
                value={settings.maxSimultaneousDownloads}
                onChange={(e) => updateSettings({ maxSimultaneousDownloads: parseInt(e.target.value, 10) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              >
                <option value={1}>1 Download</option>
                <option value={2}>2 Downloads</option>
                <option value={3}>3 Downloads</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Bandwidth Limit</div>
              <select
                value={settings.bandwidthLimitKbps}
                onChange={(e) => updateSettings({ bandwidthLimitKbps: parseInt(e.target.value, 10) })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              >
                <option value={0}>Unlimited</option>
                <option value={5000}>5 MB/s</option>
                <option value={10000}>10 MB/s</option>
                <option value={25000}>25 MB/s</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Storage Analyzer */}
      <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <HardDrive size={20} color="var(--accent-emerald)" /> Disk Storage
        </h3>

        {storageInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Installed Games: <strong style={{ color: 'var(--accent-purple)' }}>{formatBytes(storageInfo.pyraGamesBytes)}</strong></span>
              <span>Available Space: <strong style={{ color: 'var(--text-main)' }}>{formatBytes(storageInfo.freeSpaceBytes)}</strong></span>
            </div>

            <div className="progress-bar-bg" style={{ height: 14 }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(2, (storageInfo.pyraGamesBytes / storageInfo.totalSpaceBytes) * 100))}%`,
                  background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-emerald))',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)' }}>INSTALLED GAMES BREAKDOWN</div>
              {installedList.length > 0 ? (
                installedList.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.game ? item.game.name : item.id}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatBytes(item.sizeOnDisk)}</span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => openGameFolder(item.id)}
                      >
                        Open Folder
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No games installed on disk.</div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

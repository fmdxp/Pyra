import React, { useState } from 'react';
import { Play, Download, Trash2, Pause, RotateCcw, XCircle, RefreshCw, FolderOpen, Star, Shield, HardDrive, Calendar } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const GameDetailPage: React.FC = () => {
  const {
    selectedGame,
    installedGames,
    runningGames,
    downloads,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    launchGame,
    uninstallGame,
    openGameFolder,
    navigateTo,
  } = useLauncher();

  const [showUninstallModal, setShowUninstallModal] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  if (!selectedGame) {
    return (
      <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <h2>No game selected</h2>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigateTo('store')}>
          Browse Store
        </button>
      </div>
    );
  }

  const isInstalled = !!installedGames[selectedGame.id];
  const installedInfo = installedGames[selectedGame.id];
  const isRunning = runningGames[selectedGame.id]?.isRunning;
  const downloadItem = downloads[selectedGame.id];
  const isDownloading = downloadItem && downloadItem.status !== 'completed' && downloadItem.status !== 'cancelled';
  const hasUpdate = isInstalled && installedInfo.installedVersion !== selectedGame.version;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number): string => {
    return `${formatBytes(bytesPerSec)}/s`;
  };

  const formatEta = (seconds: number): string => {
    if (seconds <= 0) return 'Calculating...';
    if (seconds < 60) return `~${seconds} seconds remaining`;
    const mins = Math.ceil(seconds / 60);
    return `~${mins} min remaining`;
  };

  const handleInstallOrPlay = () => {
    if (isRunning) return;
    if (isInstalled) {
      if (hasUpdate) {
        startDownload(selectedGame, true, selectedGame.version);
      } else {
        launchGame(selectedGame.id);
      }
    } else {
      startDownload(selectedGame);
    }
  };

  const handleConfirmUninstall = async () => {
    setShowUninstallModal(false);
    await uninstallGame(selectedGame.id);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Cinematic Hero Header */}
      <div className="hero-banner" style={{ height: 420 }}>
        <img
          className="hero-bg"
          src={selectedGame.banner || selectedGame.icon}
          alt={selectedGame.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="%230e111a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238b5cf6" font-family="sans-serif" font-weight="bold" font-size="48">PYRA GAME BANNER</text></svg>';
          }}
        />
        <div className="hero-overlay" />
        <div className="hero-content" style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <img
              src={selectedGame.icon}
              alt={selectedGame.name}
              referrerPolicy="no-referrer"
              style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%237c3aed"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="24">P</text></svg>';
              }}
            />
            <div>
              <h1 className="hero-title" style={{ fontSize: '2.5rem' }}>{selectedGame.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.9rem' }}>
                  {selectedGame.genre}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>v{selectedGame.version}</span>
                {selectedGame.rating && (
                  <>
                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                    <span style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} fill="var(--accent-amber)" /> {selectedGame.rating}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="hero-description">{selectedGame.shortDescription}</p>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Actions & Live Download Progress Panel */}
        <div className="glass-panel" style={{ marginBottom: 32 }}>
          {isDownloading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-purple)' }}>
                  {downloadItem.status === 'extracting' ? 'Extracting game files...' : 'Downloading Installation Files...'}
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>
                  {downloadItem.progressPercent}%
                </span>
              </div>

              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${downloadItem.progressPercent}%` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>
                  {formatBytes(downloadItem.downloadedBytes)} / {formatBytes(downloadItem.totalBytes)}
                </span>
                <span>{formatSpeed(downloadItem.speedBytesPerSec)}</span>
                <span>{formatEta(downloadItem.etaSeconds)}</span>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                {downloadItem.status === 'downloading' ? (
                  <button className="btn btn-secondary" onClick={() => pauseDownload(selectedGame.id)}>
                    <Pause size={16} /> Pause
                  </button>
                ) : downloadItem.status === 'paused' ? (
                  <button className="btn btn-primary" onClick={() => resumeDownload(selectedGame.id)}>
                    <RotateCcw size={16} /> Resume
                  </button>
                ) : null}
                <button className="btn btn-danger" onClick={() => cancelDownload(selectedGame.id)}>
                  <XCircle size={16} /> Cancel Download
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {isRunning ? (
                  <button className="btn btn-secondary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
                    GAME RUNNING...
                  </button>
                ) : isInstalled ? (
                  hasUpdate ? (
                    <button className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }} onClick={handleInstallOrPlay}>
                      <RefreshCw size={20} /> UPDATE GAME
                    </button>
                  ) : (
                    <button className="btn btn-success" style={{ padding: '16px 36px', fontSize: '1.1rem' }} onClick={handleInstallOrPlay}>
                      <Play size={20} /> PLAY NOW
                    </button>
                  )
                ) : (
                  <button className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }} onClick={handleInstallOrPlay}>
                    <Download size={20} /> INSTALL GAME ({formatBytes(selectedGame.size)})
                  </button>
                )}

                {isInstalled && (
                  <>
                    <button className="btn btn-secondary" title="Open Game Folder" onClick={() => openGameFolder(selectedGame.id)}>
                      <FolderOpen size={18} /> Open Folder
                    </button>
                    <button className="btn btn-danger" title="Uninstall Game" onClick={() => setShowUninstallModal(true)}>
                      <Trash2 size={18} /> Uninstall
                    </button>
                  </>
                )}
              </div>

              {isInstalled && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>
                  <div>Installed Version: <strong>{installedInfo.installedVersion}</strong></div>
                  <div>Last Played: <strong>{installedInfo.lastPlayed ? new Date(installedInfo.lastPlayed).toLocaleDateString() : 'Never'}</strong></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game Details & Screenshots Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <section>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 12 }}>About The Game</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>{selectedGame.description}</p>
            </section>

            {/* Screenshots Gallery */}
            <section>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: 16 }}>Screenshots</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {selectedGame.screenshots.map((shot, idx) => (
                  <img
                    key={idx}
                    src={shot}
                    alt={`Screenshot ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease',
                    }}
                    onClick={() => setActiveScreenshot(shot)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="400" height="225" fill="%23161b26"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238b5cf6" font-family="sans-serif" font-size="16">SCREENSHOT PREVIEW</text></svg>';
                    }}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Specs Column */}
          <div className="glass-panel" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              Game Overview
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="var(--accent-purple)" />
                <span style={{ color: 'var(--text-muted)' }}>Developer:</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{selectedGame.developer}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} color="var(--accent-cyan)" />
                <span style={{ color: 'var(--text-muted)' }}>Publisher:</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{selectedGame.publisher}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={16} color="var(--accent-amber)" />
                <span style={{ color: 'var(--text-muted)' }}>Release Date:</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{selectedGame.releaseDate}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <HardDrive size={16} color="var(--accent-emerald)" />
                <span style={{ color: 'var(--text-muted)' }}>Download Size:</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatBytes(selectedGame.size)}</span>
              </div>
            </div>

            {selectedGame.tags && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>TAGS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedGame.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {activeScreenshot && (
        <div className="modal-overlay" onClick={() => setActiveScreenshot(null)}>
          <img
            src={activeScreenshot}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 48px rgba(0,0,0,0.8)' }}
          />
        </div>
      )}

      {/* Uninstall Confirmation Modal */}
      <ConfirmModal
        isOpen={showUninstallModal}
        title={`Uninstall ${selectedGame.name}?`}
        message="This will completely remove the game files from your computer. You can reinstall it anytime from the store."
        confirmText="Uninstall Game"
        onConfirm={handleConfirmUninstall}
        onCancel={() => setShowUninstallModal(false)}
      />
    </div>
  );
};

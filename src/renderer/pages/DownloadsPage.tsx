import React from 'react';
import { Download, Pause, RotateCcw, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';

export const DownloadsPage: React.FC = () => {
  const { downloads, pauseDownload, resumeDownload, cancelDownload, navigateTo } = useLauncher();

  const downloadList = Object.values(downloads);
  const activeDownloads = downloadList.filter((d) => d.status !== 'completed' && d.status !== 'cancelled');
  const completedDownloads = downloadList.filter((d) => d.status === 'completed');

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
    if (seconds < 60) return `~${seconds}s remaining`;
    const mins = Math.ceil(seconds / 60);
    return `~${mins} min remaining`;
  };

  return (
    <div className="page-container">
      <div className="section-title">
        <span>Download Manager</span>
      </div>

      {activeDownloads.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
          {activeDownloads.map((item) => (
            <div key={item.gameId} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {item.icon && (
                  <img
                    src={item.icon}
                    alt={item.gameName}
                    style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                )}
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigateTo('game-detail', item.gameId)}
                  >
                    {item.gameName}
                  </h3>
                  <div style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600 }}>
                    {item.status === 'extracting'
                      ? 'Extracting files to installation directory...'
                      : item.status === 'paused'
                      ? 'Paused'
                      : item.status === 'error'
                      ? `Error: ${item.error}`
                      : 'Downloading installation package...'}
                  </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.status === 'downloading' ? (
                    <button className="btn btn-secondary" onClick={() => pauseDownload(item.gameId)}>
                      <Pause size={16} /> Pause
                    </button>
                  ) : item.status === 'paused' ? (
                    <button className="btn btn-primary" onClick={() => resumeDownload(item.gameId)}>
                      <RotateCcw size={16} /> Resume
                    </button>
                  ) : null}
                  <button className="btn btn-danger" onClick={() => cancelDownload(item.gameId)}>
                    <XCircle size={16} /> Cancel
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${item.progressPercent}%` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>
                  {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)} ({item.progressPercent}%)
                </span>
                <span>{item.status === 'downloading' ? formatSpeed(item.speedBytesPerSec) : '--'}</span>
                <span>{item.status === 'downloading' ? formatEta(item.etaSeconds) : ''}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: 40 }}>
          <Download size={48} color="var(--text-dim)" />
          <h3 style={{ marginTop: 12, color: 'var(--text-muted)' }}>No active downloads</h3>
        </div>
      )}

      {/* Completed Downloads History */}
      {completedDownloads.length > 0 && (
        <section>
          <div className="section-title">
            <span>Completed Downloads</span>
          </div>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {completedDownloads.map((item) => (
              <div
                key={item.gameId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span style={{ fontWeight: 600 }}>{item.gameName}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>
                  Successfully installed (v{item.targetVersion})
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

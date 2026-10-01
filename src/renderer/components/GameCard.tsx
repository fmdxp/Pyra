import React from 'react';
import { Play, Download, RefreshCw } from 'lucide-react';
import { Game } from '../../shared/types';
import { useLauncher } from '../context/LauncherContext';

interface GameCardProps {
  game: Game;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const { installedGames, runningGames, downloads, navigateTo, launchGame, startDownload } = useLauncher();

  const isInstalled = !!installedGames[game.id];
  const installedInfo = installedGames[game.id];
  const isRunning = runningGames[game.id]?.isRunning;
  const isDownloading = downloads[game.id]?.status === 'downloading' || downloads[game.id]?.status === 'extracting';
  const hasUpdate = isInstalled && installedInfo.installedVersion !== game.version;

  const handleCardClick = () => {
    navigateTo('game-detail', game.id);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) return;

    if (isInstalled) {
      if (hasUpdate) {
        startDownload(game, true, game.version);
      } else {
        launchGame(game.id);
      }
    } else {
      startDownload(game);
    }
  };

  return (
    <div className="game-card" onClick={handleCardClick}>
      <div className="game-card-thumb">
        <img
          src={game.banner || game.icon}
          alt={game.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23161b26"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238b5cf6" font-family="sans-serif" font-weight="bold" font-size="20">PYRA GAME</text></svg>';
          }}
        />
        {isInstalled && !hasUpdate && <span className="game-card-badge badge-installed">INSTALLED</span>}
        {hasUpdate && <span className="game-card-badge badge-update">UPDATE</span>}
      </div>

      <div className="game-card-info">
        <div className="game-card-title">{game.name}</div>
        <div className="game-card-genre">{game.genre}</div>

        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          {isRunning ? (
            <button className="btn btn-secondary" style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}>
              PLAYING...
            </button>
          ) : isDownloading ? (
            <button className="btn btn-secondary" style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}>
              DOWNLOADING...
            </button>
          ) : isInstalled ? (
            hasUpdate ? (
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}
                onClick={handleActionClick}
              >
                <RefreshCw size={14} /> UPDATE
              </button>
            ) : (
              <button
                className="btn btn-success"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}
                onClick={handleActionClick}
              >
                <Play size={14} /> PLAY
              </button>
            )
          ) : (
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={handleActionClick}
            >
              <Download size={14} /> INSTALL
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

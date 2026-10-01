import React from 'react';
import { Play, FolderOpen, Library as LibraryIcon, ShoppingBag } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';

export const LibraryPage: React.FC = () => {
  const { catalog, installedGames, runningGames, launchGame, openGameFolder, navigateTo } = useLauncher();

  const installedList = Object.values(installedGames)
    .map((inst) => {
      const game = catalog.find((g) => g.id === inst.id);
      return { installedInfo: inst, game };
    })
    .filter((item): item is { installedInfo: typeof item.installedInfo; game: NonNullable<typeof item.game> } => !!item.game);

  return (
    <div className="page-container">
      <div className="section-title">
        <span>My Library ({installedList.length})</span>
      </div>

      {installedList.length > 0 ? (
        <div className="game-grid">
          {installedList.map(({ game, installedInfo }) => {
            const isRunning = runningGames[game.id]?.isRunning;

            return (
              <div
                key={game.id}
                className="game-card"
                onClick={() => navigateTo('game-detail', game.id)}
              >
                <div className="game-card-thumb">
                  <img src={game.banner || game.icon} alt={game.name} />
                  <span className="game-card-badge badge-installed">v{installedInfo.installedVersion}</span>
                </div>

                <div className="game-card-info">
                  <div className="game-card-title">{game.name}</div>
                  <div className="game-card-genre">
                    Last Played: {installedInfo.lastPlayed ? new Date(installedInfo.lastPlayed).toLocaleDateString() : 'Never'}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8 }}>
                    {isRunning ? (
                      <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}>
                        PLAYING...
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          launchGame(game.id);
                        }}
                      >
                        <Play size={14} /> PLAY
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px 10px' }}
                      title="Open Install Folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGameFolder(game.id);
                      }}
                    >
                      <FolderOpen size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <LibraryIcon size={56} color="var(--accent-purple)" />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>Your library is empty</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.5 }}>
            Browse the Pyra store to discover and install high-octane games to play right now.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigateTo('store')}>
            <ShoppingBag size={18} /> Browse Games
          </button>
        </div>
      )}
    </div>
  );
};

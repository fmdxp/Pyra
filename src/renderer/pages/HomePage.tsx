import React from 'react';
import { Play, Info, Flame, Sparkles } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';
import { GameCard } from '../components/GameCard';

export const HomePage: React.FC = () => {
  const { catalog, installedGames, runningGames, downloads, navigateTo, launchGame, startDownload } = useLauncher();

  const heroGame = catalog.find((g) => g.featured) || catalog[0];

  const recentlyPlayedList = Object.values(installedGames)
    .filter((g) => g.lastPlayed !== null)
    .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime())
    .map((g) => catalog.find((cat) => cat.id === g.id))
    .filter((g): g is NonNullable<typeof g> => !!g);

  if (!heroGame) {
    return (
      <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={48} color="#8b5cf6" />
        <h2 style={{ marginTop: 16 }}>Loading Catalog...</h2>
      </div>
    );
  }

  const isHeroInstalled = !!installedGames[heroGame.id];
  const isHeroRunning = runningGames[heroGame.id]?.isRunning;
  const isHeroDownloading = downloads[heroGame.id]?.status === 'downloading' || downloads[heroGame.id]?.status === 'extracting';

  const handleHeroAction = () => {
    if (isHeroRunning) return;
    if (isHeroInstalled) {
      launchGame(heroGame.id);
    } else {
      startDownload(heroGame);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Large Cinematic Hero Banner */}
      <div className="hero-banner">
        <img className="hero-bg" src={heroGame.banner || heroGame.icon} alt={heroGame.name} />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#a78bfa',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            <Flame size={14} /> FEATURED SPOTLIGHT
          </div>
          <h1 className="hero-title">{heroGame.name}</h1>
          <p className="hero-description">{heroGame.description}</p>
          <div className="hero-actions">
            {isHeroRunning ? (
              <button className="btn btn-secondary">PLAYING...</button>
            ) : isHeroDownloading ? (
              <button className="btn btn-secondary">DOWNLOADING...</button>
            ) : isHeroInstalled ? (
              <button className="btn btn-success" onClick={handleHeroAction}>
                <Play size={18} /> PLAY NOW
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleHeroAction}>
                <Play size={18} /> INSTALL GAME
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigateTo('game-detail', heroGame.id)}>
              <Info size={18} /> VIEW DETAILS
            </button>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 0 }}>
        {/* Featured Games Section */}
        <section style={{ marginBottom: 40 }}>
          <div className="section-title">
            <span>Featured Games</span>
          </div>
          <div className="game-grid">
            {catalog.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* Recently Played Section */}
        <section>
          <div className="section-title">
            <span>Recently Played</span>
          </div>
          {recentlyPlayedList.length > 0 ? (
            <div className="game-grid">
              {recentlyPlayedList.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '36px 24px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                You haven't played any games recently. Browse your library or store to dive in!
              </p>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => navigateTo('store')}
              >
                Browse Store
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

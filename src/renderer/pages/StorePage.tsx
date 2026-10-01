import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';
import { GameCard } from '../components/GameCard';

export const StorePage: React.FC = () => {
  const { catalog } = useLauncher();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'featured' | 'name' | 'rating'>('featured');

  const genres = ['All', 'Action', 'Racing', 'Strategy', 'RPG'];

  const filteredGames = catalog
    .filter((game) => {
      const matchesSearch =
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || game.genre.toLowerCase().includes(selectedGenre.toLowerCase());
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  return (
    <div className="page-container">
      {/* Search & Filter Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div style={{ position: 'relative', width: 320 }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-glass-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Genre Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {genres.map((genre) => (
            <button
              key={genre}
              className={`btn ${selectedGenre === genre ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} color="var(--text-muted)" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-glass-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="featured">Featured First</option>
            <option value="name">Title A-Z</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="section-title">
        <span>Store Catalog ({filteredGames.length})</span>
      </div>

      {filteredGames.length > 0 ? (
        <div className="game-grid">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48 }}>
          <h3>No games found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Try adjusting your search query or genre filter.
          </p>
        </div>
      )}
    </div>
  );
};

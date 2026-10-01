import React from 'react';
import { Home, ShoppingBag, Library, Download, Settings } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';
import { NavigationPage } from '../types';

export const Sidebar: React.FC = () => {
  const { activePage, navigateTo, downloads } = useLauncher();

  const activeDownloadCount = Object.values(downloads).filter(
    (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'extracting'
  ).length;

  const navItems: { id: NavigationPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'HOME', icon: <Home size={18} /> },
    { id: 'store', label: 'STORE', icon: <ShoppingBag size={18} /> },
    { id: 'library', label: 'LIBRARY', icon: <Library size={18} /> },
    { id: 'downloads', label: 'DOWNLOADS', icon: <Download size={18} />, badge: activeDownloadCount },
    { id: 'settings', label: 'SETTINGS', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="sidebar">
      {navItems.map((item) => {
        const isActive = activePage === item.id || (activePage === 'game-detail' && item.id === 'store');
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigateTo(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
            {!!item.badge && item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
          </button>
        );
      })}
    </aside>
  );
};

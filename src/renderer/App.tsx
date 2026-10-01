import React from 'react';
import { LauncherProvider, useLauncher } from './context/LauncherContext';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { HomePage } from './pages/HomePage';
import { StorePage } from './pages/StorePage';
import { LibraryPage } from './pages/LibraryPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GameDetailPage } from './pages/GameDetailPage';
import './styles/global.css';

const MainLayout: React.FC = () => {
  const { activePage } = useLauncher();

  return (
    <div id="root">
      <TitleBar />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          {activePage === 'home' && <HomePage />}
          {activePage === 'store' && <StorePage />}
          {activePage === 'library' && <LibraryPage />}
          {activePage === 'downloads' && <DownloadsPage />}
          {activePage === 'settings' && <SettingsPage />}
          {activePage === 'game-detail' && <GameDetailPage />}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LauncherProvider>
      <MainLayout />
    </LauncherProvider>
  );
};

export default App;

import React from 'react';
import { Minus, Square, X, Flame, WifiOff } from 'lucide-react';
import { useLauncher } from '../context/LauncherContext';

export const TitleBar: React.FC = () => {
  const { isOffline } = useLauncher();

  const handleMinimize = () => window.pyraAPI.windowMinimize();
  const handleMaximize = () => window.pyraAPI.windowMaximize();
  const handleClose = () => window.pyraAPI.windowClose();

  return (
    <header className="titlebar">
      <div className="titlebar-brand">
        <div className="titlebar-logo">
          <Flame size={20} color="#8b5cf6" />
          <span>PYRA</span>
        </div>
        {isOffline && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <WifiOff size={12} /> Offline Mode
          </span>
        )}
      </div>

      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
          <Minus size={14} />
        </button>
        <button className="titlebar-btn" onClick={handleMaximize} title="Maximize">
          <Square size={12} />
        </button>
        <button className="titlebar-btn close" onClick={handleClose} title="Close">
          <X size={14} />
        </button>
      </div>
    </header>
  );
};

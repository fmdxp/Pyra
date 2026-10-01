import { PyraAPI } from '../../preload/index';

declare global {
  interface Window {
    pyraAPI: PyraAPI;
  }
}

export type NavigationPage = 'home' | 'store' | 'library' | 'downloads' | 'settings' | 'game-detail';

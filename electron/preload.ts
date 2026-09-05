import { contextBridge, ipcRenderer } from 'electron';

export interface StartupConfig {
  startWithWindows: boolean;
  startMinimized: boolean;
  enableVoiceOnStartup: boolean;
  greetOnReady: boolean;
  greetingFrequency: 'always' | 'once_per_day' | 'never';
  minimizeToTrayOnClose: boolean;
  globalShortcut: string;
}

// Expose secure Akansha Desktop Bridge API
contextBridge.exposeInMainWorld('akanshaDesktop', {
  isDesktop: true,
  platform: process.platform,

  // Window Controls
  minimizeToTray: () => ipcRenderer.send('window:minimize-to-tray'),
  hideWindow: () => ipcRenderer.send('window:hide'),
  showWindow: () => ipcRenderer.send('window:show'),
  quitApp: () => ipcRenderer.send('app:quit'),
  setWindowMode: (mode: 'assistant' | 'compact' | 'standard' | 'fullscreen') => 
    ipcRenderer.send('window:set-mode', mode),

  // Windows Startup & Login Settings
  getStartupSettings: (): Promise<StartupConfig> => ipcRenderer.invoke('startup:get-settings'),
  setStartupSettings: (settings: Partial<StartupConfig>): Promise<StartupConfig> => 
    ipcRenderer.invoke('startup:set-settings', settings),

  // Native Notifications
  sendNotification: (options: { title: string; body: string; silent?: boolean }) => 
    ipcRenderer.send('notification:send', options),

  // Global Shortcuts & Events
  onGlobalShortcut: (callback: (action: string) => void) => {
    const handler = (_: any, action: string) => callback(action);
    ipcRenderer.on('shortcut:triggered', handler);
    return () => ipcRenderer.removeListener('shortcut:triggered', handler);
  },

  onTrayAction: (callback: (action: string) => void) => {
    const handler = (_: any, action: string) => callback(action);
    ipcRenderer.on('tray:action', handler);
    return () => ipcRenderer.removeListener('tray:action', handler);
  }
});

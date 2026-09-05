import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, globalShortcut, Notification } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fork, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverProcess: ChildProcess | null = null;
let isQuitting = false;

// Startup config file path in userData
const configPath = path.join(app.getPath('userData'), 'config_desktop.json');

interface DesktopConfig {
  startWithWindows: boolean;
  startMinimized: boolean;
  enableVoiceOnStartup: boolean;
  greetOnReady: boolean;
  greetingFrequency: 'always' | 'once_per_day' | 'never';
  minimizeToTrayOnClose: boolean;
  globalShortcut: string;
}

const defaultConfig: DesktopConfig = {
  startWithWindows: true,
  startMinimized: false,
  enableVoiceOnStartup: true,
  greetOnReady: true,
  greetingFrequency: 'once_per_day',
  minimizeToTrayOnClose: true,
  globalShortcut: 'CommandOrControl+Space'
};

function loadConfig(): DesktopConfig {
  try {
    if (fs.existsSync(configPath)) {
      return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
    }
  } catch (err) {
    console.warn('[Electron] Could not read desktop config, using defaults');
  }
  return { ...defaultConfig };
}

function saveConfig(cfg: Partial<DesktopConfig>): DesktopConfig {
  const current = loadConfig();
  const updated = { ...current, ...cfg };
  try {
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.error('[Electron] Failed to write desktop config:', err);
  }
  return updated;
}

// 1. SINGLE INSTANCE LOCK
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Electron] Another instance is already running. Quitting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * Check if backend server is already running on port 5000
 */
function isServerRunning(port = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Start embedded backend server if not running
 */
async function startEmbeddedServer() {
  const running = await isServerRunning(5000);
  if (running) {
    console.log('[Electron] Backend server already running on port 5000.');
    return;
  }

  console.log('[Electron] Bootstrapping embedded Akansha backend service...');
  const isDev = !app.isPackaged;
  
  if (isDev) {
    const serverScript = path.join(app.getAppPath(), 'server', 'index.ts');
    serverProcess = fork(serverScript, [], {
      execArgv: ['-r', 'tsx/cjs'],
      env: { ...process.env, PORT: '5000' }
    });
  } else {
    // Packaged build uses compiled server bundle
    const serverScript = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-server', 'index.js');
    if (fs.existsSync(serverScript)) {
      serverProcess = fork(serverScript, [], {
        env: { ...process.env, PORT: '5000' }
      });
    } else {
      const altScript = path.join(__dirname, '..', 'dist-server', 'index.js');
      if (fs.existsSync(altScript)) {
        serverProcess = fork(altScript, [], {
          env: { ...process.env, PORT: '5000' }
        });
      }
    }
  }

  if (serverProcess) {
    serverProcess.on('error', (err) => console.error('[Electron Server Process Error]:', err));
    serverProcess.on('exit', (code) => console.log(`[Electron Server Process Exited]: ${code}`));
  }
}

/**
 * Configure Windows Startup Idempotently
 */
function syncWindowsStartupSettings(config: DesktopConfig) {
  try {
    app.setLoginItemSettings({
      openAtLogin: config.startWithWindows,
      path: process.execPath,
      args: config.startMinimized ? ['--minimized'] : []
    });
    console.log(`[Electron] Windows Startup synced: openAtLogin=${config.startWithWindows}`);
  } catch (err) {
    console.error('[Electron] Failed to update login item settings:', err);
  }
}

function createMainWindow(config: DesktopConfig) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    title: 'AKANSHA · Windows AI Operating Layer',
    show: !config.startMinimized,
    backgroundColor: '#030712',
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      sandbox: false
    }
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      // If dev server not yet ready, load built dist or wait
      const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        mainWindow?.loadFile(indexPath);
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Handle window close -> minimize to tray if enabled
  mainWindow.on('close', (event) => {
    const currentCfg = loadConfig();
    if (!isQuitting && currentCfg.minimizeToTrayOnClose) {
      event.preventDefault();
      mainWindow?.hide();
      if (tray && process.platform === 'win32') {
        tray.displayBalloon?.({
          title: 'AKANSHA AI OS',
          content: 'Running in background. Press Ctrl+Space to activate.'
        });
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSystemTray() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const icon = fs.existsSync(iconPath) 
    ? nativeImage.createFromPath(iconPath) 
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('AKANSHA · Windows AI Operating Layer');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open AKANSHA',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '🎙️ Start Listening',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('tray:action', 'START_LISTENING');
      }
    },
    {
      label: '⏸️ Pause Listening',
      click: () => {
        mainWindow?.webContents.send('tray:action', 'PAUSE_LISTENING');
      }
    },
    {
      label: '⚡ Run Mission (Ctrl+Space)',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('tray:action', 'OPEN_COMMAND_PALETTE');
      }
    },
    { type: 'separator' },
    {
      label: '⚙️ Settings',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('tray:action', 'NAVIGATE_SETTINGS');
      }
    },
    {
      label: '🛡️ Security & Vault',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('tray:action', 'NAVIGATE_SECURITY');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit AKANSHA',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function registerGlobalShortcuts(config: DesktopConfig) {
  globalShortcut.unregisterAll();
  
  try {
    const shortcutKey = config.globalShortcut || 'CommandOrControl+Space';
    const registered = globalShortcut.register(shortcutKey, () => {
      console.log(`[Electron] Global shortcut triggered: ${shortcutKey}`);
      if (mainWindow) {
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        mainWindow.focus();
        mainWindow.webContents.send('shortcut:triggered', 'GLOBAL_ACTIVATION');
      }
    });

    if (registered) {
      console.log(`[Electron] Registered global shortcut: ${shortcutKey}`);
    } else {
      console.warn(`[Electron] Failed to register global shortcut: ${shortcutKey}`);
    }
  } catch (err) {
    console.error('[Electron] Error registering global shortcut:', err);
  }
}

// --- IPC HANDLERS ---

ipcMain.handle('startup:get-settings', () => {
  return loadConfig();
});

ipcMain.handle('startup:set-settings', (_, newSettings: Partial<DesktopConfig>) => {
  const updated = saveConfig(newSettings);
  syncWindowsStartupSettings(updated);
  registerGlobalShortcuts(updated);
  return updated;
});

ipcMain.on('window:minimize-to-tray', () => {
  mainWindow?.hide();
});

ipcMain.on('window:show', () => {
  mainWindow?.show();
  mainWindow?.focus();
});

ipcMain.on('window:hide', () => {
  mainWindow?.hide();
});

ipcMain.on('window:set-mode', (_, mode: 'assistant' | 'compact' | 'standard' | 'fullscreen') => {
  if (!mainWindow) return;
  if (mode === 'compact') {
    mainWindow.setSize(520, 720);
  } else if (mode === 'assistant') {
    mainWindow.setSize(800, 600);
  } else if (mode === 'fullscreen') {
    mainWindow.maximize();
  } else {
    mainWindow.setSize(1400, 900);
  }
});

ipcMain.on('notification:send', (_, { title, body, silent }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'AKANSHA AI OS',
      body: body || '',
      silent: !!silent
    }).show();
  }
});

ipcMain.on('app:quit', () => {
  isQuitting = true;
  app.quit();
});

// App Lifecycle
app.whenReady().then(async () => {
  const config = loadConfig();
  await startEmbeddedServer();
  syncWindowsStartupSettings(config);
  createMainWindow(config);
  createSystemTray();
  registerGlobalShortcuts(config);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(config);
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('window-all-closed', () => {
  const config = loadConfig();
  if (!config.minimizeToTrayOnClose || isQuitting) {
    app.quit();
  }
});

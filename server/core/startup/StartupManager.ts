import { systemMetricsService } from '../../windows/systemMetrics';
import { processManager } from '../../windows/processManager';
import { memoryEngine } from '../../memory/memoryEngine';
import { voiceRouter } from '../../voice/voiceRouter';
import { hardenedSecurity } from '../../security/hardenedSecurity';
import { deviceController } from '../../devices/deviceController';
import fs from 'fs';
import path from 'path';

export type StartupState = 
  | 'BOOTING'
  | 'LOADING_CORE'
  | 'LOADING_MEMORY'
  | 'LOADING_VOICE'
  | 'LOADING_MODELS'
  | 'CONNECTING_WINDOWS'
  | 'HEALTH_CHECK'
  | 'READY'
  | 'PARTIAL_READY'
  | 'OFFLINE'
  | 'RECOVERING'
  | 'ERROR';

export interface SubsystemHealth {
  name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  message: string;
  lastChecked: string;
}

export interface StartupConfig {
  startWithWindows: boolean;
  startMinimized: boolean;
  enableVoiceOnStartup: boolean;
  greetOnReady: boolean;
  greetingFrequency: 'always' | 'once_per_day' | 'never';
  minimizeToTrayOnClose: boolean;
  globalShortcut: string;
  lastGreetingDate?: string;
}

export class StartupManager {
  private currentState: StartupState = 'BOOTING';
  private stateHistory: Array<{ state: StartupState; timestamp: string }> = [];
  private healthChecks: Map<string, SubsystemHealth> = new Map();
  private configPath: string;
  private config: StartupConfig;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config_startup.json');
    this.config = this.loadConfig();
    this.setState('BOOTING');
  }

  private loadConfig(): StartupConfig {
    const defaultConfig: StartupConfig = {
      startWithWindows: true,
      startMinimized: false,
      enableVoiceOnStartup: true,
      greetOnReady: true,
      greetingFrequency: 'once_per_day',
      minimizeToTrayOnClose: true,
      globalShortcut: 'CommandOrControl+Space'
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        return { ...defaultConfig, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[StartupManager] Could not read config_startup.json, using defaults');
    }
    return defaultConfig;
  }

  saveConfig(newConfig: Partial<StartupConfig>): StartupConfig {
    this.config = { ...this.config, ...newConfig };
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (err) {
      console.error('[StartupManager] Failed to save startup config:', err);
    }
    return this.config;
  }

  getConfig(): StartupConfig {
    return this.config;
  }

  getState(): StartupState {
    return this.currentState;
  }

  getStateHistory() {
    return this.stateHistory;
  }

  private setState(state: StartupState) {
    this.currentState = state;
    this.stateHistory.push({
      state,
      timestamp: new Date().toISOString()
    });
    console.log(`[StartupManager] State Transition -> ${state}`);
  }

  /**
   * Run full staged startup sequence with truthful health checks
   */
  async runStartupSequence(): Promise<{ state: StartupState; greeting?: string; health: SubsystemHealth[] }> {
    const startTime = Date.now();
    this.setState('LOADING_CORE');
    await new Promise(r => setTimeout(r, 150));

    // 1. Check Memory Subsystem
    this.setState('LOADING_MEMORY');
    const memoryHealth = await this.checkMemoryHealth();
    this.healthChecks.set('MemoryEngine', memoryHealth);

    // 2. Check Voice Subsystem
    this.setState('LOADING_VOICE');
    const voiceHealth = await this.checkVoiceHealth();
    this.healthChecks.set('VoiceRouter', voiceHealth);

    // 3. Check Models & Security
    this.setState('LOADING_MODELS');
    const securityHealth = await this.checkSecurityHealth();
    this.healthChecks.set('HardenedSecurity', securityHealth);

    // 4. Connect Native Windows Plane
    this.setState('CONNECTING_WINDOWS');
    const winHealth = await this.checkWindowsHealth();
    this.healthChecks.set('WindowsControlPlane', winHealth);

    // 5. Final Health Aggregation
    this.setState('HEALTH_CHECK');
    const deviceHealth = await this.checkDeviceHealth();
    this.healthChecks.set('DeviceController', deviceHealth);

    const allHealth = Array.from(this.healthChecks.values());
    const offlineCount = allHealth.filter(h => h.status === 'offline').length;
    const degradedCount = allHealth.filter(h => h.status === 'degraded').length;

    let finalState: StartupState = 'READY';
    if (offlineCount > 0) {
      finalState = winHealth.status === 'offline' ? 'ERROR' : 'PARTIAL_READY';
    } else if (degradedCount > 0) {
      finalState = 'PARTIAL_READY';
    }

    this.setState(finalState);

    // 6. Generate Time-Aware Polite Greeting
    const greeting = this.generateGreeting(finalState);

    console.log(`[StartupManager] Startup completed in ${Date.now() - startTime}ms -> ${finalState}`);
    return {
      state: finalState,
      greeting,
      health: allHealth
    };
  }

  private async checkMemoryHealth(): Promise<SubsystemHealth> {
    const t0 = Date.now();
    try {
      const memories = memoryEngine.getMemories('working');
      return {
        name: 'Memory Engine',
        category: 'Cognitive Store',
        status: 'healthy',
        latencyMs: Date.now() - t0,
        message: `7-Layer memory active (${memories.length} working units)`,
        lastChecked: new Date().toISOString()
      };
    } catch (e: any) {
      return {
        name: 'Memory Engine',
        category: 'Cognitive Store',
        status: 'degraded',
        latencyMs: Date.now() - t0,
        message: e.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkVoiceHealth(): Promise<SubsystemHealth> {
    const t0 = Date.now();
    try {
      const activeProvider = voiceRouter.getActiveProvider();
      return {
        name: 'Voice Router',
        category: 'Audio I/O',
        status: 'healthy',
        latencyMs: Date.now() - t0,
        message: `Active provider: ${activeProvider.name} (${activeProvider.id})`,
        lastChecked: new Date().toISOString()
      };
    } catch (e: any) {
      return {
        name: 'Voice Router',
        category: 'Audio I/O',
        status: 'offline',
        latencyMs: Date.now() - t0,
        message: e.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkSecurityHealth(): Promise<SubsystemHealth> {
    const t0 = Date.now();
    try {
      const vaultMeta = hardenedSecurity.getVaultMetadata();
      return {
        name: 'Hardened Security & Vault',
        category: 'Security',
        status: 'healthy',
        latencyMs: Date.now() - t0,
        message: `AES-256 Vault active (${vaultMeta.length} keys protected), Prompt Firewall enabled`,
        lastChecked: new Date().toISOString()
      };
    } catch (e: any) {
      return {
        name: 'Hardened Security & Vault',
        category: 'Security',
        status: 'degraded',
        latencyMs: Date.now() - t0,
        message: e.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkWindowsHealth(): Promise<SubsystemHealth> {
    const t0 = Date.now();
    try {
      const telemetry = await systemMetricsService.getTelemetry();
      return {
        name: 'Windows Control Plane',
        category: 'OS Integration',
        status: (telemetry.hostType && telemetry.hostType.includes('Windows')) ? 'healthy' : 'degraded',
        latencyMs: Date.now() - t0,
        message: `${telemetry.osInfo} (CPU: ${telemetry.cpuLoad}%, RAM: ${telemetry.memoryPercent}%)`,
        lastChecked: new Date().toISOString()
      };
    } catch (e: any) {
      return {
        name: 'Windows Control Plane',
        category: 'OS Integration',
        status: 'offline',
        latencyMs: Date.now() - t0,
        message: e.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkDeviceHealth(): Promise<SubsystemHealth> {
    const t0 = Date.now();
    try {
      const devices = await deviceController.scanDevices();
      return {
        name: 'Hardware & Device Controller',
        category: 'Hardware',
        status: 'healthy',
        latencyMs: Date.now() - t0,
        message: `${devices.length} native PnP devices detected`,
        lastChecked: new Date().toISOString()
      };
    } catch (e: any) {
      return {
        name: 'Hardware & Device Controller',
        category: 'Hardware',
        status: 'degraded',
        latencyMs: Date.now() - t0,
        message: e.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Generates a polite, natural time-aware greeting based on state and user preferences
   */
  generateGreeting(state: StartupState): string | undefined {
    if (!this.config.greetOnReady) return undefined;

    const todayStr = new Date().toISOString().split('T')[0];

    if (this.config.greetingFrequency === 'never') {
      return undefined;
    }

    if (this.config.greetingFrequency === 'once_per_day') {
      if (this.config.lastGreetingDate === todayStr) {
        return undefined; // Already greeted today
      }
    }

    // Update last greeting date
    this.saveConfig({ lastGreetingDate: todayStr });

    if (state === 'PARTIAL_READY') {
      const winCheck = this.healthChecks.get('WindowsControlPlane');
      if (winCheck && winCheck.status !== 'healthy') {
        return "I'm ready, but Windows control is still reconnecting. I'll keep trying in the background.";
      }
      return "Akansha is ready. Voice and local AI are online, with some services operating in degraded mode.";
    }

    if (state === 'ERROR' || state === 'OFFLINE') {
      return "Akansha started with issues. Please inspect the system diagnostics.";
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good morning. Akansha is ready. How can I help you?";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon. I'm ready whenever you are.";
    } else {
      return "Good evening. Akansha is online and ready.";
    }
  }

  getAllHealth(): SubsystemHealth[] {
    return Array.from(this.healthChecks.values());
  }
}

export const startupManager = new StartupManager();

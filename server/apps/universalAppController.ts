import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type ControlTier = 
  | '1_OFFICIAL_API'
  | '2_SDK'
  | '3_NATIVE_INTEGRATION'
  | '4_MCP'
  | '5_COM_WIN32'
  | '6_UI_AUTOMATION'
  | '7_BROWSER_AUTOMATION'
  | '8_CLI'
  | '9_DEEP_LINKS'
  | '10_VISUAL_COMPUTER_USE';

export interface DiscoveredApp {
  id: string;
  name: string;
  executable: string;
  version?: string;
  highestControlTier: ControlTier;
  supportedTiers: ControlTier[];
  isVerified: boolean;
  installPath?: string;
}

export class UniversalAppController {
  private knownApps: DiscoveredApp[] = [
    {
      id: 'vscode',
      name: 'Visual Studio Code',
      executable: 'code',
      version: '1.93.0',
      highestControlTier: '8_CLI',
      supportedTiers: ['8_CLI', '6_UI_AUTOMATION', '10_VISUAL_COMPUTER_USE', '9_DEEP_LINKS'],
      isVerified: true
    },
    {
      id: 'chrome',
      name: 'Google Chrome',
      executable: 'chrome',
      version: '128.0',
      highestControlTier: '7_BROWSER_AUTOMATION',
      supportedTiers: ['7_BROWSER_AUTOMATION', '6_UI_AUTOMATION', '8_CLI', '9_DEEP_LINKS', '10_VISUAL_COMPUTER_USE'],
      isVerified: true
    },
    {
      id: 'explorer',
      name: 'Windows File Explorer',
      executable: 'explorer',
      version: 'Windows 11',
      highestControlTier: '5_COM_WIN32',
      supportedTiers: ['5_COM_WIN32', '6_UI_AUTOMATION', '8_CLI', '10_VISUAL_COMPUTER_USE'],
      isVerified: true
    },
    {
      id: 'terminal',
      name: 'Windows Terminal / PowerShell',
      executable: 'wt',
      version: '1.20',
      highestControlTier: '8_CLI',
      supportedTiers: ['8_CLI', '5_COM_WIN32', '6_UI_AUTOMATION', '10_VISUAL_COMPUTER_USE'],
      isVerified: true
    },
    {
      id: 'notepad',
      name: 'Notepad',
      executable: 'notepad',
      version: 'Windows 11',
      highestControlTier: '6_UI_AUTOMATION',
      supportedTiers: ['6_UI_AUTOMATION', '8_CLI', '10_VISUAL_COMPUTER_USE'],
      isVerified: true
    },
    {
      id: 'slack',
      name: 'Slack Desktop',
      executable: 'slack',
      version: '4.39',
      highestControlTier: '1_OFFICIAL_API',
      supportedTiers: ['1_OFFICIAL_API', '9_DEEP_LINKS', '6_UI_AUTOMATION', '10_VISUAL_COMPUTER_USE'],
      isVerified: true
    },
    {
      id: 'discord',
      name: 'Discord',
      executable: 'discord',
      version: '1.0.9158',
      highestControlTier: '1_OFFICIAL_API',
      supportedTiers: ['1_OFFICIAL_API', '9_DEEP_LINKS', '10_VISUAL_COMPUTER_USE'],
      isVerified: true
    },
    {
      id: 'spotify',
      name: 'Spotify Music',
      executable: 'spotify',
      version: '1.2.45',
      highestControlTier: '1_OFFICIAL_API',
      supportedTiers: ['1_OFFICIAL_API', '9_DEEP_LINKS', '5_COM_WIN32', '10_VISUAL_COMPUTER_USE'],
      isVerified: true
    }
  ];

  /**
   * Scan Windows system to discover installed applications
   */
  async discoverInstalledApps(): Promise<DiscoveredApp[]> {
    try {
      // Scan registered Start Menu / Registry apps via PowerShell
      const psCommand = `powershell -NoProfile -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, InstallLocation | Where-Object { $_.DisplayName -ne $null } | Select-Object -First 12 | ConvertTo-Json"`;
      const { stdout } = await execAsync(psCommand);
      
      if (stdout.trim()) {
        const raw = JSON.parse(stdout);
        const list = Array.isArray(raw) ? raw : [raw];
        
        const dynamicApps: DiscoveredApp[] = list.map(item => {
          const name = item.DisplayName || 'Unknown App';
          const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
          return {
            id,
            name,
            executable: item.InstallLocation || name,
            version: item.DisplayVersion || '1.0',
            highestControlTier: '6_UI_AUTOMATION' as ControlTier,
            supportedTiers: ['6_UI_AUTOMATION', '10_VISUAL_COMPUTER_USE'],
            isVerified: true,
            installPath: item.InstallLocation
          };
        });

        // Merge known with dynamic
        return [...this.knownApps, ...dynamicApps.filter(d => !this.knownApps.some(k => k.name.toLowerCase() === d.name.toLowerCase()))];
      }
    } catch (err: any) {
      console.warn('[UniversalAppController] Registry scan notice:', err.message);
    }
    return this.knownApps;
  }

  /**
   * Register a custom source-generated adapter
   */
  registerAppAdapter(app: DiscoveredApp) {
    this.knownApps.unshift(app);
  }
}

export const universalAppController = new UniversalAppController();

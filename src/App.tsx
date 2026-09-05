import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Terminal, 
  AppWindow, 
  Shield, 
  Cpu, 
  Activity, 
  Sparkles, 
  Eye, 
  Layers, 
  MessageSquare, 
  Bot, 
  Brain, 
  Smartphone, 
  Search,
  Command
} from 'lucide-react';
import { VoiceCenter } from './components/VoiceCenter';
import { MissionControl } from './components/MissionControl';
import { WindowsControl } from './components/WindowsControl';
import { VisionCenter } from './components/VisionCenter';
import { UniversalApps } from './components/UniversalApps';
import { CommunicationCenter } from './components/CommunicationCenter';
import { AgentCenter } from './components/AgentCenter';
import { MemoryCenter } from './components/MemoryCenter';
import { AutomationCenter } from './components/AutomationCenter';
import { DeviceCenter } from './components/DeviceCenter';
import { SystemTelemetryCenter } from './components/SystemTelemetryCenter';
import { DelegationGuard } from './components/DelegationGuard';
import { SettingsCenter } from './components/SettingsCenter';
import { CommandPalette } from './components/CommandPalette';
import { audioEngine } from './services/audioEngine';
import { apiService, TelemetryData } from './services/apiService';

type Tab = 
  | 'voice' 
  | 'missions' 
  | 'agents' 
  | 'windows' 
  | 'vision' 
  | 'apps' 
  | 'comms' 
  | 'memory' 
  | 'automation' 
  | 'devices' 
  | 'system' 
  | 'security'
  | 'settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('voice');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [bootGreeting, setBootGreeting] = useState<string | null>(null);

  useEffect(() => {
    audioEngine.init();
    apiService.getTelemetry().then(setTelemetry).catch(console.error);
    const interval = setInterval(() => {
      apiService.getTelemetry().then(setTelemetry).catch(console.error);
    }, 2500);

    // Run startup boot sequence and check greeting
    apiService.runStartupBoot().then((bootRes) => {
      if (bootRes?.greeting) {
        setBootGreeting(bootRes.greeting);
        // Only speak greeting if audio is enabled
        setTimeout(() => {
          audioEngine.speak(bootRes.greeting);
        }, 1200);
      }
    }).catch(console.warn);

    // Global shortcut: Ctrl + Space or Cmd + K to open Command Palette
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.code === 'Space') || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);

    // Electron Desktop Bridge Listeners
    if ((window as any).akanshaDesktop?.onGlobalShortcut) {
      (window as any).akanshaDesktop.onGlobalShortcut((action: string) => {
        if (action === 'GLOBAL_ACTIVATION') {
          setIsCommandPaletteOpen(true);
        }
      });
    }

    if ((window as any).akanshaDesktop?.onTrayAction) {
      (window as any).akanshaDesktop.onTrayAction((action: string) => {
        if (action === 'START_LISTENING') {
          setActiveTab('voice');
          audioEngine.startMicrophone();
        } else if (action === 'PAUSE_LISTENING') {
          audioEngine.stopMicrophone();
        } else if (action === 'OPEN_COMMAND_PALETTE') {
          setIsCommandPaletteOpen(true);
        } else if (action === 'NAVIGATE_SETTINGS') {
          setActiveTab('settings');
        } else if (action === 'NAVIGATE_SECURITY') {
          setActiveTab('security');
        }
      });
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  const navItems = [
    { id: 'voice' as Tab, label: 'Voice', icon: Radio },
    { id: 'missions' as Tab, label: 'Missions', icon: Terminal },
    { id: 'agents' as Tab, label: 'Agent OS', icon: Bot, badge: '15' },
    { id: 'windows' as Tab, label: 'Windows', icon: AppWindow },
    { id: 'vision' as Tab, label: 'Vision', icon: Eye },
    { id: 'apps' as Tab, label: 'Apps', icon: Layers },
    { id: 'comms' as Tab, label: 'Comms', icon: MessageSquare },
    { id: 'memory' as Tab, label: 'Memory', icon: Brain },
    { id: 'automation' as Tab, label: 'Automation', icon: Cpu },
    { id: 'devices' as Tab, label: 'Devices', icon: Smartphone },
    { id: 'system' as Tab, label: 'Telemetry', icon: Activity },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
    { id: 'settings' as Tab, label: 'Settings', icon: Command },
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Floating Glass Navigation Header */}
      <header className="sticky top-4 z-40 max-w-5xl mx-auto w-full px-4">
        <div className="nav-dock-bar px-4 py-2.5 flex items-center justify-between">
          {/* Logo Identity */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-400/30">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wider text-white font-mono">
                  AKANSHA
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                  AI OS
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Dock */}
          <nav className="hidden md:flex items-center gap-1 nav-dock-inner">
            {navItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-dock-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Pill: Command Palette Trigger & Live Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="glass-btn-secondary text-xs"
              title="Press Ctrl+Space"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px] text-slate-200 font-medium">Search</span>
              <kbd className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-black/60 text-slate-400 border border-white/15">
                Ctrl Space
              </kbd>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 shadow-sm shadow-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
              <span className="font-medium">Windows Online</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Scrollbar */}
        <div className="flex md:hidden overflow-x-auto gap-1 py-2 px-2 mt-2">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-dock-btn ${isActive ? 'active' : ''} whitespace-nowrap`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {activeTab === 'voice' && <VoiceCenter />}
        {activeTab === 'missions' && <MissionControl />}
        {activeTab === 'agents' && <AgentCenter />}
        {activeTab === 'windows' && <WindowsControl />}
        {activeTab === 'vision' && <VisionCenter />}
        {activeTab === 'apps' && <UniversalApps />}
        {activeTab === 'comms' && <CommunicationCenter />}
        {activeTab === 'memory' && <MemoryCenter />}
        {activeTab === 'automation' && <AutomationCenter />}
        {activeTab === 'devices' && <DeviceCenter />}
        {activeTab === 'system' && <SystemTelemetryCenter />}
        {activeTab === 'security' && <DelegationGuard />}
        {activeTab === 'settings' && <SettingsCenter />}
      </main>

      {/* Floating Glass Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onExecuteAction={(intent) => {
          apiService.createMission(intent);
          setActiveTab('missions');
        }}
        onNavigateTab={(t) => setActiveTab(t as Tab)}
      />

      {/* Minimal Status Footer */}
      <footer className="py-4 text-[11px] font-mono text-slate-500 text-center">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4">
          <span>AKANSHA AI OS · JARVIS MODE</span>
          <span className="text-cyan-400/80">Windows 11 Native Control Plane Online</span>
          <span>15 Agents Supervised</span>
        </div>
      </footer>
    </div>
  );
};

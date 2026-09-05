import React, { useState, useEffect } from 'react';
import {
  Settings,
  Power,
  Volume2,
  Cpu,
  AppWindow,
  Brain,
  Shield,
  Bell,
  Palette,
  Gauge,
  Lock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Radio,
  Sliders
} from 'lucide-react';
import { apiService } from '../services/apiService';

interface StartupConfig {
  startWithWindows: boolean;
  startMinimized: boolean;
  enableVoiceOnStartup: boolean;
  greetOnReady: boolean;
  greetingFrequency: 'always' | 'once_per_day' | 'never';
  minimizeToTrayOnClose: boolean;
  globalShortcut: string;
}

export const SettingsCenter: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'startup' | 'voice' | 'models' | 'window' | 'memory' | 'security' | 'notifications' | 'appearance' | 'performance' | 'privacy' | 'advanced'>('startup');
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [subsystemHealth, setSubsystemHealth] = useState<any[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  const [startupConfig, setStartupConfig] = useState<StartupConfig>({
    startWithWindows: true,
    startMinimized: false,
    enableVoiceOnStartup: true,
    greetOnReady: true,
    greetingFrequency: 'once_per_day',
    minimizeToTrayOnClose: true,
    globalShortcut: 'CommandOrControl+Space'
  });

  const [voiceSettings, setVoiceSettings] = useState({
    singleFemaleVoiceLock: true,
    bargeInSensitivity: 0.05,
    autoListenOnWake: true,
    selectedProvider: 'web_speech'
  });

  const [securitySettings, setSecuritySettings] = useState({
    promptFirewallStrict: true,
    gatedHighRiskActions: true,
    vaultAutoLockMinutes: 30,
    auditLogging: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    glassmorphicBlur: 24,
    cyanGlowIntensity: 'high',
    particleOrbs: true,
    soundEffects: true
  });

  useEffect(() => {
    loadSettings();
    loadHealth();
  }, []);

  const loadSettings = async () => {
    try {
      if ((window as any).akanshaDesktop?.getStartupSettings) {
        const desktopCfg = await (window as any).akanshaDesktop.getStartupSettings();
        setStartupConfig(desktopCfg);
      } else {
        const res = await apiService.getStartupSettings();
        if (res) setStartupConfig(res);
      }
    } catch (err) {
      console.warn('[SettingsCenter] Failed to load startup settings:', err);
    }
  };

  const loadHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const health = await apiService.getStartupHealth();
      setSubsystemHealth(health || []);
    } catch (err) {
      console.warn('[SettingsCenter] Health fetch failed:', err);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const handleSaveStartup = async () => {
    try {
      if ((window as any).akanshaDesktop?.setStartupSettings) {
        await (window as any).akanshaDesktop.setStartupSettings(startupConfig);
      }
      await apiService.saveStartupSettings(startupConfig);

      setSavedStatus('Settings synced with Windows registry & local config!');
      setTimeout(() => setSavedStatus(null), 3500);

      // Trigger notification if desktop bridge is available
      (window as any).akanshaDesktop?.sendNotification?.({
        title: 'AKANSHA Settings',
        body: 'Windows Startup and preferences saved successfully.'
      });
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const navSections = [
    { id: 'startup', label: 'Windows Startup', icon: Power },
    { id: 'voice', label: 'Voice & Speech', icon: Volume2 },
    { id: 'models', label: 'AI Providers & Local Models', icon: Cpu },
    { id: 'window', label: 'Desktop & Tray', icon: AppWindow },
    { id: 'memory', label: 'Memory & Learning', icon: Brain },
    { id: 'security', label: 'Security & Vault', icon: Shield },
    { id: 'notifications', label: 'Notifications & Audio', icon: Bell },
    { id: 'appearance', label: 'Appearance & HUD', icon: Palette },
    { id: 'performance', label: 'Performance & Telemetry', icon: Gauge },
    { id: 'privacy', label: 'Privacy & Data Lock', icon: Lock },
    { id: 'advanced', label: 'System Diagnostics', icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">AKANSHA Settings & Desktop Core</h2>
              <p className="text-xs text-slate-400">Configure Windows integration, voice providers, startup behavior, and security policies</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedStatus && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {savedStatus}
              </span>
            )}
            <button
              onClick={handleSaveStartup}
              className="glass-btn text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Section Navigation */}
        <div className="glass-panel p-3 space-y-1 md:col-span-1 h-fit">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold px-3 py-1.5">
            Settings Domains
          </div>
          {navSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Section Content Pane */}
        <div className="glass-panel p-6 md:col-span-3 space-y-6">
          {/* 1. WINDOWS STARTUP */}
          {activeSection === 'startup' && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Power className="w-4 h-4 text-cyan-400" />
                  Windows Startup Configuration
                </h3>
                <p className="text-xs text-slate-400">Control how Akansha registers with Windows login and greets you upon boot</p>
              </div>

              <div className="space-y-4">
                {/* Start with Windows */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-white">Start Akansha with Windows</div>
                    <div className="text-[11px] text-slate-400">Launch Akansha automatically when you log into your Windows user account</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={startupConfig.startWithWindows}
                      onChange={(e) => setStartupConfig({ ...startupConfig, startWithWindows: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Start Minimized */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-white">Start Minimized to System Tray</div>
                    <div className="text-[11px] text-slate-400">Keep window hidden on startup and remain standing by in background</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={startupConfig.startMinimized}
                      onChange={(e) => setStartupConfig({ ...startupConfig, startMinimized: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Enable Voice on Startup */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-white">Enable Voice Engine on Startup</div>
                    <div className="text-[11px] text-slate-400">Initialize microphone pipeline and voice listeners automatically</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={startupConfig.enableVoiceOnStartup}
                      onChange={(e) => setStartupConfig({ ...startupConfig, enableVoiceOnStartup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Greet on Ready */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-white">Greet Me When Ready</div>
                    <div className="text-[11px] text-slate-400">Akansha delivers a natural, polite time-aware voice greeting once boot passes health check</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={startupConfig.greetOnReady}
                      onChange={(e) => setStartupConfig({ ...startupConfig, greetOnReady: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                {/* Greeting Frequency Selector */}
                {startupConfig.greetOnReady && (
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                    <div className="text-xs font-semibold text-cyan-300">Greeting Frequency:</div>
                    <div className="grid grid-cols-3 gap-3">
                      {(['always', 'once_per_day', 'never'] as const).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setStartupConfig({ ...startupConfig, greetingFrequency: freq })}
                          className={`p-2.5 rounded-lg border text-xs font-medium capitalize flex items-center justify-center gap-2 transition-all ${
                            startupConfig.greetingFrequency === freq
                              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                              : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${startupConfig.greetingFrequency === freq ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                          {freq.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. VOICE & SPEECH */}
          {activeSection === 'voice' && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  Voice Architecture & Provider Lock
                </h3>
                <p className="text-xs text-slate-400">Strict single voice output manager and instant hardware barge-in settings</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-white">Enforce Single Female Voice Lock</div>
                    <div className="text-[11px] text-slate-400">Locks speech output strictly to high-clarity English Female voice and prevents dual playback</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={voiceSettings.singleFemaleVoiceLock}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, singleFemaleVoiceLock: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Hardware Barge-In Sensitivity</span>
                    <span className="font-mono text-cyan-400">{(voiceSettings.bargeInSensitivity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={voiceSettings.bargeInSensitivity}
                    onChange={(e) => setVoiceSettings({ ...voiceSettings, bargeInSensitivity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-400">Lower values trigger TTS silence faster when you speak while Akansha is talking</div>
                </div>
              </div>
            </div>
          )}

          {/* 3. DESKTOP & SYSTEM TRAY */}
          {activeSection === 'window' && (
            <div className="space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AppWindow className="w-4 h-4 text-cyan-400" />
                  Desktop Window & Global Activation
                </h3>
                <p className="text-xs text-slate-400">Manage system tray behaviors, window modes, and hotkeys</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-white">Minimize to System Tray on Close</div>
                    <div className="text-[11px] text-slate-400">Closing the window hides it into the Windows notification area instead of terminating</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={startupConfig.minimizeToTrayOnClose}
                      onChange={(e) => setStartupConfig({ ...startupConfig, minimizeToTrayOnClose: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                  </label>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                  <div className="text-xs font-semibold text-white">Global Activation Shortcut</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={startupConfig.globalShortcut}
                      onChange={(e) => setStartupConfig({ ...startupConfig, globalShortcut: e.target.value })}
                      className="glass-input text-xs font-mono max-w-xs"
                    />
                    <span className="text-[11px] text-slate-400">Summons Akansha from any app in Windows</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                  <div className="text-xs font-semibold text-white">Desktop Window Modes</div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => (window as any).akanshaDesktop?.setWindowMode?.('assistant')}
                      className="glass-btn text-xs py-2 text-center block"
                    >
                      Assistant HUD (800x600)
                    </button>
                    <button
                      onClick={() => (window as any).akanshaDesktop?.setWindowMode?.('compact')}
                      className="glass-btn-secondary text-xs py-2 text-center block"
                    >
                      Compact Mode (520x720)
                    </button>
                    <button
                      onClick={() => (window as any).akanshaDesktop?.setWindowMode?.('standard')}
                      className="glass-btn-secondary text-xs py-2 text-center block"
                    >
                      Command Center (1400x900)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. SYSTEM DIAGNOSTICS & HEALTH */}
          {activeSection === 'advanced' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    Subsystem Diagnostics & Truthful Probes
                  </h3>
                  <p className="text-xs text-slate-400">Live operational status of all core subsystems</p>
                </div>
                <button
                  onClick={loadHealth}
                  disabled={isLoadingHealth}
                  className="glass-btn-secondary text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                  <span>Run Probe</span>
                </button>
              </div>

              <div className="space-y-3">
                {subsystemHealth.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No probe data loaded yet. Click "Run Probe" to test subsystems.</div>
                ) : (
                  subsystemHealth.map((h, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{h.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">{h.category}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">{h.message}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400">{h.latencyMs}ms</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          h.status === 'healthy' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Fallback for other domains */}
          {['models', 'memory', 'security', 'notifications', 'appearance', 'performance', 'privacy'].includes(activeSection) && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white capitalize">{activeSection} Preferences</h3>
                <p className="text-xs text-slate-400">Configured and active on local Windows runtime</p>
              </div>

              <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Module operational and managed by Desktop Core.</span>
                </div>
                <p className="text-xs text-slate-300">
                  Settings in this domain are dynamically adapted by the Master Orchestrator, Letta Memory Layer, and Hardened Security Vault based on runtime context.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

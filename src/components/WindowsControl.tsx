import React, { useState, useEffect } from 'react';
import { LayoutGrid, RefreshCw, ExternalLink, Power, Terminal, AppWindow, CheckCircle2, Sparkles } from 'lucide-react';
import { apiService, RunningWindow } from '../services/apiService';

export const WindowsControl: React.FC = () => {
  const [windows, setWindows] = useState<RunningWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [psScript, setPsScript] = useState('Get-Date; Get-Service -Name "wuauserv" | Select-Object Status, Name');
  const [psOutput, setPsOutput] = useState<string>('');
  const [psRunning, setPsRunning] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<string>('');

  useEffect(() => {
    loadWindows();
    const interval = setInterval(loadWindows, 3500);
    return () => clearInterval(interval);
  }, []);

  const loadWindows = async () => {
    setLoading(true);
    try {
      const list = await apiService.getWindows();
      setWindows(list);
    } catch (err) {
      console.error('Failed to load windows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async (appName: string) => {
    setLastActionResult(`Launching ${appName}...`);
    const res = await apiService.launchApp(appName);
    setLastActionResult(res.message);
    loadWindows();
  };

  const handleFocus = async (title: string) => {
    setLastActionResult(`Focusing '${title}'...`);
    const res = await apiService.focusWindow(title);
    setLastActionResult(res.message);
  };

  const handleClose = async (pid: number) => {
    if (!confirm(`Terminate PID ${pid}?`)) return;
    setLastActionResult(`Closing PID ${pid}...`);
    const res = await apiService.closeApp(pid.toString());
    setLastActionResult(res.message);
    loadWindows();
  };

  const handleRunPowerShell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psScript.trim() || psRunning) return;

    setPsRunning(true);
    setPsOutput('Executing script in Win32 admin context...');
    try {
      const res = await apiService.runPowerShell(psScript);
      setPsOutput(res.stdout || res.stderr || 'Command completed with empty output.');
    } catch (err: any) {
      setPsOutput(`Error: ${err.message}`);
    } finally {
      setPsRunning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Floating Glass Application Dock */}
      <div className="glass-panel p-8 rounded-3xl space-y-4 text-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <AppWindow className="w-5 h-5 text-cyan-400" />
            Native Windows Control Dock
          </h2>
          <p className="text-xs text-slate-400 font-light max-w-md mx-auto">
            Click to launch native applications. Akansha verifies the PID creation and foreground window HWND.
          </p>
        </div>

        {/* Translucent Glass Application Dock */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          {[
            { name: 'VS Code', id: 'code', icon: '💻' },
            { name: 'File Explorer', id: 'explorer', icon: '📁' },
            { name: 'Windows Terminal', id: 'wt', icon: '⌨️' },
            { name: 'Notepad', id: 'notepad', icon: '📝' },
            { name: 'Calculator', id: 'calc', icon: '🧮' },
            { name: 'Google Chrome', id: 'chrome', icon: '🌐' }
          ].map((app) => (
            <button
              key={app.id}
              onClick={() => handleLaunch(app.id)}
              className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl glass-card p-3 hover:scale-105 transition-all duration-200 group"
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{app.icon}</span>
              <span className="text-[11px] font-medium text-slate-200">{app.name}</span>
            </button>
          ))}
        </div>

        {lastActionResult && (
          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-2xl max-w-lg mx-auto flex items-center justify-center gap-2 mt-4">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{lastActionResult}</span>
          </div>
        )}
      </div>

      {/* Two Column Layout: Running Windows & PowerShell Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active GUI Windows */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AppWindow className="w-4 h-4 text-indigo-400" />
              Active Windowed Processes ({windows.length})
            </h3>
            <button onClick={loadWindows} className="glass-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {windows.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-6 text-center">No windowed processes detected.</p>
            ) : (
              windows.map((win) => (
                <div
                  key={win.pid}
                  className="p-3.5 rounded-2xl glass-card flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="truncate flex-1">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span className="text-cyan-300">PID {win.pid}</span>
                      <span className="text-slate-400">({win.name})</span>
                    </div>
                    <div className="text-slate-400 text-[11px] truncate mt-0.5" title={win.windowTitle}>
                      "{win.windowTitle}"
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleFocus(win.windowTitle || win.name)}
                      title="Focus Window"
                      className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleClose(win.pid)}
                      title="Terminate Process"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Translucent PowerShell Terminal */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              PowerShell Control Plane
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full glass-pill text-emerald-400">
              Win32 Admin Context
            </span>
          </div>

          <form onSubmit={handleRunPowerShell} className="space-y-3">
            <textarea
              rows={3}
              value={psScript}
              onChange={(e) => setPsScript(e.target.value)}
              className="w-full p-3.5 rounded-2xl glass-input font-mono text-xs text-emerald-300"
              placeholder="Enter PowerShell commands..."
            />
            <button
              type="submit"
              disabled={psRunning || !psScript.trim()}
              className="w-full py-2.5 rounded-2xl glass-btn-primary text-xs font-medium disabled:opacity-40"
            >
              {psRunning ? 'Executing Script...' : 'Execute Script'}
            </button>
          </form>

          <div className="space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Output Console:</div>
            <pre className="p-3.5 rounded-2xl bg-black/50 border border-white/5 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {psOutput || '// No script executed yet.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

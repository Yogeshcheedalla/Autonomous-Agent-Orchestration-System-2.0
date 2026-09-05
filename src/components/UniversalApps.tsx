import React, { useState, useEffect } from 'react';
import { Layers, FolderGit2, Code, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/apiService';

export const UniversalApps: React.FC = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [repoPath, setRepoPath] = useState('c:\\jarvis-an');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoadingApps(true);
    try {
      const data = await apiService.getDiscoveredApps();
      setApps(data);
    } catch (err) {
      console.error('Failed to load apps:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleScanRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoPath.trim() || scanning) return;

    setScanning(true);
    try {
      const res = await apiService.scanRepo(repoPath);
      setScanResult(res);
      loadApps();
    } catch (err: any) {
      alert(`Repository scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const getTierBadge = (tier: string) => {
    if (tier.includes('1_OFFICIAL_API') || tier.includes('2_SDK')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (tier.includes('8_CLI') || tier.includes('5_COM')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
    if (tier.includes('6_UI') || tier.includes('7_BROWSER')) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Header & Source Repo Scanner */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Universal Application & Source Repo Engine
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Control any Windows application via 10-tier hierarchy or automatically generated repository adapters.
            </p>
          </div>

          <button onClick={loadApps} className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 self-start md:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingApps ? 'animate-spin' : ''}`} /> Refresh Apps
          </button>
        </div>

        {/* Scan Repo Form */}
        <form onSubmit={handleScanRepo} className="flex gap-3">
          <input
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="e.g. c:\jarvis-an"
            className="flex-1 px-4 py-3.5 rounded-2xl glass-input text-xs font-mono text-cyan-300 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={scanning || !repoPath.trim()}
            className="glass-btn-primary px-6 py-3.5 rounded-2xl text-xs font-medium disabled:opacity-40"
          >
            {scanning ? 'Scanning...' : 'Scan & Generate Adapter'}
          </button>
        </form>

        {scanResult && (
          <div className="p-4 rounded-2xl glass-card space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Adapter Generated: {scanResult.projectType}
              </span>
              <span className="text-slate-500">Security: {scanResult.securityRisk}</span>
            </div>

            <pre className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] text-cyan-200 overflow-x-auto">
              {scanResult.generatedAdapterCode}
            </pre>
          </div>
        )}
      </div>

      {/* Discovered Apps Grid */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          Discovered Apps & Control Tiers ({apps.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {apps.map((app) => (
            <div key={app.id} className="p-4 rounded-2xl glass-card space-y-2">
              <div className="flex items-start justify-between">
                <div className="font-semibold text-sm text-slate-100 truncate" title={app.name}>
                  {app.name}
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${getTierBadge(app.highestControlTier)}`}>
                  {app.highestControlTier.split('_').slice(1).join(' ')}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate">{app.executable}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

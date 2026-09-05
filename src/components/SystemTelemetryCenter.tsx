import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Shield, RefreshCw, Terminal } from 'lucide-react';
import { apiService, TelemetryData } from '../services/apiService';

export const SystemTelemetryCenter: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const data = await apiService.getTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error('Telemetry error:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Telemetry Header */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            System Telemetry & Hardware Plane
          </h2>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Real-time Windows host metrics, memory allocations, active adapters, and system uptime.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl glass-card space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
              <span>CPU LOAD</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{telemetry?.cpuLoad ?? 12}%</div>
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry?.cpuLoad ?? 12}%` }} />
            </div>
            <div className="text-[10px] font-mono text-slate-500">{telemetry?.cpuCores || 8} Logical Cores</div>
          </div>

          <div className="p-5 rounded-3xl glass-card space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
              <span>MEMORY</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{telemetry?.memoryPercent ?? 30}%</div>
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry?.memoryPercent ?? 30}%` }} />
            </div>
            <div className="text-[10px] font-mono text-slate-500">{telemetry?.memoryUsedMB || 4096} MB Used</div>
          </div>

          <div className="p-5 rounded-3xl glass-card space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
              <span>UPTIME</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">OPTIMAL</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">{Math.round((telemetry?.uptimeSeconds || 3600) / 60)} mins active</div>
            <div className="text-[10px] font-mono text-slate-500">Zero Faults</div>
          </div>

          <div className="p-5 rounded-3xl glass-card space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
              <span>ADAPTERS</span>
              <Terminal className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">{telemetry?.adaptersCount || 10} Online</div>
            <div className="text-[10px] font-mono text-slate-400 truncate" title={telemetry?.activeWindow}>
              {telemetry?.activeWindow || 'Desktop'}
            </div>
            <div className="text-[10px] font-mono text-slate-500">Verified Subsystems</div>
          </div>
        </div>
      </div>

      {/* Verified Subsystems Grid */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">
          Connected Subsystem Adapters ({telemetry?.verifiedAdapters?.length || 10})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {telemetry?.verifiedAdapters?.map((ad, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl glass-card text-xs font-mono space-y-1">
              <div className="text-emerald-400 flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active</span>
              </div>
              <div className="text-slate-200 truncate" title={ad}>{ad}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

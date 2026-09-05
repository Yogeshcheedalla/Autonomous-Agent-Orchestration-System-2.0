import React, { useState, useEffect } from 'react';
import { Cpu, Play, Power, Plus, Clock, Activity, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';

export const AutomationCenter: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rList, lList] = await Promise.all([
        apiService.getAutomationRules(),
        apiService.getAutomationLogs()
      ]);
      setRules(rList);
      setLogs(lList);
    } catch (err) {
      console.error('Failed to load automation data:', err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiService.toggleAutomationRule(id);
      loadData();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleTrigger = async (id: string) => {
    try {
      const res = await apiService.triggerAutomationRule(id);
      setStatusMsg(res.message);
      loadData();
    } catch (err: any) {
      setStatusMsg(`Trigger failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Workflows Header Panel */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              Proactive Automation & Background Engine
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Event-driven automation, scheduled missions, system health monitors, and conditional task chains.
            </p>
          </div>

          <button onClick={loadData} className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 self-start md:self-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Automation Objects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rules.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-3xl transition-all duration-200 space-y-3.5 ${
                r.enabled
                  ? 'glass-card border-amber-500/30'
                  : 'glass-card opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">{r.name}</h4>
                  <p className="text-[11px] text-slate-400 font-light line-clamp-2 mt-0.5">{r.description}</p>
                </div>
                <button
                  onClick={() => handleToggle(r.id)}
                  className={`p-2 rounded-xl text-xs transition-colors ${
                    r.enabled ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-slate-500'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-slate-400 bg-black/40 p-3 rounded-2xl border border-white/5">
                <div><span className="text-slate-500">Trigger:</span> <span className="text-cyan-300">{r.triggerConfig}</span></div>
                <div><span className="text-slate-500">Condition:</span> <span className="text-amber-300">{r.condition}</span></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-slate-500">Runs: {r.runCount}</span>
                <button
                  onClick={() => handleTrigger(r.id)}
                  className="px-3 py-1.5 rounded-xl glass-btn-secondary text-xs flex items-center gap-1 hover:text-emerald-300"
                >
                  <Play className="w-3 h-3 text-emerald-400" /> Run
                </button>
              </div>
            </div>
          ))}
        </div>

        {statusMsg && (
          <div className="text-xs font-mono text-amber-300 bg-amber-950/40 p-3 rounded-2xl border border-amber-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Execution Logs */}
      <div className="glass-panel p-6 rounded-3xl space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Trigger Execution History
        </h3>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">No automation executions recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3 rounded-2xl glass-card flex items-center justify-between text-xs">
                <span className="text-slate-200 font-semibold">{log.ruleName}</span>
                <span className="text-emerald-400 text-[11px]">{log.result}</span>
                <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

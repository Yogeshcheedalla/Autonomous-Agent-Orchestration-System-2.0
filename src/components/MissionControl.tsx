import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, XCircle, Clock, ShieldCheck, Activity, Terminal, Play, ArrowRight, Sparkles, Search } from 'lucide-react';
import { apiService, MissionData, TelemetryData } from '../services/apiService';
import { agentEventsClient, GenerativeUIPayload } from '../services/agentEvents';
import { ComponentRegistry } from './generative/ComponentRegistry';

export const MissionControl: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generativePayloads, setGenerativePayloads] = useState<GenerativeUIPayload[]>([]);

  useEffect(() => {
    loadData();
    agentEventsClient.init();

    const unsub = agentEventsClient.onGenerativeUI((payload) => {
      setGenerativePayloads(prev => [payload, ...prev.slice(0, 5)]);
    });

    const interval = setInterval(loadData, 2500);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  const loadData = async () => {
    try {
      const [mList, tData] = await Promise.all([
        apiService.getMissions(),
        apiService.getTelemetry()
      ]);
      setMissions(mList);
      setTelemetry(tData);
    } catch (err) {
      console.error('Error fetching missions:', err);
    }
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const newMission = await apiService.createMission(prompt);
      setMissions(prev => [newMission, ...prev]);
      setPrompt('');
    } catch (err) {
      console.error('Mission creation error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleQuickRun = async (cmd: string) => {
    setPrompt(cmd);
    setIsExecuting(true);
    try {
      const newMission = await apiService.createMission(cmd);
      setMissions(prev => [newMission, ...prev]);
    } catch (err) {
      console.error('Quick run failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Cockpit Status Pill Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">HOST POSTURE</div>
          <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Windows Native Host
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{telemetry?.osInfo || 'Win32 Control Plane'}</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">VERIFIED ADAPTERS</div>
          <div className="text-sm font-semibold text-cyan-300 mt-1">
            {telemetry?.adaptersCount || 10} Subsystems Online
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Win32 · WS · VAD Active</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">SYSTEM LOAD</div>
          <div className="text-sm font-semibold text-indigo-300 mt-1">
            CPU {telemetry?.cpuLoad ?? 12}% · RAM {telemetry?.memoryPercent ?? 30}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Optimal Telemetry</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">FOREGROUND HWND</div>
          <div className="text-sm font-semibold text-slate-200 mt-1 truncate" title={telemetry?.activeWindow}>
            {telemetry?.activeWindow || 'Desktop'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Active Window Focus</div>
        </div>
      </div>

      {/* Unified Mission Cockpit Glass Surface */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              Mission Cockpit
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Natural language delegation with automated planning, permission gates, and side-effect verification.
            </p>
          </div>

          <span className="text-[11px] font-mono px-3 py-1 rounded-full glass-pill text-cyan-300">
            {missions.length} Missions Logged
          </span>
        </div>

        {/* Command Input Bar */}
        <form onSubmit={handleCreateMission} className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe computer intent (e.g. 'Open VS Code', 'Check system health', 'powershell Get-Process')..."
            className="flex-1 px-4 py-3.5 rounded-2xl glass-input text-sm text-slate-100 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isExecuting || !prompt.trim()}
            className="glass-btn-primary px-6 py-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 disabled:opacity-40"
          >
            {isExecuting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isExecuting ? 'Planning...' : 'Dispatch'}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-2 items-center text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Quick Missions:</span>
          {['Open VS Code', 'Open Notepad', 'Check system health', 'powershell Get-Date', 'Focus Chrome'].map((q) => (
            <button
              key={q}
              onClick={() => handleQuickRun(q)}
              className="px-3 py-1 rounded-full glass-btn-secondary text-[11px] transition-all hover:text-cyan-300"
            >
              + {q}
            </button>
          ))}
        </div>

        {/* Generative UI Dynamic Stream */}
        {generativePayloads.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Generative Agent UI Stream</span>
            </div>
            {generativePayloads.map((payload, idx) => (
              <ComponentRegistry key={idx} componentName={payload.component} props={payload.props} />
            ))}
          </div>
        )}

        {/* Missions Queue & Connected Execution Nodes */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            Active & Verified Missions Queue
          </h3>

          <div className="space-y-3">
            {missions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No missions in motion. Enter an intent above or trigger via Voice Center.
              </div>
            ) : (
              missions.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl glass-card space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        m.status === 'passed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : m.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-cyan-500/20 text-cyan-400 animate-spin'
                      }`}>
                        {m.status === 'passed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">{m.title}</h4>
                        <p className="text-xs text-slate-400 font-light mt-0.5">{m.summary || m.intent}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
                        m.status === 'passed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : m.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {m.status.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{m.timestamp}</span>
                    </div>
                  </div>

                  {/* Connected DAG Node Flow */}
                  {m.steps && m.steps.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                      {m.steps.map((s, idx) => (
                        <React.Fragment key={s.id}>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-slate-400 font-medium">{s.action}</span>
                            <span className="text-cyan-400 text-[10px]">[{s.tool}]</span>
                          </div>
                          {idx < m.steps.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Verification Status */}
                  {m.verification && (
                    <div className="text-[11px] font-mono text-slate-400 bg-black/40 px-3.5 py-2 rounded-xl flex items-center justify-between border border-white/5">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Verification: {m.verification.message}
                      </span>
                      <span className="text-slate-600">{m.id}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

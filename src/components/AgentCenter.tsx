import React, { useState, useEffect } from 'react';
import { Bot, GitFork, Activity, CheckCircle, Clock, Play, ArrowRight, ShieldCheck, Sparkles, RefreshCw, Cpu, Brain, Zap } from 'lucide-react';
import { apiService } from '../services/apiService';

export const AgentCenter: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [dags, setDags] = useState<any[]>([]);
  const [goal, setGoal] = useState('Research system performance, inspect active processes, optimize memory, and verify state');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentList, dagList] = await Promise.all([
        apiService.getAgents(),
        apiService.getDAGs()
      ]);
      setAgents(agentList);
      setDags(dagList);
      if (agentList.length > 0 && !selectedAgent) {
        setSelectedAgent(agentList[0]);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteDAG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isExecuting) return;

    setIsExecuting(true);
    try {
      const newDag = await apiService.executeDAG(goal);
      setDags(prev => [newDag, ...prev]);
      setTimeout(loadData, 1200);
    } catch (err: any) {
      alert(`DAG dispatch failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Living Multi-Agent Orchestration Hub */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              Agent Operating System
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              15 Supervised Specialist Agents coordinated autonomously by the Master Orchestrator.
            </p>
          </div>

          <button onClick={loadData} className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 self-start md:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Matrix
          </button>
        </div>

        {/* DAG Mission Planner */}
        <form onSubmit={handleExecuteDAG} className="flex gap-3">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe a high-level multi-agent mission..."
            className="flex-1 px-4 py-3.5 rounded-2xl glass-input text-xs text-slate-100 placeholder-slate-500 font-sans"
          />
          <button
            type="submit"
            disabled={isExecuting || !goal.trim()}
            className="glass-btn-primary px-6 py-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 disabled:opacity-40"
          >
            {isExecuting ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isExecuting ? 'Synthesizing...' : 'Dispatch DAG'}
          </button>
        </form>

        {/* Living DAG Node Graph */}
        {dags.length > 0 && (
          <div className="space-y-3 pt-2">
            {dags.slice(0, 1).map((dag) => (
              <div key={dag.id} className="p-5 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-300 font-semibold flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-purple-400" />
                    DAG [{dag.id}]: {dag.goal}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {dag.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 font-mono text-xs pt-1">
                  {dag.nodes?.map((node: any, idx: number) => (
                    <div
                      key={node.id}
                      className={`p-3 rounded-xl border text-[11px] space-y-1 transition-all ${
                        node.status === 'completed'
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                          : node.status === 'running'
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 animate-pulse'
                          : 'bg-white/5 border-white/5 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <span>Node {idx + 1}</span>
                        <span className="uppercase text-purple-300">{node.agentRole}</span>
                      </div>
                      <div className="truncate font-medium text-slate-200" title={node.name}>{node.name}</div>
                      {node.result && <div className="text-[10px] text-emerald-400 truncate">{node.result}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Agent Hub Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 15 Specialist Agents Grid */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Specialist Agents Hub ({agents.length} Supervised Units)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {agents.map((ag) => {
              const isSelected = selectedAgent?.id === ag.id;
              return (
                <div
                  key={ag.id}
                  onClick={() => setSelectedAgent(ag)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 space-y-2.5 ${
                    isSelected
                      ? 'bg-purple-500/15 border border-purple-500/50 shadow-lg shadow-purple-950/40'
                      : 'glass-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100">{ag.name}</h4>
                      <p className="text-[11px] text-slate-400 font-light line-clamp-1 mt-0.5">{ag.description}</p>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                      {ag.health}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Latency: {ag.latencyMs}ms</span>
                    <span>Win Rate: {ag.successRate}%</span>
                    <span>Tasks: {ag.totalMissions}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Agent Inspector Detail Panel */}
        <div className="glass-panel p-6 rounded-3xl space-y-5">
          {selectedAgent ? (
            <>
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Agent Descriptor</div>
                <h3 className="text-base font-bold text-white">{selectedAgent.name}</h3>
                <p className="text-xs text-slate-400 font-light">{selectedAgent.description}</p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="text-slate-500 text-[10px] uppercase">Role & Authority</div>
                  <div className="text-cyan-300 font-semibold">{selectedAgent.role.toUpperCase()}</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                  <div className="text-slate-500 text-[10px] uppercase">Registered Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedAgent.capabilities?.map((cap: string) => (
                      <span key={cap} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                  <div className="text-slate-500 text-[10px] uppercase">Bound Tools</div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    {selectedAgent.tools?.map((t: string) => (
                      <div key={t} className="text-indigo-300 truncate">⚙ {t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 p-8 text-center italic">
              Select an agent from the hub to inspect permissions & capabilities.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

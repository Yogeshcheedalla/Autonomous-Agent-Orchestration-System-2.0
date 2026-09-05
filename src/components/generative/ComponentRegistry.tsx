import React from 'react';
import {
  Search,
  CheckCircle2,
  ExternalLink,
  Code2,
  AlertTriangle,
  Globe,
  FileText,
  Activity,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';

// --- 1. RESEARCH RESULTS CARD ---
export const ResearchResultsCard: React.FC<{
  title: string;
  summary: string;
  recommendations: Array<{ item: string; reason: string; score?: number }>;
  sources: Array<{ title: string; url: string }>;
}> = ({ title, summary, recommendations = [], sources = [] }) => {
  return (
    <div className="glass-panel p-5 space-y-4 border-cyan-500/30 shadow-lg shadow-cyan-500/10 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
            <span className="text-[10px] font-mono text-cyan-400">Deep Research Synthesis</span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
          {sources.length} Sources Analyzed
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-white uppercase tracking-wider font-mono">
            Key Recommendations:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">{rec.item}</span>
                  {rec.score && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      Score: {rec.score}/10
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="text-[10px] font-mono uppercase text-slate-400">Verified Citations:</div>
          <div className="flex flex-wrap gap-2">
            {sources.map((s, idx) => (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-slate-300 bg-white/5 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <Globe className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[180px]">{s.title || s.url}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. AGENT GRAPH VISUALIZER ---
export const AgentGraphVisualizer: React.FC<{
  goal: string;
  nodes: Array<{ id: string; agent: string; status: 'pending' | 'running' | 'completed' | 'failed'; description: string }>;
}> = ({ goal, nodes = [] }) => {
  return (
    <div className="glass-panel p-5 space-y-4 border-purple-500/30 shadow-lg shadow-purple-500/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">Multi-Agent DAG Execution</h4>
            <span className="text-[10px] font-mono text-purple-400">Mission: {goal}</span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
          {nodes.length} Specialist Nodes
        </span>
      </div>

      <div className="space-y-2">
        {nodes.map((n, i) => (
          <div
            key={n.id || i}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              n.status === 'running'
                ? 'bg-purple-950/40 border-purple-500/50 shadow-sm shadow-purple-500/20 animate-pulse'
                : n.status === 'completed'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                : 'bg-white/[0.02] border-white/5 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                n.status === 'running' ? 'bg-purple-400 animate-ping' :
                n.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-600'
              }`} />
              <div>
                <div className="text-xs font-bold text-white">{n.agent}</div>
                <div className="text-[11px] text-slate-300">{n.description}</div>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10">
              {n.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 3. CODE DIFF CARD ---
export const CodeDiffCard: React.FC<{
  filename: string;
  diff: string;
  explanation: string;
}> = ({ filename, diff, explanation }) => {
  return (
    <div className="glass-panel p-5 space-y-3 border-indigo-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-white">{filename}</span>
        </div>
        <span className="text-[10px] font-mono text-indigo-400">OpenHands Code Patch</span>
      </div>
      <p className="text-xs text-slate-300">{explanation}</p>
      <pre className="p-3.5 rounded-xl bg-black/70 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-60">
        <code>{diff}</code>
      </pre>
    </div>
  );
};

// --- 4. HUMAN-IN-THE-LOOP APPROVAL DIALOG ---
export const ConfirmationDialog: React.FC<{
  action: string;
  reason: string;
  riskLevel: 'ELEVATED' | 'HIGH_RISK';
  onApprove?: () => void;
  onReject?: () => void;
}> = ({ action, reason, riskLevel, onApprove, onReject }) => {
  return (
    <div className="glass-panel p-5 space-y-4 border-amber-500/40 bg-amber-950/20 shadow-xl shadow-amber-500/10 animate-bounce-short">
      <div className="flex items-center gap-3 border-b border-amber-500/30 pb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Delegation Guard Approval Required</h4>
          <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
            Risk Tier: {riskLevel}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-white">Proposed Action:</div>
        <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-amber-200">
          {action}
        </div>
        <p className="text-xs text-slate-300 pt-1">{reason}</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={onReject}
          className="glass-btn-secondary text-xs px-4 py-1.5 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300"
        >
          Block Action
        </button>
        <button
          onClick={onApprove}
          className="glass-btn text-xs px-5 py-1.5 bg-cyan-500/30 border-cyan-400 text-white shadow-md shadow-cyan-500/20"
        >
          Authorize & Execute
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT REGISTRY DISPATCHER ---
export const ComponentRegistry: React.FC<{
  componentName: string;
  props: Record<string, any>;
}> = ({ componentName, props }) => {
  switch (componentName) {
    case 'ResearchResultsCard':
      return <ResearchResultsCard {...(props as any)} />;
    case 'AgentGraphVisualizer':
      return <AgentGraphVisualizer {...(props as any)} />;
    case 'CodeDiffCard':
      return <CodeDiffCard {...(props as any)} />;
    case 'ConfirmationDialog':
      return <ConfirmationDialog {...(props as any)} />;
    default:
      return null;
  }
};

import React, { useState, useEffect } from 'react';
import { Search, Terminal, AppWindow, Bot, Radio, Cpu, Shield, Sparkles, ArrowRight, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (intent: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onExecuteAction,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commandItems = [
    { id: 'c1', title: 'Open Visual Studio Code', category: 'App', action: () => onExecuteAction('Open VS Code'), icon: AppWindow },
    { id: 'c2', title: 'Check Windows System Health & Telemetry', category: 'System', action: () => onExecuteAction('Check system health'), icon: Cpu },
    { id: 'c3', title: 'Launch Autonomous Multi-Agent DAG Mission', category: 'Agent OS', action: () => onNavigateTab('agents'), icon: Bot },
    { id: 'c4', title: 'Switch to Live Voice Center & Waveform', category: 'Voice', action: () => onNavigateTab('voice'), icon: Radio },
    { id: 'c5', title: 'Scan Repository & Generate Adapter', category: 'Repo', action: () => onNavigateTab('apps'), icon: Terminal },
    { id: 'c6', title: 'Open Mission Control Cockpit', category: 'Missions', action: () => onNavigateTab('missions'), icon: Sparkles },
    { id: 'c7', title: 'View Delegation Guard Security Vault', category: 'Security', action: () => onNavigateTab('security'), icon: Shield },
  ];

  const filtered = commandItems.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === 'ArrowDown' && isOpen) {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
      }
      if (e.key === 'ArrowUp' && isOpen) {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      }
      if (e.key === 'Enter' && isOpen && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Glass Command Palette Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel p-4 shadow-2xl border border-white/10 z-10 space-y-3 animate-orb">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/40 border border-white/10">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="What would you like Akansha to do? (e.g. Open VS Code, Run mission...)"
            autoFocus
            className="flex-1 bg-transparent border-none text-white text-sm placeholder-slate-500 focus:outline-none font-sans"
          />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            ESC
          </span>
        </div>

        {/* Command Suggestions List */}
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">
              No matching commands. Press Enter to execute as custom intent.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                      : 'hover:bg-white/5 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-100">{item.title}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.category}</div>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Hints */}
        <div className="flex items-center justify-between px-3 pt-2 text-[11px] font-mono text-slate-500 border-t border-white/5">
          <span>Navigate: ↑ ↓</span>
          <span>Execute: ↵</span>
          <span>AKANSHA COMMAND OS</span>
        </div>
      </div>
    </div>
  );
};

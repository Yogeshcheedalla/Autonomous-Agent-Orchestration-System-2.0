import React, { useState, useEffect } from 'react';
import { Brain, Search, Plus, Sparkles, Database, Award, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/apiService';

export const MemoryCenter: React.FC = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newLayer, setNewLayer] = useState('long_term');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedLayer]);

  const loadData = async () => {
    try {
      const [memList, stratList] = await Promise.all([
        selectedLayer === 'all' ? apiService.getMemories() : apiService.getMemories(selectedLayer),
        apiService.getLearnedStrategies()
      ]);
      setMemories(memList);
      setStrategies(stratList);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    try {
      const results = await apiService.searchMemories(searchQuery);
      setMemories(results);
    } catch (err) {
      console.error('Memory search error:', err);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim()) return;

    try {
      const newEntry = await apiService.addMemory({
        layer: newLayer,
        key: newKey,
        content: newContent,
        confidence: 0.95
      });
      setMemories(prev => [newEntry, ...prev]);
      setStatusMsg(`Stored memory '${newKey}' in [${newLayer}].`);
      setNewKey('');
      setNewContent('');
    } catch (err: any) {
      setStatusMsg(`Storage error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* 7-Layer Cognitive Memory Hub */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Cognitive Memory & Personal Intelligence
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Persistent cross-session knowledge, semantic retrieval, and self-optimizing execution strategies.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Semantic query..."
              className="px-3.5 py-2 rounded-xl glass-input text-xs text-slate-200 placeholder-slate-500"
            />
            <button type="submit" className="glass-btn-primary p-2.5 rounded-xl">
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Layer Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs font-mono">
          {['all', 'working', 'conversation', 'task', 'project', 'long_term', 'semantic', 'learned_strategies'].map((l) => (
            <button
              key={l}
              onClick={() => setSelectedLayer(l)}
              className={`px-3 py-1.5 rounded-full transition-all text-[11px] ${
                selectedLayer === l
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'glass-btn-secondary border-transparent text-slate-400'
              }`}
            >
              {l.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Spatial Memory Clusters & Strategy Optimizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Spatial Memory Clusters */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Active Memory Clusters ({memories.length})
          </h3>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {memories.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-6 text-center">No memories found for this layer.</p>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl glass-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[9px] uppercase">
                        {m.layer}
                      </span>
                      <span className="font-semibold text-slate-100">{m.key}</span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500">
                      Confidence: {Math.round(m.confidence * 100)}%
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed font-sans">{m.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Strategy Optimizer & Knowledge Injection */}
        <div className="space-y-6">
          {/* Learned Strategies */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Strategy Optimizer
            </h3>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {strategies.map((s) => (
                <div key={s.id} className="p-3.5 rounded-2xl glass-card text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-100">
                    <span>{s.taskType}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">{Math.round(s.confidenceScore * 100)}% Win Rate</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 truncate">{s.successfulToolSequence.join(' → ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingest Knowledge */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Store Fact
            </h3>

            <form onSubmit={handleAddMemory} className="space-y-2.5 text-xs">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Memory identifier / key..."
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 text-xs font-mono"
              />
              <textarea
                rows={2}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Fact content..."
                className="w-full px-3 py-2 rounded-xl glass-input text-slate-200 text-xs"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl glass-btn-primary text-xs font-medium">
                Save Memory
              </button>
            </form>

            {statusMsg && (
              <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 p-2 rounded-xl border border-cyan-500/30">
                {statusMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

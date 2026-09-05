import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, Lock, Key } from 'lucide-react';
import { apiService, AuditEntry } from '../services/apiService';

export const DelegationGuard: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [vaultSecrets, setVaultSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditData, vaultData] = await Promise.all([
        apiService.getAuditLog(),
        apiService.getVaultSecrets()
      ]);
      setLogs(auditData);
      setVaultSecrets(vaultData);
    } catch (err) {
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH_RISK':
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'ELEVATED':
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Security Banner Header */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Delegation Guard & Security Vault
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full glass-pill text-purple-300">
                  Local Policy Enforced
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Multi-tier permission gates, Credential Vault isolation, and immutable audit logs.
              </p>
            </div>
          </div>

          <button onClick={loadData} className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 self-start md:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Audit
          </button>
        </div>

        {/* Security Policy Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl glass-card space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Policy Mode</div>
            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> SAFE_AUTONOMOUS
            </div>
            <div className="text-[11px] text-slate-400 font-light">Low risk read & observation verified automatically</div>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Elevated & High Risk</div>
            <div className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> GATE_CONFIRMATION
            </div>
            <div className="text-[11px] text-slate-400 font-light">Process termination & system changes require gate approval</div>
          </div>

          <div className="p-5 rounded-2xl glass-card space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Credential Vault</div>
            <div className="text-sm font-semibold text-cyan-300 flex items-center gap-1.5">
              <Key className="w-4 h-4" /> ZERO_LEAK_ISOLATION
            </div>
            <div className="text-[11px] text-slate-400 font-light">{vaultSecrets.length} Isolated API credentials registered</div>
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">
          Immutable Decision Audit Trail ({logs.length})
        </h3>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center">No decisions recorded in this session yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl glass-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${getRiskBadge(log.riskLevel)}`}>
                    {log.riskLevel}
                  </span>
                  <div>
                    <span className="text-slate-100 font-medium">{log.action}</span>
                    <span className="text-slate-500 mx-2">→</span>
                    <span className="text-cyan-300">"{log.target}"</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                  <span>{log.executedBy}</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

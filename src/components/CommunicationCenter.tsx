import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, ShieldAlert, CheckCircle2, Filter } from 'lucide-react';
import { apiService } from '../services/apiService';

export const CommunicationCenter: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [draftPlatform, setDraftPlatform] = useState<string>('slack');
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inbox, draftList] = await Promise.all([
        apiService.getSocialInbox(),
        apiService.getDrafts()
      ]);
      setMessages(inbox);
      setDrafts(draftList);
    } catch (err) {
      console.error('Failed to load communications:', err);
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !content.trim()) return;

    try {
      const newDraft = await apiService.createDraft({
        platform: draftPlatform,
        recipient,
        content
      });
      setDrafts(prev => [newDraft, ...prev]);
      setStatusMsg(`Draft created (${newDraft.requiresApproval ? 'Gate Approval Required' : 'Ready'}).`);
      setRecipient('');
      setContent('');
    } catch (err: any) {
      setStatusMsg(`Draft error: ${err.message}`);
    }
  };

  const handleApproveSend = async (draftId: string) => {
    try {
      const res = await apiService.sendApprovedDraft(draftId);
      setStatusMsg(res.message);
      loadData();
    } catch (err: any) {
      setStatusMsg(`Send failed: ${err.message}`);
    }
  };

  const filteredMessages = selectedPlatform === 'all'
    ? messages
    : messages.filter(m => m.platform === selectedPlatform);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Header & Platform Filter */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Social & Unified Communications Hub
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Aggregated incoming feeds across WhatsApp, Telegram, Discord, Slack, X, and Gmail.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {['all', 'discord', 'slack', 'whatsapp', 'x', 'gmail'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`px-3 py-1.5 rounded-full uppercase text-[10px] transition-all ${
                  selectedPlatform === p
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'glass-btn-secondary border-transparent text-slate-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Feed & Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Feed */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            Unified Inbox ({filteredMessages.length})
          </h3>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="p-4 rounded-2xl glass-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full glass-pill uppercase text-cyan-300">
                      {msg.platform}
                    </span>
                    <span className="text-xs font-semibold text-slate-100">{msg.sender}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    {msg.urgency === 'HIGH' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        URGENT
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-light leading-relaxed font-sans">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Outgoing Composer & Approval Queue */}
        <div className="space-y-6">
          {/* Composer */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              Compose Message
            </h3>

            <form onSubmit={handleCreateDraft} className="space-y-2.5 text-xs">
              <select
                value={draftPlatform}
                onChange={(e) => setDraftPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl glass-input text-slate-200 font-mono text-xs"
              >
                <option value="slack">Slack</option>
                <option value="discord">Discord</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="x">X (Public Post)</option>
                <option value="gmail">Gmail Email</option>
              </select>

              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Recipient / Channel..."
                className="w-full p-2.5 rounded-xl glass-input text-slate-200 text-xs"
              />

              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Message body..."
                className="w-full p-2.5 rounded-xl glass-input text-slate-200 text-xs"
              />

              <button type="submit" className="w-full py-2.5 rounded-xl glass-btn-primary text-xs font-medium">
                Create Protected Draft
              </button>
            </form>

            {statusMsg && (
              <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 p-2 rounded-xl border border-cyan-500/30">
                {statusMsg}
              </div>
            )}
          </div>

          {/* Outgoing Approval Queue */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Approval Queue ({drafts.length})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {drafts.map((d) => (
                <div key={d.id} className="p-3 rounded-2xl glass-card text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-300 uppercase">{d.platform} → {d.recipient}</span>
                    <span className={d.status === 'sent' ? 'text-emerald-400' : 'text-amber-400'}>{d.status}</span>
                  </div>
                  <p className="text-slate-300 font-light italic">"{d.content}"</p>
                  {d.status !== 'sent' && (
                    <button
                      onClick={() => handleApproveSend(d.id)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-medium"
                    >
                      Approve & Dispatch
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

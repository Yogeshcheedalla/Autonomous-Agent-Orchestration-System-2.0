import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, RefreshCw, Zap, Cpu, Send, CheckCircle2, MessageSquare, Activity, Monitor, Layers, Clock, ShieldCheck } from 'lucide-react';
import { audioEngine, VoiceState } from '../services/audioEngine';
import { WaveformVisualizer } from './WaveformVisualizer';
import { AkanshaAvatar } from './AkanshaAvatar';
import { apiService } from '../services/apiService';

interface LogItem {
  id: string;
  sender: 'user' | 'akansha';
  text: string;
  time: string;
  intent?: string;
  metrics?: {
    intentLatencyMs?: number;
    toolLatencyMs?: number;
    verificationLatencyMs?: number;
    totalLatencyMs?: number;
  };
  steps?: Array<{
    id: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }>;
}

export const VoiceCenter: React.FC = () => {
  const [micActive, setMicActive] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [partialTranscript, setPartialTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [responseLog, setResponseLog] = useState<LogItem[]>([
    {
      id: 'init-0',
      sender: 'akansha',
      text: 'Hello. I am Akansha, your Windows AI Operating Layer. Utterance pipeline, deterministic fast paths, and single female voice are active.',
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [providers, setProviders] = useState<any[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>('qwen-audio');

  // Truthful subsystem health states
  const [uiTarsStatus, setUiTarsStatus] = useState<{ available: boolean; provider: string; details?: string }>({
    available: false,
    provider: 'Native Win32 / PowerShell'
  });
  const [odysseusStatus, setOdysseusStatus] = useState<{ connected: boolean; status: string; models: string[] }>({
    connected: false,
    status: 'OFFLINE',
    models: []
  });

  useEffect(() => {
    audioEngine.onStateChange = (state) => setVoiceState(state);
    audioEngine.onPartialTranscript = (text) => setPartialTranscript(text);
    
    audioEngine.onFinalTranscript = (text, utteranceId) => {
      setFinalTranscript(text);
      setPartialTranscript('');
      const uId = utteranceId || 'utt-' + Date.now();
      
      setResponseLog(prev => {
        // Prevent duplicate addition of the same user utteranceId
        if (prev.some(item => item.id === uId)) return prev;
        return [{
          id: uId,
          sender: 'user',
          text,
          time: new Date().toLocaleTimeString()
        }, ...prev];
      });
    };

    audioEngine.onSpokenResponse = (text, mission, utteranceId) => {
      const respId = utteranceId ? `resp-${utteranceId}` : 'resp-' + Date.now();
      setResponseLog(prev => {
        if (prev.some(item => item.id === respId)) return prev;
        return [{
          id: respId,
          sender: 'akansha',
          text,
          time: new Date().toLocaleTimeString(),
          intent: mission?.intent,
          metrics: mission?.metrics,
          steps: mission?.steps
        }, ...prev];
      });
    };

    loadProviders();
    loadSubsystemHealth();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await apiService.getVoiceProviders();
      setProviders(data.providers || []);
      if (data.activeProvider) setActiveProvider(data.activeProvider.id);
    } catch (err) {
      console.error('Failed to load voice providers:', err);
    }
  };

  const loadSubsystemHealth = async () => {
    try {
      const [tars, ody] = await Promise.allSettled([
        apiService.getUITarsStatus(),
        apiService.getOdysseusHealth()
      ]);
      if (tars.status === 'fulfilled') {
        setUiTarsStatus(tars.value);
      }
      if (ody.status === 'fulfilled') {
        setOdysseusStatus(ody.value);
      }
    } catch (e) {
      console.warn('Subsystem health check error:', e);
    }
  };

  const toggleMicrophone = async () => {
    if (micActive) {
      audioEngine.stopMicrophone();
      setMicActive(false);
      setVoiceState('IDLE');
    } else {
      const success = await audioEngine.startMicrophone();
      if (success) {
        setMicActive(true);
        setVoiceState('LISTENING');
      } else {
        alert('Could not access microphone. Please check browser microphone permissions or use the command bar below.');
      }
    }
  };

  const handleProviderChange = async (providerId: string) => {
    try {
      await apiService.selectVoiceProvider(providerId);
      setActiveProvider(providerId);
      audioEngine.setProvider(providerId);
    } catch (err) {
      console.error('Error switching provider:', err);
    }
  };

  const handleTestBargeIn = () => {
    audioEngine.speak("I am currently executing an automation plan. You can interrupt me at any moment by speaking or pressing interrupt.");
  };

  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput.trim();
    audioEngine.submitTextCommand(text);
    setManualInput('');
  };

  const quickCommands = [
    "Open Notepad and write Akansha is operational",
    "Can you open YouTube?",
    "what I said to you",
    "What time is it in India?",
    "Open Calculator",
    "Check CPU and system telemetry"
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Central Holographic Presence & Audio Wave Section */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center space-y-4 shadow-2xl border border-white/15">
        {/* Holographic Avatar Orb */}
        <AkanshaAvatar state={voiceState} />

        {/* Realtime Organic Audio Waveform */}
        <div className="w-full max-w-xl">
          <WaveformVisualizer isActive={micActive} voiceState={voiceState} />
        </div>

        {/* Circular Floating Glass Microphone Controller */}
        <div className="flex flex-col items-center space-y-3 pt-2">
          <div className="mic-btn-container">
            {/* Outer Glowing Energy Halo */}
            {micActive && (
              <div className="absolute inset-0 rounded-full bg-rose-500/30 blur-xl animate-ping pointer-events-none" />
            )}
            
            <button
              onClick={toggleMicrophone}
              className={micActive ? 'mic-btn-active' : 'mic-btn-idle'}
              title={micActive ? 'Click to Stop Microphone' : 'Click to Enable Microphone'}
            >
              {micActive ? <MicOff className="w-8 h-8 drop-shadow-md" /> : <Mic className="w-8 h-8 drop-shadow-md" />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950/80 border border-white/10 shadow-inner">
            <span className={`w-2 h-2 rounded-full ${micActive ? 'bg-rose-400 animate-ping shadow-sm shadow-rose-400' : 'bg-emerald-400'}`} />
            <span className="text-xs font-mono text-slate-200 tracking-wider font-semibold">
              {micActive ? 'LIVE LISTENING (Utterance Boundary Active)' : 'Microphone Ready (Click to speak)'}
            </span>
          </div>
        </div>

        {/* Quick Voice Command Input Bar */}
        <form onSubmit={handleSendManual} className="w-full max-w-xl flex items-center pt-2">
          <div className="glass-input-wrapper w-full">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Type a voice command / prompt (e.g. 'Open Notepad and write hello')..."
              className="glass-input-field"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="glass-btn-primary disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </form>

        {/* Quick Command Suggestions Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {quickCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => {
                audioEngine.submitTextCommand(cmd);
              }}
              className="glass-chip"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>"{cmd}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subsystem Truthful Health Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Computer Use Layer */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Computer Use</div>
              <div className="text-[10px] text-slate-400">{uiTarsStatus.provider}</div>
            </div>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
            uiTarsStatus.available
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              : 'bg-indigo-950/60 text-cyan-300 border-cyan-500/40'
          }`}>
            {uiTarsStatus.available ? 'UI-TARS Ready' : 'Win32 Native'}
          </span>
        </div>

        {/* Odysseus Local Layer */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Odysseus AI</div>
              <div className="text-[10px] text-slate-400">{odysseusStatus.connected ? 'Connected' : 'Workspace / Local'}</div>
            </div>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
            odysseusStatus.connected
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900/60 text-slate-400 border-slate-700/50'
          }`}>
            {odysseusStatus.connected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Voice Pipeline & Speaker Lock */}
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-xs font-semibold text-slate-200">TTS Audio Lock</div>
              <div className="text-[10px] text-slate-400">Single Female Voice</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ENFORCED
          </span>
        </div>
      </div>

      {/* Two Column Layout: Conversational Feed & Voice Engine Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Conversational Transcript Stream */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Conversation Stream
            </h3>
            <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Deduplicated Pipeline
            </span>
          </div>

          {/* Realtime Spoken Transcript Bubble */}
          {(partialTranscript || finalTranscript) && (
            <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-100 text-sm shadow-lg shadow-cyan-500/10">
              <div className="text-[10px] font-mono text-cyan-400 mb-1 uppercase font-bold tracking-wider">Live Stream</div>
              <p className="italic font-medium">"{partialTranscript || finalTranscript}"</p>
            </div>
          )}

          {/* History Messages Feed */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {responseLog.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl text-sm transition-all duration-200 ${
                  msg.sender === 'user'
                    ? 'ml-10 bg-indigo-950/60 border border-indigo-500/40 text-indigo-100 shadow-md shadow-indigo-950/50'
                    : 'mr-10 bg-slate-900/60 border border-white/15 text-slate-100 shadow-md shadow-black/40'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={msg.sender === 'user' ? 'text-indigo-300 font-bold' : 'text-cyan-300 font-bold'}>
                      {msg.sender === 'user' ? 'YOU' : 'AKANSHA'}
                    </span>
                    {msg.intent && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-semibold">
                        {msg.intent}
                      </span>
                    )}
                  </div>
                  <span>{msg.time}</span>
                </div>

                <p className="leading-relaxed font-sans">{msg.text}</p>

                {/* Multi-step execution breakdown */}
                {msg.steps && msg.steps.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
                    <div className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      Execution Steps ({msg.steps.length}):
                    </div>
                    {msg.steps.map((step) => (
                      <div key={step.id} className="text-xs text-slate-300 flex items-center gap-2 pl-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{step.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Telemetry latency metrics */}
                {msg.metrics && msg.metrics.totalLatencyMs !== undefined && (
                  <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      Total: <strong className="text-emerald-400">{msg.metrics.totalLatencyMs}ms</strong>
                    </span>
                    {msg.metrics.intentLatencyMs !== undefined && (
                      <span>Intent: <strong className="text-cyan-400">{msg.metrics.intentLatencyMs}ms</strong></span>
                    )}
                    {msg.metrics.toolLatencyMs !== undefined && (
                      <span>Tool: <strong className="text-amber-400">{msg.metrics.toolLatencyMs}ms</strong></span>
                    )}
                    {msg.metrics.verificationLatencyMs !== undefined && (
                      <span>Verify: <strong className="text-purple-400">{msg.metrics.verificationLatencyMs}ms</strong></span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Engine Selector & Barge-In */}
        <div className="space-y-6">
          {/* Voice Engine Selector */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Voice Engine
              </h3>
              <button 
                onClick={() => { loadProviders(); loadSubsystemHealth(); }} 
                className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                title="Refresh voice providers & health"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {providers.map((p) => {
                const isSelected = p.id === activeProvider;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`provider-card ${isSelected ? 'active' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-100">{p.name}</div>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-light leading-snug">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barge-In Interruption & Voice Output Test */}
          <div className="glass-panel p-6 rounded-2xl space-y-3.5 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Single Voice & Barge-In
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 font-medium">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Enforces a single female TTS audio channel. Speak into the mic or click Interrupt to immediately silence audio output.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleTestBargeIn}
                className="flex-1 py-2.5 px-4 rounded-full glass-btn-secondary text-xs flex items-center justify-center gap-1.5 font-semibold"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Voice</span>
              </button>
              <button
                onClick={() => audioEngine.cancelSpeech()}
                className="py-2.5 px-4 rounded-full bg-gradient-to-r from-amber-600/30 to-rose-600/30 text-amber-200 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/40 transition-all cursor-pointer shadow-md shadow-amber-950/40 active:scale-95"
              >
                Interrupt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sparkles, Radio, Brain, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { VoiceState } from '../services/audioEngine';

interface AkanshaAvatarProps {
  state: VoiceState;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AkanshaAvatar: React.FC<AkanshaAvatarProps> = ({ state, subtext, size = 'lg' }) => {
  // Determine state-specific atmospheric colors and glows
  const getStateConfig = () => {
    switch (state) {
      case 'SPEAKING':
        return {
          glow: 'rgba(16, 185, 129, 0.45)',
          border: 'rgba(16, 185, 129, 0.5)',
          gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
          label: 'Speaking to you',
          icon: Radio
        };
      case 'LISTENING':
        return {
          glow: 'rgba(168, 85, 247, 0.55)',
          border: 'rgba(168, 85, 247, 0.6)',
          gradient: 'from-purple-400 via-indigo-500 to-cyan-500',
          label: 'Listening attentively',
          icon: Sparkles
        };
      case 'THINKING':
      case 'UNDERSTANDING':
      case 'PLANNING':
        return {
          glow: 'rgba(56, 189, 248, 0.5)',
          border: 'rgba(56, 189, 248, 0.6)',
          gradient: 'from-cyan-400 via-indigo-600 to-blue-500',
          label: 'Synthesizing neural plan',
          icon: Brain
        };
      case 'EXECUTING':
        return {
          glow: 'rgba(99, 102, 241, 0.55)',
          border: 'rgba(99, 102, 241, 0.6)',
          gradient: 'from-indigo-400 via-cyan-500 to-teal-400',
          label: 'Executing across Windows control plane',
          icon: Zap
        };
      case 'INTERRUPTED':
        return {
          glow: 'rgba(245, 158, 11, 0.6)',
          border: 'rgba(245, 158, 11, 0.7)',
          gradient: 'from-amber-400 via-orange-500 to-rose-500',
          label: 'Interrupted (Barge-in active)',
          icon: AlertTriangle
        };
      case 'VERIFYING':
        return {
          glow: 'rgba(16, 185, 129, 0.4)',
          border: 'rgba(16, 185, 129, 0.5)',
          gradient: 'from-teal-400 to-emerald-500',
          label: 'Verifying outcome',
          icon: ShieldCheck
        };
      default:
        return {
          glow: 'rgba(56, 189, 248, 0.25)',
          border: 'rgba(255, 255, 255, 0.15)',
          gradient: 'from-cyan-500 via-indigo-600 to-purple-600',
          label: 'Standing by',
          icon: Sparkles
        };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  const orbDimensions = size === 'lg' ? 'w-36 h-36' : size === 'md' ? 'w-24 h-24' : 'w-16 h-16';

  return (
    <div className="flex flex-col items-center justify-center relative py-6">
      {/* Outer Acoustic Ripple Rings (When Listening or Speaking) */}
      {(state === 'LISTENING' || state === 'SPEAKING') && (
        <>
          <div
            className="absolute rounded-full pointer-events-none animate-ripple"
            style={{
              width: size === 'lg' ? '220px' : '150px',
              height: size === 'lg' ? '220px' : '150px',
              border: `1.5px solid ${config.border}`,
              boxShadow: `0 0 35px ${config.glow}`
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none animate-ripple"
            style={{
              width: size === 'lg' ? '260px' : '180px',
              height: size === 'lg' ? '260px' : '180px',
              border: `1px solid ${config.border}`,
              animationDelay: '0.8s'
            }}
          />
        </>
      )}

      {/* Holographic Core Avatar Orb */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Blurred Backlight */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-70 transition-all duration-700"
          style={{ background: config.glow, transform: 'scale(1.3)' }}
        />

        {/* Outer Glass Ring */}
        <div
          className={`${orbDimensions} rounded-full p-1.5 backdrop-blur-2xl transition-all duration-500 relative flex items-center justify-center animate-orb`}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1.5px solid ${config.border}`,
            boxShadow: `0 0 50px ${config.glow}, inset 0 0 20px rgba(255, 255, 255, 0.15)`
          }}
        >
          {/* Internal Glowing Gradient Sphere */}
          <div
            className={`w-full h-full rounded-full bg-gradient-to-tr ${config.gradient} flex items-center justify-center shadow-inner opacity-90 transition-all duration-500`}
          >
            <Icon className="w-10 h-10 text-white drop-shadow-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Presence Text Hierarchy */}
      <div className="text-center mt-5 space-y-1 z-10">
        <h3 className="text-xl font-semibold tracking-tight text-white flex items-center justify-center gap-2">
          AKANSHA
          <span className="text-[10px] font-mono font-normal px-2.5 py-0.5 rounded-full glass-pill text-cyan-300">
            {state}
          </span>
        </h3>
        <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
          {subtext || config.label}
        </p>
      </div>
    </div>
  );
};

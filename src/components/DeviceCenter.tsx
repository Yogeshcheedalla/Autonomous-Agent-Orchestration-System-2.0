import React, { useState, useEffect } from 'react';
import { Smartphone, Volume2, VolumeX, Monitor, Bluetooth, Camera, RefreshCw, CheckCircle2, Sliders } from 'lucide-react';
import { apiService } from '../services/apiService';

export const DeviceCenter: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const list = await apiService.getDevices();
      setDevices(list);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceAction = async (deviceId: string, action: string, value?: any) => {
    try {
      const res = await apiService.executeDeviceAction(deviceId, action, value);
      setStatusMsg(res.message);
      loadDevices();
    } catch (err: any) {
      setStatusMsg(`Action failed: ${err.message}`);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'audio_output':
      case 'audio_input':
        return <Volume2 className="w-5 h-5 text-cyan-400" />;
      case 'display':
        return <Monitor className="w-5 h-5 text-indigo-400" />;
      case 'bluetooth':
        return <Bluetooth className="w-5 h-5 text-purple-400" />;
      case 'camera':
        return <Camera className="w-5 h-5 text-emerald-400" />;
      default:
        return <Smartphone className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Device Hub Header */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Connected Hardware Plane
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Live discovery across Windows audio endpoints, displays, Bluetooth peripherals, and cameras.
            </p>
          </div>

          <button onClick={loadDevices} className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 self-start md:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Scan PnP Bus
          </button>
        </div>

        {/* Devices Topology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-3xl glass-card space-y-3.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                    {getCategoryIcon(d.category)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100 line-clamp-1">{d.name}</h4>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{d.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  {d.status}
                </span>
              </div>

              {/* Properties */}
              {d.properties && (
                <div className="text-[11px] font-mono text-slate-400 bg-black/40 p-3 rounded-2xl border border-white/5 space-y-1">
                  {d.properties.resolution && <div>Resolution: {d.properties.resolution}</div>}
                  {d.batteryLevel && <div className="text-emerald-400">Battery: {d.batteryLevel}%</div>}
                  {d.properties.volume !== undefined && (
                    <div className="flex items-center justify-between pt-1">
                      <span>Volume: {d.properties.volume}%</span>
                      <button
                        onClick={() => handleDeviceAction(d.id, 'toggle_mute')}
                        className="p-1 rounded bg-white/10 text-slate-300"
                      >
                        {d.properties.isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {statusMsg && (
          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 p-3 rounded-2xl border border-cyan-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

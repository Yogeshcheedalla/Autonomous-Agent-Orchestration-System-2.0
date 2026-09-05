import React, { useState, useEffect } from 'react';
import { Eye, Camera, Crosshair, MousePointer, Type, Sparkles, Monitor, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/apiService';

export const VisionCenter: React.FC = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [textToType, setTextToType] = useState('');
  const [actionStatus, setActionStatus] = useState<string>('');

  useEffect(() => {
    handleTakeScreenshot();
  }, []);

  const handleTakeScreenshot = async () => {
    setLoading(true);
    setActionStatus('Capturing desktop frame...');
    try {
      const res = await apiService.captureScreenshot();
      if (res.success && res.base64Image) {
        setScreenshot(res.base64Image);
        setMetrics(res.metrics);
        setActionStatus(`Frame verified: ${res.metrics?.width}x${res.metrics?.height} px`);
      } else {
        setActionStatus(`Capture failed: ${res.error}`);
      }
    } catch (err: any) {
      setActionStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = (metrics?.width || 1920) / rect.width;
    const scaleY = (metrics?.height || 1080) / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    setCoords({ x: clickX, y: clickY });
  };

  const handleExecuteClick = async (type: 'click' | 'right_click' | 'double_click') => {
    if (!coords) return;
    setActionStatus(`Executing ${type} at (${coords.x}, ${coords.y})...`);
    try {
      const res = await apiService.executeVisualAction({
        action: type,
        x: coords.x,
        y: coords.y
      });
      setActionStatus(res.message);
      if (res.afterScreenshot) setScreenshot(res.afterScreenshot);
    } catch (err: any) {
      setActionStatus(`Action failed: ${err.message}`);
    }
  };

  const handleExecuteType = async () => {
    if (!textToType) return;
    setActionStatus(`Typing text into active window...`);
    try {
      const res = await apiService.executeVisualAction({
        action: 'type',
        text: textToType
      });
      setActionStatus(res.message);
      setTextToType('');
      if (res.afterScreenshot) setScreenshot(res.afterScreenshot);
    } catch (err: any) {
      setActionStatus(`Typing failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Vision Header */}
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              Vision & Computer Use Center
            </h2>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Pixel-accurate screen capture, visual UI element targeting, and closed-loop computer use verification.
            </p>
          </div>

          <button
            onClick={handleTakeScreenshot}
            disabled={loading}
            className="glass-btn-primary px-5 py-2.5 rounded-2xl text-xs font-medium flex items-center gap-2 disabled:opacity-40"
          >
            <Camera className="w-4 h-4" />
            {loading ? 'Capturing...' : 'Capture Snapshot'}
          </button>
        </div>
      </div>

      {/* Screen Mirror & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screen Frame (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <Monitor className="w-4 h-4" /> Frame ({metrics ? `${metrics.width}x${metrics.height}` : 'Standby'})
            </span>
            <span>Click image to select target coordinate</span>
          </div>

          <div className="relative rounded-2xl border border-white/5 bg-black/60 overflow-hidden min-h-[340px] flex items-center justify-center">
            {screenshot ? (
              <div className="relative w-full cursor-crosshair">
                <img
                  src={screenshot}
                  alt="Desktop Screen"
                  onClick={handleImageClick}
                  className="w-full h-auto object-contain block max-h-[480px]"
                />
                {coords && (
                  <div
                    className="absolute w-6 h-6 -ml-3 -mt-3 pointer-events-none rounded-full border-2 border-cyan-400 bg-cyan-500/30 animate-ping"
                    style={{
                      left: `${(coords.x / (metrics?.width || 1920)) * 100}%`,
                      top: `${(coords.y / (metrics?.height || 1080)) * 100}%`
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-xs flex items-center gap-2">
                <Camera className="w-4 h-4 animate-pulse" /> No screen frame captured yet.
              </div>
            )}
          </div>

          {actionStatus && (
            <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 p-3 rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{actionStatus}</span>
            </div>
          )}
        </div>

        {/* Targeting & Typing Controls (1 col) */}
        <div className="space-y-6">
          {/* Coordinates Box */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              Target Coordinate
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-500">X:</span>
                <div className="text-sm font-bold text-cyan-300">{coords ? `${coords.x}px` : '---'}</div>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-slate-500">Y:</span>
                <div className="text-sm font-bold text-cyan-300">{coords ? `${coords.y}px` : '---'}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleExecuteClick('click')}
                disabled={!coords}
                className="py-2.5 rounded-xl glass-btn-secondary text-xs disabled:opacity-40"
              >
                Click
              </button>
              <button
                onClick={() => handleExecuteClick('double_click')}
                disabled={!coords}
                className="py-2.5 rounded-xl glass-btn-secondary text-xs disabled:opacity-40"
              >
                Double
              </button>
              <button
                onClick={() => handleExecuteClick('right_click')}
                disabled={!coords}
                className="py-2.5 rounded-xl glass-btn-secondary text-xs disabled:opacity-40"
              >
                Right
              </button>
            </div>
          </div>

          {/* Typing Tool */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Type className="w-4 h-4 text-emerald-400" />
              Keyboard Keystroke Dispatch
            </h3>

            <input
              type="text"
              value={textToType}
              onChange={(e) => setTextToType(e.target.value)}
              placeholder="Text to type..."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-200"
            />
            <button
              onClick={handleExecuteType}
              disabled={!textToType.trim()}
              className="w-full py-2.5 rounded-xl glass-btn-primary text-xs font-medium disabled:opacity-40"
            >
              Send Keystrokes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

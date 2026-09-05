import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface WaveformVisualizerProps {
  isActive: boolean;
  voiceState: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isActive, voiceState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const freqData = audioEngine.getFrequencyData();
      const timeData = audioEngine.getTimeDomainData();

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Determine glowing color theme based on voice state
      let strokeColor1 = 'rgba(56, 189, 248, 0.85)';
      let strokeColor2 = 'rgba(168, 85, 247, 0.7)';
      let glowColor = 'rgba(56, 189, 248, 0.4)';

      if (voiceState === 'SPEAKING') {
        strokeColor1 = 'rgba(52, 211, 153, 0.9)';
        strokeColor2 = 'rgba(6, 182, 212, 0.8)';
        glowColor = 'rgba(52, 211, 153, 0.5)';
      } else if (voiceState === 'INTERRUPTED') {
        strokeColor1 = 'rgba(251, 191, 36, 0.9)';
        strokeColor2 = 'rgba(244, 63, 94, 0.8)';
        glowColor = 'rgba(251, 191, 36, 0.5)';
      } else if (voiceState === 'LISTENING') {
        strokeColor1 = 'rgba(192, 132, 252, 0.9)';
        strokeColor2 = 'rgba(56, 189, 248, 0.8)';
        glowColor = 'rgba(192, 132, 252, 0.5)';
      }

      // Draw primary organic smooth audio ribbon using Bezier curve interpolation
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.2, strokeColor1);
      gradient.addColorStop(0.8, strokeColor2);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 18;
      ctx.shadowColor = glowColor;

      const points: Array<{ x: number; y: number }> = [];
      const step = Math.max(1, Math.floor(timeData.length / 48));

      for (let i = 0; i < timeData.length; i += step) {
        let v = timeData[i] / 128.0;
        
        if (!isActive) {
          // Idle gentle breathing sine wave
          const t = Date.now() / 900;
          v = 1.0 + 0.035 * Math.sin(t + i * 0.08);
        }

        const x = (i / (timeData.length - 1)) * width;
        const y = centerY + (v - 1.0) * (height * 0.65);
        points.push({ x, y });
      }

      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 2; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        if (points.length > 2) {
          ctx.quadraticCurveTo(
            points[points.length - 2].x,
            points[points.length - 2].y,
            points[points.length - 1].x,
            points[points.length - 1].y
          );
        }
      }
      ctx.stroke();

      // Secondary subtle harmonic wave for depth
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.shadowBlur = 0;

      for (let i = 0; i < points.length; i++) {
        const offset = Math.sin((Date.now() / 600) + i) * 6;
        const x = points[i].x;
        const y = points[i].y + offset;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isActive, voiceState]);

  return (
    <div className="relative w-full h-24 flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={750}
        height={90}
        className="w-full h-full block"
      />
    </div>
  );
};

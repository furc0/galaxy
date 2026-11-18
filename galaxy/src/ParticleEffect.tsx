import React, { useEffect, useRef } from 'react';
import { Position, Theme } from './types';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string;
}

interface ParticleEffectProps {
  cells: Position[];
  colors: string[];
  gridSize: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

// Single-canvas particle system: cheap on GC, smooth on mid-range phones.
export const ParticleEffect: React.FC<ParticleEffectProps> = ({ cells, colors, gridSize, canvasRef }) => {
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (cells.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cw = rect.width / gridSize;
    const ch = rect.height / gridSize;
    const list = particlesRef.current;

    for (const cell of cells) {
      const cx = cell.col * cw + cw / 2;
      const cy = cell.row * ch + ch / 2;
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 70;
        list.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 30,
          life: 0, maxLife: 0.5 + Math.random() * 0.4,
          size: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }
    // Cap total particles for perf
    if (list.length > 400) list.splice(0, list.length - 400);

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, rect.width, rect.height);
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life += dt;
        if (p.life >= p.maxLife) { list.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 160 * dt;
        const t = 1 - p.life / p.maxLife;
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        const s = p.size * t;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (list.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cells, colors, gridSize, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
    />
  );
};

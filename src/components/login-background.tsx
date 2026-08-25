'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  depth: number;
  life: number;
  maxLife: number;
}

interface DataLine {
  points: { x: number; y: number }[];
  color: string;
  opacity: number;
  speed: number;
  offset: number;
  amplitude: number;
}

interface Ring {
  radius: number;
  opacity: number;
  rotation: number;
  speed: number;
  pulsePhase: number;
}

export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const dataLinesRef = useRef<DataLine[]>([]);
  const ringsRef = useRef<Ring[]>([]);
  const lightSweepRef = useRef(0);
  const lightSweepActiveRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    const count = reducedMotionRef.current ? 30 : 120;
    for (let i = 0; i < count; i++) {
      const isBlue = Math.random() > 0.4;
      const isGold = !isBlue && Math.random() > 0.5;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.25,
        color: isBlue ? '#3b82f6' : isGold ? '#c9a84c' : '#ffffff',
        depth: Math.random(),
        life: 0,
        maxLife: 200 + Math.random() * 300,
      });
    }
    particlesRef.current = particles;
  }, []);

  const initDataLines = useCallback((w: number, h: number) => {
    const lines: DataLine[] = [];
    const count = reducedMotionRef.current ? 15 : 40;
    for (let i = 0; i < count; i++) {
      const isLeft = Math.random() > 0.5;
      const y = Math.random() * h;
      const points: { x: number; y: number }[] = [];
      const segments = 8 + Math.floor(Math.random() * 6);
      for (let s = 0; s <= segments; s++) {
        points.push({
          x: isLeft ? (s / segments) * w * 0.6 : w - ((s / segments) * w * 0.6),
          y: y + (Math.random() - 0.5) * h * 0.3,
        });
      }
      lines.push({
        points,
        color: isLeft ? '#3b82f6' : '#c9a84c',
        opacity: 0.03 + Math.random() * 0.06,
        speed: 0.0005 + Math.random() * 0.001,
        offset: Math.random() * Math.PI * 2,
        amplitude: 20 + Math.random() * 60,
      });
    }
    dataLinesRef.current = lines;
  }, []);

  const initRings = useCallback(() => {
    const rings: Ring[] = [];
    for (let i = 0; i < 5; i++) {
      rings.push({
        radius: 120 + i * 35,
        opacity: 0.04 + (5 - i) * 0.015,
        rotation: Math.random() * Math.PI * 2,
        speed: (0.0003 + Math.random() * 0.0004) * (i % 2 === 0 ? 1 : -1),
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    ringsRef.current = rings;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(window.innerWidth, window.innerHeight);
      initDataLines(window.innerWidth, window.innerHeight);
    };

    resize();
    initRings();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMouse);

    // Light sweep timer
    const sweepInterval = setInterval(() => {
      if (!reducedMotionRef.current) {
        lightSweepActiveRef.current = true;
        lightSweepRef.current = 0;
      }
    }, 10000 + Math.random() * 4000);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = timeRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // ── Base gradient ──
      const baseGrad = ctx.createLinearGradient(0, 0, w, h);
      baseGrad.addColorStop(0, '#060b14');
      baseGrad.addColorStop(0.5, '#080d18');
      baseGrad.addColorStop(1, '#0a1020');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // ── Ambient blue glow (left, breathing) ──
      const blueBreath = 0.28 + Math.sin(t * 0.00015) * 0.1;
      const blueGrad = ctx.createRadialGradient(
        w * 0.15 + (mouse.x - 0.5) * 30,
        h * 0.45 + (mouse.y - 0.5) * 20,
        0,
        w * 0.15 + (mouse.x - 0.5) * 30,
        h * 0.45 + (mouse.y - 0.5) * 20,
        w * 0.5
      );
      blueGrad.addColorStop(0, `rgba(59,130,246,${blueBreath})`);
      blueGrad.addColorStop(0.4, `rgba(59,130,246,${blueBreath * 0.3})`);
      blueGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = blueGrad;
      ctx.fillRect(0, 0, w, h);

      // ── Ambient gold glow (right, breathing) ──
      const goldBreath = 0.18 + Math.sin(t * 0.00012 + 2) * 0.08;
      const goldGrad = ctx.createRadialGradient(
        w * 0.85 + (mouse.x - 0.5) * 20,
        h * 0.55 + (mouse.y - 0.5) * 15,
        0,
        w * 0.85 + (mouse.x - 0.5) * 20,
        h * 0.55 + (mouse.y - 0.5) * 15,
        w * 0.45
      );
      goldGrad.addColorStop(0, `rgba(201,168,76,${goldBreath})`);
      goldGrad.addColorStop(0.4, `rgba(201,168,76,${goldBreath * 0.25})`);
      goldGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, 0, w, h);

      // ── Data-flow lines ──
      if (!reducedMotionRef.current) {
        dataLinesRef.current.forEach((line) => {
          ctx.beginPath();
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 0.5;
          ctx.globalAlpha = line.opacity * (0.7 + Math.sin(t * line.speed + line.offset) * 0.3);

          for (let i = 0; i < line.points.length - 1; i++) {
            const p1 = line.points[i];
            const p2 = line.points[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 + Math.sin(t * 0.0002 + line.offset + i) * line.amplitude;

            if (i === 0) ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }

      // ── Radial rings (around left cube area) ──
      const cubeX = w * 0.22 + (mouse.x - 0.5) * 7;
      const cubeY = h * 0.52 + (mouse.y - 0.5) * 5;

      ringsRef.current.forEach((ring) => {
        ring.rotation += ring.speed;
        const pulse = 0.6 + Math.sin(t * 0.0002 + ring.pulsePhase) * 0.4;
        ctx.beginPath();
        ctx.ellipse(
          cubeX,
          cubeY,
          ring.radius * pulse,
          ring.radius * pulse * 0.35,
          ring.rotation,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(59,130,246,${ring.opacity * pulse})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Traveling light on ring
        const travelAngle = t * 0.0003 + ring.pulsePhase;
        const tx = cubeX + Math.cos(travelAngle) * ring.radius * pulse;
        const ty = cubeY + Math.sin(travelAngle) * ring.radius * pulse * 0.35;
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${ring.opacity * pulse * 2})`;
        ctx.fill();
      });

      // ── Particles ──
      particlesRef.current.forEach((p) => {
        p.x += p.vx * (1 + p.depth);
        p.y += p.vy * (1 + p.depth);
        p.life++;

        // Mouse parallax
        p.x += (mouse.x - 0.5) * p.depth * 0.3;
        p.y += (mouse.y - 0.5) * p.depth * 0.2;

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Fade in/out
        let alpha = p.opacity;
        if (p.life < 60) alpha *= p.life / 60;
        if (p.life > p.maxLife - 60) alpha *= (p.maxLife - p.life) / 60;
        if (p.life >= p.maxLife) {
          p.life = 0;
          p.x = Math.random() * w;
          p.y = Math.random() * h;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── Light sweep effect ──
      if (lightSweepActiveRef.current && !reducedMotionRef.current) {
        lightSweepRef.current += 0.008;
        const sweep = lightSweepRef.current;
        if (sweep > 1.5) {
          lightSweepActiveRef.current = false;
        } else {
          const sweepX = w * (sweep - 0.25);
          const sweepGrad = ctx.createLinearGradient(sweepX - 200, 0, sweepX + 200, 0);
          sweepGrad.addColorStop(0, 'transparent');
          sweepGrad.addColorStop(0.5, 'rgba(59,130,246,0.04)');
          sweepGrad.addColorStop(0.7, 'rgba(201,168,76,0.03)');
          sweepGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = sweepGrad;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // ── Cursor light ──
      const cursorX = mouse.x * w;
      const cursorY = mouse.y * h;
      const cursorGrad = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, 300);
      cursorGrad.addColorStop(0, 'rgba(50,140,255,0.04)');
      cursorGrad.addColorStop(0.5, 'rgba(201,168,76,0.015)');
      cursorGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = cursorGrad;
      ctx.fillRect(0, 0, w, h);

      // ── Atmospheric haze ──
      const hazeGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
      hazeGrad.addColorStop(0, 'transparent');
      hazeGrad.addColorStop(1, 'rgba(6,11,20,0.6)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 0, w, h);

      timeRef.current += 16;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    // Visibility handling
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current);
      } else {
        animRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(sweepInterval);
    };
  }, [initParticles, initDataLines, initRings]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

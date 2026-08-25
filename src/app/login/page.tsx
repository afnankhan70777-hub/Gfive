'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Manrope, Sora } from 'next/font/google';
import { useAuthStore, useDataStore } from '@/lib/store';
import { createClient } from '@/utils/supabase/client';
import { getFirstPermittedRoute } from '@/lib/utils';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-sora',
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [remember, setRemember] = useState(true);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const allUsers = useDataStore((s) => s.users);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ticksRef = useRef<SVGGElement>(null);

  // Redirect already-authenticated users away from login
  useEffect(() => {
    if (mounted && isAuthenticated && currentUser) {
      const redirectTo = getFirstPermittedRoute(currentUser.role?.permissions || []);
      router.replace(redirectTo);
    }
  }, [mounted, isAuthenticated, currentUser, router]);

  useEffect(() => {
    // Delay mounting to allow Zustand store to hydrate from localStorage
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  /* ---------- Dial ring ticks ---------- */
  useEffect(() => {
    const ticksGroup = ticksRef.current;
    if (!ticksGroup) return;
    ticksGroup.innerHTML = '';
    const CX = 200, CY = 200, R_OUT = 178;
    const TOTAL = 72;
    for (let i = 0; i < TOTAL; i++) {
      const angle = (i / TOTAL) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const len = isMajor ? 14 : 6;
      const rIn = R_OUT - len;
      const x1 = CX + Math.cos(angle) * R_OUT;
      const y1 = CY + Math.sin(angle) * R_OUT;
      const x2 = CX + Math.cos(angle) * rIn;
      const y2 = CY + Math.sin(angle) * rIn;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      line.setAttribute('stroke-width', isMajor ? '2' : '1');
      line.setAttribute('stroke', isMajor ? 'rgba(255,216,115,0.75)' : 'rgba(109,180,255,0.28)');
      ticksGroup.appendChild(line);
    }
  }, []);

  /* ---------- Canvas particles + flow lines ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0, dpr = 1;
    let particles: any[] = [];
    let flowLines: any[] = [];
    let animId = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const BLUE = [47, 143, 255];
    const GOLD = [240, 180, 41];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      (canvas as any).style.width = width + 'px';
      (canvas as any).style.height = height + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
      buildFlowLines();
    }

    function buildParticles() {
      const density = Math.min(140, Math.floor((width * height) / 14000));
      particles = Array.from({ length: density }, () => {
        const leftSide = Math.random() < 0.55;
        const x = leftSide ? Math.random() * width * 0.62 : width * 0.55 + Math.random() * width * 0.45;
        const color = x < width * 0.55 ? BLUE : GOLD;
        return {
          x,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: Math.random() * 1.6 + 0.6,
          color,
          twinkle: Math.random() * Math.PI * 2,
        };
      });
    }

    function buildFlowLines() {
      flowLines = Array.from({ length: 6 }, (_, i) => ({
        baseY: height * (0.25 + i * 0.12) + (Math.random() - 0.5) * 40,
        amplitude: 26 + Math.random() * 30,
        speed: 0.15 + Math.random() * 0.12,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.06 + Math.random() * 0.08,
        widthStart: width * (0.62 + Math.random() * 0.08),
      }));
    }

    function drawFlowLines(t: number) {
      flowLines.forEach((line) => {
        ctx!.beginPath();
        const steps = 60;
        for (let s = 0; s <= steps; s++) {
          const px = line.widthStart + (width - line.widthStart) * (s / steps);
          const progress = s / steps;
          const py = line.baseY + Math.sin(progress * Math.PI * 2.2 + t * line.speed + line.phase) * line.amplitude * progress;
          if (s === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        const grad = ctx!.createLinearGradient(line.widthStart, 0, width, 0);
        grad.addColorStop(0, `rgba(240,180,41,0)`);
        grad.addColorStop(0.6, `rgba(240,180,41,${line.opacity})`);
        grad.addColorStop(1, `rgba(240,180,41,${line.opacity * 1.6})`);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.1;
        ctx!.stroke();
      });
    }

    function step(t: number) {
      ctx!.clearRect(0, 0, width, height);
      drawFlowLines(t * 0.001);

      const linkDist = Math.min(140, width * 0.09);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.14;
            const c = a.color;
            ctx!.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.twinkle += 0.02;
        const pulse = 0.55 + Math.sin(p.twinkle) * 0.35;
        const c = p.color;
        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${pulse})`;
        ctx!.shadowColor = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
        ctx!.shadowBlur = 6;
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      });

      if (!reduceMotion) animId = requestAnimationFrame(step);
    }

    window.addEventListener('resize', resize);
    resize();

    if (reduceMotion) {
      step(0);
    } else {
      animId = requestAnimationFrame(step);
    }

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  /* ---------- Auth handler ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const normalizedUsername = username.trim().toLowerCase();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, role:role_id(*)')
        .eq('name', normalizedUsername)
        .eq('password', password)
        .single();

      if (!userError && userData) {
        // Update last_login in Supabase immediately
        try {
          await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userData.id);
        } catch {
          // Ignore Supabase update errors
        }

        const user = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role
            ? { id: userData.role.id, name: userData.role.name, permissions: userData.role.permissions || [] }
            : { id: '', name: '', permissions: [] },
          status: userData.status,
          lastLogin: new Date().toISOString(),
          avatar: userData.avatar,
        };
        login(user.name, password, [user]);
        const redirectTo = getFirstPermittedRoute(user.role?.permissions || []);
        router.push(redirectTo);
        return;
      }
    } catch {
      // Supabase unavailable
    }

    const success = login(username, password, allUsers);
    if (success) {
      const currentUser = useAuthStore.getState().currentUser;
      const redirectTo = getFirstPermittedRoute(currentUser?.role?.permissions || []);
      router.push(redirectTo);
    } else {
      setError('Invalid ID or password.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${manrope.variable} ${sora.variable}`}
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: '#05070d',
        fontFamily: 'var(--font-manrope), sans-serif',
        color: '#f5f7fb',
        overflowX: 'hidden',
      }}
    >
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 18% 65%, rgba(47,143,255,0.09), transparent 60%), radial-gradient(ellipse 55% 55% at 88% 30%, rgba(240,180,41,0.09), transparent 60%), linear-gradient(160deg, #05070d 0%, #060911 45%, #050710 100%)',
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Page layout */}
      <div
        className="page-grid"
        style={{
          position: 'relative',
          zIndex: 3,
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          alignItems: 'center',
          gap: 'clamp(20px, 3vw, 40px)',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: 'clamp(16px, 3vw, 32px) clamp(16px, 4vw, 48px)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 1s cubic-bezier(.2,.75,.2,1), transform 1s cubic-bezier(.2,.75,.2,1)',
        }}
      >
        {/* LEFT — Hero */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 'clamp(4px, 0.6vh, 6px)',
          }}
        >
          <p
            style={{
              margin: '0 0 clamp(8px, 1.5vh, 14px)',
              fontSize: 'clamp(0.65rem, 0.9vw, 0.72rem)',
              fontWeight: 700,
              letterSpacing: '4px',
              color: '#caa24a',
              opacity: 0.9,
            }}
          >
            DEVICE INTELLIGENCE PLATFORM
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-sora), var(--font-manrope), sans-serif',
              fontSize: 'clamp(1.7rem, 3vw, 2.8rem)',
              fontWeight: 800,
              margin: '0 0 clamp(6px, 1vh, 8px)',
              letterSpacing: '0.3px',
            }}
          >
            <span style={{ color: '#f5f7fb' }}>MOBIIS</span>{' '}
            <span
              style={{
                background: 'linear-gradient(120deg, #ffd873, #f0b429)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              ERP
            </span>
          </h1>
          <p
            style={{
              margin: '0 0 clamp(24px, 4vh, 40px)',
              fontSize: 'clamp(0.78rem, 1.1vw, 0.86rem)',
              letterSpacing: '1px',
              color: '#8b93a7',
              fontWeight: 500,
              display: 'flex',
              gap: '10px',
            }}
          >
            <span>Inventory</span>
            <span style={{ color: '#1c4c8f' }}>/</span>
            <span>IMEI</span>
            <span style={{ color: '#1c4c8f' }}>/</span>
            <span>Intelligence</span>
          </p>

          {/* Cube stage */}
          <div
            style={{
              position: 'relative',
              width: 'clamp(180px, 22vw, 340px)',
              height: 'clamp(180px, 22vw, 340px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Shadow */}
            <div
              style={{
                position: 'absolute',
                bottom: 'clamp(34px, 5vw, 52px)',
                width: 'clamp(90px, 11vw, 160px)',
                height: 'clamp(16px, 2vw, 28px)',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(240,180,41,0.35), rgba(240,180,41,0) 70%)',
                filter: 'blur(3px)',
                animation: 'shadowBreathe 5s ease-in-out infinite',
              }}
            />

            {/* Halo glow */}
            <div
              style={{
                position: 'absolute',
                width: 'clamp(160px, 18vw, 290px)',
                height: 'clamp(160px, 18vw, 290px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240,180,41,0.16), rgba(47,143,255,0.08) 45%, transparent 72%)',
                filter: 'blur(20px)',
                animation: 'haloBreathe 5s ease-in-out infinite',
              }}
            />

            {/* Dial ring */}
            <svg
              viewBox="0 0 400 400"
              style={{
                position: 'absolute',
                width: 'clamp(180px, 22vw, 340px)',
                height: 'clamp(180px, 22vw, 340px)',
                animation: 'dialRotate 60s linear infinite',
              }}
            >
              <circle
                cx="200"
                cy="200"
                r="178"
                fill="none"
                stroke="rgba(240,180,41,0.14)"
                strokeWidth="1"
              />
              <g ref={ticksRef} />
            </svg>

            {/* Comet ring */}
            <svg
              viewBox="0 0 400 400"
              style={{
                position: 'absolute',
                width: 'clamp(180px, 22vw, 340px)',
                height: 'clamp(180px, 22vw, 340px)',
                animation: 'cometRotate 7s linear infinite',
              }}
            >
              <defs>
                <linearGradient id="cometGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f0b429" stopOpacity="0" />
                  <stop offset="100%" stopColor="#ffd873" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <circle
                cx="200"
                cy="200"
                r="148"
                fill="none"
                stroke="url(#cometGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="90 840"
              />
            </svg>

            {/* Sparkles */}
            <div style={{ position: 'absolute', inset: 0 }}>
              {[0, -2.3, -4.6, -6.9].map((delay, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: i % 2 === 0 ? '#ffd873' : '#6db4ff',
                    boxShadow: i % 2 === 0
                      ? '0 0 8px rgba(255,216,115,0.9)'
                      : '0 0 8px rgba(109,180,255,0.9)',
                    animation: `sparkOrbit 9s linear infinite`,
                    animationDelay: `${delay}s`,
                  }}
                />
              ))}
            </div>

            {/* Cube float */}
            <div
              style={{
                width: 'clamp(90px, 11vw, 160px)',
                height: 'clamp(90px, 11vw, 160px)',
                perspective: '1000px',
                animation: 'floatBob 4.5s ease-in-out infinite',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  animation: 'cubeTumble 16s ease-in-out infinite',
                }}
              >
                {/* Front face */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'clamp(90px, 11vw, 160px)',
                    height: 'clamp(90px, 11vw, 160px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.10), rgba(240,180,41,0.05) 40%, rgba(6,9,16,0.35) 100%)',
                    border: '1px solid rgba(240,180,41,0.38)',
                    boxShadow: 'inset 0 0 24px rgba(240,180,41,0.10), inset 0 0 60px rgba(47,143,255,0.05)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '6px',
                    transform: `translateZ(clamp(45px, 5.5vw, 80px))`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sora), sans-serif',
                      fontWeight: 800,
                      fontSize: 'clamp(0.75rem, 1.3vw, 1.25rem)',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ color: 'transparent', WebkitTextStroke: '1.3px #f5f7fb' }}>G</span>
                    <span style={{ color: 'transparent', WebkitTextStroke: '1.3px #f5f7fb' }}>&apos;</span>
                    <span style={{ color: 'transparent', WebkitTextStroke: '1.3px #ffd873', textShadow: '0 0 14px rgba(255,216,115,0.55)' }}>FIVE</span>
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(0.35rem, 0.5vw, 0.42rem)',
                      fontWeight: 700,
                      letterSpacing: '3px',
                      color: '#caa24a',
                      opacity: 0.85,
                    }}
                  >
                    PAKISTAN
                  </span>
                </div>

                {/* Back face */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'clamp(90px, 11vw, 160px)',
                    height: 'clamp(90px, 11vw, 160px)',
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.10), rgba(240,180,41,0.05) 40%, rgba(6,9,16,0.35) 100%)',
                    border: '1px solid rgba(240,180,41,0.38)',
                    boxShadow: 'inset 0 0 24px rgba(240,180,41,0.10), inset 0 0 60px rgba(47,143,255,0.05)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '6px',
                    transform: `translateZ(calc(clamp(45px, 5.5vw, 80px) * -1)) rotateY(180deg)`,
                  }}
                />

                {/* Right face */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'clamp(90px, 11vw, 160px)',
                    height: 'clamp(90px, 11vw, 160px)',
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.10), rgba(240,180,41,0.05) 40%, rgba(6,9,16,0.35) 100%)',
                    border: '1px solid rgba(47,143,255,0.32)',
                    boxShadow: 'inset 0 0 24px rgba(240,180,41,0.10), inset 0 0 60px rgba(47,143,255,0.05)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '6px',
                    transform: `rotateY(90deg) translateZ(clamp(45px, 5.5vw, 80px))`,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      width: '1px',
                      height: '60%',
                      background: 'linear-gradient(180deg, transparent, rgba(109,180,255,0.5), transparent)',
                    }}
                  />
                </div>

                {/* Left face */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'clamp(90px, 11vw, 160px)',
                    height: 'clamp(90px, 11vw, 160px)',
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.10), rgba(240,180,41,0.05) 40%, rgba(6,9,16,0.35) 100%)',
                    border: '1px solid rgba(47,143,255,0.32)',
                    boxShadow: 'inset 0 0 24px rgba(240,180,41,0.10), inset 0 0 60px rgba(47,143,255,0.05)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '6px',
                    transform: `rotateY(-90deg) translateZ(clamp(45px, 5.5vw, 80px))`,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      width: '1px',
                      height: '60%',
                      background: 'linear-gradient(180deg, transparent, rgba(109,180,255,0.5), transparent)',
                    }}
                  />
                </div>

                {/* Top face */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'clamp(90px, 11vw, 160px)',
                    height: 'clamp(90px, 11vw, 160px)',
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.16), rgba(240,180,41,0.08) 50%, rgba(6,9,16,0.3))',
                    border: '1px solid rgba(240,180,41,0.38)',
                    boxShadow: 'inset 0 0 24px rgba(240,180,41,0.10), inset 0 0 60px rgba(47,143,255,0.05)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '6px',
                    transform: `rotateX(90deg) translateZ(clamp(45px, 5.5vw, 80px))`,
                  }}
                >
                  <div
                    style={{
                      width: 'clamp(20px, 2.5vw, 38px)',
                      height: 'clamp(20px, 2.5vw, 38px)',
                      border: '1px solid rgba(255,216,115,0.5)',
                      transform: 'rotate(45deg)',
                      boxShadow: '0 0 16px rgba(255,216,115,0.25)',
                    }}
                  />
                </div>

                {/* Bottom face */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'clamp(90px, 11vw, 160px)',
                    height: 'clamp(90px, 11vw, 160px)',
                    background: 'linear-gradient(155deg, rgba(255,255,255,0.10), rgba(240,180,41,0.05) 40%, rgba(6,9,16,0.35) 100%)',
                    border: '1px solid rgba(240,180,41,0.38)',
                    boxShadow: 'inset 0 0 24px rgba(240,180,41,0.10), inset 0 0 60px rgba(47,143,255,0.05)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '6px',
                    transform: `rotateX(-90deg) translateZ(clamp(45px, 5.5vw, 80px))`,
                  }}
                />

                {/* Cube core */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 'clamp(34px, 4vw, 60px)',
                    height: 'clamp(34px, 4vw, 60px)',
                    transform: 'translate(-50%, -50%) translateZ(0)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,216,115,0.9), rgba(240,180,41,0.25) 55%, transparent 75%)',
                    filter: 'blur(6px)',
                    animation: 'corePulse 3.6s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT — Auth panel */}
        <section style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {/* Panel border glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '22px',
              padding: '1px',
              background: 'linear-gradient(200deg, rgba(240,180,41,0.55), rgba(47,143,255,0.15) 35%, rgba(240,180,41,0.05) 65%, rgba(240,180,41,0.5))',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: 'borderFlow 8s linear infinite',
              opacity: 0.8,
            }}
          />

          {/* Auth card */}
          <div
            className="auth-card"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 'min(420px, 88vw)',
              background: 'linear-gradient(180deg, rgba(14,20,36,0.92), rgba(8,12,22,0.94))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '22px',
              padding: 'clamp(24px, 2.5vw, 36px) clamp(24px, 3.5vw, 42px) clamp(20px, 2.5vw, 32px)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset',
            }}
          >
            {/* Wordmark header */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                margin: '0 auto clamp(16px, 2vw, 22px)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sora), sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                  letterSpacing: '0.5px',
                  lineHeight: 1,
                }}
              >
                <span style={{ color: '#f5f7fb' }}>G</span>
                <span style={{ color: '#f5f7fb' }}>&apos;</span>
                <span style={{ color: '#ffd873', textShadow: '0 0 20px rgba(255,216,115,0.5)' }}>FIVE</span>
              </span>
              <span
                style={{
                  fontSize: 'clamp(0.6rem, 0.8vw, 0.68rem)',
                  fontWeight: 700,
                  letterSpacing: '6px',
                  color: '#caa24a',
                  opacity: 0.9,
                }}
              >
                PAKISTAN
              </span>
            </div>

            {/* Form title */}
            <h2
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-sora), sans-serif',
                fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
                fontWeight: 800,
                margin: '0 0 2px',
              }}
            >
              <span style={{ color: '#f5f7fb' }}>MOBIIS</span>{' '}
              <span style={{ color: '#f0b429' }}>ERP</span>
            </h2>
            <p
              style={{
                textAlign: 'center',
                color: '#8b93a7',
                fontSize: 'clamp(0.75rem, 1vw, 0.85rem)',
                margin: '0 0 clamp(16px, 2vw, 22px)',
              }}
            >
              Sign in to your account
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} autoComplete="off" noValidate>
              {/* User ID */}
              <div style={{ marginBottom: 'clamp(12px, 1.5vw, 16px)' }}>
                <label
                  htmlFor="userid"
                  style={{
                    display: 'block',
                    fontSize: 'clamp(0.75rem, 0.9vw, 0.82rem)',
                    fontWeight: 600,
                    color: '#b7bfd1',
                    marginBottom: 'clamp(5px, 0.7vw, 7px)',
                  }}
                >
                  User ID
                </label>
                <div
                  className="input-shell"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    height: 'clamp(40px, 5vw, 46px)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    style={{ width: '18px', height: '18px', color: '#566079', flexShrink: 0 }}
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2.3" />
                    <path d="M3.5 6.5 12 13l8.5-6.5" />
                  </svg>
                  <input
                    type="text"
                    id="userid"
                    name="userid"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    className="login-input"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f5f7fb',
                      fontSize: 'clamp(0.88rem, 1vw, 0.95rem)',
                      fontFamily: 'var(--font-manrope), sans-serif',
                      height: '100%',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 'clamp(12px, 1.5vw, 16px)' }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    fontSize: 'clamp(0.75rem, 0.9vw, 0.82rem)',
                    fontWeight: 600,
                    color: '#b7bfd1',
                    marginBottom: 'clamp(5px, 0.7vw, 7px)',
                  }}
                >
                  Password
                </label>
                <div
                  className="input-shell"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '0 14px',
                    height: 'clamp(40px, 5vw, 46px)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    style={{ width: '18px', height: '18px', color: '#566079', flexShrink: 0 }}
                  >
                    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
                    <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="login-input"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#f5f7fb',
                      fontSize: 'clamp(0.88rem, 1vw, 0.95rem)',
                      fontFamily: 'var(--font-manrope), sans-serif',
                      height: '100%',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#566079',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: '19px', height: '19px' }} />
                    ) : (
                      <Eye style={{ width: '19px', height: '19px' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Row between */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '4px 0 clamp(16px, 2vw, 22px)',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    fontSize: 'clamp(0.78rem, 0.9vw, 0.85rem)',
                    color: '#b7bfd1',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      background: remember ? '#f0b429' : 'transparent',
                      border: remember ? 'none' : '1.5px solid #566079',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: remember ? '0 0 10px rgba(240,180,41,0.4)' : 'none',
                    }}
                  >
                    {remember && (
                      <svg viewBox="0 0 16 16" style={{ width: '12px', height: '12px' }}>
                        <path
                          d="M3 8.5 6.2 12 13 4.5"
                          fill="none"
                          stroke="#101010"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setError('Password recovery would connect to your authentication service.')}
                  style={{
                    fontSize: 'clamp(0.75rem, 0.85vw, 0.82rem)',
                    color: '#caa24a',
                    textDecoration: 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease',
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: 'clamp(42px, 5vw, 48px)',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(100deg, #ffd873, #f0b429 55%, #caa24a)',
                  backgroundSize: '200% 100%',
                  color: '#1a1400',
                  fontFamily: 'var(--font-manrope), sans-serif',
                  fontSize: 'clamp(0.92rem, 1.05vw, 1rem)',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.25s ease, background-position 0.6s ease',
                  boxShadow: '0 10px 30px rgba(240,180,41,0.25)',
                }}
              >
                <span style={{ opacity: isLoading ? 0.5 : 1 }}>
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  style={{
                    width: '19px',
                    height: '19px',
                    transition: 'transform 0.2s ease',
                    animation: isLoading ? 'spin 0.8s linear infinite' : 'none',
                  }}
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </form>

            {error && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 'clamp(0.78rem, 0.9vw, 0.85rem)',
                  marginTop: '12px',
                  color: error.includes('granted') ? '#78c99f' : '#d9a7a7',
                }}
              >
                {error}
              </div>
            )}

          </div>
        </section>
      </div>

      {/* Global keyframes */}
      <style jsx global>{`
        @keyframes shadowBreathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(0.82); opacity: 0.5; }
        }
        @keyframes haloBreathe {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes dialRotate {
          to { transform: rotate(360deg); }
        }
        @keyframes cometRotate {
          to { transform: rotate(360deg); }
        }
        @keyframes sparkOrbit {
          0% { transform: rotate(0deg) translateX(175px) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: rotate(360deg) translateX(175px) rotate(-360deg); opacity: 0; }
        }
        @keyframes floatBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes cubeTumble {
          0% { transform: rotateX(-20deg) rotateY(0deg); }
          50% { transform: rotateX(-26deg) rotateY(180deg); }
          100% { transform: rotateX(-20deg) rotateY(360deg); }
        }
        @keyframes corePulse {
          0%, 100% { opacity: 0.65; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
        }
        @keyframes borderFlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .input-shell:focus-within {
          border-color: rgba(240,180,41,0.55) !important;
          box-shadow: 0 0 0 3px rgba(240,180,41,0.12) !important;
          background: rgba(255,255,255,0.045) !important;
        }
        .input-shell:focus-within svg {
          color: #caa24a !important;
        }
        /* Target autofill with parent class for higher specificity */
        .auth-card .input-shell input:-webkit-autofill,
        .auth-card .input-shell input:-webkit-autofill:hover,
        .auth-card .input-shell input:-webkit-autofill:focus,
        .auth-card .input-shell input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0d1321 inset !important;
          box-shadow: 0 0 0 1000px #0d1321 inset !important;
          -webkit-text-fill-color: #f5f7fb !important;
          text-fill-color: #f5f7fb !important;
          caret-color: #f5f7fb !important;
          background-color: #0d1321 !important;
          background-image: none !important;
          color: #f5f7fb !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }


        @media (max-width: 1024px) {
          .page-grid {
            grid-template-columns: 1fr !important;
            padding: clamp(16px, 2.5vw, 32px) clamp(12px, 2.5vw, 24px) !important;
            gap: clamp(24px, 4vw, 40px) !important;
          }
        }
        @media (max-width: 560px) {
          .page-grid {
            padding: 16px 12px !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
        }
      `}</style>
    </div>
  );
}

'use client';

interface GFiveLogoProps {
  size?: number;
  showTagline?: boolean;
}

export function GFiveLogo({ size = 64, showTagline = true }: GFiveLogoProps) {
  const scale = size / 64;

  return (
    <div className="flex flex-col items-center" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
      {/* Logo Badge */}
      <div
        className="relative flex items-center justify-center rounded-2xl shadow-2xl"
        style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #0099cc 0%, #0077b3 50%, #005f99 100%)',
          boxShadow: '0 0 30px rgba(0, 153, 204, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        {/* Subtle inner glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 60%)',
          }}
        />
        {/* G'FIVE Text */}
        <span
          className="relative font-black tracking-tight leading-none select-none"
          style={{
            fontSize: 22,
            color: '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.1)',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          }}
        >
          G<span className="inline-block mx-[1px]" style={{ fontSize: 18, fontWeight: 300 }}>&apos;</span>FIVE
        </span>
      </div>

      {/* Brand Name */}
      {showTagline && (
        <div className="mt-3 text-center">
          <h1
            className="font-bold tracking-wide"
            style={{
              fontSize: 18,
              color: '#f0f0f0',
              textShadow: '0 0 20px rgba(0, 153, 204, 0.2)',
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            G&apos;FIVE
          </h1>
          <p
            className="mt-0.5 font-medium tracking-[0.2em] uppercase"
            style={{
              fontSize: 10,
              color: '#0099cc',
              letterSpacing: '0.25em',
            }}
          >
            Pakistan
          </p>
        </div>
      )}
    </div>
  );
}

export function GFiveLogoSmall({ size = 36 }: { size?: number }) {
  const scale = size / 36;
  return (
    <div className="flex items-center gap-2.5" style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}>
      <div
        className="relative flex items-center justify-center rounded-lg"
        style={{
          width: 36,
          height: 36,
          background: 'linear-gradient(135deg, #0099cc 0%, #0077b3 100%)',
          boxShadow: '0 0 15px rgba(0, 153, 204, 0.25), 0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <span
          className="font-black leading-none select-none"
          style={{
            fontSize: 13,
            color: '#ffffff',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
        >
          G<span style={{ fontSize: 11, fontWeight: 300 }}>&apos;</span>F
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className="font-bold"
          style={{
            fontSize: 13,
            color: '#f0f0f0',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
        >
          G&apos;FIVE
        </span>
        <span
          className="font-medium uppercase"
          style={{
            fontSize: 8,
            color: '#0099cc',
            letterSpacing: '0.2em',
          }}
        >
          Pakistan
        </span>
      </div>
    </div>
  );
}

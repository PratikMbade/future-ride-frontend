import React from 'react'

/* Deterministic star field — no Math.random() */
const STARS = Array.from({ length: 200 }, (_, i) => ({
  x: (i * 137.508) % 100,
  y: (i * 61.8) % 100,
  r: i % 25 === 0 ? 2.2 : i % 7 === 0 ? 1.5 : i % 3 === 0 ? 1 : 0.6,
  op: 0.15 + (i % 9) * 0.08,
  delay: (i * 0.12) % 8,
  dur: 2.5 + (i % 6) * 0.8,
  gold: i % 18 === 0,
  sky: i % 11 === 0,
}))

const PALETTES = [
  // 0: current — blue/gold
  {
    spot1: 'rgba(17, 178, 194, 0.1)',
    spot2: 'rgba(80, 232, 248, 0.1)',
    spot3: 'rgba(80, 232, 248, 0.3)',
    base: ['#3B82F6', '#030D28', '#020B20'],
  },
  // 1: purple/pink nebula
  {
    spot1: 'rgba(8, 113, 255, 0.64)',
    spot2: 'rgba(236,72,153,0.12)',
    spot3: 'rgba(167,139,250,0.07)',
    base: ['#0A0518', '#120A2E', '#0A0518'],
  },
  // 2: teal/emerald
  {
    spot1: 'rgba(8, 113, 255, 0.64)',
    spot2: 'rgba(245,166,35,0.08)',
    spot3: 'rgba(34,211,238,0.06)',
    base: ['#020F0E', '#031A18', '#020F0E'],
  },
  // 3: deep red/orange (aggressive/energetic)
  {
    spot1: 'rgba(220,38,38,0.16)',
    spot2: 'rgba(251,146,60,0.10)',
    spot3: 'rgba(248,113,113,0.05)',
    base: ['#150505', '#1F0A0A', '#150505'],
  },
]

const ACTIVE_PALETTE = 0
export function SpaceBackground() {
    const p = PALETTES[ACTIVE_PALETTE]

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
     style={{
        background:
          `radial-gradient(ellipse 90% 60% at 15% 15%, ${p.spot1} 0%, transparent 55%),` +
          `radial-gradient(ellipse 70% 50% at 85% 80%, ${p.spot2} 0%, transparent 55%),` +
          `radial-gradient(ellipse 80% 70% at 50% 50%, ${p.spot3} 0%, transparent 65%),` +
          `linear-gradient(170deg, ${p.base[0]} 0%, ${p.base[1]} 50%, ${p.base[2]} 100%)`,
      }}
      />

      {/* Nebula 1 — top right blue */}
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          top: '-10%', right: '-5%',
          width: '55vw', height: '55vw',
          maxWidth: 700, maxHeight: 700,
          background: 'radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animationDelay: '0s',
        }}
      />
      {/* Nebula 2 — bottom left gold */}
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          bottom: '-5%', left: '-8%',
          width: '45vw', height: '45vw',
          maxWidth: 600, maxHeight: 600,
          background: 'radial-gradient(ellipse, rgba(245,166,35,0.10) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animationDelay: '2s',
        }}
      />
      {/* Nebula 3 — mid purple */}
      <div
        className="absolute rounded-full animate-glow-pulse"
        style={{
          top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40vw', height: '40vw',
          maxWidth: 500, maxHeight: 500,
          background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDelay: '4s',
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(56,189,248,0.8) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r}px`,
            height: `${s.r}px`,
            backgroundColor: s.gold ? '#FCD34D' : s.sky ? '#38BDF8' : '#FFFFFF',
            opacity: s.op,
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

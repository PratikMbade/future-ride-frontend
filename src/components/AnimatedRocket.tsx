import React from 'react'
import { motion } from 'framer-motion'

interface Props {
  size?: number
}

export function AnimatedRocket({ size = 280 }: Props) {
  const s = size

  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s * 1.4 }}>
      {/* Outer orbit ring */}
      <div
        className="absolute rounded-full border border-dashed border-[#38BDF8]/20 animate-orbit"
        style={{ width: s * 1.05, height: s * 1.05, top: '50%', left: '50%', marginTop: -(s * 0.525), marginLeft: -(s * 0.525) }}
      />
      {/* Inner orbit ring reverse */}
      <div
        className="absolute rounded-full border border-dashed border-[#F5A623]/12 animate-orbit-rev"
        style={{ width: s * 0.75, height: s * 0.75, top: '50%', left: '50%', marginTop: -(s * 0.375), marginLeft: -(s * 0.375) }}
      />

      {/* Nebula glow behind rocket */}
      <div
        className="absolute rounded-full blur-3xl animate-glow-pulse"
        style={{
          width: s * 0.9, height: s * 0.9,
          background: 'radial-gradient(ellipse, rgba(56,189,248,0.22) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl animate-glow-pulse"
        style={{
          width: s * 0.5, height: s * 0.5,
          background: 'radial-gradient(ellipse, rgba(245,166,35,0.15) 0%, transparent 70%)',
          animationDelay: '1.5s',
        }}
      />

      {/* Floating rocket */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -22, 0], rotate: [0, 2, 0, -2, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          width={s * 0.55}
          height={s * 1.1}
          viewBox="0 0 110 240"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_18px_rgba(56,189,248,0.5)]"
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0A1030" />
              <stop offset="40%" stopColor="#111830" />
              <stop offset="100%" stopColor="#0A1030" />
            </linearGradient>
            <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(56,189,248,0.1)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0.1)" />
            </linearGradient>
            <linearGradient id="windowGrad" cx="35%" cy="35%" r="70%"  gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1E56D9" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id="winGlow" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1E56D9" stopOpacity="0.3" />
            </radialGradient>
            <radialGradient id="flameCore" cx="50%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
              <stop offset="40%" stopColor="#F5A623" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
            </radialGradient>
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* === NOSE CONE === */}
          <path
            d="M 55 4 C 53 20 47 45 44 78 L 66 78 C 63 45 57 20 55 4 Z"
            fill="url(#bodyGrad)"
            stroke="rgba(56,189,248,0.7)"
            strokeWidth="1"
            filter="url(#glowFilter)"
          />
          {/* Nose tip glow */}
          <ellipse cx="55" cy="8" rx="3" ry="5" fill="rgba(56,189,248,0.4)" />

          {/* === MAIN BODY === */}
          <rect
            x="44" y="76" width="22" height="108"
            rx="3" ry="3"
            fill="url(#bodyGrad)"
            stroke="rgba(56,189,248,0.55)"
            strokeWidth="1"
          />

          {/* Chrome accent bands */}
          <rect x="44" y="84" width="22" height="3" rx="1" fill="url(#chromeGrad)" />
          <rect x="44" y="158" width="22" height="3" rx="1" fill="url(#chromeGrad)" />

          {/* Body highlight */}
          <rect x="53" y="79" width="3" height="102" rx="1.5" fill="rgba(255,255,255,0.06)" />

          {/* === PORTHOLE WINDOW === */}
          <circle cx="55" cy="116" r="11" fill="#040D28" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="55" cy="116" r="7.5" fill="url(#winGlow)" />
          <circle cx="51" cy="112" r="2.5" fill="rgba(255,255,255,0.5)" />

          {/* Second small window */}
          <circle cx="55" cy="143" r="5.5" fill="#040D28" stroke="rgba(56,189,248,0.4)" strokeWidth="1" />
          <circle cx="55" cy="143" r="3" fill="rgba(56,189,248,0.25)" />

          {/* === LEFT FIN === */}
          <path
            d="M 44 148 L 16 192 L 22 197 L 44 175 Z"
            fill="url(#bodyGrad)"
            stroke="rgba(56,189,248,0.55)"
            strokeWidth="1"
          />
          {/* Left fin accent */}
          <line x1="44" y1="155" x2="20" y2="195" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5" />

          {/* === RIGHT FIN === */}
          <path
            d="M 66 148 L 94 192 L 88 197 L 66 175 Z"
            fill="url(#bodyGrad)"
            stroke="rgba(56,189,248,0.55)"
            strokeWidth="1"
          />
          {/* Right fin accent */}
          <line x1="66" y1="155" x2="90" y2="195" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5" />

          {/* === BOOSTER BASE === */}
          <path
            d="M 42 175 L 35 196 L 75 196 L 68 175 Z"
            fill="#06101E"
            stroke="rgba(245,166,35,0.5)"
            strokeWidth="1"
          />

          {/* === NOZZLES === */}
          <ellipse cx="47" cy="197" rx="7" ry="3.5" fill="#030A18" stroke="rgba(245,166,35,0.65)" strokeWidth="1" />
          <ellipse cx="63" cy="197" rx="7" ry="3.5" fill="#030A18" stroke="rgba(245,166,35,0.65)" strokeWidth="1" />
        </svg>

        {/* Animated flame */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -4, transformOrigin: 'top center' }}
          animate={{
            scaleY: [0.9, 1.25, 0.9],
            scaleX: [1, 0.9, 1],
            opacity: [0.75, 1, 0.75],
          }}
          transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width={s * 0.28} height={s * 0.32} viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="fg2" cx="50%" cy="10%" r="90%">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="1" />
                <stop offset="35%" stopColor="#F5A623" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#EF4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M 12 5 Q 30 40 12 72 Q 30 52 48 72 Q 30 40 48 5 Q 30 28 12 5 Z" fill="url(#fg2)" />
          </svg>
        </motion.div>

        {/* Particle sparks */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              bottom: s * 0.08,
              left: '50%',
              width: 2.5,
              height: 2.5,
              backgroundColor: i % 2 === 0 ? '#FCD34D' : '#F5A623',
            }}
            animate={{
              x: [(i - 4) * 4, (i - 4) * 18],
              y: [0, s * 0.25],
              opacity: [1, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration: 0.7 + i * 0.08,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Orbit dots */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: i % 2 === 0 ? '#38BDF8' : '#F5A623',
            top: '50%',
            left: '50%',
          }}
          animate={{
            x: [(s * 0.5) * Math.cos((i * Math.PI) / 2), (s * 0.5) * Math.cos((i * Math.PI) / 2 + Math.PI * 2)],
            y: [(s * 0.28) * Math.sin((i * Math.PI) / 2), (s * 0.28) * Math.sin((i * Math.PI) / 2 + Math.PI * 2)],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

import React from 'react'
import { motion } from 'framer-motion'

const PKGS = [
  { l: 1, p: 5, m: 2 }, { l: 2, p: 10, m: 4 }, { l: 3, p: 20, m: 8 },
  { l: 4, p: 40, m: 16 }, { l: 5, p: 80, m: 32 }, { l: 6, p: 160, m: 64 },
  { l: 7, p: 320, m: 128 }, { l: 8, p: 640, m: 256 }, { l: 9, p: 1280, m: 512 },
  { l: 10, p: 2560, m: 1024 }, { l: 11, p: 5120, m: 2048 }, { l: 12, p: 10240, m: 4096 },
]

const fmt = (p: number) => p >= 1000 ? `$${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}K` : `$${p}`
const accent = (l: number) => l === 12 ? '#F5A623' : l === 1 ? '#38BDF8' : l <= 4 ? '#38BDF840' : l <= 8 ? '#38BDF870' : '#38BDF8'

export function Packages() {
  return (
    <section id="packages" data-testid="packages-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 -left-4">05</span>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#F5A623]/25 bg-[#F5A623]/8 text-[#F5A623] mb-5">
            Participation Packages
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            12 Levels of<br /><span className="text-brand">Unlimited Growth</span>
          </h2>
          <p className="text-white/55 text-base mt-4 max-w-xl">
            Start from just $5 and scale through 12 levels. Every upgrade unlocks greater rewards and team income.
          </p>
        </motion.div>

        {/* Terminal window */}
        <div className="rounded-2xl overflow-hidden border border-[#38BDF8]/18" style={{ background: 'rgba(3,13,40,0.9)' }}>
          {/* Title bar */}
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/6 bg-[#020B20]/60">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 font-mono-custom text-xs text-white/25 tracking-widest">futureride://packages</span>
          </div>
          {/* Col headers */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 px-6 py-3 border-b border-white/5">
            {['LEVEL', 'INVESTMENT', 'STRUCTURE', 'STATUS'].map((h) => (
              <div key={h} className="font-mono-custom text-[10px] text-white/30 tracking-[0.2em]">{h}</div>
            ))}
          </div>
          {/* Rows */}
          {PKGS.map((pkg, i) => (
            <motion.div
              key={pkg.l}
              data-testid={`package-card-${pkg.l}`}
              initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
              className={`grid grid-cols-3 md:grid-cols-4 gap-4 px-6 py-4 border-b border-white/4 group cursor-default transition-colors duration-150 hover:bg-[#38BDF8]/4 ${pkg.l === 12 ? 'bg-[#F5A623]/3' : ''}`}
            >
              <div className="flex items-center">
                <span className="font-mono-custom font-bold text-xs" style={{ color: accent(pkg.l) }}>
                  #{String(pkg.l).padStart(2, '0')}
                </span>
              </div>
              <div>
                <span className="font-mono-custom font-extrabold text-base sm:text-lg text-white group-hover:text-[#38BDF8] transition-colors">
                  {fmt(pkg.p)}
                </span>
                <span className="text-white/25 text-[10px] ml-1">USDT</span>
              </div>
              <div className="font-mono-custom text-sm text-white/50">{pkg.m.toLocaleString()}</div>
              <div className="hidden md:flex items-center">
                {pkg.l === 1 && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md">ENTRY</span>}
                {pkg.l === 12 && <span className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-2 py-0.5 rounded-md">MAX</span>}
                {pkg.l === 6 && <span className="text-[10px] font-bold text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/20 px-2 py-0.5 rounded-md">MID</span>}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-white/22 text-xs mt-5 text-center">Packages are permanent with no expiry. Earnings are illustrative only.</p>
      </div>
    </section>
  )
}

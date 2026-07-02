import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const PKGS = [
  { l: 1, p: 5, m: 2 }, { l: 2, p: 10, m: 4 }, { l: 3, p: 20, m: 8 },
  { l: 4, p: 40, m: 16 }, { l: 5, p: 80, m: 32 }, { l: 6, p: 160, m: 64 },
  { l: 7, p: 320, m: 128 }, { l: 8, p: 640, m: 256 }, { l: 9, p: 1280, m: 512 },
  { l: 10, p: 2560, m: 1024 }, { l: 11, p: 5120, m: 2048 }, { l: 12, p: 10240, m: 4096 },
]

const fmt = (p: number) => p >= 1000 ? `$${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}K` : `$${p}`
const accent = (l: number) => l === 12 ? '#F5A623' : l === 1 ? '#38BDF8' : l <= 4 ? '#38BDF840' : l <= 8 ? '#38BDF870' : '#38BDF8'

// income at each level = price * members / 2 (matches LevelIncomeTable income formula)
const TOTAL_INCOME = PKGS.reduce((sum, p) => sum + (p.p * p.m) / 2, 0)
const TOTAL_MEMBERS = PKGS.reduce((sum, p) => sum + p.m, 0)

function useCountUp(target: number, durationMs = 1600, run = true): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, run])
  return value
}

function TotalHighlightCard() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const obs = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && setInView(true),
      { threshold: 0.15 },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])

  const animatedTotal = useCountUp(TOTAL_INCOME, 1800, inView)

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      data-testid="packages-total-card"
      className="mb-8 flex flex-col gap-6 overflow-hidden rounded-2xl border border-[#F5A623]/20 p-6 md:flex-row md:items-center md:justify-between md:p-8"
      style={{ background: 'rgba(3,13,40,0.9)' }}
    >
      <div>
        <div className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623] animate-pulse" />
          <span className="font-mono-custom text-[10px] uppercase tracking-[0.25em] text-[#F5A623]">
            Max-Cycle Income Potential
          </span>
        </div>
        <div className="mt-2 font-mono-custom text-4xl font-extrabold text-white sm:text-5xl">
          ${animatedTotal.toLocaleString()}{' '}
          <span className="text-white/25 text-2xl sm:text-3xl">USDT</span>
        </div>
        <p className="mt-2 max-w-md text-xs text-white/40">
          Theoretical max payout if all 12 levels of the 2×2 matrix are completely filled.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Levels', value: '12', color: '#38BDF8' },
          { label: 'Max Members', value: TOTAL_MEMBERS.toLocaleString(), color: '#A855F7' },
          { label: 'Entry Point', value: '$5', color: '#34D399' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-center"
          >
            <div className="font-mono-custom text-[9px] uppercase tracking-[0.18em] text-white/30">
              {s.label}
            </div>
            <div
              className="mt-1 font-mono-custom text-base font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
export function Packages() {
  return (
    <section id="packages" data-testid="packages-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 right-0">06</span>

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

        <TotalHighlightCard/>

        {/* Terminal window */}
        <div className="rounded-2xl overflow-hidden border border-[#38BDF8]/18" style={{ background: 'rgba(3,13,40,0.9)' }}>
          {/* Title bar */}
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/6 bg-[#020B20]/60">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 font-mono-custom text-xs text-white/25 tracking-widest">FutureRide/Packages</span>
          </div>
          {/* Col headers */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 px-6 py-3 border-b border-white/5">
            {['LEVEL', 'INVESTMENT', 'STRUCTURE', 'STATUS'].map((h) => (
              <div key={h} className="font-mono-custom text-[10px] text-white/90 tracking-[0.2em]">{h}</div>
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
              <div className='translate-x-4'>
                <span className="font-mono-custom  font-extrabold text-base sm:text-lg text-white group-hover:text-[#38BDF8] transition-colors">
                  {fmt(pkg.p)}
                </span>
                <span className="text-white/25 text-[10px] ml-1">USDT</span>
              </div>
              <div className="font-mono-custom text-sm text-white/80 translate-x-4">{pkg.m.toLocaleString()}</div>
              <div className="hidden md:flex items-center">
                {pkg.l === 1 && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md">ENTRY</span>}
                {pkg.l === 12 && <span className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-2 py-0.5 rounded-md">MAX</span>}
                {pkg.l === 3 && <span className="text-[10px] font-bold text-[#f2ece2] bg-[#F5A623]/10 border border-[#F5A623]/20 px-2 py-0.5 rounded-md">Silver Roaylty Unlock</span>}
                                {pkg.l === 9 && <span className="text-[10px] font-bold text-[#A855F7] bg-[#A855F7]/10 border border-[#A855F7]/20 px-2 py-0.5 rounded-md">Diamond Roaylty Unlock</span>}
                {pkg.l === 5 && <span className="text-[10px] font-bold text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-2 py-0.5 rounded-md">Gold Roaylty Unlock</span>}
                                {pkg.l === 7 && <span className="text-[10px] font-bold text-[#f7f4ef] bg-[#F5A623]/10 border border-[#F5A623]/20 px-2 py-0.5 rounded-md">Platinum Roaylty Unlock</span>}

                {pkg.l === 4 && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md">Auto Upgrade</span>}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-white/80 text-md mt-5 text-center">Packages are permanent with no expiry. Earnings are illustrative only.</p>
      </div>
    </section>
  )
}

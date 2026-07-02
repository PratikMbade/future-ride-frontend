import React from 'react'
import { motion } from 'framer-motion'

const STATS = [
  { v: '12', l: 'Package Levels', c: '#38BDF8' },
  { v: '$10,240', l: 'Max Package', c: '#F5A623' },
  { v: '3', l: 'Income Streams', c: '#A855F7' },
  { v: '$8,800', l: 'Max Royalty Cap', c: '#38BDF8' },
  { v: '100%', l: 'P2P Automated', c: '#F5A623' },
  { v: '0%', l: 'Central Control', c: '#A855F7' },
]

export function StatsSection() {
  return (
    <section id="stats" data-testid="stats-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 left-0">09</span>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#A855F7]/25 bg-[#A855F7]/8 text-[#A855F7] mb-5">
            By The Numbers
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            FutureRide <span className="text-brand">At a Glance</span>
          </h2>
        </motion.div>

        <div className="grad-border rounded-3xl">
          <div className="bg-[#030D28]/90 rounded-3xl p-10 md:p-14">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-14">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.l}
                  data-testid={`stat-${i}`}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div
                    className="font-black leading-none tracking-tight mb-2"
                    style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', color: s.c }}
                  >
                    {s.v}
                  </div>
                  <div className="text-white/60 text-sm font-medium">{s.l}</div>
                  <div className="mt-3 mx-auto w-10 h-[2px] rounded-full" style={{ background: `${s.c}35` }} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import React from 'react'
import { motion } from 'framer-motion'

const STREAMS = [
  {
    pct: '20%', label: 'Direct Income',
    desc: 'Earn instantly when someone joins using your referral link. Fast, direct, peer-to-peer payments straight to your wallet.',
    c: '#38BDF8', from: '#38BDF8', to: '#1E56D9',
  },
  {
    pct: '50%', label: 'Upgrade Income',
    desc: 'The largest income stream. Earned automatically when team members upgrade packages via our smart upline mechanism.',
    c: '#F5A623', from: '#FCD34D', to: '#D97706',
  },
  {
    pct: '30%', label: 'Daily Royalty',
    desc: 'Passive income distributed daily from the global royalty pool based on your tier — Silver, Gold, Platinum, or Diamond.',
    c: '#A855F7', from: '#C084FC', to: '#7C3AED',
  },
]

export function IncomeDistribution() {
  return (
    <section id="income" data-testid="income-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 left-0">05</span>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/8 text-[#38BDF8] mb-5">
            Income Distribution
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Three Automated<br /><span className="text-brand">Income Streams</span>
          </h2>
          <p className="text-white/55 text-base mt-4 max-w-xl">
            Every transaction is automatically split across three income streams by smart contract — zero human involvement.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STREAMS.map((s, i) => (
            <motion.div
              key={s.label}
              data-testid={`income-stream-${i}`}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative overflow-hidden rounded-2xl group hover:-translate-y-1 transition-transform duration-300"
              style={{ background: `linear-gradient(150deg, ${s.c}12 0%, rgba(3,13,40,0.95) 55%)`, border: `1px solid ${s.c}25` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${s.c}, transparent)` }} />
              <div className="p-8 sm:p-10">
                <div
                  className="font-black leading-none tracking-tight mb-3"
                  style={{ fontSize: 'clamp(4rem, 9vw, 7rem)', background: `linear-gradient(135deg, ${s.from}, ${s.to})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  {s.pct}
                </div>
                <h3 className="font-bold text-white text-xl mb-4">{s.label}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">{s.desc}</p>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: `${s.c}90` }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.c }} />
                  Smart Contract Automated
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full blur-3xl opacity-10 group-hover:opacity-18 transition-opacity" style={{ backgroundColor: s.c }} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-5 rounded-2xl border border-white/6 bg-white/[0.025] p-5 text-center"
        >
          <span className="text-white/45 text-sm">Total Distribution: </span>
          <span className="font-mono-custom font-bold text-white text-sm">20% + 50% + 30% = </span>
          <span className="text-gold font-mono-custom font-extrabold text-lg">100%</span>
          <span className="text-white/30 text-sm ml-2">— Every satoshi goes back to participants.</span>
        </motion.div>
      </div>
    </section>
  )
}

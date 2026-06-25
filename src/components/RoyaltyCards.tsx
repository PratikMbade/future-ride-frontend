import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Crown, Gem, Sparkles } from 'lucide-react'

const TIERS = [
  {
    name: 'Silver', cap: '$300', sub: 'Entry Royalty', c: '#C0C0C0',
    bg: 'linear-gradient(135deg, rgba(192,192,192,0.12), rgba(3,13,40,0.95))', border: 'rgba(192,192,192,0.3)',
    Icon: Shield,
  },
  {
    name: 'Gold', cap: '$1,500', sub: 'Enhanced Royalty', c: '#F5A623',
    bg: 'linear-gradient(135deg, rgba(245,166,35,0.18), rgba(3,13,40,0.95))', border: 'rgba(245,166,35,0.4)',
    Icon: Crown,
  },
  {
    name: 'Platinum', cap: '$2,000', sub: 'Premium Royalty', c: '#38BDF8',
    bg: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(3,13,40,0.95))', border: 'rgba(56,189,248,0.35)',
    Icon: Gem,
  },
  {
    name: 'Diamond', cap: '$5,000', sub: 'Elite Royalty', c: '#C084FC',
    bg: 'linear-gradient(135deg, rgba(192,132,252,0.18), rgba(3,13,40,0.95))', border: 'rgba(192,132,252,0.4)',
    Icon: Sparkles,
  },
]

export function RoyaltyCards() {
  return (
    <section id="royalty" data-testid="royalty-section" className="relative py-20 sm:py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 right-0">06</span>

      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-10 sm:mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#A855F7]/25 bg-[#A855F7]/8 text-[#A855F7] mb-5">
            Royalty Membership
          </span>
          <h2 className="font-black text-white text-3xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Royalty Card <span className="text-brand">Tiers</span>
          </h2>
          <p className="text-white/55 text-sm sm:text-base mt-4 max-w-xl">
            Unlock your tier for daily passive distributions from the global royalty pool. Maximum combined cap: $8,800.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.name}
              data-testid={`royalty-card-${t.name.toLowerCase()}`}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative group"
            >
              {/* Hover glow */}
              <div className="absolute -inset-0.5 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(ellipse, ${t.c}25, transparent)` }}
              />
              <div
                className="relative rounded-xl sm:rounded-2xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-2 aspect-[4/5] sm:aspect-[1.6/1]"
                style={{ background: t.bg, border: `1px solid ${t.border}` }}
              >
                {/* Top shine */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, transparent, ${t.c}80, transparent)` }} />
                {/* Content */}
                <div className="absolute inset-0 p-3.5 sm:p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-extrabold text-lg sm:text-2xl tracking-tight mb-0.5 truncate" style={{ color: t.c }}>{t.name}</div>
                      <div className="text-[8px] sm:text-[10px] text-white tracking-widest uppercase font-semibold">{t.sub}</div>
                    </div>
                    <div
                      className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-lg flex items-center justify-center"
                      style={{ background: `${t.c}15`, border: `1px solid ${t.c}40` }}
                    >
                      <t.Icon
                        className="w-5 h-5 sm:w-6 sm:h-6"
                        style={{ color: t.c }}
                        strokeWidth={2}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[9px] text-white uppercase tracking-[0.2em] mb-1 font-semibold"> Cap</div>
                    <div className="font-black text-xl sm:text-3xl leading-none tracking-tight" style={{ color: t.c }}>{t.cap}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-5 sm:mt-6 rounded-2xl border border-white/6 bg-white/[0.025] p-4 sm:p-5 text-center"
        >
          <span className="text-white/45 text-xs sm:text-sm">Combined Max Royalty Cap: </span>
          <span className="font-mono-custom font-extrabold text-gold text-lg sm:text-xl">$8,800</span>
          <span className="text-white/25 text-[10px] sm:text-xs ml-2 block sm:inline mt-1 sm:mt-0">($300 + $1,500 + $2,000 + $5,000)</span>
        </motion.div>
      </div>
    </section>
  )
}
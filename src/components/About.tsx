import React from 'react'
import { motion } from 'framer-motion'
import { Users, Cpu, Lock, ArrowRight } from 'lucide-react'
import { AnimatedRocket } from './AnimatedRocket'

const PILLARS = [
  { icon: Users, title: 'Community First', desc: 'Built by the community, for the community — every participant is a valued member of the global FutureRide ecosystem.', color: '#38BDF8' },
  { icon: Cpu, title: 'BNB Smart Chain', desc: 'Leveraging the speed, security, and low fees of BNB Smart Chain for seamless automated reward distribution.', color: '#F5A623' },
  { icon: Lock, title: 'Fully Transparent', desc: 'Every transaction is on-chain. Verified smart contracts ensure zero manipulation and complete trust.', color: '#38BDF8' },
]

const POINTS = [
  'Decentralized — No Company, No Admins, No Fees',
  'Automated via Verified Smart Contracts',
  'Permanent Slots — No Time Limits, No Expiry',
  'BNB Smart Chain — Fast, Secure, Low-Cost',
]

export function About() {
  return (
    <section id="about" data-testid="about-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 -left-4">01</span>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#F5A623]/25 bg-[#F5A623]/8 text-[#F5A623] mb-5">
            About The Platform
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Built For <span className="text-brand">Growth, Leadership</span><br />
            &amp; Long-Term Success
          </h2>
        </motion.div>

        {/* Layout: quote card + pillar cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
          {/* Big quote */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="lg:col-span-3 grad-border rounded-2xl"
          >
            <div className="h-full bg-[#030D28]/90 rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
              <blockquote
                data-testid="about-quote"
                className="font-extrabold text-xl sm:text-2xl md:text-3xl text-white leading-tight tracking-tight mb-6"
              >
                "A Global Community Built On{' '}
                <span className="text-sky-grad">Growth</span>,{' '}
                <span className="text-gold">Participation</span>
                {' '}&amp; Decentralized Freedom"
              </blockquote>
              <div className="space-y-3 mb-6">
                {POINTS.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-white/65">
                    <span className="w-5 h-5 rounded-full bg-[#38BDF8]/12 border border-[#38BDF8]/25 flex items-center justify-center flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                    </span>
                    {p}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[#38BDF8] text-sm font-semibold">
                <span>Powered by BNB Smart Chain</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </motion.div>

          {/* Mini rocket */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2 flex items-center justify-center py-8"
          >
            <AnimatedRocket size={180} />
          </motion.div>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              data-testid={`about-pillar-${i}`}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
              className="card p-6 hover:-translate-y-1 transition-transform duration-300"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${p.color}12`, border: `1px solid ${p.color}28` }}
              >
                <p.icon size={20} style={{ color: p.color }} />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{p.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

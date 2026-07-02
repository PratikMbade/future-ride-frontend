import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const BENEFITS = [
  { t: 'Unlock 100% of Your Success Potential', d: 'A disciplined, structured growth model designed to help every participant reach their full potential.' },
  { t: 'True Financial Freedom', d: 'Tools, community, and a transparent reward system to achieve real financial independence.' },
  { t: 'Personal Development & Leadership', d: 'Beyond rewards — develop leadership skills, communication abilities, and community mastery.' },
  { t: 'Stronger Network Opportunities', d: 'Stronger connections, stronger opportunities, and a stronger future for every participant.' },
  { t: 'Generational Opportunities', d: 'Create lasting opportunities for future generations through sustainable ecosystem design.' },
  { t: 'Simple & Accessible Entry', d: 'An accessible pathway where individuals can participate, connect, and unlock new growth.' },
  { t: 'Growth Powered by Teamwork', d: 'Growth fueled by collective participation — every member strengthens the entire ecosystem.' },
]

export function Benefits() {
  return (
    <section id="benefits" data-testid="benefits-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 right-4">08</span>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/8 text-[#38BDF8] mb-5">
            Why Choose FutureRide
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Benefits That Drive<br /><span className="text-brand">Real Growth</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Featured card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="lg:col-span-2 grad-border rounded-2xl"
          >
            <div className="bg-[#030D28]/90 rounded-2xl p-8 h-full">
              <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/12 border border-[#38BDF8]/25 flex items-center justify-center mb-6">
                <CheckCircle2 size={28} className="text-[#38BDF8]" />
              </div>
              <h3 className="font-extrabold text-2xl text-white mb-4 leading-tight">
                {BENEFITS[0].t}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-7">{BENEFITS[0].d}</p>
              <div className="space-y-3">
                {['Global Community Access', '3 Income Streams', 'Lifetime Rank Slots', 'BNB Smart Chain Security'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Checklist */}
          <div className="lg:col-span-3 space-y-3">
            {BENEFITS.slice(1).map((b, i) => (
              <motion.div
                key={i}
                data-testid={`benefit-card-${i + 1}`}
                initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex items-start gap-4 p-5 rounded-xl card hover:-translate-y-0.5 transition-transform duration-200 group"
              >
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-[#38BDF8] opacity-60 group-hover:opacity-100 transition-opacity" />
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{b.t}</h4>
                  <p className="text-white/50 text-xs leading-relaxed">{b.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

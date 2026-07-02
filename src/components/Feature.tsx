import React from 'react'
import { motion } from 'framer-motion'
import { Globe, Zap, Shield, Users, Star, Code, TrendingUp, Heart, Award, Rocket, Play, Gift } from 'lucide-react'

const FEATURES = [
  { n: '01', icon: Globe, title: 'Global Network', desc: 'Connect with members worldwide in a truly borderless, decentralized ecosystem.', wide: true, c: '#38BDF8' },
  { n: '02', icon: Zap, title: 'True Decentralization', desc: 'No company, no admins — pure peer-to-peer power.', c: '#F5A623' },
  { n: '03', icon: Shield, title: '100% Secure P2P', desc: 'Fully automated, transparent peer-to-peer transactions.', c: '#38BDF8' },
  { n: '04', icon: Star, title: 'Permanent Slots', desc: 'No time limits, no expiry — your rank lasts for life.', c: '#F5A623' },
  { n: '05', icon: Code, title: 'Verified Smart Contracts', desc: 'Audited BNB Smart Chain contracts — zero manipulation possible.', wide: true, c: '#A855F7' },
  { n: '06', icon: TrendingUp, title: 'Structured Growth', desc: '12-level pathway with clear participation and reward rules.', c: '#38BDF8' },
  { n: '07', icon: Heart, title: 'Community Driven', desc: 'Built by the community, for the community — always.', c: '#F5A623' },
  { n: '08', icon: Award, title: 'Leadership Building', desc: 'Develop leadership skills, communication & network mastery.', wide: true, c: '#38BDF8' },
  { n: '09', icon: Users, title: 'Long-Term Potential', desc: 'Designed for sustainable, long-term growth — not quick schemes.', c: '#F5A623' },
  { n: '10', icon: Play, title: 'Easy To Start', desc: 'Begin from just $5 with a simple, guided onboarding process.', c: '#A855F7' },
  { n: '11', icon: Gift, title: 'Multiple Rewards', desc: 'Earn Direct Income, Upgrade Income & Daily Royalty simultaneously.', c: '#38BDF8' },
  { n: '12', icon: Rocket, title: 'Decentralized Freedom', desc: 'Complete freedom from centralized control — your rules, your rewards.', c: '#F5A623' },
]

export function Features() {
  return (
    <section id="features" data-testid="features-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 right-0">02</span>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-14"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/8 text-[#38BDF8] mb-5">
            Platform Features
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            12 Powerful Features to<br />
            <span className="text-brand">Drive Your Success</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.n}
              data-testid={`feature-card-${i}`}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.4) }}
              className={`group card hover:-translate-y-1 transition-all duration-300 p-7 ${f.wide ? '' : ''}`}
              style={{ borderColor: `${f.c}20` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `${f.c}14`, border: `1px solid ${f.c}28` }}
                >
                  <f.icon size={20} style={{ color: f.c }} />
                </div>
                <span className="font-mono-custom font-bold " style={{ color: `` }}>{f.n}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
              <p className="text-[#38bdf8] text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

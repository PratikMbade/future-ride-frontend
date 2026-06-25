import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedRocket } from './AnimatedRocket'
import { LOGO_URL } from '../constants/assets'
import { ChevronDown, Shield, Zap, Globe } from 'lucide-react'

const TRUST = [
  { icon: Shield, label: 'Verified Smart Contract' },
  { icon: Zap, label: 'BNB Smart Chain' },
  { icon: Globe, label: '100% Decentralized' },
]

const STATS = [
  { val: '12', label: 'Package Levels' },
  { val: '$10K', label: 'Max Package' },
  { val: '3', label: 'Income Streams' },
  { val: '$8.8K', label: 'Royalty Cap' },
]

export function Hero() {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="home" data-testid="hero-section" className="relative min-h-screen flex items-center overflow-hidden">

      {/* Side rockets — decorative, tucked behind content, hidden on small mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="hidden md:flex absolute left-2 lg:left-10 top-1/2 -translate-y-1/2 rotate-[35deg] justify-center items-center pointer-events-none opacity-60 lg:opacity-100 z-0"
      >
        <AnimatedRocket size={240} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.3 }}
        className="hidden md:flex absolute right-2 lg:right-10 top-1/2 -translate-y-1/2 -rotate-[35deg] justify-center items-center pointer-events-none opacity-60 lg:opacity-100 z-0"
      >
        <AnimatedRocket size={240} />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-5 md:px-10 w-full pt-24 pb-32 flex flex-col items-center text-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className=" relative"
        >
          <div className="absolute -inset-4 rounded-full bg-[#38BDF8]/10 blur-3xl animate-glow-pulse" />
          <img
            src={LOGO_URL}
            alt="FutureRide Logo"
            data-testid="hero-logo"
            className="w-28 h-28 sm:w-44 sm:h-44 md:w-96 md:h-96   object-contain relative z-10 drop-shadow-[0_0_25px_rgba(56,189,248,0.45)]"
            style={{ mixBlendMode: 'screen' }}
          />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 text-[11px]  lg:text-[15px] font-semibold tracking-widest uppercase rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/6 text-[#38BDF8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            Community Growth & Reward Ecosystem
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          <p className="text-white/50 font-semibold text-sm sm:text-xs tracking-[0.18em] uppercase mb-2">
            Welcome to
          </p>
<h1
  data-testid="hero-headline"
  className="font-black leading-[0.92] text-7xl lg:text-8xl tracking-tight mb-6"
>
  <span className="text-shine-gold">FUTURE</span>
  <span className="text-shine-silver block sm:inline">RIDE</span>
</h1>
        </motion.div>

        {/* Description */}
        <motion.p
          data-testid="hero-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="text-white/65 text-base sm:text-lg leading-relaxed max-w-xl mb-8"
        >
          A growing global community built on growth, participation &amp; decentralized freedom.
          Powered by BNB Smart Chain smart contracts — automated, transparent, and permanent.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto justify-center"
        >
          <button
            data-testid="hero-primary-cta"
            onClick={() => go('packages')}
            className="btn-gold px-8 py-4 text-[15px] rounded-xl"
          >
            Join FutureRide
          </button>
          <button
            data-testid="hero-secondary-cta"
            onClick={() => go('about')}
            className="btn-outline px-8 py-4 text-[15px] rounded-xl"
          >
            Learn More
          </button>
        </motion.div>

        {/* Rocket — mobile only, inline in flow since side rockets are hidden below md */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="flex md:hidden justify-center items-center mb-10"
          data-testid="hero-rocket"
        >
          <AnimatedRocket size={180} />
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {TRUST.map((t) => (
            <div
              key={t.label}
              data-testid={`trust-indicator-${t.label.toLowerCase().replace(/\s/g, '-')}`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/10 bg-white/4 text-white/65 text-xs font-medium"
            >
              <t.icon size={13} className="text-[#38BDF8] flex-shrink-0" />
              {t.label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quick stats — full width band */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-[#020B20]/60 backdrop-blur-sm z-10"
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-testid={`trust-indicator-${s.label.toLowerCase().replace(/\s/g, '-')}`}
              className={`py-4 text-center ${i < 3 ? 'border-r border-white/5' : ''}`}
            >
              <div className="text-xl sm:text-2xl font-extrabold text-gold mb-0.5">{s.val}</div>
              <div className="text-white/40 text-xs font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        onClick={() => go('stats-marquee')}
        data-testid="hero-scroll-cue"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute right-6 bottom-24 text-white/20 hover:text-white/50 transition-colors hidden xl:block"
      >
        <ChevronDown size={22} />
      </motion.button>
    </section>
  )
}
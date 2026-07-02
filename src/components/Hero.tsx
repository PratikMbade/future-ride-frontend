import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedRocket } from './AnimatedRocket'
import { LOGO_URL } from '../constants/assets'
import { ChevronDown, Shield, Zap, Globe } from 'lucide-react'
import LaunchCountdown from './LaunchCountdown'

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
          <a
            href="https://whatsapp.com/channel/0029VbD7Y0477qVZZaf29E1b"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="hero-primary-cta"
            className="inline-flex items-center justify-center gap-2 bg-green-500 px-8 py-4 text-[15px] font-bold rounded-xl"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.22 8.22 0 0 1-1.26-4.4c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.27-8.22 8.27zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.23-.73-.66-1.23-1.46-1.37-1.71-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.36-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.24-.85.83-.85 2.03s.87 2.36 1 2.52c.12.17 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.19.21-.58.21-1.08.15-1.19-.07-.11-.23-.18-.48-.3z" />
            </svg>
            Join Whatsapp Channel
          </a>
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
import React from 'react'
import { motion } from 'framer-motion'
import { LOGO_URL } from '../constants/assets'
import { AnimatedRocket } from './AnimatedRocket'

export function CTASection() {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="cta" data-testid="cta-section" className="relative py-28 md:py-36 overflow-hidden">
      {/* Deep space gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(30,86,217,0.18) 0%, rgba(2,11,32,0) 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[120px] bg-[#F5A623]/8" />
      </div>

      {/* Small floating rockets as decorations */}
      <motion.div
        className="absolute top-10 right-10 opacity-20 hidden lg:block"
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AnimatedRocket size={80} />
      </motion.div>
      <motion.div
        className="absolute bottom-10 left-10 opacity-15 hidden lg:block"
        animate={{ y: [0, 12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        <AnimatedRocket size={60} />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-5 md:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Logo */}
          <motion.div
            className="relative mb-7"
            initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            <div className="absolute -inset-4 rounded-full bg-[#38BDF8]/10 blur-2xl animate-glow-pulse" />
            <img
              src={LOGO_URL}
              alt="FutureRide"
              className="w-20 h-20 object-contain relative z-10 drop-shadow-[0_0_24px_rgba(56,189,248,0.4)]"
              style={{ mixBlendMode: 'screen' }}
            />
          </motion.div>

          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#F5A623]/25 bg-[#F5A623]/8 text-[#F5A623] mb-6">
            Ready to Begin?
          </span>

          <h2
            data-testid="cta-headline"
            className="font-black text-white leading-none tracking-tight mb-7"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
          >
            Ready to Start Your<br />
            <span className="text-brand">FutureRide Journey?</span>
          </h2>

          <p className="text-white/60 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
            Join a growing global community built on growth, participation, and decentralized freedom.
            Your journey begins with a single step — starting at just $5.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-9 w-full sm:w-auto">
            <motion.button
              data-testid="cta-primary-button"
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => go('packages')}
              className="btn-gold px-10 py-4 text-[15px] rounded-xl min-w-[200px]"
            >
              Join FutureRide Now
            </motion.button>
            <motion.button
              data-testid="cta-secondary-button"
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => go('about')}
              className="btn-outline px-10 py-4 text-[15px] rounded-xl min-w-[200px]"
            >
              Learn More
            </motion.button>
          </div>

          <p className="text-white/25 text-xs max-w-lg">
            FutureRide is a community platform, not financial advice. Visit{' '}
            <a href="https://www.futureride.live" target="_blank" rel="noopener noreferrer" className="text-white/45 hover:text-white/70 transition-colors underline underline-offset-2">
              www.futureride.live
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

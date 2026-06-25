import React from 'react'
import { Globe, Twitter, Send } from 'lucide-react'
import { LOGO_URL } from '../constants/assets'

const LINKS = [
  { l: 'Home', h: '#home' }, { l: 'About', h: '#about' },
  { l: 'Features', h: '#features' }, { l: 'How It Works', h: '#how-it-works' },
  { l: 'Packages', h: '#packages' }, { l: 'Royalty', h: '#royalty' },
  { l: 'Benefits', h: '#benefits' }, { l: 'FAQ', h: '#faq' },
]

export function Footer() {
  const go = (h: string) => document.getElementById(h.slice(1))?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer data-testid="footer" className="border-t border-[#38BDF8]/8 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        {/* Brand hero */}
        <div className="text-center mb-14">
          <img
            src={LOGO_URL}
            alt="FutureRide"
            data-testid="footer-logo"
            className="w-24 h-24 object-contain mx-auto mb-5 drop-shadow-[0_0_20px_rgba(56,189,248,0.3)]"
            style={{ mixBlendMode: 'screen' }}
          />
<h1
  data-testid="hero-headline"
  className="font-black leading-[0.92] text-7xl lg:text-8xl tracking-tight mb-6"
>
  <span className="text-shine-gold">FUTURE</span>
  <span className="text-shine-silver block sm:inline">RIDE</span>
</h1>
          <p className="text-white/30 text-sm mt-3 font-medium tracking-widest">
            Community Growth &amp; Reward Ecosystem
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center mb-10">
          {LINKS.map((lnk) => (
            <button
              key={lnk.h}
              data-testid={`footer-link-${lnk.l.toLowerCase()}`}
              onClick={() => go(lnk.h)}
              className="text-white/30 text-sm font-medium hover:text-white/70 transition-colors duration-200"
            >
              {lnk.l}
            </button>
          ))}
        </div>

        {/* Social */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <a
            data-testid="footer-website-link"
            href="https://www.futureride.live" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/4 text-white/45 text-sm font-medium hover:text-white/75 hover:border-white/18 transition-all"
          >
            <Globe size={13} />
            <span>futureride.live</span>
          </a>
          <button data-testid="footer-telegram" className="w-10 h-10 rounded-xl border border-white/10 bg-white/4 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/18 transition-all">
            <Send size={13} />
          </button>
          <button data-testid="footer-twitter" className="w-10 h-10 rounded-xl border border-white/10 bg-white/4 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/18 transition-all">
            <Twitter size={13} />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-white/[0.04] pt-8">
          <p className="text-white/20 text-xs leading-relaxed text-center max-w-3xl mx-auto mb-4">
            FutureRide is a decentralized community participation ecosystem, not a financial advisor or investment company.
            All information is for educational purposes only. Participation involves risk.
            Cryptocurrency activities carry inherent financial risks. Past performance does not guarantee future results.
          </p>
          <p className="text-white/15 text-xs text-center">
            © {new Date().getFullYear()} FutureRide. All rights reserved. Built on BNB Smart Chain.
          </p>
        </div>
      </div>
    </footer>
  )
}

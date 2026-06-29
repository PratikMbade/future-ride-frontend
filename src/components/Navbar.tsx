import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { LOGO_URL } from '../constants/assets'
import { Link } from '@tanstack/react-router'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Packages', href: '#packages' },
  { label: 'Royalty', href: '#royalty' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState('home')

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
      const ids = ['home', ...navLinks.map((l) => l.href.slice(1))]
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i])
        if (el && window.scrollY >= el.offsetTop - 130) { setActive(ids[i]); break }
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (href: string) => {
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#020B20]/85 backdrop-blur-2xl border-b border-[#38BDF8]/10 shadow-lg shadow-black/30'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between h-[70px]">
        {/* Logo */}
        <button
          data-testid="navbar-logo"
          onClick={() => go('#home')}
          className="flex items-center gap-2.5 flex-shrink-0 group"
        >
          <div className="relative w-20 h-20  overflow-hidden  flex-shrink-0">
            <img
              src={LOGO_URL}
              alt="FutureRide"
              className="w-full h-full object-contain"
              // style={{ mixBlendMode: 'screen' }}
            />
          </div>
          <span className="text-white font-extrabold text-[18px] tracking-tight leading-none hidden sm:block">
            <span className="text-white">FUTURE</span>
            <span className="text-yellow-400">RIDE</span>
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => {
            const isActive = active === l.href.slice(1)
            return (
              <button
                key={l.href}
                data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => go(l.href)}
                className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isActive ? 'text-[#38BDF8]' : 'text-white/95 hover:text-white'
                }`}
              >
                {isActive && <span className="absolute inset-0 rounded-lg bg-[#38BDF8]/8 border border-[#38BDF8]/20" />}
                <span className="relative">{l.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            data-testid="navbar-cta-button"
            to={'/registration'}
            className="hidden lg:block px-6 py-2.5 text-sm font-bold text-black rounded-xl btn-gold"
          >
            Register
          </Link>
           <Link
            data-testid="navbar-cta-button"
            to={'/login'}
            className="hidden lg:block px-6 py-2.5 text-sm font-bold text-black rounded-xl bg-white"
          >
            Login
          </Link>
          <button
            data-testid="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          data-testid="navbar-mobile-menu"
          className="lg:hidden bg-[#020B20]/95 backdrop-blur-2xl border-b border-[#38BDF8]/10"
        >
          <div className="px-5 py-4 space-y-1">
            {navLinks.map((l) => (
              <button
                key={l.href}
                onClick={() => go(l.href)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  active === l.href.slice(1) ? 'text-[#38BDF8] bg-[#38BDF8]/8' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
              </button>

              
            ))}
            <div className='flex flex-col w-fit gap-4'>
                         <Link
            data-testid="navbar-cta-button"
            to={'/registration'}
            className=" lg:hidden px-6 py-2.5 text-sm font-bold text-black rounded-xl btn-gold"
          >
            Register
          </Link>
           <Link
            data-testid="navbar-cta-button"
            to={'/login'}
            className=" lg:hidden px-6 py-2.5 text-sm font-bold text-black rounded-xl bg-white"
          >
            Login
          </Link>
            </div>

          </div>
        </div>
      )}
    </nav>
  )
}

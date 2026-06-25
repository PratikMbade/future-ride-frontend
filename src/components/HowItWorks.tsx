import React from 'react'
import { motion } from 'framer-motion'
import { Wallet, Package, Users, DollarSign } from 'lucide-react'

const STEPS = [
  { n: '01', icon: Wallet, title: 'Connect Your Wallet', desc: 'Link your BNB Smart Chain wallet — MetaMask, Token Pocket, or SafePal. No sign-up required.', c: '#38BDF8' },
  { n: '02', icon: Package, title: 'Choose Your Package', desc: 'Select from 12 package levels starting at just $5. Each level unlocks greater rewards.', c: '#F5A623' },
  { n: '03', icon: Users, title: 'Build Your Network', desc: 'Refer others, grow your team, and activate upgrade income through collective participation.', c: '#38BDF8' },
  { n: '04', icon: DollarSign, title: 'Earn & Scale', desc: 'Collect Direct (20%), Upgrade (50%), and Daily Royalty (30%) rewards — fully automated.', c: '#F5A623' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" data-testid="how-it-works-section" className="relative py-28 md:py-36 overflow-hidden">
      <span aria-hidden className="sec-num -top-4 -left-4">03</span>

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full border border-[#F5A623]/25 bg-[#F5A623]/8 text-[#F5A623] mb-5">
            How It Works
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Start Your Journey in<br />
            <span className="text-brand">4 Simple Steps</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line desktop */}
          <div className="hidden lg:block absolute top-[54px] left-[calc(12.5%+30px)] right-[calc(12.5%+30px)] h-px"
            style={{ background: 'linear-gradient(90deg, #38BDF820, #F5A62340, #38BDF820)' }}
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              data-testid={`step-card-${i}`}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.14 }}
              className="flex flex-col lg:items-center lg:text-center"
            >
              {/* Icon */}
              <div className="relative mb-6 self-start lg:self-auto">
                <div
                  className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center relative z-10"
                  style={{ background: `${step.c}14`, border: `1px solid ${step.c}30` }}
                >
                  <step.icon size={24} style={{ color: step.c }} />
                </div>
                <span
                  className="absolute -top-2.5 -right-2.5 text-[10px] font-mono-custom font-bold px-2 py-0.5 rounded-md"
                  style={{ color: step.c, background: `${step.c}18`, border: `1px solid ${step.c}30` }}
                >
                  {step.n}
                </span>
              </div>

              <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{step.desc}</p>

              {i < STEPS.length - 1 && (
                <div className="lg:hidden mt-5 ml-[30px] h-6 w-px"
                  style={{ background: `linear-gradient(to bottom, ${step.c}40, transparent)` }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

import React from 'react'

const ITEMS = [
  '12 PACKAGE LEVELS', '$10,240 MAX PACKAGE', '3 INCOME STREAMS',
  '$8,800 ROYALTY CAP', '100% AUTOMATED', 'BNB SMART CHAIN',
  '100% PEER-TO-PEER', 'ZERO CENTRAL CONTROL', 'VERIFIED SMART CONTRACT',
  'PERMANENT RANK SLOTS', 'NO EXPIRY', 'GLOBAL COMMUNITY',
]

const DOUBLED = [...ITEMS, ...ITEMS]

export function StatsMarquee() {
  return (
    <div
      id="stats-marquee"
      data-testid="stats-marquee"
      className="relative overflow-hidden border-y border-[#38BDF8]/10 py-4 bg-[#030D28]/60"
    >
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#030D28] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-[#030D28] to-transparent pointer-events-none" />

      <div className="marquee-inner">
        {DOUBLED.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-4 px-5 shrink-0">
            <span
              data-testid={i < ITEMS.length ? `marquee-item-${i}` : undefined}
              className="font-bold text-xs tracking-[0.22em] text-white/50"
            >
              {item}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]/60 shrink-0" />
          </span>
        ))}
      </div>
    </div>
  )
}

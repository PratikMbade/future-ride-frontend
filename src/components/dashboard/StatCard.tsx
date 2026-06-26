import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  accent?: 'blue' | 'purple' | 'cyan' | 'gold' | 'green' | 'red' | 'default'
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
  'data-testid'?: string
}

const ACCENTS = {
  blue:    { border: 'border-[#38BDF8]/25', glow: 'shadow-[0_0_24px_rgba(56,189,248,0.08)]', badge: 'bg-[#38BDF8]/10 text-[#38BDF8]', val: '#38BDF8' },
  purple:  { border: 'border-[#8B5CF6]/25', glow: 'shadow-[0_0_24px_rgba(139,92,246,0.1)]',  badge: 'bg-[#8B5CF6]/10 text-[#8B5CF6]', val: '#8B5CF6' },
  cyan:    { border: 'border-[#06B6D4]/25', glow: 'shadow-[0_0_24px_rgba(6,182,212,0.1)]',   badge: 'bg-[#06B6D4]/10 text-[#06B6D4]', val: '#06B6D4' },
  gold:    { border: 'border-[#F5A623]/25', glow: 'shadow-[0_0_24px_rgba(245,166,35,0.1)]',  badge: 'bg-[#F5A623]/10 text-[#F5A623]', val: '#F5A623' },
  green:   { border: 'border-[#22C55E]/25', glow: 'shadow-[0_0_24px_rgba(34,197,94,0.08)]',  badge: 'bg-[#22C55E]/10 text-[#22C55E]', val: '#22C55E' },
  red:     { border: 'border-[#EF4444]/25', glow: 'shadow-[0_0_24px_rgba(239,68,68,0.08)]',  badge: 'bg-[#EF4444]/10 text-[#EF4444]', val: '#EF4444' },
  default: { border: 'border-white/8',      glow: '',                                          badge: 'bg-white/8 text-white/60',        val: '#94A3B8' },
}

export function StatCard({ title, value, subtitle, accent = 'default', icon, trend, trendValue, className = '', 'data-testid': testId }: StatCardProps) {
  const a = ACCENTS[accent]
  return (
    <div
      data-testid={testId}
      className={`relative rounded-xl border bg-[#090F22] p-4 overflow-hidden group hover:border-opacity-50 transition-all duration-300 ${a.border} ${a.glow} ${className}`}
    >
      {/* subtle grid bg */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.8) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/40">{title}</p>
          {icon && <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.badge}`}>{icon}</div>}
        </div>
        <p className="text-2xl font-black tracking-tight text-white mb-0.5" style={{ fontFamily: 'Outfit' }}>{value}</p>
        {subtitle && <p className="text-xs text-white/35">{subtitle}</p>}
        {trend && trendValue && (
          <div className={`inline-flex items-center gap-1 mt-1.5 text-xs font-medium ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white/40'}`}>
            {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  )
}

interface GradientStatCardProps {
  title: string
  value: string | number
  subtitle?: string
  gradient: string
  icon?: React.ReactNode
  bottomText?: string
  'data-testid'?: string
}

export function GradientStatCard({ title, value, subtitle, gradient, icon, bottomText, 'data-testid': testId }: GradientStatCardProps) {
  return (
    <div data-testid={testId} className={`relative rounded-xl p-4 overflow-hidden ${gradient}`} style={{ minHeight: 120 }}>
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[15px] font-semibold tracking-widest uppercase text-white/60">{title}</p>
          {icon && <div className="text-white/50">{icon}</div>}
        </div>
        <p className="text-5xl font-black text-white mt-auto">{value}</p>
        {subtitle && <p className="text-md text-white/80 mt-0.5">{subtitle}</p>}
        {bottomText && <p className="text-xs text-white/80 mt-1">{bottomText}</p>}
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// 6:00 PM IST, June 29, 2026 → IST is UTC+5:30
const LAUNCH_DATE = new Date('2026-06-29T18:00:00+05:30').getTime()

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function getTimeLeft(): TimeLeft {
  const diff = LAUNCH_DATE - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: false,
  }
}

function useCountdown(): TimeLeft {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft)

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  return timeLeft
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export default function LaunchCountdown() {
  const { days, hours, minutes, seconds, done } = useCountdown()

  const UNITS = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      data-testid="hero-launch-countdown"
      className="relative w-full max-w-3xl mb-10"
    >
      {/* Glow behind card */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#F5A623]/30 via-[#38BDF8]/20 to-[#F5A623]/30 blur-2xl opacity-60" />

      <div className="relative rounded-3xl border border-[#F5A623]/30 bg-[#020B20]/90 backdrop-blur-xl px-6 py-7 sm:px-10 sm:py-9 overflow-hidden">
        {/* faint top sheen */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5A623]/60 to-transparent" />

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#F5A623] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F5A623]" />
          </span>
          <span className="font-mono-custom text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-[#F5A623]">
            {done ? "We're Live Now" : 'Official Launch Countdown'}
          </span>
        </div>

        {done ? (
          <p className="text-center text-white text-2xl sm:text-3xl font-extrabold">
            🚀 FutureRide has launched!
          </p>
        ) : (
          <>
            {/* Digit blocks */}
            <div className="flex items-center justify-center  sm:gap-5">
              {UNITS.map((u, i) => (
                <div key={u.label} className="flex items-center gap-2.5 sm:gap-5">
                  <div className="flex flex-col items-center">
                    <div className="relative rounded-2xl border border-white/12 bg-black/50 px-3.5 py-3 sm:px-7 sm:py-5 min-w-[64px] sm:min-w-[96px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <span className="block text-center font-mono-custom text-3xl sm:text-5xl font-black text-white tabular-nums leading-none">
                        {pad(u.value)}
                      </span>
                    </div>
                    <span className="mt-2.5 font-mono-custom text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                      {u.label}
                    </span>
                  </div>
                  {i < UNITS.length - 1 && (
                    <span className="-mt-5 font-mono-custom text-2xl sm:text-4xl font-bold text-[#F5A623]/50">
                      :
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Date line */}
            <p className="mt-6 text-center font-mono-custom text-xs sm:text-sm font-semibold tracking-[0.1em] text-white/45">
              29 JUNE 2026 &nbsp;·&nbsp; 6:00 PM IST
            </p>
          </>
        )}
      </div>
    </motion.div>
  )
}
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Plane, CheckCircle2, XCircle, Loader2, Users, Package,
  DollarSign, Clock, TrendingUp, RefreshCw, AlertCircle,
} from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { StatCard } from '../StatCard'
import type { DubaiTourEligibilityResponse, DubaiTourGenerationBusinessResponse } from '../../../types/dashboard'

const API = import.meta.env.VITE_API_URL

const TOUR_START = new Date('2026-08-30T00:00:00Z').getTime()
const TOUR_END = new Date('2026-10-30T23:59:59Z').getTime()

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function useTourWindow() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const total = TOUR_END - TOUR_START
  const elapsed = Math.min(Math.max(now - TOUR_START, 0), total)
  const progress = total > 0 ? elapsed / total : 0
  const remainingMs = Math.max(0, TOUR_END - now)
  const totalSeconds = Math.floor(remainingMs / 1000)

  return {
    days: String(Math.floor(totalSeconds / 86400)).padStart(2, '0'),
    hours: String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0'),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
    progress,
    progressPct: Math.round(progress * 100),
    notStarted: now < TOUR_START,
    ended: now >= TOUR_END,
  }
}

function CountdownBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#081421] border border-[#38bdf8]/20 min-w-[48px] sm:min-w-[62px]">
      <span className="font-mono text-base sm:text-2xl font-black text-white leading-none">{value}</span>
      <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.14em] uppercase text-[#7dd3fc] mt-1">{label}</span>
    </div>
  )
}

function ProgressBar({ pct, met }: { pct: number; met: boolean }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${clamped}%`,
          background: met
            ? 'linear-gradient(90deg,#16a34a,#4ade80)'
            : 'linear-gradient(90deg,#1B4FD8,#38BDF8)',
        }}
      />
    </div>
  )
}

function MetPill({ met, pendingLabel = 'Pending' }: { met: boolean; pendingLabel?: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 border ${
        met ? 'bg-[#22C55E]/10 border-[#22C55E]/30' : 'bg-white/[0.04] border-white/10'
      }`}
    >
      {met ? <CheckCircle2 size={11} className="text-[#4ade80]" /> : <XCircle size={11} className="text-white/30" />}
      <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${met ? 'text-[#4ade80]' : 'text-white/40'}`}>
        {met ? 'Done' : pendingLabel}
      </span>
    </div>
  )
}

function GridOverlay() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(rgba(56,189,248,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.8) 1px,transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  )
}

export default function DubaiTourPage() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => {
    refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  const countdown = useTourWindow()

  const { data, isLoading, isError, refetch, isFetching } = useQuery<DubaiTourEligibilityResponse>({
    queryKey: ['dashboard', 'dubai-tour-eligibility', address],
    queryFn: async () => {
      const res = await fetch(`${API}/api/user/dubai-tour-eligibility`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load Dubai Tour eligibility')
      const json = await res.json()
      if (!json.success) throw new Error('Failed to load Dubai Tour eligibility')
      return json
    },
    enabled: sessionReady,
    staleTime: 60 * 1000,
  })

  // Separate, heavier query: walks the full referral downline (not just
  // direct referrals), so it's kept on its own endpoint/loading state and
  // never blocks the eligibility card above.
  const {
    data: genBusinessData,
    isLoading: genBusinessLoading,
    isError: genBusinessError,
    refetch: refetchGenBusiness,
    isFetching: genBusinessFetching,
  } = useQuery<DubaiTourGenerationBusinessResponse>({
    queryKey: ['dashboard', 'dubai-tour-generation-business', address],
    queryFn: async () => {
      const res = await fetch(`${API}/api/user/dubai-tour-generation-business`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load generation team business')
      const json = await res.json()
      if (!json.success) throw new Error('Failed to load generation team business')
      return json
    },
    enabled: sessionReady,
    staleTime: 5 * 60 * 1000,
  })

  if (sessionPending) {
    return (
      <div className="relative space-y-6" data-testid="dubai-tour-page">
        <header>
          <p className="text-2xl sm:text-3xl font-bold text-white">Dubai Tour</p>
          <span className="text-sm sm:text-base font-medium text-white/70">Elite rewards trip for top performers</span>
        </header>
        <div className="flex items-center justify-center gap-2 py-16">
          <Loader2 size={18} className="animate-spin text-[#7dd3fc]" />
          <p className="text-white font-mono text-sm font-semibold">Loading session…</p>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="relative space-y-6" data-testid="dubai-tour-page">
        <header>
          <p className="text-2xl sm:text-3xl font-bold text-white">Dubai Tour</p>
          <span className="text-sm sm:text-base font-medium text-white/70">Elite rewards trip for top performers</span>
        </header>
        <div className="flex items-center justify-center py-16">
          <p className="text-white font-mono text-sm font-semibold">Sign in to view your Dubai Tour eligibility</p>
        </div>
      </div>
    )
  }

  const ownPackages = data?.requirements.ownPackages
  const directTeam = data?.requirements.directTeam
  const eligible = !!data?.eligible

  return (
    <div className="relative space-y-4" data-testid="dubai-tour-page">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            <span className="text-brand">Dubai Tour</span>
          </p>
          <span className="text-xs sm:text-sm font-medium text-white/60">
            An all-expenses Dubai trip for members who unlock both requirements below
          </span>
        </div>
      </header>

      {/* Campaign window / countdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative rounded-2xl border border-[#38bdf8]/20 bg-[#080F26] p-4 sm:p-5 overflow-hidden"
        data-testid="dubai-tour-countdown"
      >
        <GridOverlay />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-[#38BDF8]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#7dd3fc] leading-none">
                  Campaign window
                </p>
                <p className="text-sm font-bold text-white mt-1">Aug 30 – Oct 30, 2026</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <CountdownBlock value={countdown.days} label="Days" />
              <CountdownBlock value={countdown.hours} label="Hrs" />
              <CountdownBlock value={countdown.minutes} label="Min" />
              <CountdownBlock value={countdown.seconds} label="Sec" />
            </div>
          </div>

          <div>
            <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-linear"
                style={{ width: `${countdown.progressPct}%`, background: 'linear-gradient(90deg,#1B4FD8,#38BDF8)' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] font-mono text-white/40">
              <span>Aug 30</span>
              <span className="text-white/60 font-semibold">
                {countdown.notStarted ? 'Not started' : countdown.ended ? 'Campaign ended' : `${countdown.progressPct}% elapsed`}
              </span>
              <span>Oct 30</span>
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16">
          <Loader2 size={18} className="animate-spin text-[#7dd3fc]" />
          <p className="text-white font-mono text-sm font-semibold">Checking eligibility…</p>
        </div>
      ) : isError || !data ? (
        <div className="rounded-2xl border border-[#EF4444]/25 bg-[#080F26] p-6 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle size={22} className="text-[#EF4444]" />
          <p className="text-sm font-semibold text-white/80">Couldn't load your Dubai Tour eligibility.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white/80 border border-white/15 hover:bg-white/[0.06] transition-all"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Eligibility hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="relative rounded-2xl overflow-hidden border-2"
            style={{
              borderColor: eligible ? 'rgba(34,197,94,0.4)' : 'rgba(245,166,35,0.3)',
              background: eligible
                ? 'linear-gradient(120deg,#052e1a 0%, #0a4d2c 50%, #052e1a 100%)'
                : 'linear-gradient(120deg,#1e1405 0%,#3d2a08 50%,#1e1405 100%)',
            }}
            data-testid="dubai-tour-eligibility-banner"
          >
            <GridOverlay />
            <div className="relative z-10 p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center"
                style={{ background: eligible ? 'rgba(34,197,94,0.15)' : 'rgba(245,166,35,0.15)' }}
              >
                <Plane size={24} className={eligible ? 'text-[#4ade80]' : 'text-[#F5A623]'} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-bold tracking-[0.14em] uppercase leading-none"
                  style={{ color: eligible ? '#4ade80' : '#F5A623' }}
                >
                  {eligible ? 'Eligible' : 'Not yet eligible'}
                </p>
                <p className="text-base sm:text-xl font-black text-white leading-tight mt-1.5">
                  {eligible ? "You're qualified for the Dubai Tour" : 'Keep building to unlock the Dubai Tour'}
                </p>
                <p className="text-xs sm:text-sm text-white/60 mt-1">
                  {eligible
                    ? 'You have met both requirements before the campaign closes.'
                    : 'Complete both requirements below before the countdown ends.'}
                </p>
              </div>
              <div className="hidden sm:flex shrink-0">
                {eligible ? (
                  <CheckCircle2 size={28} className="text-[#4ade80]" />
                ) : (
                  <XCircle size={28} className="text-[#F5A623]" />
                )}
              </div>
            </div>
          </motion.div>

          {/* Generation team business (separate, potentially slow, endpoint) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
            data-testid="dubai-tour-generation-business"
          >
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#F5A623]/10 flex items-center justify-center shrink-0">
                  <DollarSign size={16} className="text-[#F5A623]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Generation Team Business</p>
                  <p className="text-[10px] text-white/40">
                    Packages bought by your full downline — direct referrals and every referral beneath them — during the campaign window
                  </p>
                </div>
              </div>
              {genBusinessError && (
                <button
                  type="button"
                  onClick={() => refetchGenBusiness()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white/80 border border-white/15 hover:bg-white/[0.06] transition-all shrink-0"
                >
                  <RefreshCw size={11} className={genBusinessFetching ? 'animate-spin' : ''} />
                  Retry
                </button>
              )}
            </div>

            {genBusinessLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 size={16} className="animate-spin text-[#7dd3fc]" />
                <p className="text-white/60 font-mono text-xs font-semibold">Crunching your downline — this can take a moment…</p>
              </div>
            ) : genBusinessError ? (
              <p className="text-xs text-white/50">Couldn't load this figure right now.</p>
            ) : (
              <div className="flex items-end justify-between flex-wrap gap-2">
                <p className="text-2xl font-black text-white font-mono leading-none" style={{ fontFamily: 'Outfit' }}>
                  {usd(genBusinessData?.totalGenerationBusiness ?? 0)}
                </p>
                <p className="text-[10px] text-white/40">{genBusinessData?.downlineCount ?? 0} downline members</p>
              </div>
            )}
          </motion.div>

          {/* Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Own packages */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
              data-testid="dubai-tour-requirement-own-packages"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center shrink-0">
                    <Package size={16} className="text-[#38BDF8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">Own Packages</p>
                    <p className="text-[10px] text-white/40">Minimum active packages you must hold</p>
                  </div>
                </div>
                <MetPill met={ownPackages?.met ?? false} />
              </div>

              <div className="flex items-end justify-between mb-2">
                <p className="text-2xl font-black text-white font-mono leading-none" style={{ fontFamily: 'Outfit' }}>
                  {ownPackages?.current ?? 0}
                  <span className="text-white/30 text-base"> / {ownPackages?.required ?? 0}</span>
                </p>
              </div>
              <ProgressBar
                pct={ownPackages ? (ownPackages.current / Math.max(1, ownPackages.required)) * 100 : 0}
                met={ownPackages?.met ?? false}
              />
            </motion.div>

            {/* Direct team */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
              data-testid="dubai-tour-requirement-direct-team"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#38BDF8]/10 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-[#38BDF8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">Direct Team</p>
                    <p className="text-[10px] text-white/40">Meet either requirement below</p>
                  </div>
                </div>
                <MetPill met={directTeam?.met ?? false} />
              </div>

              <div className="space-y-4 mt-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <p className="text-xs font-semibold text-white/70 leading-snug">
                      Qualifying direct referrals
                      <span className="text-white/35">
                        {' '}(≥ {directTeam?.qualifyingDirectReferrals.packagesRequiredPerReferral ?? 0} packages each)
                      </span>
                    </p>
                    <MetPill met={directTeam?.qualifyingDirectReferrals.met ?? false} />
                  </div>
                  <div className="flex items-end justify-between mb-1.5">
                    <p className="text-lg font-black text-white font-mono leading-none">
                      {directTeam?.qualifyingDirectReferrals.current ?? 0}
                      <span className="text-white/30 text-sm"> / {directTeam?.qualifyingDirectReferrals.required ?? 0}</span>
                    </p>
                  </div>
                  <ProgressBar
                    pct={
                      directTeam
                        ? (directTeam.qualifyingDirectReferrals.current / Math.max(1, directTeam.qualifyingDirectReferrals.required)) * 100
                        : 0
                    }
                    met={directTeam?.qualifyingDirectReferrals.met ?? false}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <p className="text-xs font-semibold text-white/70">Total direct package value</p>
                    <MetPill met={directTeam?.totalDirectPackageValue.met ?? false} />
                  </div>
                  <div className="flex items-end justify-between mb-1.5">
                    <p className="text-lg font-black text-white font-mono leading-none">
                      {usd(directTeam?.totalDirectPackageValue.current ?? 0)}
                      <span className="text-white/30 text-sm"> / {usd(directTeam?.totalDirectPackageValue.required ?? 0)}</span>
                    </p>
                  </div>
                  <ProgressBar
                    pct={
                      directTeam
                        ? (directTeam.totalDirectPackageValue.current / Math.max(1, directTeam.totalDirectPackageValue.required)) * 100
                        : 0
                    }
                    met={directTeam?.totalDirectPackageValue.met ?? false}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}

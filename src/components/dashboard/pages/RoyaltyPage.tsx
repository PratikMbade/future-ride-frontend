import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Lock, Medal, Crown, ShieldCheck, Gem, Loader2, CheckCircle2, AlertCircle, Sparkles, Users, TrendingUp, Wallet, Zap } from 'lucide-react'
import { ethers } from 'ethers'
import { useActiveAccount } from 'thirdweb/react'
import { authClient } from '@/lib/authClient'
import { royaltyContract } from '@/contract/royalty/royaltyContract'
import futureRideLogo from '@/assets/future-ride-logo.png'

const API = import.meta.env.VITE_API_URL

interface TierConfig {
  id: string
  poolNumber: number
  name: string
  base: string
  light: string
  dark: string
  sheen: string
  textColor: string
  accentColor: string
  badge: string
  icon: typeof Medal
}

const TIER_CONFIG: TierConfig[] = [
  { id: 'silver',   poolNumber: 3, name: 'Silver',   base: '#A6ACB4', light: '#F4F6F8', dark: '#5B6168', sheen: 'rgba(255,255,255,0.85)', textColor: '#1B1F23', accentColor: '#272B30', badge: 'SLV', icon: Medal },
  { id: 'gold',     poolNumber: 5, name: 'Gold',     base: '#C99A3B', light: '#FBE8AE', dark: '#6B4A12', sheen: 'rgba(255,244,210,0.9)',  textColor: '#241902', accentColor: '#3D2A08', badge: 'GLD', icon: Crown },
  { id: 'platinum', poolNumber: 7, name: 'Platinum', base: '#9B9FA5', light: '#C8C9CA', dark: '#60656B', sheen: 'rgba(232,240,250,0.9)',  textColor: '#16191C', accentColor: '#272D33', badge: 'PLT', icon: ShieldCheck },
  { id: 'diamond',  poolNumber: 9, name: 'Diamond',  base: '#D7EBF2', light: '#FFFFFF', dark: '#7FA9BC', sheen: 'rgba(255,255,255,0.95)', textColor: '#0F1E24', accentColor: '#1A3F4F', badge: 'DMD', icon: Gem },
]

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type ClaimTxState = 'idle' | 'pending' | 'mining' | 'success' | 'error'
type PoolState = 'locked' | 'claimable' | 'claimed-this-phase' | 'graduated' | 'loading'

interface PoolStatus {
  state: PoolState
  claimed: number
  maxClaim: number
  remaining: number
  isUncapped: boolean
}

const LOADING_STATUS: PoolStatus = { state: 'loading', claimed: 0, maxClaim: 0, remaining: 0, isUncapped: false }

async function fetchPoolStatus(
  contract: ethers.Contract,
  readAddress: string,
  poolNumber: number,
): Promise<PoolStatus> {
  const [userDetails, activePool, currentPhase] = await Promise.all([
    contract.userDetails(readAddress, poolNumber),
    contract.userActivePool(readAddress),
    contract.phaseDetail(),
  ])

  const joined       = (userDetails.joined as ethers.BigNumber)
  const claimedWei    = (userDetails.claimed as ethers.BigNumber)
  const lastClaimed   = (userDetails.lastClaimed as ethers.BigNumber)
  const maxClaimWei   = (userDetails.maxClaim as ethers.BigNumber)
  const activePoolNum = (activePool as ethers.BigNumber).toNumber()
  const phase          = (currentPhase as ethers.BigNumber)

  const claimed    = parseFloat(ethers.utils.formatUnits(claimedWei, 18))
  const maxClaim   = parseFloat(ethers.utils.formatUnits(maxClaimWei, 18))
  const isUncapped = maxClaimWei.isZero()
  const remaining  = isUncapped ? 0 : Math.max(0, maxClaim - claimed)

  if (joined.isZero()) {
    return { state: 'locked', claimed, maxClaim, remaining, isUncapped }
  }
  if (activePoolNum !== poolNumber) {
    return { state: 'graduated', claimed, maxClaim, remaining, isUncapped }
  }

  const alreadyClaimedThisPhase = lastClaimed.eq(phase)
  const exhausted = !isUncapped && claimedWei.gte(maxClaimWei)

  if (alreadyClaimedThisPhase) return { state: 'claimed-this-phase', claimed, maxClaim, remaining, isUncapped }
  if (exhausted)               return { state: 'graduated',          claimed, maxClaim, remaining, isUncapped }
  return { state: 'claimable', claimed, maxClaim, remaining, isUncapped }
}

interface PoolStats {
  memberCount: number
  distributedAmt: number
}

const LOADING_STATS: PoolStats = { memberCount: 0, distributedAmt: 0 }

async function fetchPoolStats(contract: ethers.Contract, poolNumber: number): Promise<PoolStats> {
  const [countBn, details] = await Promise.all([
    contract.getCounts(poolNumber),
    contract.poolDetails(poolNumber),
  ])
  return {
    memberCount: (countBn as ethers.BigNumber).toNumber(),
    distributedAmt: parseFloat(ethers.utils.formatUnits(details.distributedAmt as ethers.BigNumber, 18)),
  }
}

function usePhaseCountdown(contract: ethers.Contract | null) {
  const [intervalSeconds, setIntervalSeconds] = useState<number | null>(null)
  const [currentPhaseStart, setCurrentPhaseStart] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!contract) return
    let cancelled = false

    contract.royalty(contract.address).then((r: any) => {
      if (cancelled) return
      setIntervalSeconds((r.interval as ethers.BigNumber).toNumber())
    }).catch(() => {})

    contract.phaseDetail().then((p: ethers.BigNumber) => {
      if (cancelled) return
      setCurrentPhaseStart(p.toNumber())
    }).catch(() => {})

    return () => { cancelled = true }
  }, [contract])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (intervalSeconds === null || currentPhaseStart === null) {
    return { h: '--', m: '--', s: '--', progress: 0, ready: false }
  }

  const nextPhaseStartMs = (currentPhaseStart + intervalSeconds) * 1000
  const remainingMs = Math.max(0, nextPhaseStartMs - now)
  const totalSeconds = Math.floor(remainingMs / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')

  const elapsed = intervalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / (intervalSeconds * 1000))) : 0

  return { h, m, s, progress: elapsed, ready: true }
}

function CompactCountdown({ countdown }: { countdown: ReturnType<typeof usePhaseCountdown> }) {
  const R = 14
  const C = 2 * Math.PI * R
  const dash = C * countdown.progress

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#38bdf8]/30 bg-[#081421]">
      <div className="relative w-[36px] h-[36px] shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={R} fill="none" stroke="rgba(125,211,252,0.12)" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r={R} fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            className="transition-all duration-700 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={12} className="text-[#7dd3fc]" />
        </div>
      </div>
      <div>
        <p className="m-0 text-[9px] font-bold tracking-[0.14em] uppercase text-[#7dd3fc] leading-none">Next phase</p>
        <p className="font-mono text-[15px] font-bold text-white leading-tight mt-1">
          {countdown.h}:{countdown.m}:{countdown.s}
        </p>
      </div>
    </div>
  )
}

function QuickClaimBar({
  activeTier, activeStatus, txState, txError, canClaim, onClaim, countdown,
}: {
  activeTier: TierConfig
  activeStatus: PoolStatus
  txState: ClaimTxState
  txError: string
  canClaim: boolean
  onClaim: () => void
  countdown: ReturnType<typeof usePhaseCountdown>
}) {
  const Icon = activeTier.icon
  const isBusy = txState === 'pending' || txState === 'mining'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative rounded-2xl overflow-hidden border-2 border-[#38bdf8]/40"
      style={{
        background: `linear-gradient(120deg, ${activeTier.dark} 0%, ${activeTier.base} 45%, ${activeTier.dark} 100%)`,
        boxShadow: '0 12px 32px -8px rgba(56,189,248,0.35), inset 0 0 0 1px rgba(255,255,255,0.15)',
      }}
      data-testid="royalty-quick-claim"
    >
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 2px, transparent 5px)' }}
      />

      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.3)', border: `1.5px solid ${activeTier.accentColor}40` }}
            >
              <Icon size={22} style={{ color: activeTier.accentColor }} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-[#0f3d1f]" fill="#16a34a" />
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase leading-none" style={{ color: activeTier.textColor }}>
                  Claim ready
                </p>
              </div>
              <p className="text-lg font-bold tracking-[0.02em] uppercase leading-tight mt-1" style={{ color: activeTier.textColor }}>
                {activeTier.name} pool
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] font-bold tracking-[0.14em] uppercase leading-none opacity-75" style={{ color: activeTier.textColor }}>
              {activeStatus.isUncapped ? 'Cap' : 'Remaining'}
            </p>
            <p className="font-mono text-base font-bold leading-tight mt-1" style={{ color: activeTier.textColor }}>
              {activeStatus.isUncapped ? '∞' : usd(activeStatus.remaining)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/25 shrink-0">
            <Sparkles size={11} className="text-[#7dd3fc]" />
            <span className="font-mono text-[11px] font-bold text-white">
              {countdown.h}:{countdown.m}:{countdown.s}
            </span>
          </div>

          <button
            onClick={onClaim}
            disabled={isBusy || !canClaim}
            data-testid={`royalty-quick-claim-btn-${activeTier.id}`}
            className="group relative flex-1 overflow-hidden py-3 rounded-lg text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={isBusy || !canClaim ? {
              background: 'rgba(4,17,31,0.6)', color: '#ffffff', border: '1.5px solid rgba(255,255,255,0.25)',
            } : {
              background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
              color: '#04111f',
              boxShadow: '0 6px 20px rgba(56,189,248,0.45)',
            }}
          >
            {!isBusy && canClaim && (
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)' }} />
            )}
            <span className="relative inline-flex items-center gap-2">
              {isBusy ? (
                <><Loader2 size={15} className="animate-spin" />{txState === 'pending' ? 'Confirm in wallet…' : 'Claiming…'}</>
              ) : !canClaim ? (
                <><Wallet size={14} />Connect wallet</>
              ) : (
                <>Claim now<Zap size={14} /></>
              )}
            </span>
          </button>
        </div>

        {txState === 'error' && txError && (
          <p className="text-xs font-mono font-bold text-center mt-2 flex items-center justify-center gap-1.5 text-[#fecaca]">
            <AlertCircle size={11} />{txError}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function UnifiedTierCard({
  tier, index, status, stats, statsLoading, txState, txError, canClaim, onClaim, isActiveTier,
}: {
  tier: TierConfig
  index: number
  status: PoolStatus
  stats: PoolStats
  statsLoading: boolean
  txState: ClaimTxState
  txError: string
  canClaim: boolean
  onClaim: () => void
  isActiveTier: boolean
}) {
  const Icon = tier.icon
  const isBusy = txState === 'pending' || txState === 'mining'

  const perUser = stats.memberCount > 0 ? stats.distributedAmt / stats.memberCount : 0

  const statusPill = (() => {
    switch (status.state) {
      case 'claimable':          return { label: 'Ready',      color: '#16a34a', bg: 'rgba(34,197,94,0.22)', border: 'rgba(34,197,94,0.55)' }
      case 'claimed-this-phase': return { label: 'Claimed',    color: '#0f3d1f', bg: 'rgba(34,197,94,0.28)', border: 'rgba(34,197,94,0.7)' }
      case 'locked':             return { label: 'Locked',     color: '#94a3b8', bg: 'rgba(148,163,184,0.18)', border: 'rgba(148,163,184,0.4)' }
      case 'graduated':          return { label: 'Complete',   color: '#4ade80', bg: 'rgba(74,222,128,0.18)', border: 'rgba(74,222,128,0.4)' }
      default:                   return { label: 'Loading',    color: '#7dd3fc', bg: 'rgba(125,211,252,0.15)', border: 'rgba(125,211,252,0.3)' }
    }
  })()
const isDiamond = tier.id === 'diamond'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="relative rounded-2xl overflow-hidden"
      data-testid={`royalty-card-${tier.id}`}
      style={isActiveTier ? { boxShadow: '0 0 0 2px #38bdf8, 0 10px 28px -8px rgba(56,189,248,0.35)' } : {}}
    >
      <div
        className="relative p-4"
        style={{
          background: `linear-gradient(135deg, ${tier.dark} 0%, ${tier.base} 35%, ${tier.light} 55%, ${tier.base} 75%, ${tier.dark} 100%)`,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.10] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 2px, transparent 5px)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDiamond
              ? 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.9) 0%, rgba(196,225,255,0.3) 18%, rgba(255,214,238,0.18) 32%, transparent 60%)'
              : `radial-gradient(circle at 30% 20%, ${tier.sheen} 0%, transparent 55%)`,
            mixBlendMode: 'screen',
            opacity: 0.55,
          }}
        />

        <img
          src={futureRideLogo}
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: '60%', maxWidth: '220px', opacity: 0.5, objectFit: 'contain',
          }}
        />

        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.28)',
                border: `1.5px solid ${tier.accentColor}40`,
              }}
            >
              <Icon size={18} style={{ color: tier.accentColor }} strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase leading-none opacity-80" style={{ color: tier.textColor }}>
                Pool {tier.poolNumber}
              </p>
              <p className="text-base font-bold tracking-[0.02em] leading-tight mt-0.5" style={{ color: tier.textColor }}>
                {tier.name}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
            style={{ background: statusPill.bg, border: `1px solid ${statusPill.border}` }}
          >
            {status.state === 'claimable' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
            )}
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: statusPill.color === '#0f3d1f' || statusPill.color === '#16a34a' ? '#ffffff' : statusPill.color }}>
              {statusPill.label}
            </span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(4,17,31,0.55)' }}>
            <p className="text-[9px] font-bold tracking-wider uppercase text-white/70 mb-1 flex items-center gap-1">
              <Users size={9} /> Royalty Holders
            </p>
            <p className="text-sm font-bold text-white font-mono leading-tight">
              {statsLoading ? '—' : stats.memberCount.toLocaleString('en-US')}
            </p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(4,17,31,0.55)' }}>
            <p className="text-[9px] font-bold tracking-wider uppercase text-white/70 mb-1 flex items-center gap-1">
              <TrendingUp size={9} /> Today's Distribute
            </p>
            <p className="text-sm font-bold text-white font-mono leading-tight">
              {statsLoading ? '—' : usd(stats.distributedAmt)}
            </p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(4,17,31,0.55)' }}>
            <p className="text-[9px] font-bold tracking-wider uppercase text-white/70 mb-1">
              Per holder
            </p>
            <p className="text-sm font-bold text-white font-mono leading-tight">
              {statsLoading ? '—' : usd(perUser)}
            </p>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(4,17,31,0.55)' }}>
            <p className="text-[9px] font-bold tracking-wider uppercase text-white/70 mb-1">
              Your claimed
            </p>
            <p className="text-sm font-bold text-white font-mono leading-tight">
              {status.state === 'loading' ? '—' : usd(status.claimed)}
            </p>
          </div>
        </div>

        <div className="relative z-10">
          {status.state === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-2 rounded-lg" style={{ background: 'rgba(4,17,31,0.5)' }}>
              <Loader2 size={14} className="animate-spin text-[#7dd3fc]" />
              <span className="text-xs font-mono font-bold text-white">Loading…</span>
            </div>
          )}

          {status.state === 'locked' && (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg" style={{ background: 'rgba(4,17,31,0.65)' }}>
              <Lock size={13} className="text-white" />
              <span className="text-xs font-mono font-semibold text-white">
                Reach this tier to unlock
              </span>
            </div>
          )}

          {status.state === 'graduated' && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(4,17,31,0.6)' }}>
              <CheckCircle2 size={14} className="text-[#4ade80] shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-white leading-snug">
                {status.claimed === 0
                  ? 'Claim limit passed to next royalty pool'
                  : `Complete — total claimed ${usd(status.claimed)}. Upgrade for next pool.`}
              </p>
            </div>
          )}

          {status.state === 'claimed-this-phase' && (
            <div
              className="w-full py-2.5 rounded-lg text-center text-xs font-mono font-bold tracking-wide border border-[#22c55e] bg-green-500 flex items-center justify-center gap-1.5"
              // style={{ background: 'rgba(34,197,94,0.35)', color: '#ffffff' }}
              data-testid={`royalty-claimed-${tier.id}`}
            >
              <CheckCircle2 size={12} />
              Claimed this phase
            </div>
          )}

          {status.state === 'claimable' && (
            <>
              {!canClaim ? (
                <div
                  className="w-full py-2.5 rounded-lg text-center text-xs font-mono font-bold tracking-wide border border-white/30 flex items-center justify-center gap-1.5"
                  style={{ background: 'rgba(4,17,31,0.6)', color: '#ffffff' }}
                  data-testid={`royalty-wallet-required-${tier.id}`}
                >
                  <Wallet size={12} />
                  Connect wallet to claim
                </div>
              ) : (
                <button
                  onClick={onClaim}
                  disabled={isBusy}
                  data-testid={`royalty-claim-btn-${tier.id}`}
                  className="group relative w-full overflow-hidden py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={isBusy ? {
                    background: 'rgba(4,17,31,0.6)', color: '#ffffff', border: '1.5px solid rgba(255,255,255,0.3)',
                  } : {
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                    color: '#04111f',
                    boxShadow: '0 4px 14px rgba(56,189,248,0.35)',
                  }}
                >
                  {!isBusy && (
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)' }} />
                  )}
                  <span className="relative inline-flex items-center gap-1.5">
                    {isBusy ? (
                      <><Loader2 size={14} className="animate-spin" />{txState === 'pending' ? 'Confirm…' : 'Claiming…'}</>
                    ) : (
                      <>Claim reward<Zap size={13} /></>
                    )}
                  </span>
                </button>
              )}
            </>
          )}

          {txState === 'error' && txError && (
            <p className="text-[11px] font-mono font-bold text-center mt-2 flex items-center justify-center gap-1 text-[#e71a1a]">
              <AlertCircle size={11} />{txError}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
 
}

export default function RoyaltyFundPool() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => {
    refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const readAddress = session?.user?.name
  const sessionReady = !sessionPending && !!readAddress

  const account = useActiveAccount()
  const walletAddress = account?.address

  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [contractLoading, setContractLoading] = useState(false)

  useEffect(() => {
    if (!account) {
      setContract(null)
      return
    }
    let cancelled = false
    setContractLoading(true)
    royaltyContract(account)
      .then(c => { if (!cancelled) setContract(c ?? null) })
      .finally(() => { if (!cancelled) setContractLoading(false) })
    return () => { cancelled = true }
  }, [account])

  const [statuses, setStatuses] = useState<Record<number, PoolStatus>>(
    Object.fromEntries(TIER_CONFIG.map(t => [t.poolNumber, LOADING_STATUS]))
  )
  const [txStates, setTxStates] = useState<Record<number, ClaimTxState>>({})
  const [txErrors, setTxErrors] = useState<Record<number, string>>({})

  const [poolStats, setPoolStats] = useState<Record<number, PoolStats>>(
    Object.fromEntries(TIER_CONFIG.map(t => [t.poolNumber, LOADING_STATS]))
  )
  const [statsLoading, setStatsLoading] = useState(true)

  const phaseCountdown = usePhaseCountdown(contract)

  const loadAllPoolStats = useCallback(async () => {
    if (!contract) return
    setStatsLoading(true)
    const results = await Promise.allSettled(
      TIER_CONFIG.map(t => fetchPoolStats(contract, t.poolNumber))
    )
    setPoolStats(prev => {
      const next = { ...prev }
      results.forEach((r, i) => {
        const poolNumber = TIER_CONFIG[i].poolNumber
        if (r.status === 'fulfilled') next[poolNumber] = r.value
      })
      return next
    })
    setStatsLoading(false)
  }, [contract])

  useEffect(() => { loadAllPoolStats() }, [loadAllPoolStats])

  const loadAllStatuses = useCallback(async () => {
    if (!contract || !readAddress) return

    const results = await Promise.allSettled(
      TIER_CONFIG.map(t => fetchPoolStatus(contract, readAddress, t.poolNumber))
    )

    setStatuses(prev => {
      const next = { ...prev }
      results.forEach((r, i) => {
        const poolNumber = TIER_CONFIG[i].poolNumber
        if (r.status === 'fulfilled') next[poolNumber] = r.value
      })
      return next
    })
  }, [contract, readAddress])

  useEffect(() => { loadAllStatuses() }, [loadAllStatuses])

  const handleClaim = useCallback(async (poolNumber: number) => {
    if (!contract || !walletAddress) return

    setTxStates(prev => ({ ...prev, [poolNumber]: 'pending' }))
    setTxErrors(prev => ({ ...prev, [poolNumber]: '' }))

    try {
      const tx = await contract.claimReward(walletAddress)
      setTxStates(prev => ({ ...prev, [poolNumber]: 'mining' }))
      await tx.wait(1)

      setTxStates(prev => ({ ...prev, [poolNumber]: 'success' }))

      fetch(`${API}/api/royalty/fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactionHash: tx.hash }),
      }).catch(() => {})

      await Promise.all([loadAllStatuses(), loadAllPoolStats()])
    } catch (err: any) {
      const msg: string = err?.reason ?? err?.data?.message ?? err?.message ?? ''
      let friendly = 'Claim failed. Please try again.'
      if (msg.toLowerCase().includes('user rejected') || msg.includes('4001')) {
        friendly = 'You rejected the transaction.'
      } else if (msg.includes('Already Claimed')) {
        friendly = 'Already claimed for this phase.'
      } else if (msg.includes('No Users Found')) {
        friendly = 'You will be eligible for next phase not current one.'
      }
      setTxStates(prev => ({ ...prev, [poolNumber]: 'error' }))
      setTxErrors(prev => ({ ...prev, [poolNumber]: friendly }))
    }
  }, [contract, walletAddress, loadAllStatuses, loadAllPoolStats])

  const activeClaimable = useMemo(() => {
    return TIER_CONFIG.find(t => statuses[t.poolNumber]?.state === 'claimable') ?? null
  }, [statuses])

  if (sessionPending) {
    return (
      <div className="relative space-y-6" data-testid="royalty-fund-pool">
        <header>
          <p className="text-2xl sm:text-3xl font-bold text-white">Royalty Fund Pool</p>
          <span className="text-sm sm:text-base font-medium text-white/70">
            Tier-based rewards. Higher packages unlock higher caps.
          </span>
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
      <div className="relative space-y-6" data-testid="royalty-fund-pool">
        <header>
          <p className="text-2xl sm:text-3xl font-bold text-white">Royalty Fund Pool</p>
          <span className="text-sm sm:text-base font-medium text-white/70">
            Tier-based rewards. Higher packages unlock higher caps.
          </span>
        </header>
        <div className="flex items-center justify-center py-16">
          <p className="text-white font-mono text-sm font-semibold">Sign in to view royalty status</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-4" data-testid="royalty-fund-pool">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl font-bold text-white leading-tight">Royalty Fund Pool</p>
          <span className="text-xs sm:text-sm font-medium text-white/70">
            Tier-based rewards. Higher packages unlock higher caps.
          </span>
        </div>
        <CompactCountdown countdown={phaseCountdown} />
      </header>

      {contractLoading ? (
        <div className="flex items-center justify-center gap-2 py-16">
          <Loader2 size={18} className="animate-spin text-[#7dd3fc]" />
          <p className="text-white font-mono text-sm font-semibold">Connecting to contract…</p>
        </div>
      ) : !contract ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-white font-mono text-sm font-semibold">Connect your wallet to view royalty status</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeClaimable && (
            <QuickClaimBar
              activeTier={activeClaimable}
              activeStatus={statuses[activeClaimable.poolNumber] ?? LOADING_STATUS}
              txState={txStates[activeClaimable.poolNumber] ?? 'idle'}
              txError={txErrors[activeClaimable.poolNumber] ?? ''}
              canClaim={!!walletAddress}
              onClaim={() => handleClaim(activeClaimable.poolNumber)}
              countdown={phaseCountdown}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TIER_CONFIG.map((tier, i) => (
              <UnifiedTierCard
                key={tier.id}
                tier={tier}
                index={i}
                status={statuses[tier.poolNumber] ?? LOADING_STATUS}
                stats={poolStats[tier.poolNumber] ?? LOADING_STATS}
                statsLoading={statsLoading}
                txState={txStates[tier.poolNumber] ?? 'idle'}
                txError={txErrors[tier.poolNumber] ?? ''}
                canClaim={!!walletAddress}
                onClaim={() => handleClaim(tier.poolNumber)}
                isActiveTier={activeClaimable?.poolNumber === tier.poolNumber}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Lock, Medal, Crown, ShieldCheck, Gem, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { ethers } from 'ethers'
import { useActiveAccount } from 'thirdweb/react'
import { authClient } from '@/lib/authClient'
import { royaltyContract } from '@/contract/royalty/royaltyContract'
import futureRideLogo from '@/assets/future-ride-logo.png'

const API = import.meta.env.VITE_API_URL

// ─── tier definitions — static display config only; all numeric
//     claim/cap/remaining data now comes from on-chain reads ──────────
interface TierConfig {
  id: string
  poolNumber: number   // 3 | 5 | 7 | 9 — matches the contract's "package" arg exactly
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
  {
    id: 'silver', poolNumber: 3, name: 'Silver',
    base: '#A6ACB4', light: '#F4F6F8', dark: '#5B6168',
    sheen: 'rgba(255,255,255,0.85)', textColor: '#1B1F23', accentColor: '#272B30',
    badge: 'SLV', icon: Medal,
  },
  {
    id: 'gold', poolNumber: 5, name: 'Gold',
    base: '#C99A3B', light: '#FBE8AE', dark: '#6B4A12',
    sheen: 'rgba(255,244,210,0.9)', textColor: '#241902', accentColor: '#3D2A08',
    badge: 'GLD', icon: Crown,
  },
  {
    id: 'platinum', poolNumber: 7, name: 'Platinum',
    base: '#9B9FA5', light: '#C8C9CA', dark: '#60656B',
    sheen: 'rgba(232,240,250,0.9)', textColor: '#16191C', accentColor: '#272D33',
    badge: 'PLT', icon: ShieldCheck,
  },
  {
    id: 'diamond', poolNumber: 9, name: 'Diamond',
    base: '#D7EBF2', light: '#FFFFFF', dark: '#7FA9BC',
    sheen: 'rgba(255,255,255,0.95)', textColor: '#0F1E24', accentColor: '#1A3F4F',
    badge: 'DMD', icon: Gem,
  },
]

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── per-pool on-chain status ───────────────────────────────
type ClaimTxState = 'idle' | 'pending' | 'mining' | 'success' | 'error'

type PoolState = 'locked' | 'claimable' | 'claimed-this-phase' | 'graduated' | 'loading'

interface PoolStatus {
  state:       PoolState
  claimed:     number
  maxClaim:    number
  remaining:   number
  isUncapped:  boolean
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

  const joined        = (userDetails.joined as ethers.BigNumber)
  const claimedWei     = (userDetails.claimed as ethers.BigNumber)
  const lastClaimed    = (userDetails.lastClaimed as ethers.BigNumber)
  const maxClaimWei    = (userDetails.maxClaim as ethers.BigNumber)
  const activePoolNum  = (activePool as ethers.BigNumber).toNumber()
  const phase           = (currentPhase as ethers.BigNumber)

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

  if (alreadyClaimedThisPhase) {
    return { state: 'claimed-this-phase', claimed, maxClaim, remaining, isUncapped }
  }
  if (exhausted) {
    return { state: 'graduated', claimed, maxClaim, remaining, isUncapped }
  }

  return { state: 'claimable', claimed, maxClaim, remaining, isUncapped }
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

function PhaseCountdown({ countdown }: { countdown: ReturnType<typeof usePhaseCountdown> }) {
  const R = 19
  const C = 2 * Math.PI * R
  const dash = C * countdown.progress

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-[#38bdf8]/30 bg-[#081421]">
      <div className="relative w-[52px] h-[52px] shrink-0">
        <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
          <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(125,211,252,0.12)" strokeWidth="5" />
          <circle
            cx="26" cy="26" r={R} fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            className="transition-all duration-700 ease-linear"
            style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.6))' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={16} className="text-[#7dd3fc]" />
        </div>
      </div>

      <div>
        <p className="m-0 text-[11px] font-bold tracking-[0.16em] uppercase text-[#7dd3fc]">Next phase in</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {[
            { v: countdown.h, l: 'H' },
            { v: countdown.m, l: 'M' },
            { v: countdown.s, l: 'S' },
          ].map(({ v, l }, i) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 min-w-[40px]">
                <span className="font-mono text-[18px] font-bold text-white leading-none">{v}</span>
                <span className="font-mono text-[8px] font-bold tracking-[0.1em] text-[#7dd3fc] mt-0.5">{l}</span>
              </div>
              {i < 2 && <span className="text-white text-[16px] font-bold">:</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniCountdownChip({ countdown, emphasis }: {
  countdown: ReturnType<typeof usePhaseCountdown>
  emphasis?: boolean
}) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl"
      style={{
        background: 'rgba(4,17,31,0.82)',
        border: emphasis ? '1.5px solid #38bdf8' : '1.5px solid rgba(56,189,248,0.4)',
      }}
    >
      <Sparkles size={13} className="text-[#7dd3fc] shrink-0" />
      <span className="text-[11.5px] font-bold tracking-[0.06em] uppercase text-white">Next phase</span>
      <span className="font-mono text-[14px] font-bold text-white">
        {countdown.h}:{countdown.m}:{countdown.s}
      </span>
    </div>
  )
}

function PremiumCard({
  tier, index, status, txState, txError, canClaim, onClaim, countdown,
}: {
  tier: TierConfig
  index: number
  status: PoolStatus
  txState: ClaimTxState
  txError: string
  canClaim: boolean
  onClaim: () => void
  countdown: ReturnType<typeof usePhaseCountdown>
}) {
  const isDiamond = tier.id === 'diamond'
  const Icon = tier.icon
  const isBusy = txState === 'pending' || txState === 'mining'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="relative rounded-3xl overflow-hidden"
      data-testid={`royalty-card-${tier.id}`}
    >
      <div
        className="relative flex flex-col min-h-[360px]"
        style={{
          background: `linear-gradient(135deg, ${tier.dark} 0%, ${tier.base} 35%, ${tier.light} 55%, ${tier.base} 75%, ${tier.dark} 100%)`,
          boxShadow: '0 22px 48px -12px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.12)',
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
            width: '70%', maxWidth: '300px', opacity: 0.65, objectFit: 'contain',
          }}
        />

        <div className="relative z-10 px-8 pt-7 pb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] uppercase leading-none" style={{ color: tier.textColor }}>
              Future Ride
            </p>
            <p className="text-2xl font-bold tracking-[0.04em] uppercase leading-none mt-2" style={{ color: tier.textColor }}>
              {tier.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status.state === 'claimable' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.22)', border: '1.5px solid rgba(34,197,94,0.55)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: '#0f3d1f' }}>Live</span>
              </div>
            )}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.28)', border: `1.5px solid ${tier.accentColor}40` }}>
              <Icon size={28} style={{ color: tier.accentColor }} strokeWidth={2.25} />
            </div>
            <Wifi size={22} style={{ color: tier.textColor, transform: 'rotate(90deg)' }} />
          </div>
        </div>

        <div className="flex-1" />

        {status.state === 'loading' && (
          <div className="relative z-10 px-8 pb-7 flex items-center justify-center gap-2 py-6">
            <Loader2 size={18} className="animate-spin" style={{ color: tier.textColor }} />
            <span className="text-sm font-mono font-bold" style={{ color: tier.textColor }}>Loading…</span>
          </div>
        )}

        {status.state === 'locked' && (
          <div
            className="relative z-10 px-8 pb-8 pt-3 flex flex-col items-center text-center gap-3"
            style={{ background: 'rgba(4,17,31,0.72)' }}
          >
            <Lock size={30} className="text-white" />
            <p className="text-lg font-bold leading-snug max-w-[280px] text-white">
              Not yet unlocked
            </p>
            <p className="text-sm font-mono font-semibold tracking-wide text-white">
              Reach this royalty tier to participate
            </p>
          </div>
        )}

        {status.state === 'graduated' && (
          <div
            className="relative z-10 px-8 pb-8 pt-3 flex flex-col items-center text-center gap-3"
            style={{ background: 'rgba(4,17,31,0.62)' }}
          >
            <CheckCircle2 size={28} className="text-[#4ade80]" />
            {status.claimed === 0 ? (
              <p className="text-lg font-bold leading-snug max-w-70 text-white">
                Your claim limit passed to next royalty pool
              </p>
            ) : (
              <>
                <p className="text-lg font-bold leading-snug max-w-70 text-white">
                  You've reached maximum limit of this royalty pool, upgrade packages for next pool
                </p>
                <p className="text-sm font-mono font-semibold tracking-wide text-white">
                  Total claimed here: {usd(status.claimed)}
                </p>
              </>
            )}
          </div>
        )}

        {(status.state === 'claimable' || status.state === 'claimed-this-phase') && (
          <>
            <div className="relative z-10 px-8 pb-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(4,17,31,0.5)' }}>
                <p className="text-xs font-bold tracking-wider uppercase mb-1.5 text-white">
                  Amount Claimed
                </p>
                <p className="text-3xl font-bold text-white">{usd(status.claimed)}</p>
              </div>
              <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(4,17,31,0.5)' }}>
                <p className="text-xs font-bold tracking-wider uppercase mb-1.5 text-white">
                  {status.isUncapped ? 'Cap' : 'Remaining'}
                </p>
                <p className="text-3xl font-bold text-white">
                  {status.isUncapped ? 'Uncapped' : usd(status.remaining)}
                </p>
              </div>
            </div>

            <div className="relative z-10 px-8 pb-7 flex flex-col gap-3">
              <MiniCountdownChip countdown={countdown} emphasis={status.state === 'claimed-this-phase'} />

              {status.state === 'claimed-this-phase' ? (
                <div
                  className="w-full py-3.5 rounded-xl text-center text-sm font-mono font-bold tracking-wide border-2 border-[#22c55e]/90"
                  style={{ background: 'rgba(34,197,94,2.68)', color: '#ffffff' }}
                  data-testid={`royalty-claimed-${tier.id}`}
                >
                  Already claimed this phase
                </div>
              ) : !canClaim ? (
                <div
                  className="w-full py-3.5 rounded-xl text-center text-sm font-mono font-bold tracking-wide border-2 border-white/30"
                  style={{ background: 'rgba(4,17,31,0.55)', color: '#ffffff' }}
                  data-testid={`royalty-wallet-required-${tier.id}`}
                >
                  Connect wallet to claim
                </div>
              ) : (
                <button
                  onClick={onClaim}
                  disabled={isBusy}
                  data-testid={`royalty-claim-btn-${tier.id}`}
                  className="group relative w-full overflow-hidden py-4 rounded-full text-[15px] font-bold tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={isBusy ? {
                    background: 'rgba(4,17,31,0.6)', color: '#ffffff', border: '2px solid rgba(255,255,255,0.3)',
                  } : {
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                    color: '#04111f',
                    boxShadow: '0 8px 26px rgba(56,189,248,0.45)',
                  }}
                >
                  {!isBusy && (
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)' }} />
                  )}
                  <span className="relative inline-flex items-center gap-2">
                    {isBusy ? (
                      <><Loader2 size={17} className="animate-spin" />{txState === 'pending' ? 'Confirm in wallet…' : 'Claiming…'}</>
                    ) : (
                      'Claim Reward'
                    )}
                  </span>
                </button>
              )}

              {txState === 'error' && txError && (
                <p className="text-md font-mono font-bold text-center flex items-center justify-center gap-1.5 text-[#e71a1a]">
                  <AlertCircle size={12} />{txError}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── page ──────────────────────────────────────────────────
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

  const phaseCountdown = usePhaseCountdown(contract)

  const loadAllStatuses = useCallback(async () => {
    if (!contract || !readAddress) return

    const results = await Promise.allSettled(
      TIER_CONFIG.map(t => fetchPoolStatus(contract, readAddress, t.poolNumber))
    )

    setStatuses(prev => {
      const next = { ...prev }
      results.forEach((r, i) => {
        const poolNumber = TIER_CONFIG[i].poolNumber
        if (r.status === 'fulfilled') {
          next[poolNumber] = r.value
        }
      })
      return next
    })
  }, [contract, readAddress])

  useEffect(() => {
    loadAllStatuses()
  }, [loadAllStatuses])

  const handleClaim = useCallback(async (poolNumber: number) => {
    if (!contract || !walletAddress) return

    setTxStates(prev => ({ ...prev, [poolNumber]: 'pending' }))
    setTxErrors(prev => ({ ...prev, [poolNumber]: '' }))

    try {
      const tx = await contract.claimReward(walletAddress)
      setTxStates(prev => ({ ...prev, [poolNumber]: 'mining' }))
      await tx.wait(1)

      setTxStates(prev => ({ ...prev, [poolNumber]: 'success' }))

      // Fallback safety net — fired AFTER the claim transaction is
      // confirmed, not instead of relying on the live royalty event
      // listener. If the listener is up and already processing this
      // transaction, this endpoint's idempotency check (against
      // transactionHash inside royaltyincome.service.ts) makes the
      // call a safe no-op. If the listener is down or lagging, this
      // POST is what actually gets the claim recorded into
      // RoyaltyIncome. Deliberately NOT awaited and NOT blocking the
      // success UI state or the status refresh below — this is
      // insurance, mirroring the registration fallback call already
      // wired into RegisterPage.tsx's handleRegister.
      fetch(`${API}/api/royalty/fallback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transactionHash: tx.hash }),
      }).catch(() => {
        // best-effort — if this fails, the live event listener is the
        // remaining safety net; nothing more to do client-side
      })

      await loadAllStatuses()
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
  }, [contract, walletAddress, loadAllStatuses])

  if (sessionPending) {
    return (
      <div className="relative space-y-8" data-testid="royalty-fund-pool">
        <header>
          <p className="text-3xl font-bold text-white">Royalty Fund Pool</p>
          <span className="text-lg font-medium text-white">
            Tier-based royalty rewards. Higher packages unlock higher claim caps.
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
      <div className="relative space-y-8" data-testid="royalty-fund-pool">
        <header>
          <p className="text-3xl font-bold text-white">Royalty Fund Pool</p>
          <span className="text-lg font-medium text-white">
            Tier-based royalty rewards. Higher packages unlock higher claim caps.
          </span>
        </header>
        <div className="flex items-center justify-center py-16">
          <p className="text-white font-mono text-sm font-semibold">Sign in to view royalty status</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-8" data-testid="royalty-fund-pool">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-3xl font-bold text-white">Royalty Fund Pool</p>
          <span className="text-lg font-medium text-white">
            Tier-based royalty rewards. Higher packages unlock higher claim caps.
          </span>
        </div>
        <PhaseCountdown countdown={phaseCountdown} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TIER_CONFIG.map((tier, i) => (
            <PremiumCard
              key={tier.id}
              tier={tier}
              index={i}
              status={statuses[tier.poolNumber] ?? LOADING_STATUS}
              txState={txStates[tier.poolNumber] ?? 'idle'}
              txError={txErrors[tier.poolNumber] ?? ''}
              canClaim={!!walletAddress}
              onClaim={() => handleClaim(tier.poolNumber)}
              countdown={phaseCountdown}
            />
          ))}
        </div>
      )}
    </div>
  )
}
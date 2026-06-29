import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Lock, Medal, Crown, ShieldCheck, Gem } from 'lucide-react'
import futureRideLogo from '@/assets/future-ride-logo.png'

// ─── tier definitions ──────────────────────────────────────
interface CardTier {
  id: string
  name: string
  base: string
  light: string
  dark: string
  sheen: string
  textColor: string
  accentColor: string
  badge: string
  icon: typeof Medal
  locked: boolean
  unlockPackage?: number
  cap: number
  claimed: number   // mock — replace with real API data
  remaining: number // mock — replace with real API data
}

const TIERS: CardTier[] = [
  {
    id: 'silver', name: 'Silver',
    base: '#A6ACB4', light: '#F4F6F8', dark: '#5B6168',
    sheen: 'rgba(255,255,255,0.85)', textColor: '#2A2E33', accentColor: '#3A3F45',
    badge: 'SLV', icon: Medal, locked: false, cap: 500, claimed: 120, remaining: 180,
  },
  {
    id: 'gold', name: 'Gold',
    base: '#C99A3B', light: '#FBE8AE', dark: '#6B4A12',
    sheen: 'rgba(255,244,210,0.9)', textColor: '#2C1F08', accentColor: '#4A330D',
    badge: 'GLD', icon: Crown, locked: false, cap: 1000, claimed: 300, remaining: 1200
,
  },
{
    id: 'platinum', name: 'Platinum',
    base: '#9B9FA5', light: '#C8C9CA', dark: '#60656B',
    sheen: 'rgba(232,240,250,0.9)', textColor: '#22262B', accentColor: '#39424B',
    badge: 'PLT', icon: ShieldCheck, locked: true, unlockPackage: 7, cap: 2000, claimed: 0, remaining: 0,
  },
  {
    id: 'diamond', name: 'Diamond',
    base: '#D7EBF2', light: '#FFFFFF', dark: '#7FA9BC',
    sheen: 'rgba(255,255,255,0.95)', textColor: '#1B2E36', accentColor: '#235468',
    badge: 'DMD', icon: Gem, locked: true, unlockPackage: 9, cap: 5000, claimed: 0, remaining: 0,
  },
]

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── single card ───────────────────────────────────────────
function PremiumCard({ tier, index }: { tier: CardTier; index: number }) {
  const isDiamond = tier.id === 'diamond'
  const Icon = tier.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="relative rounded-3xl overflow-hidden"
      data-testid={`royalty-card-${tier.id}`}
    >
      <div
        className="relative flex flex-col min-h-[300px]"
        style={{
          background: `linear-gradient(135deg, ${tier.dark} 0%, ${tier.base} 35%, ${tier.light} 55%, ${tier.base} 75%, ${tier.dark} 100%)`,
          boxShadow: '0 22px 48px -12px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      >
        {/* brushed-metal grain */}
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

        {/* ── big background logo watermark — centered, no rotation ── */}
        <img
          src={futureRideLogo}
          alt=""
          aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70%',
            maxWidth: '300px',
            opacity: 0.65,
            objectFit: 'contain',
          }}
        />

        {/* ── card top: brand + icon row ── */}
        <div className="relative z-10 px-8 pt-7 pb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] uppercase leading-none" style={{ color: tier.textColor }}>
              Future Ride
            </p>
            <p className="text-2xl font-bold tracking-[0.04em] uppercase leading-none mt-2" style={{ color: tier.textColor, opacity: 0.9 }}>
              {tier.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <Icon size={34} style={{ color: tier.accentColor }} strokeWidth={2} />
            </div>
            <Wifi size={24} style={{ color: tier.textColor, opacity: 0.65, transform: 'rotate(90deg)' }} />
          </div>
        </div>

        <div className="flex-1" />

        {/* ── stats footer (unlocked) ── */}
        {!tier.locked && (
          <div className="relative z-10 px-8 pb-7 grid grid-cols-2 gap-4">
            <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.16)' }}>
              <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: tier.textColor, opacity: 0.65 }}>
                Amount Claimed
              </p>
              <p className="text-3xl font-bold" style={{ color: tier.textColor }}>
                {usd(tier.claimed)}
              </p>
            </div>
            <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.16)' }}>
              <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: tier.textColor, opacity: 0.65 }}>
                Amount Remaining
              </p>
              <p className="text-3xl font-bold" style={{ color: tier.textColor }}>
                {usd(tier.remaining)}
              </p>
            </div>
          </div>
        )}

        {/* ── locked overlay ── */}
        {tier.locked && (
          <div
            className="relative z-10 px-8 pb-8 pt-3 flex flex-col items-center text-center gap-3"
            style={{ background: 'rgba(8,15,38,0.58)', backdropFilter: 'blur(1.5px)' }}
          >
            <Lock size={30} style={{ color: tier.textColor, opacity: 0.9 }} />
            <p className="text-lg font-semibold leading-snug max-w-[280px]" style={{ color: tier.textColor }}>
              Upgrade to Package {String(tier.unlockPackage).padStart(2, '0')} to unlock
            </p>
            <p className="text-sm font-mono tracking-wide" style={{ color: tier.textColor, opacity: 0.75 }}>
              Capped at {usd(tier.cap)} USDT
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── 24-hour countdown ─────────────────────────────────────
const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000

function useClaimCountdown() {
  // mock — replace with the user's actual lastClaimedAt from the backend
  const [claimedAt, setClaimedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!claimedAt) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [claimedAt])

  const remainingMs = claimedAt ? Math.max(0, claimedAt + CLAIM_COOLDOWN_MS - now) : 0
  const canClaim = remainingMs <= 0

  const claim = () => {
    if (!canClaim) return
    setClaimedAt(Date.now())
    setNow(Date.now())
    // TODO: call the real claim API here, e.g.
    // await fetch(`${API}/api/royalty/claim`, { method: 'POST', credentials: 'include' })
  }

  const formatted = (() => {
    const totalSeconds = Math.floor(remainingMs / 1000)
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(totalSeconds % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  })()

  return { canClaim, claim, formatted }
}

// ─── page ──────────────────────────────────────────────────
export default function RoyaltyFundPool() {
  const { canClaim, claim, formatted } = useClaimCountdown()

  return (
    <div className="space-y-8" data-testid="royalty-fund-pool">
      <header>
        <p className="text-3xl font-bold text-white">Royalty Fund Pool</p>
        <span className="text-lg text-white/50">
          Tier-based royalty rewards. Higher packages unlock higher claim caps.
        </span>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {TIERS.map((tier, i) => (
          <PremiumCard key={tier.id} tier={tier} index={i} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          onClick={claim}
          disabled={!canClaim}
          data-testid="royalty-claim-button"
          className={[
            'px-8 py-3 rounded-xl text-base font-mono font-semibold tracking-wide transition-all',
            canClaim
              ? 'bg-[#38BDF8]/10 border border-[#38BDF8]/40 text-[#38BDF8] hover:bg-[#38BDF8]/20 active:scale-[0.98]'
              : 'bg-white/[0.03] border border-white/[0.08] text-white/30 cursor-not-allowed',
          ].join(' ')}
        >
          {canClaim ? 'Claim Reward' : `Next claim in ${formatted}`}
        </button>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Copy, Check, Users, Package, Activity, Globe, GitBranch, Lock, Layers, Clock, AlertTriangle, Sparkles, Wallet, Network, ShieldAlert } from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { StatCard } from '../StatCard'
import PackageBuyPage from './PackageBuy'
import { dashboardService } from '#/services/dashboard.service'
import { RecentIncomePageTable, type IncomePageData, type IncomeRow } from '../RecentIncomePageTable'
import { TableSkeleton } from '../LoadingSkeleton'
import { useOnChainRegisterInfo } from '@/hooks/useOnChainRegisterInfo'
import { useDailyRoyaltyClaimed } from '@/hooks/useDailyRoyaltyClaimed'
import { ClaimAutoUpgradeHoldingCard } from '../ClaimAutoUpgradeHoldingCard'

const API = import.meta.env.VITE_API_URL

const PACKAGE_NAMES = ['Bronze','Silver','Pearl','Gold','Sapphire','Platinum','Diamond','Ruby','Emerald','Royal','Crown','Imperial']

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) }

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.05] ${className}`} />
}

// ─── types ──────────────────────────────────────────────
// Mirrors getMe's response shape exactly — DB-only, fast.
export interface DashboardMe {
  highestPackage: number
  packagePurchaseDate: string
  referredBy: string | null
  referredByContractRegId: number | null
  referralLink: string
  directTeamCount: number
  totalTeamCount: number
  totalCommunityTeam: number
  totalGenerationTeam:number
  userAddress: string
  contractRegId: number
  isRegistered: boolean
  directIncome: number
  generationIncome: number
  lapsIncome: number
  lostIncome: number
  levelIncome: number
  levelLapseIncome: number
  levelLostIncome: number
  lostPay: number
  totalIncome: number
  royaltyIncome:number
  // todaysIncome is an object with a `total` field, not a bare number —
  // the old `number` typing didn't match how it's actually used below.
  todaysIncome: {
    total: number
  }
}

interface OnChainBalances {
  success: boolean
  walletFundBalance: number
  upgradeHoldingIncome: number
  activeRoyaltyPool: number
  walletFundBalanceError?: boolean
  upgradeHoldingIncomeError?: boolean
  activeRoyaltyPoolError?: boolean
}

export function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024 };
}
export default function HomeDashboard() {
  // ── session ────────────────────────────────────────────
  // Same pattern as DashboardHomePage: scope every query on the SIWE
  // session address, not the wallet connector's live state, and force a
  // refetch on mount as a second-layer defense against the better-auth
  // useSession() stale-atom issue (see DashboardHomePage for full context).
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()
  const { isMobile, isTablet } = useBreakpoint();
  const isSmall = isMobile || isTablet;
  useEffect(() => {
    refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  // ── DB-only dashboard data ────────────────────────────
  const meQ = useQuery<DashboardMe>({
    queryKey: ['dashboard', 'me', address],
    queryFn: async () => {
      const res = await fetch(`${API}/api/user/me`, { credentials: 'include' })
      if (!res.ok) throw new Error('dashboard/me failed')
      return res.json()
    },
    enabled: sessionReady,
    staleTime: 2 * 60 * 1000,
  })

  // ── on-chain balances: wallet fund balance + upgrade holding income ──
  // Separate query, independent loading state — page shouldn't block on
  // an RPC call when DB data is already available.
  const onChainQ = useQuery<OnChainBalances>({
    queryKey: ['dashboard', 'on-chain-balances', address],
    queryFn: async () => {
      const res = await fetch(`${API}/api/dashboard/on-chain-balances`, { credentials: 'include' })
      if (!res.ok) throw new Error('on-chain-balances failed')
      return res.json()
    },
    enabled: sessionReady,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const recentQ = useQuery({
  queryKey: ["dashboard", "recent-income", address],
  queryFn:  () => dashboardService.getRecentIncome(15),
  enabled:   sessionReady,
  staleTime: 2 * 60 * 1000,
});

  // ── direct/generation/level income — read live from the contract's
  // register() struct, not the backend DB ──
  const onChainRegister = useOnChainRegisterInfo(address)
  const royaltyClaimedQ = useDailyRoyaltyClaimed(address)

  const [recentPage,      setRecentPage]      = useState(1);
  const [recentPageSize,  setRecentPageSize]  = useState(8);
  const [recentSearch,    setRecentSearch]    = useState("");
  const [recentPkgFilter, setRecentPkgFilter] = useState(0);

  const me = meQ.data
  const isLoading = sessionPending || meQ.isLoading || !me

  const upgradeHoldingIncome = onChainQ.data?.upgradeHoldingIncome ?? 0
  const walletFundBalance = onChainQ.data?.walletFundBalance ?? 0
  const onChainLoading = onChainQ.isLoading

  // "Total Earnings" = direct + generation + level + level lapsed +
  // generation lapsed, straight from the on-chain register() struct.
  // Every lost-income category (level lost, generation lost, lost pay) is
  // deliberately excluded — that value was never actually received.
  const totalEarnedCombined =
    onChainRegister.data.directIncome +
    onChainRegister.data.generationIncome +
    onChainRegister.data.levelIncome +
    onChainRegister.data.levelLapsedIncome +
    onChainRegister.data.generationLapsedIncome

  const [recentTypeFilter, setRecentTypeFilter] = useState<string>("all");

const allRecentRows: IncomeRow[] = (recentQ.data ?? []).map(r => ({
    id:                r.id,
    fromUserAddress:   r.fromAddress,
    fromContractRegId: r.fromContractRegId,   // ← NEW
    incomeType:        r.incomeType,          // ← NEW
    packageNumber:     r.packageNumber,
    packageName:       r.packageName,
    amount:            r.amount.toString(),
    timestamp:         Math.floor(new Date(r.date).getTime() / 1000).toString(),
    transactionHash:   r.transactionHash,
    level:             r.level,
    createdAt:         r.date,
  }));
  const recentTyped = recentTypeFilter !== "all"
    ? allRecentRows.filter(r => r.incomeType === recentTypeFilter)
    : allRecentRows;
  const recentFiltered = recentPkgFilter > 0
    ? recentTyped.filter(r => r.packageNumber === recentPkgFilter)
    : recentTyped;

  const recentSearched = recentSearch
    ? recentFiltered.filter(r => r.fromUserAddress.toLowerCase().includes(recentSearch.toLowerCase()))
    : recentFiltered;
  const recentTotal      = recentSearched.length;
  const recentTotalPages = Math.max(1, Math.ceil(recentTotal / recentPageSize));
  const recentData: IncomePageData = {
    success:    true,
    total:      recentTotal,
    page:       recentPage,
    pageSize:   recentPageSize,
    totalPages: recentTotalPages,
    records:    recentSearched.slice((recentPage - 1) * recentPageSize, recentPage * recentPageSize),
  };

  const [linkCopied, setLinkCopied] = useState(false)

  const copyLink = async () => {
    if (!me) return
    await navigator.clipboard.writeText(me.referralLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  // ── overall (all-time) income per type — NOT daily ──────
  // Direct/Generation/Level income figures come straight from the
  // contract's register() struct (see useOnChainRegisterInfo) instead of
  // the backend DB. Grouped into three tiers for the dashboard layout:
  // core (earned), lapsed (delayed), and lost (never received — flagged).
  const onChainLoadingIncome = onChainRegister.isLoading
  const coreIncomeCards = [
    { label: 'Direct Income',        value: onChainRegister.data.directIncome,     color: '#38BDF8', icon: Users,     loading: onChainLoadingIncome },
    { label: 'Generation Income',    value: onChainRegister.data.generationIncome, color: '#22C55E', icon: GitBranch, loading: onChainLoadingIncome },
    { label: 'Level Income',         value: onChainRegister.data.levelIncome,      color: '#2DD4BF', icon: Layers,    loading: onChainLoadingIncome },
    { label: 'Auto Upgrade Holding', value: upgradeHoldingIncome,                  color: '#F5A623', icon: Lock,      loading: onChainLoading },
    { label: 'Daily Royalty Pool',   value: royaltyClaimedQ.data ?? 0,             color: '#A855F7', icon: Sparkles,  loading: royaltyClaimedQ.isLoading },
  ]
  const lapsedIncomeCards = [
    { label: 'Level Lapsed Income',      value: onChainRegister.data.levelLapsedIncome,      color: '#FB923C', icon: Clock, loading: onChainLoadingIncome },
    { label: 'Generation Lapsed Income', value: onChainRegister.data.generationLapsedIncome, color: '#FDE047', icon: Clock, loading: onChainLoadingIncome },
  ]
  const lostIncomeCards = [
    { label: 'Level Lost Income',      value: onChainRegister.data.levelLostIncome },
    { label: 'Generation Lost Income', value: onChainRegister.data.generationLostIncome },
  ]
  const totalLostIncome = onChainRegister.data.levelLostIncome + onChainRegister.data.generationLostIncome

  const quickStats = [
    { testId: 'stat-direct-team', label: 'Direct Team',     value: isLoading ? '—' : String(me?.directTeamCount ?? 0),     icon: Users,       color: '#8B5CF6' },
    { testId: 'stat-my-generation', label: 'Matrix Team',   value: isLoading ? '—' : String(me?.totalGenerationTeam ?? 0), icon: Network,     color: '#F59E0B' },
    { testId: 'stat-community', label: 'Generation Team',   value: isLoading ? '—' : String(me?.totalTeamCount ?? 0),      icon: Activity,    color: '#F59E0B' },
    { testId: 'stat-active-package', label: 'Active Package', value: isLoading ? '—' : (me?.highestPackage ? PACKAGE_NAMES[me.highestPackage - 1] ?? String(me.highestPackage) : 'None'),   icon: Package,     color: '#06B6D4' },
  ]

  return (
    <div className="space-y-6" data-testid="home-dashboard">
      {/* ── Identity Strip ── */}
      <motion.div
        initial="hidden" animate="visible" custom={0} variants={fadeUp}
        className="relative rounded-2xl border border-white/10 bg-[#080F26] overflow-hidden"
        data-testid="identity-strip"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/60 to-transparent" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4FD8]/70 to-[#38BDF8]/25 border border-[#38BDF8]/30 flex items-center justify-center">
              <Globe size={18} className="text-[#38BDF8]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white truncate">
                  {isLoading ? 'Loading…' : `User #${me?.contractRegId ?? '—'}`}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase bg-green-400/10 text-green-400 border border-green-400/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                  {isLoading ? '—' : me?.isRegistered ? 'Active' : 'Inactive'}
                </span>
              </div>
              {isLoading ? <Skeleton className="h-3 w-32 mt-1" /> : <WalletAddress address={me?.userAddress ?? ''} className="font-mono text-xs text-white/40" />}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isLoading ? <Skeleton className="h-8 flex-1 sm:w-44" /> : (
              <div className="flex-1 sm:w-44 flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] min-w-0">
                <Globe size={11} className="text-[#38BDF8] shrink-0" />
                <span className="text-[11px] text-white/40 truncate font-mono">{me?.referralLink}</span>
              </div>
            )}
            <button
              data-testid="copy-referral-link"
              onClick={copyLink}
              disabled={isLoading}
              className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#1B4FD8] to-[#38BDF8] text-white text-xs font-bold tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {linkCopied ? <Check size={13} /> : <Copy size={13} />}
              <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Claim Auto Upgrade Holding ── */}
      <ClaimAutoUpgradeHoldingCard index={0.5} />

      {/* ── Balance Hero + Account Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial="hidden" animate="visible" custom={1} variants={fadeUp}
          className="rounded-[24px] border border-[#38BDF8]/15 bg-gradient-to-br from-[#0A1230] via-[#080F26] to-[#060A1C] p-5 sm:p-6 overflow-hidden relative shadow-[0_10px_40px_-14px_rgba(0,0,0,0.5)]"
          data-testid="total-earnings-card"
        >
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-[#38BDF8]/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet size={13} className="text-[#38BDF8]" />
              <p className="text-[11px] font-semibold tracking-widest uppercase text-white/60">Wallet Balance</p>
            </div>
            {isLoading || onChainLoading
              ? <Skeleton className="h-11 w-40 mb-1" />
              : <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white" style={{ fontFamily: 'Outfit' }}>${walletFundBalance.toFixed(2)}</span>
                  <span className="text-sm font-bold text-[#F5A623]">USDT</span>
                </div>
            }
            {onChainQ.data?.walletFundBalanceError && (
              <p className="text-xs text-amber-400/70 mt-1">Balance temporarily unavailable — showing fallback value</p>
            )}

            <div className="h-px bg-white/8 my-4" />

            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={13} className="text-[#38BDF8]" />
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/50">Total Earnings</p>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: 'Outfit' }} data-testid="stat-total-earnings">
                  {isLoading || onChainRegister.isLoading ? '—' : totalEarnedCombined.toFixed(2)}
                  <span className="text-sm font-normal text-white/40 ml-1.5">USDT</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-green-400/[0.06] border border-green-400/10">
                <Activity size={14} className="text-green-400" />
                <span className="text-sm text-white/50">Today:</span>
                <span className="text-base font-bold text-green-400">{isLoading ? '—' : `${(me?.todaysIncome?.total ?? 0).toFixed(4)} USDT`}</span>
              </div>

              {!isLoading && !onChainLoadingIncome && totalLostIncome > 0 && (
                <>
                  {lostIncomeCards.map(({ label, value }) => (
                    <motion.div
                      key={label}
                      animate={{
                        opacity: [1, 0.55, 1],
                        boxShadow: [
                          '0 0 0px rgba(239,68,68,0)',
                          '0 0 18px rgba(239,68,68,0.55)',
                          '0 0 0px rgba(239,68,68,0)',
                        ],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10"
                      data-testid={`wallet-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <AlertTriangle size={14} className="text-red-400" />
                      <span className="text-sm text-red-300/80">{label.replace(' Income', '')}:</span>
                      <span className="text-base font-bold text-red-400">{(value ?? 0).toFixed(2)} USDT</span>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden" animate="visible" custom={2} variants={fadeUp}
          className="rounded-[24px] border border-white/10 bg-[#080F26] p-5 sm:p-6"
          data-testid="identity-card"
        >
          <p className="text-base sm:text-lg font-bold tracking-widest uppercase text-white mb-5">Account Details</p>
          <div className="space-y-3">
            <div className="flex items-center gap-4 py-2.5 px-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#38BDF815]"><Users size={18} className="text-[#38BDF8]" /></div>
              <span className="text-base sm:text-lg font-semibold text-white flex-1">User ID</span>
              {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="font-mono font-bold text-xl sm:text-2xl text-[#38BDF8]">{me?.contractRegId}</span>}
            </div>
            <div className="flex items-center gap-4 py-2.5 px-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#22C55E15]"><Activity size={18} className="text-[#22C55E]" /></div>
              <span className="text-base sm:text-lg font-semibold text-white flex-1">Wallet</span>
              {isLoading ? <Skeleton className="h-5 w-24" /> : <WalletAddress address={me?.userAddress ?? ''} className="font-mono font-bold text-lg sm:text-xl text-[#22C55E]" />}
            </div>
            <div className="flex items-center gap-4 py-2.5 px-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#F5A62315]"><Users size={18} className="text-[#F5A623]" /></div>
              <span className="text-base sm:text-lg font-semibold text-white flex-1">Referred ID</span>
              {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="font-mono font-bold text-xl sm:text-2xl text-[#F5A623]">{me?.referredByContractRegId ?? '—'}</span>}
            </div>
            <div className="flex items-center gap-4 py-2.5 px-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#8B5CF615]"><Globe size={18} className="text-[#8B5CF6]" /></div>
              <span className="text-base sm:text-lg font-semibold text-white flex-1">Referred By</span>
              {isLoading ? <Skeleton className="h-5 w-24" /> : <WalletAddress address={me?.referredBy ?? ''} className="font-mono font-bold text-lg sm:text-xl text-[#8B5CF6]" />}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Team & Package quick stats ── */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {quickStats.map(({ testId, label, value, icon: Icon, color }) => (
          <div key={label} data-testid={testId} className="rounded-2xl border border-white/10 bg-[#080F26] p-6 sm:p-8 flex items-center gap-5 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.6)] min-h-[140px] sm:min-h-[160px]">
            <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}26` }}>
              <Icon size={28} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold tracking-wider uppercase text-white mb-1">{label}</p>
              <p className="text-3xl sm:text-4xl font-black text-white truncate" style={{ fontFamily: 'Outfit' }}>{value}</p>
            </div>
          </div>
        ))}
      </motion.div>



      {/* ── Core Income ── */}
      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#1B4FD8]" />
          <p className="text-xs font-bold tracking-widest uppercase text-white/50">Core Income</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreIncomeCards.map(({ label, value, color, icon: Icon, loading }) => (
            <div
              key={label}
              data-testid={`dist-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className="relative rounded-2xl p-5 sm:p-6 overflow-hidden border border-white/10 bg-[#080F26] shadow-[0_8px_20px_-12px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />
              <div className="flex items-start justify-between gap-2 mb-4">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{label}</p>
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
                  <Icon size={18} style={{ color }} />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: 'Outfit' }}>
                {isLoading || loading ? '—' : (value ?? 0).toFixed(2)}
                <span className="text-sm font-normal ml-2" style={{ color }}>USDT</span>
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Lapsed Income ── */}
      <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
          <p className="text-xs font-bold tracking-widest uppercase text-white/50">Lapsed Income</p>
          <span className="text-[10px] text-white/30 hidden sm:inline">— delayed, not yet released</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lapsedIncomeCards.map(({ label, value, color, icon: Icon, loading }) => (
            <div key={label} data-testid={`dist-${label.toLowerCase().replace(/\s+/g, '-')}`} className="relative rounded-2xl p-5 sm:p-6 overflow-hidden border border-white/10 bg-[#080F26]">
              <div className="flex items-center gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color }}>{label}</p>
                  <p className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: 'Outfit' }}>
                    {isLoading || loading ? '—' : (value ?? 0).toFixed(2)}
                    <span className="text-sm font-normal ml-2" style={{ color }}>USDT</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <PackageBuyPage/>
    </div>
  )
}
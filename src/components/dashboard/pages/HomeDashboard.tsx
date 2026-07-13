import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Copy, Check, Users, DollarSign, Package, Activity, Globe } from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { StatCard, GradientStatCard } from '../StatCard'
import PackageBuyPage from './PackageBuy'
import { dashboardService } from '#/services/dashboard.service'
import { RecentIncomePageTable, type IncomePageData, type IncomeRow } from '../RecentIncomePageTable'
import { TableSkeleton } from '../LoadingSkeleton'

const API = import.meta.env.VITE_API_URL

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) }

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.05] ${className}`} />
}

// ─── types ──────────────────────────────────────────────
// Mirrors getMe's response shape exactly — DB-only, fast.
interface DashboardMe {
  highestPackage: number
  packagePurchaseDate: string
  referredBy: string | null
  referredByContractRegId: number | null
  referralLink: string
  directTeamCount: number
  totalCommunityTeam: number
  userAddress: string
  contractRegId: number
  isRegistered: boolean
  directIncome: number
  generationIncome: number
  lapsIncome: number
  lostIncome: number
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
  walletFundBalanceError?: boolean
  upgradeHoldingIncomeError?: boolean
}
function useBreakpoint() {
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

  const [recentPage,      setRecentPage]      = useState(1);
  const [recentPageSize,  setRecentPageSize]  = useState(8);
  const [recentSearch,    setRecentSearch]    = useState("");
  const [recentPkgFilter, setRecentPkgFilter] = useState(0);

  const me = meQ.data
  const isLoading = sessionPending || meQ.isLoading || !me

  const upgradeHoldingIncome = onChainQ.data?.upgradeHoldingIncome ?? 0
  const walletFundBalance = onChainQ.data?.walletFundBalance ?? 0
  const onChainLoading = onChainQ.isLoading

  // totalIncome from getMe is DB-only (direct + generation + laps);
  // add the on-chain upgrade holding figure client-side for the
  // "Total Earnings" lifetime stat (kept separate from the live
  // withdrawable walletFundBalance shown on the main balance card).
  const totalEarnedCombined = (me?.totalIncome ?? 0) + upgradeHoldingIncome

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
  const distributionCards = [
    { label: 'Direct Income',        value: me?.directIncome,        color: '#38BDF8', bg: 'from-[#0D2B6E] to-[#1B4FD8]', loading: false },
    { label: 'Generation Income',    value: me?.generationIncome,    color: '#22C55E', bg: 'from-[#14532D] to-[#16A34A]', loading: false },
        { label: 'Royalty Income',    value: me?.royaltyIncome,    color: '#f2f0eb', bg: 'from-[#fcba03] to-[#16A34A]', loading: false },

    { label: 'Auto Upgrade Holding', value: upgradeHoldingIncome,    color: '#F5A623', bg: 'from-[#78340A] to-[#D97706]', loading: onChainLoading },
    { label: 'Laps Credit Income',   value: me?.lapsIncome,          color: '#A855F7', bg: 'from-[#3B0764] to-[#7E22CE]', loading: false },
    { label: 'Lost Income',          value: me?.lostIncome,          color: '#F43F5E', bg: 'from-[#4C0519] to-[#BE123C]', loading: false },
  ]

  return (
    <div className="space-y-5" data-testid="home-dashboard">
      {/* ── Referral Portal Card ── */}
      <motion.div
        initial="hidden" animate="visible" custom={0} variants={fadeUp}
        className="relative rounded-2xl border border-[#38BDF8]/15 bg-[#080F26] overflow-hidden"
        data-testid="referral-portal-card"
      >
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.8) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#1B4FD8]/60 to-[#38BDF8]/20 border border-[#38BDF8]/25 flex items-center justify-center">
            <Globe size={26} className="text-[#38BDF8]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-white">Referral Portal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-green-400/10 text-green-400 border border-green-400/20">
                {isLoading ? '—' : me?.isRegistered ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-0 w-full sm:w-auto sm:max-w-xs">
            {isLoading ? <Skeleton className="h-8 w-full" /> : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] min-w-0">
                <Globe size={12} className="text-[#38BDF8] shrink-0" />
                <span className="text-xs text-white/40 truncate font-mono">{me?.referralLink}</span>
              </div>
            )}
            <button
              data-testid="copy-referral-link"
              onClick={copyLink}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1B4FD8] to-[#38BDF8] text-white text-xs font-bold tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {linkCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Earnings + Stats Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          initial="hidden" animate="visible" custom={1} variants={fadeUp}
          className="lg:col-span-3 rounded-2xl border border-[#38BDF8]/12 bg-[#080F26] p-5 overflow-hidden relative"
          data-testid="total-earnings-card"
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.8) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10">
            <p className="text-[13px] font-semibold tracking-widest uppercase text-white/90 mb-1">Current USDT Balance</p>
            {isLoading || onChainLoading
              ? <Skeleton className="h-12 w-40 mb-4" />
              : <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white" style={{ fontFamily: 'Outfit' }}>
                    ${walletFundBalance.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-[#F5A623]">USDT - BEP-20</span>
                </div>
            }
            {onChainQ.data?.walletFundBalanceError && (
              <p className="text-xs text-amber-400/70 mb-3">Balance temporarily unavailable — showing fallback value</p>
            )}
            <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-green-400/[0.06] border border-green-400/10 w-fit">
              <Activity size={12} className="text-green-400" />
              <span className="text-xs text-white/50">Today:</span>
              <span className="text-sm font-bold text-green-400">{isLoading ? '—' : `${(me?.todaysIncome?.total ?? 0).toFixed(4)} USDT`}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#38BDF815]">
                  <Users size={14} className="text-[#38BDF8]" />
                </div>
                <span className="text-lg text-white flex-1">User ID</span>
                {isLoading ? <Skeleton className="h-4 w-24" /> : <span className="font-mono font-semibold text-lg text-[#38BDF8]">{me?.contractRegId}</span>}
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#22C55E15]">
                  <Activity size={14} className="text-[#22C55E]" />
                </div>
                <span className="text-lg text-white flex-1">Wallet Address</span>
                {isLoading ? <Skeleton className="h-4 w-32" /> : <WalletAddress address={me?.userAddress ?? ''} className="font-mono font-semibold text-lg text-[#22C55E]" />}
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#F5A62315]">
                  <Users size={14} className="text-[#F5A623]" />
                </div>
                <span className="text-lg text-white flex-1">Referred ID</span>
                {isLoading ? <Skeleton className="h-4 w-24" /> : <span className="font-mono font-semibold text-lg text-[#F5A623]">{me?.referredByContractRegId ?? '—'}</span>}
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#8B5CF615]">
                  <Globe size={14} className="text-[#8B5CF6]" />
                </div>
                <span className="text-lg text-white flex-1">Referred Address</span>
                {isLoading ? <Skeleton className="h-4 w-32" /> : <WalletAddress address={me?.referredBy ?? ''} className="font-mono font-semibold text-lg text-[#8B5CF6]" />}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden" animate="visible" custom={2} variants={fadeUp}
          className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-3"
        >
          <GradientStatCard
            data-testid="stat-total-earnings"
            title="Total Earnings"
            value={isLoading || onChainLoading ? '—' : totalEarnedCombined.toFixed(2)}
            subtitle="USDT"
            gradient="bg-gradient-to-br from-[#0D2B6E] via-[#1244A6] to-[#1B4FD8]"
            icon={<DollarSign size={16} />}
          />
          <GradientStatCard
            data-testid="stat-direct-team"
            title="Direct Team"
            value={isLoading ? '—' : String(me?.directTeamCount ?? 0)}
            subtitle="Members"
            gradient="bg-gradient-to-br from-[#3B1D8F] via-[#5B21B6] to-[#7C3AED]"
            icon={<Users size={16} />}
          />
          <GradientStatCard
            data-testid="stat-active-package"
            title="Active Package"
            value={isLoading ? '—' : String(me?.highestPackage ?? 0)}
            subtitle={isLoading ? '' : new Date(me!.packagePurchaseDate).toLocaleDateString()}
            gradient="bg-gradient-to-br from-[#065F5F] via-[#0891B2] to-[#06B6D4]"
            icon={<Package size={16} />}
          />
          <GradientStatCard
            data-testid="stat-community"
            title="Community"
            value={isLoading ? '—' : String(me?.totalCommunityTeam ?? 0)}
            subtitle="Total Members"
            gradient="bg-gradient-to-br from-[#78340A] via-[#B45309] to-[#F59E0B]"
            icon={<Activity size={16} />}
          />
        </motion.div>
      </div>

      {/* ── Overall income breakdown (all-time, NOT daily) ── */}
      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {distributionCards.map(({ label, value, color, bg, loading }) => (
            <div key={label} data-testid={`dist-${label.toLowerCase().replace(/\s+/g, '-')}`} className={`rounded-xl p-4 bg-gradient-to-br ${bg}/30 border border-white/8`}>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color }}>{label}</p>
              <p className="text-2xl font-black text-white">
                {isLoading || loading ? '—' : (value ?? 0).toFixed(2)}
                <span className="text-sm font-normal ml-1.5" style={{ color }}>USDT</span>
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <PackageBuyPage/>

        <section className="flex flex-col gap-3.5">
        <div>
          <h2 className={`m-0 font-heading ${isSmall ? "text-[16px]" : "text-[18px]"} font-bold text-white tracking-[-0.02em]`}>
            Recent Income
          </h2>
          <p className="mt-1 m-0 text-[13px] text-white/35 font-body">
            Latest payouts received from your downline.
          </p>
        </div>
        {recentQ.isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <RecentIncomePageTable
            data={recentData}
            isLoading={recentQ.isLoading}
            isFetching={recentQ.isFetching}
            page={recentPage}
            pageSize={recentPageSize}
            search={recentSearch}
            pkgFilter={recentPkgFilter}
            onPage={setRecentPage}
            onPageSize={n => { setRecentPageSize(n); setRecentPage(1); }}
            onSearch={s => { setRecentSearch(s); setRecentPage(1); }}
            onPkgFilter={v => { setRecentPkgFilter(v); setRecentPage(1); }}
            showLevel={true}
            typeFilter={recentTypeFilter}
            onTypeFilter={v => { setRecentTypeFilter(v); setRecentPage(1); }}
          />
        )}
      </section>

      
    </div>
  )
}
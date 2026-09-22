import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ethers } from 'ethers'
import { Search, UserSearch, AlertCircle, Users, Activity, Globe, DollarSign, Package } from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { GradientStatCard } from '../StatCard'
import type { UserIncomeLookupInfo } from '../../../types/dashboard'
import { useOnChainRegisterInfo, type OnChainRegisterInfo } from '@/hooks/useOnChainRegisterInfo'

const API = import.meta.env.VITE_API_URL

// ─── overall income breakdown cards — same categories, same card
// markup/classes as the logged-in user's Home Dashboard. Direct/Generation/
// Level income figures come straight from the looked-up address's on-chain
// register() struct (see useOnChainRegisterInfo); everything else still
// comes from the DB totals since the contract doesn't track it.
function distributionCards(info: UserIncomeLookupInfo, onChain: OnChainRegisterInfo, onChainLoading: boolean) {
  return [
    { label: 'Direct Income',            value: onChain.directIncome,           color: '#38BDF8', bg: 'from-[#0D2B6E] to-[#1B4FD8]', loading: onChainLoading },
    { label: 'Generation Income',        value: onChain.generationIncome,       color: '#22C55E', bg: 'from-[#14532D] to-[#16A34A]', loading: onChainLoading },
    { label: 'Auto Upgrade Holding',     value: info.upgradeHoldingIncome,      color: '#F5A623', bg: 'from-[#78340A] to-[#D97706]', loading: false },
    { label: 'Level Income',             value: onChain.levelIncome,            color: '#2DD4BF', bg: 'from-[#0F3B3A] to-[#0D9488]', loading: onChainLoading },
    { label: 'Level Lapsed Income',      value: onChain.levelLapsedIncome,      color: '#FB923C', bg: 'from-[#4A2109] to-[#C2410C]', loading: onChainLoading },
    { label: 'Level Lost Income',        value: onChain.levelLostIncome,        color: '#F87171', bg: 'from-[#450A0A] to-[#B91C1C]', loading: onChainLoading },
    { label: 'Generation Lapsed Income', value: onChain.generationLapsedIncome, color: '#FDE047', bg: 'from-[#713F12] to-[#CA8A04]', loading: onChainLoading },
    { label: 'Generation Lost Income',   value: onChain.generationLostIncome,   color: '#FB7185', bg: 'from-[#500724] to-[#BE185D]', loading: onChainLoading },
  ]
}

export default function UserIncomeLookup() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => {
    refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 400)
    return () => clearTimeout(t)
  }, [input])

  const target = debounced.toLowerCase()
  const targetValid = ethers.utils.isAddress(target)

  const lookupQ = useQuery<UserIncomeLookupInfo>({
    queryKey: ['preview', 'income-lookup', target],
    queryFn: async () => {
      const res = await fetch(`${API}/api/preview/${target}/info`, { credentials: 'include' })
      if (res.status === 404) throw new Error('not-found')
      if (!res.ok) throw new Error('error')
      const json: UserIncomeLookupInfo = await res.json()
      if (!json.success) throw new Error('error')
      return json
    },
    enabled: sessionReady && targetValid,
    staleTime: 30 * 1000,
    retry: false,
  })

  const isLoading = targetValid && lookupQ.isFetching
  const notFound = targetValid && lookupQ.isError && lookupQ.error instanceof Error && lookupQ.error.message === 'not-found'
  const otherError = targetValid && lookupQ.isError && !notFound
  const info = lookupQ.data

  // Direct/Generation/Level income — read live from the looked-up
  // address's on-chain register() struct instead of the backend DB.
  const onChainRegister = useOnChainRegisterInfo(targetValid ? target : undefined)

  // Total Income = direct + generation + level + level lapsed + generation
  // lapsed, straight from the on-chain register() struct — matches the
  // Home Dashboard's "Total Earnings" formula. Every lost-income category
  // (level lost, generation lost) and laps credit/upgrade holding are
  // deliberately excluded.
  const totalIncome = info
    ? onChainRegister.data.directIncome +
      onChainRegister.data.generationIncome +
      onChainRegister.data.levelIncome +
      onChainRegister.data.levelLapsedIncome +
      onChainRegister.data.generationLapsedIncome
    : 0

  return (
    <div className="space-y-5" data-testid="user-income-lookup-page">
      <header>
        <p className="text-base font-bold text-white">User Income Lookup</p>
        <span className="text-sm text-white/50">
          Enter any registered wallet address to view its full income breakdown.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <div className="relative w-full sm:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            data-testid="user-income-lookup-search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter wallet address (0x…)"
            spellCheck={false}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8]/50 transition-colors font-mono"
          />
        </div>
        {input.trim().length > 0 && !targetValid && (
          <p className="mt-2 text-xs text-amber-400/80">That doesn't look like a valid wallet address.</p>
        )}
      </motion.div>

      {!targetValid && input.trim().length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
          className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-10 flex flex-col items-center text-center gap-2"
        >
          <UserSearch size={28} className="text-white/25 mb-1" />
          <p className="text-sm text-white/50">Paste a wallet address above to look up their income.</p>
        </motion.div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-10 text-center text-white/60 text-sm">
          Looking up…
        </div>
      )}

      {notFound && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-6 flex items-center gap-3"
          data-testid="user-income-lookup-not-found"
        >
          <AlertCircle size={18} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200/80">No registered user found at that address.</p>
        </motion.div>
      )}

      {otherError && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-6 flex items-center gap-3"
        >
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-200/80">Couldn't load that address's info. Try again.</p>
        </motion.div>
      )}

      {!isLoading && info && (
        <>
          {/* ── overview + stats grid — same layout as Home Dashboard's
              "Current USDT Balance" + GradientStatCard grid, adapted to
              DB-only fields (no live on-chain balance for an arbitrary
              address) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
              className="lg:col-span-3 rounded-2xl border border-[#38BDF8]/12 bg-[#080F26] p-5 overflow-hidden relative"
              data-testid="user-income-lookup-identity"
            >
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.8) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[13px] font-semibold tracking-widest uppercase text-white/90">User Overview</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${info.isRegistered ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                    {info.isRegistered ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#38BDF815]">
                      <Users size={14} className="text-[#38BDF8]" />
                    </div>
                    <span className="text-lg text-white flex-1">User ID</span>
                    <span className="font-mono font-semibold text-lg text-[#38BDF8]">{info.contractRegId ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#22C55E15]">
                      <Activity size={14} className="text-[#22C55E]" />
                    </div>
                    <span className="text-lg text-white flex-1">Wallet Address</span>
                    <WalletAddress address={info.userAddress} className="font-mono font-semibold text-lg text-[#22C55E]" />
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#F5A62315]">
                      <Users size={14} className="text-[#F5A623]" />
                    </div>
                    <span className="text-lg text-white flex-1">Referred ID</span>
                    <span className="font-mono font-semibold text-lg text-[#F5A623]">{info.referredByContractRegId ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#8B5CF615]">
                      <Globe size={14} className="text-[#8B5CF6]" />
                    </div>
                    <span className="text-lg text-white flex-1">Referred Address</span>
                    {info.referredBy
                      ? <WalletAddress address={info.referredBy} className="font-mono font-semibold text-lg text-[#8B5CF6]" />
                      : <span className="font-mono font-semibold text-lg text-white/40">—</span>}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-3"
            >
              <GradientStatCard
                data-testid="lookup-stat-total-income"
                title="Total Income"
                value={totalIncome.toFixed(2)}
                subtitle="USDT"
                gradient="bg-gradient-to-br from-[#0D2B6E] via-[#1244A6] to-[#1B4FD8]"
                icon={<DollarSign size={16} />}
              />
              <GradientStatCard
                data-testid="lookup-stat-direct-team"
                title="Direct Team"
                value={String(info.directTeamCount)}
                subtitle=""
                gradient="bg-gradient-to-br from-[#3B1D8F] via-[#5B21B6] to-[#7C3AED]"
                icon={<Users size={16} />}
              />
              <GradientStatCard
                data-testid="lookup-stat-community-team"
                title="Community Team"
                value={String(info.totalCommunityTeam)}
                subtitle=""
                gradient="bg-gradient-to-br from-[#78340A] via-[#B45309] to-[#F59E0B]"
                icon={<Activity size={16} />}
              />
              <GradientStatCard
                data-testid="lookup-stat-active-package"
                title="Active Package"
                value={String(info.highestPackage)}
                subtitle={info.packageName}
                gradient="bg-gradient-to-br from-[#065F5F] via-[#0891B2] to-[#06B6D4]"
                icon={<Package size={16} />}
              />
            </motion.div>
          </div>

          {/* ── overall income breakdown — same grid/card markup as Home Dashboard ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {distributionCards(info, onChainRegister.data, onChainRegister.isLoading).map(({ label, value, color, bg, loading }) => (
                <div key={label} data-testid={`lookup-dist-${label.toLowerCase().replace(/\s+/g, '-')}`} className={`rounded-xl p-4 bg-gradient-to-br ${bg}/30 border border-white/8`}>
                  <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color }}>{label}</p>
                  <p className="text-2xl font-black text-white">
                    {loading ? '—' : (value ?? 0).toFixed(2)}
                    <span className="text-sm font-normal ml-1.5" style={{ color }}>USDT</span>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Users, DollarSign, Package, Activity, Globe } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboard'
import { WalletAddress } from '../WalletAddress'
import { StatCard, GradientStatCard } from '../StatCard'
import { DataTable } from '../DataTable'
import type { Column, } from '../DataTable'
import type { IncomeRecord } from '@/types/dashboard'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) }

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.05] ${className}`} />
}

export default function HomeDashboard() {
  const { data, isLoading } = useDashboardData()
  const [linkCopied, setLinkCopied] = useState(false)

  const copyLink = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.user.referralLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }


  const recentCols: Column<IncomeRecord>[] = [
    {
      key: 'fromWallet', header: 'From Wallet', sortable: true,
      render: (r) => <WalletAddress address={r.fromWallet} data-testid="income-wallet" />,
    },
    { key: 'amount', header: 'Amount (BNB)', sortable: true, render: (r) => <span className="text-[#38BDF8] font-mono font-medium">{r.amount.toFixed(4)}</span> },
    {
      key: 'incomeType', header: 'Type',
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
          r.incomeType === 'direct' ? 'bg-[#38BDF8]/10 text-[#38BDF8]' :
          r.incomeType === 'generation' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
          'bg-[#F5A623]/10 text-[#F5A623]'}`}>
          {r.incomeType}
        </span>
      ),
    },
    { key: 'level', header: 'Level', render: (r) => <span className="text-white/50">L{r.level}</span> },
    { key: 'date',  header: 'Date',  sortable: true, render: (r) => <span className="text-white/40 text-xs">{r.date}</span> },
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
          {/* Brand badge */}
          <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#1B4FD8]/60 to-[#38BDF8]/20 border border-[#38BDF8]/25 flex items-center justify-center">
            <Globe size={26} className="text-[#38BDF8]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-white">Referral Portal</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-green-400/10 text-green-400 border border-green-400/20">Active</span>
            </div>
          </div>
          {/* Referral link */}
          <div className="flex flex-col gap-2 min-w-0 w-full sm:w-auto sm:max-w-xs">
            {isLoading ? <Skeleton className="h-8 w-full" /> : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] min-w-0">
                <Globe size={12} className="text-[#38BDF8] shrink-0" />
                <span className="text-xs text-white/40 truncate font-mono">{data?.user.referralLink}</span>
              </div>
            )}
            <button
              data-testid="copy-referral-link"
              onClick={copyLink}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1B4FD8] to-[#38BDF8] text-white text-xs font-bold tracking-wider hover:opacity-90 active:scale-95 transition-all"
            >
              {linkCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Earnings + Stats Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Total Earnings breakdown */}
        <motion.div
          initial="hidden" animate="visible" custom={1} variants={fadeUp}
          className="lg:col-span-3 rounded-2xl border border-[#38BDF8]/12 bg-[#080F26] p-5 overflow-hidden relative"
          data-testid="total-earnings-card"
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.8) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10">
            <p className="text-[13px] font-semibold tracking-widest uppercase text-white/90 mb-1">Current USDT Balance </p>
            {isLoading
              ? <Skeleton className="h-12 w-40 mb-4" />
              : <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-white" style={{ fontFamily: 'Outfit' }}>
                   $  {data?.earningsStats.total.toFixed(2)}
                  </span>
                  <span className="text-lg font-bold text-[#F5A623]">USDT - BEP-20</span>
                </div>
            }
            {/* Today earnings */}
            <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-green-400/[0.06] border border-green-400/10 w-fit">
              <Activity size={12} className="text-green-400" />
              <span className="text-xs text-white/50">Today:</span>
              <span className="text-sm font-bold text-green-400">{isLoading ? '—' : `${data?.earningsStats.today.toFixed(4)} USDT`}</span>
            </div>
            {/* Identity rows */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#38BDF815]">
                  <Users size={14} className="text-[#38BDF8]" />
                </div>
                <span className="text-lg text-white flex-1">User ID</span>
                {isLoading ? <Skeleton className="h-4 w-24" /> : <span className="font-mono font-semibold text-lg text-[#38BDF8]">{data?.user.userId}</span>}
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#22C55E15]">
                  <Activity size={14} className="text-[#22C55E]" />
                </div>
                <span className="text-lg text-white flex-1">Wallet Address</span>
                {isLoading ? <Skeleton className="h-4 w-32" /> : <WalletAddress address={data?.user.walletAddress ?? ''} className="font-mono font-semibold text-lg text-[#22C55E]" />}
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#F5A62315]">
                  <Users size={14} className="text-[#F5A623]" />
                </div>
                <span className="text-lg text-white flex-1">Referred ID</span>
                {isLoading ? <Skeleton className="h-4 w-24" /> : <span className="font-mono font-semibold text-lg text-[#F5A623]">{data?.user.referrerId}</span>}
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/2 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#8B5CF615]">
                  <Globe size={14} className="text-[#8B5CF6]" />
                </div>
                <span className="text-lg text-white flex-1">Referred Address</span>
                {isLoading ? <Skeleton className="h-4 w-32" /> : <WalletAddress address={data?.user.referredBy ?? ''} className="font-mono font-semibold text-lg text-[#8B5CF6]" />}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: 2x2 stat cards */}
        <motion.div
          initial="hidden" animate="visible" custom={2} variants={fadeUp}
          className="lg:col-span-2 grid grid-cols-2 gap-3"
        >
          <GradientStatCard
            data-testid="stat-total-earnings"
            title="Total Earnings"
            value={isLoading ? '—' : `${data?.earningsStats.total.toFixed(2)}`}
            subtitle="USDT"
            gradient="bg-gradient-to-br from-[#0D2B6E] via-[#1244A6] to-[#1B4FD8]"
            icon={<DollarSign size={16} />}
          />
          <GradientStatCard
            data-testid="stat-direct-team"
            title="Direct Team"
            value={isLoading ? '—' : String(data?.networkStats.directTeam ?? 0)}
            subtitle="Members"
            gradient="bg-gradient-to-br from-[#3B1D8F] via-[#5B21B6] to-[#7C3AED]"
            icon={<Users size={16} />}
          />
          <GradientStatCard
            data-testid="stat-active-package"
            title="Active Package"
            value={isLoading ? '—' : (data?.user.currentPackage ?? '—')}
            subtitle={isLoading ? '' : `Highest: ${data?.user.highestPackage}`}
            gradient="bg-gradient-to-br from-[#065F5F] via-[#0891B2] to-[#06B6D4]"
            icon={<Package size={16} />}
          />
          <GradientStatCard
            data-testid="stat-community"
            title="Community"
            value={isLoading ? '—' : String(data?.networkStats.totalCommunity ?? 0)}
            subtitle={`Active: ${isLoading ? '—' : data?.networkStats.activeTeam}`}
            gradient="bg-gradient-to-br from-[#78340A] via-[#B45309] to-[#F59E0B]"
            icon={<Activity size={16} />}
          />
        </motion.div>
      </div>


      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
             { label: 'Total Income',     key: 'direct',     color: '#38BDF8', bg: 'from-[#0D2B6E] to-[#1B4FD8]' },
            { label: 'Direct Income',     key: 'direct',     color: '#38BDF8', bg: 'from-[#0D2B6E] to-[#1B4FD8]' },
            { label: 'Generation Income', key: 'generation', color: '#22C55E', bg: 'from-[#14532D] to-[#16A34A]' },
            { label: 'Auto Upgrade Holding',    key: 'upgrade',    color: '#F5A623', bg: 'from-[#78340A] to-[#D97706]' },
            { label: 'Laps Credit Income',    key: 'upgrade',    color: '#A855F7', bg: 'from-[#3B0764] to-[#7E22CE]' },
            { label: 'Lost Income',    key: 'upgrade',    color: '#F43F5E', bg: 'from-[#4C0519] to-[#BE123C]' },


          ].map(({ label, key, color, bg }) => (
            <div key={label} data-testid={`dist-${key}`} className={`rounded-xl p-4 bg-gradient-to-br ${bg}/30 border border-white/8`}>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color }}>{label}</p>
              <p className="text-2xl font-black text-white">
                {isLoading ? '—' : data?.todayDistribution[key as keyof typeof data.todayDistribution].toFixed(2)}
                <span className="text-sm font-normal ml-1.5" style={{ color }}>USDT</span>
              </p>
            </div>
          ))}
        </div>
      </motion.div>


    </div>
  )
}

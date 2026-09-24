import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ethers } from 'ethers'
import { useActiveAccount } from 'thirdweb/react'
import {
  Coins, TrendingUp, Layers, Timer, Loader2, CheckCircle2, XCircle,
  AlertCircle, Wallet, RefreshCw, Users, Sparkles, Gift, Zap,
} from 'lucide-react'
import {
  dailyRoyaltyPoolContract,
  DAILY_ROYALTY_POOL_CONTRACT_ADDRESS,
} from '@/contract/daily-royalty-pool/daily-royalty-pool-contract'

const ERC20_READ_ABI = [
  { constant: true, inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { constant: true, inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
]

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type ClaimTxState = 'idle' | 'pending' | 'mining' | 'success' | 'error'

interface UserInfoData {
  addedTime: number
  claimedTime: number
  directCount: number
  userClaimedAmt: number
  inPool: boolean
  one: boolean
  two: boolean
  three: boolean
  upline: string
}

const EMPTY_USER_INFO: UserInfoData = {
  addedTime: 0, claimedTime: 0, directCount: 0, userClaimedAmt: 0,
  inPool: false, one: false, two: false, three: false, upline: ZERO_ADDRESS,
}

interface PoolPageData {
  totalSupplyAmount: number
  totalDistributionAmount: number
  currentPoolNum: number
  claimablePoolId: number
  hasClaimablePool: boolean
  poolIntervalSeconds: number
  timeLeftToClaimSeconds: number
  tokenSymbol: string
  isEligible: boolean
  alreadyClaimed: boolean
  claimableAmount: number
  qualifiedUsers: number
  lastPoolFundLock: number
  lastPoolPerUser: number
  userTotalQualified: number
  userTotalPoolClaimed: number
  userTotalClaimedAmt: number
  userInfo: UserInfoData
}

// Reads use the contract's own time-aware getters (currentPool / claimablePool /
// getPoolInfo / getUserClaimStatus) instead of the raw poolCount/poolDetails
// mappings, since those stay stale on-chain until someone sends a tx.
async function fetchPoolPageData(contract: ethers.Contract, walletAddress: string): Promise<PoolPageData | null> {
  const [globalPool, currentPoolBn, poolIntervalBn, tokenAddr, claimStatus, globalUser] = await Promise.all([
    contract.GlobalPoolDetails(DAILY_ROYALTY_POOL_CONTRACT_ADDRESS),
    contract.currentPool(),
    contract.poolIntervalTime(),
    contract.tokenAddress(),
    contract.getUserClaimStatus(walletAddress),
    contract.GlobalUserDetails(walletAddress),
  ])

  const currentPoolNum = (currentPoolBn as ethers.BigNumber).toNumber()
  if (currentPoolNum === 0) return null

  const claimablePoolId = (claimStatus.pool as ethers.BigNumber).toNumber()
  const tokenContract = new ethers.Contract(tokenAddr, ERC20_READ_ABI, contract.signer)

  const [poolInfo, userInfoRaw, timeLeft, tokenDecimalsRaw, tokenSymbol] = await Promise.all([
    claimablePoolId > 0 ? contract.getPoolInfo(claimablePoolId) : null,
    claimablePoolId > 0 ? contract.userInfo(claimablePoolId, walletAddress) : null,
    contract.getTimeLeft().catch(() => null),
    tokenContract.decimals().catch(() => 18),
    tokenContract.symbol().catch(() => ''),
  ])

  const decimals = typeof tokenDecimalsRaw === 'number' ? tokenDecimalsRaw : Number(tokenDecimalsRaw)
  const toNum = (bn: ethers.BigNumber) => parseFloat(ethers.utils.formatUnits(bn, decimals))

  return {
    totalSupplyAmount: toNum(globalPool.totalSupplyAmount),
    totalDistributionAmount: toNum(globalPool.totalDistributionAmount),
    currentPoolNum,
    claimablePoolId,
    hasClaimablePool: claimablePoolId > 0,
    poolIntervalSeconds: (poolIntervalBn as ethers.BigNumber).toNumber(),
    timeLeftToClaimSeconds: timeLeft ? (timeLeft.timeLeftToClaim as ethers.BigNumber).toNumber() : 0,
    tokenSymbol,
    isEligible: claimStatus.qualified as boolean,
    alreadyClaimed: claimStatus.claimed as boolean,
    claimableAmount: toNum(claimStatus.claimableAmount as ethers.BigNumber),
    qualifiedUsers: poolInfo ? (poolInfo.qualifiedUsers as ethers.BigNumber).toNumber() : 0,
    lastPoolFundLock: poolInfo ? toNum(poolInfo.lockedAmount) : 0,
    lastPoolPerUser: poolInfo ? toNum(poolInfo.perUserDistribution) : 0,
    userTotalQualified: (globalUser.totalQualified as ethers.BigNumber).toNumber(),
    userTotalClaimedAmt: toNum(globalUser.totalClaimed),
    userTotalPoolClaimed: (globalUser.totalPoolClaimed as ethers.BigNumber).toNumber(),
    userInfo: userInfoRaw ? {
      addedTime: (userInfoRaw.addedTime as ethers.BigNumber).toNumber(),
      claimedTime: (userInfoRaw.claimedTime as ethers.BigNumber).toNumber(),
      directCount: (userInfoRaw.directCount as ethers.BigNumber).toNumber(),
      userClaimedAmt: toNum(userInfoRaw.UserClaimedAmt),
      inPool: userInfoRaw.inPool as boolean,
      one: userInfoRaw.one as boolean,
      two: userInfoRaw.two as boolean,
      three: userInfoRaw.three as boolean,
      upline: userInfoRaw.upline as string,
    } : EMPTY_USER_INFO,
  }
}

function fmtAmt(n: number, symbol: string) {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 4 })}${symbol ? ' ' + symbol : ''}`
}

function fmtDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function fmtDate(unixSeconds: number) {
  if (!unixSeconds) return '—'
  return new Date(unixSeconds * 1000).toLocaleString()
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
}

function HeroStat({
  icon, label, value, accent, pulse, index = 0, big = true, colorful = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
  pulse?: boolean
  index?: number
  big?: boolean
  colorful?: boolean
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="relative rounded-2xl border p-4 sm:p-5 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: colorful
          ? `linear-gradient(135deg, ${accent}55 0%, ${accent}1A 45%, rgba(8,15,38,0.96) 100%)`
          : 'linear-gradient(160deg, rgba(255,255,255,0.035) 0%, rgba(8,15,38,0.96) 65%)',
        borderColor: colorful ? `${accent}80` : `${accent}30`,
        boxShadow: colorful ? `0 12px 32px -14px ${accent}99` : undefined,
      }}
    >
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: accent }}
      />
      <div className="relative z-10 flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}1F`, border: `1px solid ${accent}55`, color: accent }}
        >
          {icon}
        </div>
        <span className="text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase text-white/60">{label}</span>
        {pulse && (
          <span className="ml-auto flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          </span>
        )}
      </div>
      <p
        className={`relative z-10 font-black text-white font-mono leading-tight tracking-tight truncate ${big ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'}`}
      >
        {value}
      </p>
    </motion.div>
  )
}

function SectionHeader({ icon, title, subtitle, accent }: { icon: React.ReactNode; title: string; subtitle: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${accent}1F`, border: `1px solid ${accent}55`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base sm:text-lg font-black text-white leading-tight">{title}</p>
        <p className="text-xs sm:text-sm text-white/50 font-medium">{subtitle}</p>
      </div>
      <div className="flex-1 h-px ml-2" style={{ background: `linear-gradient(90deg, ${accent}55, transparent)` }} />
    </div>
  )
}

export default function DailyRoyaltyPoolPage() {
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
    dailyRoyaltyPoolContract(account)
      .then((c) => { if (!cancelled) setContract(c ?? null) })
      .finally(() => { if (!cancelled) setContractLoading(false) })
    return () => { cancelled = true }
  }, [account])

  const [data, setData] = useState<PoolPageData | null>(null)
  const [poolNotStarted, setPoolNotStarted] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [fetchedAt, setFetchedAt] = useState(0)

  const loadData = useCallback(async () => {
    if (!contract || !walletAddress) return
    setDataLoading(true)
    setDataError('')
    try {
      const result = await fetchPoolPageData(contract, walletAddress)
      if (result === null) {
        setPoolNotStarted(true)
        setData(null)
      } else {
        setPoolNotStarted(false)
        setData(result)
        setFetchedAt(Date.now())
      }
    } catch (err: any) {
      setDataError(err?.reason ?? err?.message ?? 'Failed to load pool data.')
    } finally {
      setDataLoading(false)
    }
  }, [contract, walletAddress])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!contract || !walletAddress) return
    const t = setInterval(loadData, 60000)
    return () => clearInterval(t)
  }, [contract, walletAddress, loadData])

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const remainingSeconds = data
    ? Math.max(0, data.timeLeftToClaimSeconds - Math.floor((now - fetchedAt) / 1000))
    : 0

  const [txState, setTxState] = useState<ClaimTxState>('idle')
  const [txError, setTxError] = useState('')
  const isBusy = txState === 'pending' || txState === 'mining'

  const handleClaim = useCallback(async () => {
    if (!contract || !walletAddress) return
    setTxState('pending')
    setTxError('')
    try {
      const tx = await contract.claim(walletAddress)
      setTxState('mining')
      await tx.wait(1)
      setTxState('success')
      await loadData()
    } catch (err: any) {
      const msg: string = err?.reason ?? err?.data?.message ?? err?.message ?? ''
      let friendly = 'Claim failed. Please try again.'
      if (msg.toLowerCase().includes('user rejected') || msg.includes('4001')) {
        friendly = 'You rejected the transaction.'
      } else if (msg.includes('Already Claimed')) {
        friendly = 'You have already claimed for this pool.'
      } else if (msg.includes('No Supply Available')) {
        friendly = 'No supply is available to claim yet.'
      } else if (msg.includes('Invalid User')) {
        friendly = 'You are not eligible to claim for this pool.'
      }
      setTxState('error')
      setTxError(friendly)
    }
  }, [contract, walletAddress, loadData])

  return (
    <div className="relative space-y-5" data-testid="daily-royalty-pool-page">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex items-center gap-3.5">
          <div
            className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #38BDF8 0%, #0ea5e9 100%)',
              boxShadow: '0 8px 24px -6px rgba(56,189,248,0.55)',
            }}
          >
            <Gift size={24} className="text-[#04111f]" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">Daily Royalty Pool</p>
            <span className="text-sm sm:text-base font-medium text-white/60">
              Qualify with 2 direct referrals across all three packages to earn a share of today's pool.
            </span>
          </div>
        </div>
        {data && (
          <button
            onClick={loadData}
            disabled={dataLoading}
            data-testid="daily-royalty-refresh"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] text-sm font-bold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-40"
          >
            <RefreshCw size={15} className={dataLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}
      </header>

      {!account ? (
        <div className="flex items-center justify-center gap-3 py-20 rounded-2xl border border-white/[0.08] bg-[#080F26]">
          <Wallet size={22} className="text-white/50" />
          <p className="text-white font-mono text-base sm:text-lg font-semibold">Connect your wallet to view the daily royalty pool</p>
        </div>
      ) : contractLoading ? (
        <div className="flex items-center justify-center gap-3 py-20 rounded-2xl border border-white/[0.08] bg-[#080F26]">
          <Loader2 size={22} className="animate-spin text-[#7dd3fc]" />
          <p className="text-white font-mono text-base sm:text-lg font-semibold">Connecting to contract…</p>
        </div>
      ) : dataLoading && !data && !poolNotStarted ? (
        <div className="flex items-center justify-center gap-3 py-20 rounded-2xl border border-white/[0.08] bg-[#080F26]">
          <Loader2 size={22} className="animate-spin text-[#7dd3fc]" />
          <p className="text-white font-mono text-base sm:text-lg font-semibold">Loading pool data…</p>
        </div>
      ) : dataError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 rounded-2xl border border-white/[0.08] bg-[#080F26]">
          <div className="flex items-center gap-2.5 text-red-400">
            <AlertCircle size={20} />
            <p className="text-base font-mono font-semibold">{dataError}</p>
          </div>
          <button
            onClick={loadData}
            className="px-5 py-2.5 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-sm font-bold hover:bg-[#38BDF8]/20 transition-all"
          >
            Retry
          </button>
        </div>
      ) : poolNotStarted ? (
        <div className="flex items-center justify-center py-20 rounded-2xl border border-white/[0.08] bg-[#080F26]">
          <p className="text-white font-mono text-base sm:text-lg font-semibold">The daily royalty pool hasn't started yet.</p>
        </div>
      ) : data ? (
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative rounded-3xl border border-white/[0.08] bg-[#080F26] p-5 sm:p-7 overflow-hidden"
            data-testid="daily-royalty-status-card"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5A623]/60 to-transparent" />

            <div className="flex items-center justify-between gap-3 mb-5">
              <p className="text-xl sm:text-2xl font-black text-white">Your Status</p>
              <span
                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide"
                style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.35)', color: '#F5A623' }}
              >
                Pool #{data.claimablePoolId}
              </span>
            </div>

            {!data.hasClaimablePool ? (
              <div className="flex items-center gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]" data-testid="daily-royalty-nothing-claimable">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                  <XCircle size={22} className="text-white/50" />
                </div>
                <p className="text-base sm:text-lg text-white/80 font-medium">No pool has closed yet — nothing to claim so far.</p>
              </div>
            ) : !data.isEligible ? (
              <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-500/[0.06] border border-red-500/20" data-testid="daily-royalty-not-eligible">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <XCircle size={22} className="text-red-400" />
                </div>
                <p className="text-base sm:text-lg text-white/85 font-medium">You're not eligible for today's daily royalty pool.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <HeroStat index={0} big={false} icon={<Timer size={15} />} label="Added" value={fmtDate(data.userInfo.addedTime)} accent="#38BDF8" />
                  <HeroStat index={1} big={false} icon={<Timer size={15} />} label="Claimed" value={fmtDate(data.userInfo.claimedTime)} accent="#4ade80" />
                  <HeroStat index={2} big={false} icon={<Users size={15} />} label="Direct Count" value={String(data.userInfo.directCount)} accent="#F5A623" />
                  <HeroStat index={3} big={false} icon={<Coins size={15} />} label="Total Claimed" value={fmtAmt(data.userInfo.userClaimedAmt, data.tokenSymbol)} accent="#38BDF8" />
                </div>

                <div
                  className="relative rounded-2xl overflow-hidden p-5 sm:p-7"
                  style={{
                    background: 'linear-gradient(135deg, #0c1a33 0%, #0a1428 100%)',
                    border: '1px solid rgba(56,189,248,0.35)',
                    boxShadow: '0 20px 50px -18px rgba(56,189,248,0.35)',
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 2px, transparent 6px)' }}
                  />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-[#7dd3fc] mb-2.5">
                        <Sparkles size={14} /> Today's Claimable Amount
                      </p>
                      <p className="text-4xl sm:text-5xl font-black text-white font-mono leading-none tracking-tight break-all">
                        {fmtAmt(data.claimableAmount, data.tokenSymbol)}
                      </p>
                      {data.qualifiedUsers > 0 && (
                        <p className="text-sm sm:text-base text-white/50 mt-3 font-medium">
                          Split among {data.qualifiedUsers} qualified member{data.qualifiedUsers === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>

                    {data.alreadyClaimed ? (
                      <div
                        className="shrink-0 px-6 py-4 rounded-xl text-center text-sm sm:text-base font-black tracking-wide border border-[#22c55e] bg-green-500 flex items-center justify-center gap-2"
                        data-testid="daily-royalty-claimed"
                      >
                        <CheckCircle2 size={18} />
                        Already Claimed
                      </div>
                    ) : (
                      <button
                        onClick={handleClaim}
                        disabled={isBusy || data.claimableAmount <= 0}
                        data-testid="daily-royalty-claim-btn"
                        className="group relative shrink-0 overflow-hidden flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base sm:text-lg font-black tracking-wide transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)',
                          color: '#04111f',
                          boxShadow: '0 8px 24px rgba(56,189,248,0.45)',
                        }}
                      >
                        {!isBusy && data.claimableAmount > 0 && (
                          <span
                            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }}
                          />
                        )}
                        <span className="relative inline-flex items-center gap-2">
                          {isBusy ? (
                            <><Loader2 size={18} className="animate-spin" />{txState === 'pending' ? 'Confirm in wallet…' : 'Claiming…'}</>
                          ) : (
                            <>Claim Now<Zap size={18} /></>
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {txState === 'error' && txError && (
                  <p className="text-sm font-mono font-bold mt-3 flex items-center gap-1.5 text-[#f87171]">
                    <AlertCircle size={14} />{txError}
                  </p>
                )}
                {txState === 'success' && (
                  <p className="text-sm font-mono font-bold mt-3 flex items-center gap-1.5 text-[#4ade80]">
                    <CheckCircle2 size={14} />Claim successful!
                  </p>
                )}
              </>
            )}
          </motion.div>

          <section>
          <SectionHeader icon={<Timer size={17} />} title="Pool Overview" subtitle="Live status of the daily royalty pool" accent="#F5A623" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <HeroStat index={0} icon={<Coins size={17} />} label="Total Supply" value={fmtAmt(data.totalSupplyAmount, data.tokenSymbol)} accent="#F5A623" />
            <HeroStat index={1} icon={<TrendingUp size={17} />} label="Total Distributed" value={fmtAmt(data.totalDistributionAmount, data.tokenSymbol)} accent="#38BDF8" />
            <HeroStat index={2} icon={<Layers size={17} />} label="Current Pool" value={`#${data.currentPoolNum}`} accent="#38BDF8" />
            <HeroStat index={3} icon={<Timer size={17} />} label="Pool Interval" value={fmtDuration(data.poolIntervalSeconds)} accent="#F5A623" />
            <HeroStat index={4} icon={<Timer size={17} />} label="Pool Ends In" value={fmtDuration(remainingSeconds)} accent="#fb7185" pulse />
          </div>
          </section>

          <section>
            <SectionHeader icon={<Layers size={17} />} title="Global" subtitle={`Last closed pool #${data.claimablePoolId || '—'}`} accent="#38BDF8" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <HeroStat colorful index={0} icon={<Coins size={17} />} label="Last Pool - Fund Lock" value={fmtAmt(data.lastPoolFundLock, data.tokenSymbol)} accent="#F5A623" />
              <HeroStat colorful index={1} icon={<Users size={17} />} label="Last Pool - Total Qualified" value={String(data.qualifiedUsers)} accent="#38BDF8" />
              <HeroStat colorful index={2} icon={<Sparkles size={17} />} label="Last Pool - Per User" value={fmtAmt(data.lastPoolPerUser, data.tokenSymbol)} accent="#14B8A6" />
            </div>
          </section>

          <section>
            <SectionHeader icon={<Wallet size={17} />} title="Your Info" subtitle="Your lifetime activity across all pools" accent="#A855F7" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <HeroStat colorful index={3} icon={<CheckCircle2 size={17} />} label="Total Pool Qualified" value={String(data.userTotalQualified)} accent="#A855F7" />
              <HeroStat colorful index={4} icon={<Gift size={17} />} label="Total Pool Claim" value={String(data.userTotalPoolClaimed)} accent="#22C55E" />
              <HeroStat colorful index={5} icon={<TrendingUp size={17} />} label="Total Claimed Amount" value={fmtAmt(data.userTotalClaimedAmt, data.tokenSymbol)} accent="#F43F5E" />
            </div>
          </section>

        </div>
      ) : null}
    </div>
  )
}

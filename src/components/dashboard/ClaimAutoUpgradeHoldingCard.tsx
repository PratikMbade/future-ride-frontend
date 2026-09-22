import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { motion } from 'framer-motion'
import { useActiveAccount } from 'thirdweb/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Lock, Loader2, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react'
import { contractInstance } from '@/contract/auto-upgrade-holding-contract'

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }) }

type ClaimTxState = 'idle' | 'pending' | 'mining' | 'success' | 'error'

interface HoldingInfo {
  amount: number
}

function toNum(bn: ethers.BigNumber) {
  return parseFloat(ethers.utils.formatUnits(bn, 18))
}

// Sibling section to the identity strip on the dashboard home page — lets a
// connected wallet claim their auto-upgrade holding balance directly from
// the AUTO_UPGRADE_CONTRACT_ADDRESS contract, mirroring the claim flow in
// RoyaltyPage.tsx (claimReward → claimUpgradeHolding).
export function ClaimAutoUpgradeHoldingCard({ index = 0.5 }: { index?: number }) {
  const account = useActiveAccount()
  const walletAddress = account?.address
  const queryClient = useQueryClient()

  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [contractLoading, setContractLoading] = useState(false)

  useEffect(() => {
    if (!account) {
      setContract(null)
      return
    }
    let cancelled = false
    setContractLoading(true)
    contractInstance(account)
      .then(c => { if (!cancelled) setContract(c ?? null) })
      .finally(() => { if (!cancelled) setContractLoading(false) })
    return () => { cancelled = true }
  }, [account])

  const holdingQ = useQuery<HoldingInfo>({
    queryKey: ['on-chain', 'auto-upgrade-holding', walletAddress],
    queryFn: async () => {
      const amountWei = await contract!.autoUpgradeHolding(walletAddress)

      return {
        amount: toNum(amountWei as ethers.BigNumber),
      }
    },
    enabled: !!contract && !!walletAddress,
    staleTime: 60 * 1000,
    retry: 1,
  })

  const [txState, setTxState] = useState<ClaimTxState>('idle')
  const [txError, setTxError] = useState('')

  const isBusy = txState === 'pending' || txState === 'mining'
  const amount = holdingQ.data?.amount ?? 0
  const canClaim = !!contract && !!walletAddress && amount > 0 && !isBusy

  const handleClaim = useCallback(async () => {
    if (!contract || !walletAddress) return
    setTxState('pending')
    setTxError('')
    try {
      const tx = await contract.claimUpgradeHolding(walletAddress)
      setTxState('mining')
      await tx.wait(1)
      setTxState('success')
      await Promise.all([
        holdingQ.refetch(),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'on-chain-balances'] }),
      ])
    } catch (err: any) {
      const msg: string = err?.reason ?? err?.data?.message ?? err?.message ?? ''
      let friendly = 'Claim failed. Please try again.'
      if (msg.toLowerCase().includes('user rejected') || msg.includes('4001')) {
        friendly = 'You rejected the transaction.'
      } else if (msg) {
        friendly = msg
      }
      setTxState('error')
      setTxError(friendly)
    }
  }, [contract, walletAddress, holdingQ, queryClient])

  const statusLabel = !walletAddress
    ? 'Connect wallet to view'
    : contractLoading || holdingQ.isLoading
      ? 'Loading…'
      : `${amount.toFixed(2)} USDT claimable`

  const buttonLabel =
    txState === 'pending' ? 'Confirm in wallet…' :
    txState === 'mining'  ? 'Claiming…' :
    txState === 'success' ? 'Claimed!' :
    'Claim'

  return (
    <motion.div
      initial="hidden" animate="visible" custom={index} variants={fadeUp}
      className="relative rounded-2xl border border-[#F5A623]/20 bg-[#080F26] overflow-hidden"
      data-testid="claim-holding-card"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5A623]/60 to-transparent" />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5A623]/70 to-[#F5A623]/25 border border-[#F5A623]/30 flex items-center justify-center">
            <Lock size={18} className="text-[#F5A623]" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-white truncate">Auto Upgrade Holding</span>
            <p className="text-xs text-white/40 truncate">{statusLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            data-testid="claim-holding-button"
            onClick={handleClaim}
            disabled={!canClaim}
            className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#F5A623] to-[#FBBF24] text-[#1A1200] text-xs font-bold tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
          >
            {isBusy ? <Loader2 size={13} className="animate-spin" /> : txState === 'success' ? <CheckCircle2 size={13} /> : <Sparkles size={13} />}
            <span>{buttonLabel}</span>
          </button>
        </div>
      </div>

      {txState === 'error' && txError && (
        <p className="relative z-10 flex items-center gap-1.5 text-[11px] text-red-400 px-4 sm:px-5 pb-3">
          <AlertCircle size={11} className="shrink-0" />{txError}
        </p>
      )}
    </motion.div>
  )
}

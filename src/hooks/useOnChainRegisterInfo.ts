import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { useActiveAccount } from 'thirdweb/react'
import { contractInstance } from '@/contract/contract'

export interface OnChainRegisterInfo {
  directIncome: number
  generationIncome: number
  generationLapsedIncome: number
  generationLostIncome: number
  levelIncome: number
  levelLapsedIncome: number
  levelLostIncome: number
}

const EMPTY_REGISTER_INFO: OnChainRegisterInfo = {
  directIncome: 0,
  generationIncome: 0,
  generationLapsedIncome: 0,
  generationLostIncome: 0,
  levelIncome: 0,
  levelLapsedIncome: 0,
  levelLostIncome: 0,
}

function toNum(bn: ethers.BigNumber) {
  return parseFloat(ethers.utils.formatUnits(bn, 18))
}

// Reads the `register(address)` struct directly from the FutureRide contract —
// Direct/Upgrade/UpLps/LVLIn/LVLLPSIn/UPLOST/LVLLOST are lifetime income
// totals the contract itself tracks per address, so no backend round-trip
// is needed to show them.
//
// Field mapping (per contract naming convention — "UP" = generation/upline,
// "LVL" = level):
//   Direct    → direct income
//   Upgrade   → generation income
//   UpLps     → generation lapsed income
//   UPLOST    → generation lost income
//   LVLIn     → level income
//   LVLLPSIn  → level lapsed income
//   LVLLOST   → level lost income
export function useOnChainRegisterInfo(readAddress?: string) {
  const account = useActiveAccount()

  const query = useQuery<OnChainRegisterInfo>({
    queryKey: ['on-chain', 'register-info', account?.address, readAddress],
    queryFn: async () => {
      const contract = await contractInstance(account!)
      if (!contract) throw new Error('Contract instance unavailable')
      const r = await contract.register(readAddress)
      return {
        directIncome:           toNum(r.Direct),
        generationIncome:       toNum(r.Upgrade),
        generationLapsedIncome: toNum(r.UpLps),
        generationLostIncome:   toNum(r.UPLOST),
        levelIncome:            toNum(r.LVLIn),
        levelLapsedIncome:      toNum(r.LVLLPSIn),
        levelLostIncome:        toNum(r.LVLLOST),
      }
    },
    enabled: !!account && !!readAddress && ethers.utils.isAddress(readAddress),
    staleTime: 60 * 1000,
    retry: 1,
  })

  return {
    data: query.data ?? EMPTY_REGISTER_INFO,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

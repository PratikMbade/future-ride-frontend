import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'
import { useActiveAccount } from 'thirdweb/react'
import { dailyRoyaltyPoolContract } from '@/contract/daily-royalty-pool/daily-royalty-pool-contract'

const ERC20_DECIMALS_ABI = [
  { constant: true, inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
]

// Lifetime amount a wallet has claimed from the daily royalty pool
// (GlobalUserDetails.totalClaimed), read straight from the pool contract.
export function useDailyRoyaltyClaimed(readAddress?: string) {
  const account = useActiveAccount()

  return useQuery<number>({
    queryKey: ['on-chain', 'daily-royalty-claimed', account?.address, readAddress],
    queryFn: async () => {
      const contract = await dailyRoyaltyPoolContract(account!)
      if (!contract) throw new Error('Contract instance unavailable')
      const [user, tokenAddr] = await Promise.all([
        contract.GlobalUserDetails(readAddress),
        contract.tokenAddress(),
      ])
      const token = new ethers.Contract(tokenAddr, ERC20_DECIMALS_ABI, contract.signer)
      const decimals = Number(await token.decimals().catch(() => 18))
      return parseFloat(ethers.utils.formatUnits(user.totalClaimed, decimals))
    },
    enabled: !!account && !!readAddress,
    staleTime: 60 * 1000,
    retry: 1,
  })
}

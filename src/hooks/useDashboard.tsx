import { useQuery } from '@tanstack/react-query'
import {
  mockDashboardData,
  mockDirectTeam,
  mockGenerationTree,
  mockIncomeRecords,
  mockPackageHistory,
  mockUserPreview,
} from '../lib/mockData'
import type { IncomeType, UserPreview } from '../types/dashboard'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { await delay(600); return mockDashboardData },
    staleTime: 1000 * 60 * 5,
  })
}

export function useDirectTeam() {
  return useQuery({
    queryKey: ['directTeam'],
    queryFn: async () => { await delay(500); return mockDirectTeam },
  })
}

export function useGenerationTree() {
  return useQuery({
    queryKey: ['generationTree'],
    queryFn: async () => { await delay(700); return mockGenerationTree },
  })
}

export function useIncomeRecords(type?: IncomeType) {
  return useQuery({
    queryKey: ['incomeRecords', type],
    queryFn: async () => {
      await delay(500)
      return type ? mockIncomeRecords.filter((r) => r.incomeType === type) : mockIncomeRecords
    },
  })
}

export function usePackageHistory() {
  return useQuery({
    queryKey: ['packageHistory'],
    queryFn: async () => { await delay(400); return mockPackageHistory },
  })
}

export function useUserPreview(walletAddress?: string) {
  return useQuery<UserPreview>({
    queryKey: ['userPreview', walletAddress],
    queryFn: async () => { await delay(800); return mockUserPreview },
    enabled: !!walletAddress,
  })
}

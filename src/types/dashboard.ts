export type IncomeType ='total-income'| 'direct' | 'generation' | 'auto-upgrade-holding' | 'laps-credit' | 'lost-income'
export type MemberStatus = 'active' | 'inactive'
export type PackageStatus = 'active' | 'expired' | 'pending'

export interface DashboardUser {
  userId: string
  walletAddress: string
  referralCode: string
  referralLink: string
  referredBy: string
  referrerId: string
  currentPackage: string
  highestPackage: string
  walletBalance: number
  status: MemberStatus
  joinDate: string
}

export interface NetworkStats {
  directTeam: number
  totalCommunity: number
  activeTeam: number
  totalReferrals: number
}

export interface EarningsStats {
  total: number
  today: number
  direct: number
  generation: number
  upgrade: number
  lost: number
}

export interface IncomeRecord {
  id: string
  fromWallet: string
  amount: number
  incomeType: IncomeType
  level: number
  date: string
}

export interface PackageRecord {
  id: string
  packageName: string
  amount: number
  purchaseDate: string
  status: PackageStatus
}

export interface DirectTeamMember {
  id: string
  walletAddress: string
  package: string
  joinDate: string
  status: MemberStatus
}

export interface GenerationTreeNode {
  id: string
  walletAddress: string
  package: string
  level: number
  joinDate: string
  children: GenerationTreeNode[]
}

export interface UserPreview {
  walletAddress: string
  package: string
  directTeamCount: number
  communityCount: number
  totalEarnings: number
  directIncome: number
  generationIncome: number
  upgradeIncome: number
  lostIncome: number
  generationTree: GenerationTreeNode
}

export interface SparklineData {
  value: number
}

export interface DashboardData {
  user: DashboardUser
  networkStats: NetworkStats
  earningsStats: EarningsStats
  recentIncome: IncomeRecord[]
  sparklines: {
    direct: SparklineData[]
    generation: SparklineData[]
    upgrade: SparklineData[]
    lost: SparklineData[]
  }
  todayDistribution: {
    direct: number
    generation: number
    upgrade: number
  }
}

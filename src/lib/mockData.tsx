import type {
  DashboardData,
  DirectTeamMember,
  GenerationTreeNode,
  IncomeRecord,
  PackageRecord,
  SparklineData,
  UserPreview,
} from '@/types/dashboard'

const WALLETS = [
  '0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B',
  '0x2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C',
  '0x3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D',
  '0x4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E',
  '0x5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F',
  '0x6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f5A',
  '0x7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B',
  '0x8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C',
]

const PACKAGES = ['$5','$10','$20','$40','$80','$160','$320','$640','$1280','$2560','$5120','$10240']

function rnd(min: number, max: number) { return Math.random() * (max - min) + min }
function rndDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString().split('T')[0]
}
function spark(n = 7): SparklineData[] {
  return Array.from({ length: n }, () => ({ value: parseFloat(rnd(0, 12).toFixed(2)) }))
}

export const mockDashboardData: DashboardData = {
  user: {
    userId: '2',
    walletAddress: '0xA1B2C3D4E5F6789012345678901234567890ABCD',
    referralCode: '1',
    referralLink: 'https://futureride.live/join?ref=FR-A1B2C3',
    referredBy: '0xB2C3D4E5F67890123456789012345678901BCDE',
    referrerId: '1',
    currentPackage: '$160',
    highestPackage: '$320',
    walletBalance: 2.847,
    status: 'active',
    joinDate: '2024-11-15',
  },
  networkStats: { directTeam: 8, totalCommunity: 47, activeTeam: 6, totalReferrals: 8 },
  earningsStats: { total: 24.56, today: 1.28, direct: 12.40, generation: 8.96, upgrade: 3.20, lost: 0.80 },
  recentIncome: WALLETS.map((w, i) => ({
    id: `inc-${i}`,
    fromWallet: w,
    amount: parseFloat(rnd(0.1, 5).toFixed(4)),
    incomeType: (['direct','generation','upgrade-income'] as const)[i % 3],
    level: (i % 12) + 1,
    date: rndDate(new Date('2024-12-01'), new Date('2025-01-30')),
  })),
  sparklines: { direct: spark(), generation: spark(), upgrade: spark(), lost: spark() },
  todayDistribution: { direct: 0.64, generation: 0.48, upgrade: 0.16 },
}

export const mockPackageHistory: PackageRecord[] = [
  { id: 'p1', packageName: 'Package $5',   amount: 5,   purchaseDate: '2024-06-10', status: 'expired' },
  { id: 'p2', packageName: 'Package $10',  amount: 10,  purchaseDate: '2024-07-22', status: 'expired' },
  { id: 'p3', packageName: 'Package $40',  amount: 40,  purchaseDate: '2024-09-05', status: 'expired' },
  { id: 'p4', packageName: 'Package $160', amount: 160, purchaseDate: '2024-11-15', status: 'active' },
  { id: 'p5', packageName: 'Package $320', amount: 320, purchaseDate: '2024-12-01', status: 'expired' },
]

export const mockDirectTeam: DirectTeamMember[] = WALLETS.map((w, i) => ({
  id: `m${i}`,
  walletAddress: w,
  package: PACKAGES[i % PACKAGES.length],
  joinDate: rndDate(new Date('2024-06-01'), new Date('2025-01-30')),
  status: i % 5 !== 0 ? 'active' : 'inactive',
}))

export const mockIncomeRecords: IncomeRecord[] = Array.from({ length: 30 }, (_, i) => ({
  id: `ir-${i}`,
  fromWallet: WALLETS[i % WALLETS.length],
  amount: parseFloat(rnd(0.05, 8).toFixed(4)),
  incomeType: (['total-income','direct','generation','auto-upgrade-holding','laps-credit','lost-income'] as const)[i % 3],
  level: (i % 12) + 1,
  date: rndDate(new Date('2024-10-01'), new Date('2025-01-30')),
}))

function buildTree(depth: number, addr: string, level: number): GenerationTreeNode {
  return {
    id: `${addr.slice(-4)}-${level}-${depth}`,
    walletAddress: addr,
    package: PACKAGES[level % PACKAGES.length],
    level,
    joinDate: rndDate(new Date('2024-06-01'), new Date('2025-01-30')),
    children: depth > 0
      ? WALLETS.slice(0, depth > 1 ? 3 : 2).map((w) => buildTree(depth - 1, w, level + 1))
      : [],
  }
}

export const mockGenerationTree: GenerationTreeNode = buildTree(
  3, '0xA1B2C3D4E5F6789012345678901234567890ABCD', 1
)

export const mockUserPreview: UserPreview = {
  walletAddress: '0x9876543210ABCDEF9876543210ABCDEF98765432',
  package: '$80',
  directTeamCount: 5,
  communityCount: 23,
  totalEarnings: 8.45,
  directIncome: 4.20,
  generationIncome: 3.10,
  upgradeIncome: 1.15,
  lostIncome: 0.30,
  generationTree: buildTree(2, '0x9876543210ABCDEF9876543210ABCDEF98765432', 1),
}

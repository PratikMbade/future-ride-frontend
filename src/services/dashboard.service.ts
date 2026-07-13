/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export type IncomeType = 'direct' | 'generation' | 'laps';


// src/services/dashboard.service.ts
const API = import.meta.env.VITE_API_URL;

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json();
};

// ─── types ────────────────────────────────────────────────
export interface UserData {
  highestPackage:      number;
  packagePurchaseDate: string;
  referredBy:          string | null;
  referralLink:        string;
  directTeamCount:     number;
  totalCommunityTeam:  number;
  userAddress:         string;
  contractRegId:       number | null;
  isRegistered:        boolean;
  walletFundBalance:   number;
}

export interface EarningsData {
  totalEarning:       number;
  todaysEarning:      number;
  directTeamCount:    number;
  totalCommunityTeam: number;
}

export interface BreakdownData {
  directIncome:       number;
  levelUpgradeIncome: number;
  lapsIncome:         number;
}

export interface IncomeRecord {
  id:                string;
  incomeType:        IncomeType;
  fromAddress:       string;        // ← mapped from fromUserAddress
  fromContractRegId: number | null; // ← sender's registered contract user ID
  amount:            number;
  packageNumber:     number;
  packageName:       string;
  level:             number;
  date:              string;
  transactionHash:   string;
}
// ─── service ──────────────────────────────────────────────
export const dashboardService = {

  // all account card + wallet card data from one endpoint
  getUser: async (): Promise<UserData> => {
    const data = await get<{ success: boolean } & UserData>('/api/user/me');
    return data;
  },

  // earnings: sum of all income types
  getEarnings: async (): Promise<EarningsData> => {
    const [directRes, genRes, _lapsRes, userRes] = await Promise.all([
      get<{ records: { amount: string }[] }>('/api/income/direct'),
      get<{ records: { amount: string }[] }>('/api/income/generation'),
      get<{ records: { amount: string }[] }>('/api/income/laps'),
      get<UserData>('/api/user/me'),
    ]);

    const sum = (records: { amount: string }[]) =>
      records.reduce((acc, r) => acc + parseFloat(r.amount), 0);

    const totalEarning = sum(directRes.records) + sum(genRes.records);

    // today's earning — filter by today's date
    const today = new Date().toDateString();
    const todaysEarning = [
      ...directRes.records,
      ...genRes.records,
    ]
      .filter(r => new Date(parseInt((r as any).timestamp) * 1000).toDateString() === today)
      .reduce((acc, r) => acc + parseFloat(r.amount), 0);

    return {
      totalEarning,
      todaysEarning,
      directTeamCount:    userRes.directTeamCount,
      totalCommunityTeam: userRes.totalCommunityTeam,
    };
  },

  // income breakdown by type
  getBreakdown: async (): Promise<BreakdownData> => {
    const [directRes, genRes, lapsRes] = await Promise.all([
      get<{ records: { amount: string }[] }>('/api/income/direct'),
      get<{ records: { amount: string }[] }>('/api/income/generation'),
      get<{ records: { amount: string }[] }>('/api/income/laps'),
    ]);

    const sum = (records: { amount: string }[]) =>
      records.reduce((acc, r) => acc + parseFloat(r.amount), 0);

    return {
      directIncome:       sum(directRes.records),
      levelUpgradeIncome: sum(genRes.records),
      lapsIncome:         sum(lapsRes.records),
    };
  },

  // recent income — merged and sorted by timestamp desc
getRecentIncome: async (limit = 15): Promise<IncomeRecord[]> => {
  const [directRes, genRes, lapsRes] = await Promise.all([
    get<{ records: any[] }>('/api/income/direct'),
    get<{ records: any[] }>('/api/income/generation'),
    get<{ records: any[] }>('/api/income/laps'),
  ]);

const normalize = (r: any, type: IncomeType): IncomeRecord => ({
  id:                r.id,
  incomeType:        type,
  fromAddress:       r.fromUserAddress,
  fromContractRegId: r.fromContractRegId ?? r.contractRegId ?? null,
  amount:            typeof r.amount === 'number' ? r.amount : parseFloat(r.amount),
  packageNumber:     r.packageNumber,
  packageName:       r.packageName,
  level:             r.level ?? 0,
  date:              new Date(r.creditedAt ?? r.timestamp).toISOString(),
  transactionHash:   r.transactionHash,
});

  const direct = directRes.records.map(r => normalize(r, 'direct'));
  const gen    = genRes.records.map(r    => normalize(r, 'generation'));
  const laps   = lapsRes.records.map(r   => normalize(r, 'laps'));

  return [...direct, ...gen, ...laps]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
},
};
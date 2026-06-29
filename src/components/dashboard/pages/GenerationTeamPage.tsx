import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { DataTable } from '../DataTable'
import type { Column, FilterConfig } from '../DataTable'
import type { GenerationTeamMember, GenerationTeamResponse } from '../../../types/dashboard'

const API = import.meta.env.VITE_API_URL

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function GenerationTeamPage() {
  // Same session-scoping pattern as DirectTeam/DashboardHomePage.
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => {
    refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  // Generation level is a structural filter the backend computes from the
  // tree walk — it can't be applied client-side after the fact, so it's
  // a real query param that refetches, same as page/search/package.
  const [levelFilter, setLevelFilter] = useState<string>('')

  const teamQ = useQuery<GenerationTeamMember[]>({
    queryKey: ['dashboard', 'generation-team', address, levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '500' })
      if (levelFilter) params.set('level', levelFilter)

      const res = await fetch(`${API}/api/user/generation-team?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load generation team')
      const json: GenerationTeamResponse = await res.json()
      if (!json.success) throw new Error('Failed to load generation team')
      return json.members
    },
    enabled: sessionReady,
    staleTime: 60 * 1000,
  })

  const team = teamQ.data
  const isLoading = sessionPending || teamQ.isLoading

  const cols: Column<GenerationTeamMember>[] = [
    {
      key: 'contractRegId', header: 'User ID', sortable: true,
      render: (r) => <span className="font-mono font-semibold text-[#38BDF8]">{r.contractRegId ?? '—'}</span>,
    },
    {
      key: 'userAddress', header: 'Wallet Address', sortable: true,
      render: (r) => <WalletAddress address={r.userAddress} data-testid="gen-team-member-wallet" />,
    },
    {
      key: 'generationLevel', header: 'Generation Level', sortable: true,
      render: (r) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#A855F7]/10 text-[#A855F7] font-mono">
          Level{r.generationLevel}
        </span>
      ),
    },
    {
      key: 'referralAddress', header: 'Referral Address', sortable: true,
      render: (r) => r.referralAddress
        ? <WalletAddress address={r.referralAddress} data-testid="gen-team-referral-address" />
        : <span className="font-mono text-sm text-white/35">—</span>,
    },
    {
      key: 'highestPackage', header: 'Current Package', sortable: true,
      render: (r) => (
        <span className="text-[#F5A623] font-mono font-medium">
          PKG {String(r.highestPackage).padStart(2, '0')}
        </span>
      ),
    },
    {
      key: 'joinedAt', header: 'Joining Date', sortable: true,
      render: (r) => <span className="text-white/70 text-sm">{new Date(r.joinedAt).toLocaleDateString()}</span>,
    },
    {
      key: 'totalIncome', header: 'Total Income', sortable: true,
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono font-bold text-white">{usd(r.totalIncome)}</span>
          <span className="text-[10px] text-white/40 font-mono leading-tight">
            D: {usd(r.directIncome)} · G: {usd(r.generationIncome)} · L: {usd(r.lapsIncome)} · R: {usd(r.royaltyIncome)}
          </span>
        </div>
      ),
    },
  ]

  const packageOptions = Array.from({ length: 12 }, (_, i) => i + 1).map((p) => ({
    label: `PKG ${String(p).padStart(2, '0')}`,
    value: String(p),
  }))

  const filters: FilterConfig<GenerationTeamMember>[] = [
    {
      key: 'highestPackage',
      label: 'Packages',
      options: packageOptions,
    },
  ]

  return (
    <div className="space-y-5" data-testid="generation-team-page">

      <header>
        <p className="text-base font-bold text-white">Generation Team Table</p>
        <span className="text-sm text-white/50">
          All downline members across every generation level in your matrix.
        </span>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-base font-bold text-white">Generation Team Members</p>

          {/* Level filter — server-side, since it's computed from the tree walk */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-mono uppercase tracking-wider">Level</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white font-mono outline-none focus:border-[#A855F7]/40"
              data-testid="generation-level-filter"
            >
              <option value="">All Levels</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((lvl) => (
                <option key={lvl} value={lvl}>L{lvl}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable<GenerationTeamMember>
          data-testid="generation-team-table"
          data={team ?? []}
          columns={cols}
          loading={isLoading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50]}
          searchable
          searchPlaceholder="Search wallet or package…"
          filters={filters}
        />
      </motion.div>
    </div>
  )
}
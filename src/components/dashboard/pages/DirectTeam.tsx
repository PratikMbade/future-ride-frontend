import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { DataTable } from '../DataTable'
import type { Column, FilterConfig } from '../DataTable'
import type { DirectTeamMember, DirectTeamResponse } from '../../../types/dashboard'

const API = import.meta.env.VITE_API_URL

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DirectTeam() {
  // Same session-scoping pattern as DashboardHomePage/HomeDashboard:
  // scope on the SIWE session address (authClient.useSession), not the
  // wallet connector's live state, and force a refetch on mount as a
  // second-layer defense against the better-auth stale-atom issue.
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => {
    refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  // Fetch the full direct-team list in one shot (high limit) so DataTable's
  // existing client-side search/pagination keeps working unchanged —
  // only the data source moved, not how DataTable consumes it.
  const teamQ = useQuery<DirectTeamMember[]>({
    queryKey: ['dashboard', 'direct-team', address],
    queryFn: async () => {
      const res = await fetch(`${API}/api/user/direct-team?limit=500`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load direct team')
      const json: DirectTeamResponse = await res.json()
      if (!json.success) throw new Error('Failed to load direct team')
      return json.members
    },
    enabled: sessionReady,
    staleTime: 60 * 1000,
  })

  const team = teamQ.data
  const isLoading = sessionPending || teamQ.isLoading

  const cols: Column<DirectTeamMember>[] = [
    {
      key: 'contractRegId', header: 'User ID', sortable: true,
      render: (r) => <span className="font-mono font-semibold text-[#38BDF8]">{r.contractRegId ?? '—'}</span>,
    },
    {
      key: 'userAddress', header: 'Wallet Address', sortable: true,
      render: (r) => <WalletAddress address={r.userAddress} data-testid="team-member-wallet" />,
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
      // Count of THIS member's own direct referrals — surfaced by the backend
      // via `subMap.get(m.userAddress)` in getDirectTeam.
      key: 'directTeam', header: 'Direct Team', sortable: true,
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#22D3EE]/10 text-[#22D3EE] font-mono">
          <Users size={11} />
          {r.directTeam ?? 0}
        </span>
      ),
    },
    {
       key: 'totalTeam', header: 'Total Team', sortable: true,
  render: (r) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#A855F7]/10 text-[#A855F7] font-mono">
      <Users size={11} />
      {(r.totalTeam ?? 0).toLocaleString()}
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
    shortLabel: `P${p}`,
  }))

  const filters: FilterConfig<DirectTeamMember>[] = [
    {
      key: 'highestPackage',
      label: 'PKG',
      allLabel: 'All Packages',
      accent: '#F5A623',
      options: packageOptions,
    },
  ]

  return (
    <div className="space-y-5" data-testid="direct-team-page">
      <header>
        <p className="text-base font-bold text-white">Direct Team Table</p>
        <span className="text-sm text-white/50">
          All members who joined through your referral link.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <p className="text-base font-bold text-white mb-4">Direct Team Members</p>
        <DataTable<DirectTeamMember>
          data-testid="direct-team-table"
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
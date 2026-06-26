import { motion } from 'framer-motion'
import { useDirectTeam, useDashboardData } from '../../../hooks/useDashboard'
import { WalletAddress } from '../WalletAddress'
import { DataTable } from '../DataTable'
import type { Column, FilterConfig } from '../DataTable'
import type { DirectTeamMember } from '../../../types/dashboard'

export default function DirectTeam() {
  const { data: team, isLoading } = useDirectTeam()

  const cols: Column<DirectTeamMember>[] = [
    {
      key: 'walletAddress', header: 'Wallet Address', sortable: true,
      render: (r) => <WalletAddress address={r.walletAddress} data-testid="team-member-wallet" />,
    },
    { key: 'package', header: 'Package', sortable: true, render: (r) => <span className="text-[#F5A623] font-mono font-medium">{r.package}</span> },
    { key: 'joinDate', header: 'Join Date', sortable: true, render: (r) => <span className="text-white/70 text-sm">{r.joinDate}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${r.status === 'active' ? 'bg-green-400/15 text-green-400' : 'bg-red-400/15 text-red-400'}`}>
          {r.status}
        </span>
      ),
    },
  ]

  // Build package filter options dynamically from whatever packages exist in the data,
  // so this stays correct if new package tiers are added later.
  const packageOptions = Array.from(new Set((team ?? []).map((m) => m.package))).map((p) => ({
    label: p,
    value: p,
  }))

  const filters: FilterConfig<DirectTeamMember>[] = [
    {
      key: 'package',
      label: 'Packages',
      options: packageOptions,
    },
  ]

  return (
    <div className="space-y-5" data-testid="direct-team-page">

      <header>
        <p>
          Direct Team Table
        </p>
        <span>
          Here we have all member that comes through your refe
        </span>
      </header>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5">
        <p className="text-base font-bold text-white mb-4">Direct Team Members</p>
        <DataTable<DirectTeamMember>
          data-testid="direct-team-table"
          data={(team ?? []) as unknown as DirectTeamMember[]}
          columns={cols as Column<DirectTeamMember>[]}
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
import React from 'react'
import { motion } from 'framer-motion'
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react'
import { useDirectTeam, useDashboardData } from '../../../hooks/useDashboard'
import { StatCard } from '../StatCard'
import { WalletAddress } from '../WalletAddress'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import type { DirectTeamMember } from '../../../types/dashboard'

export default function DirectTeam() {
  const { data: team, isLoading } = useDirectTeam()
  const { data: dash } = useDashboardData()

  const active = team?.filter((m) => m.status === 'active').length ?? 0
  const inactive = team?.filter((m) => m.status === 'inactive').length ?? 0

  const cols: Column<DirectTeamMember>[] = [
    {
      key: 'walletAddress', header: 'Wallet Address', sortable: true,
      render: (r) => <WalletAddress address={r.walletAddress} data-testid="team-member-wallet" />,
    },
    { key: 'package', header: 'Package', sortable: true, render: (r) => <span className="text-[#F5A623] font-mono font-medium">{r.package}</span> },
    { key: 'joinDate', header: 'Join Date', sortable: true, render: (r) => <span className="text-white/40 text-xs">{r.joinDate}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5" data-testid="direct-team-page">
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <StatCard data-testid="team-total"    title="Total Members"       value={team?.length ?? '—'}  accent="blue"   icon={<Users size={14} />} />
        <StatCard data-testid="team-active"   title="Active Members"      value={active}               accent="cyan"   icon={<UserCheck size={14} />} />
        <StatCard data-testid="team-inactive" title="Inactive Members"    value={inactive}             accent="red"    icon={<UserX size={14} />} />
        <StatCard data-testid="team-referrals" title="Total Referrals"    value={dash?.networkStats.totalReferrals ?? '—'} accent="gold" icon={<TrendingUp size={14} />} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5">
        <p className="text-sm font-bold text-white mb-4">Direct Team Members</p>
        <DataTable<DirectTeamMember>
          data-testid="direct-team-table"
          data={(team ?? []) as unknown as DirectTeamMember[]}
          columns={cols as Column<DirectTeamMember>[]}
          loading={isLoading}
          pageSize={8}
          searchable
          searchPlaceholder="Search wallet or package…"
        />
      </motion.div>
    </div>
  )
}

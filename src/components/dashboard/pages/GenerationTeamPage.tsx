import { useEffect, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { DataTable } from '../DataTable'
import type { Column, ServerFilterConfig } from '../DataTable'
import type { GenerationTeamMember, GenerationTeamResponse } from '../../../types/dashboard'

const API = import.meta.env.VITE_API_URL

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function GenerationTeamPage() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => { refetchSession() /* eslint-disable-next-line */ }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  // All filter/pagination state — every one of these is a query param now.
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch]     = useState('')
  const [levelFilter, setLevelFilter]     = useState('all')
  const [packageFilter, setPackageFilter] = useState('all')

  // Reset to page 1 whenever a filter/search/pageSize changes — otherwise
  // you can land on page 7 of a filtered set that only has 2 pages.
  useEffect(() => { setPage(1) }, [search, levelFilter, packageFilter, pageSize])

  const teamQ = useQuery<GenerationTeamResponse>({
    queryKey: ['dashboard', 'generation-team', address, page, pageSize, search, levelFilter, packageFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(pageSize),
      })
      if (search.trim())             params.set('search', search.trim())
      if (levelFilter   !== 'all')   params.set('level', levelFilter)
      if (packageFilter !== 'all')   params.set('package', packageFilter)

      const res = await fetch(`${API}/api/user/generation-team?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load generation team')
      const json: GenerationTeamResponse = await res.json()
      if (!json.success) throw new Error('Failed to load generation team')
      return json
    },
    enabled: sessionReady,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads — no table flash
  })

  const members = teamQ.data?.members ?? []
  const total   = teamQ.data?.total   ?? 0
  const isLoading = sessionPending || (teamQ.isLoading && !teamQ.data)

  const cols: Column<GenerationTeamMember>[] = [
    { key: 'contractRegId', header: 'User ID', sortable: false,
      render: (r) => <span className="font-mono font-semibold text-[#38BDF8]">{r.contractRegId ?? '—'}</span> },
    { key: 'userAddress', header: 'Wallet Address', sortable: false,
      render: (r) => <WalletAddress address={r.userAddress} data-testid="gen-team-member-wallet" /> },
    { key: 'generationLevel', header: 'Generation Level', sortable: false,
      render: (r) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#A855F7]/10 text-[#A855F7] font-mono">
          Level {r.generationLevel}
        </span>
      ) },
    { key: 'referralAddress', header: 'Referral Address', sortable: false,
      render: (r) => r.referralAddress
        ? <WalletAddress address={r.referralAddress} data-testid="gen-team-referral-address" />
        : <span className="font-mono text-sm text-white/35">—</span> },
    { key: 'highestPackage', header: 'Current Package', sortable: false,
      render: (r) => (
        <span className="text-[#F5A623] font-mono font-medium">
          PKG {String(r.highestPackage).padStart(2, '0')}
        </span>
      ) },
    { key: 'joinedAt', header: 'Joining Date', sortable: false,
      render: (r) => <span className="text-white/70 text-sm">{new Date(r.joinedAt).toLocaleDateString()}</span> },
    { key: 'totalIncome', header: 'Total Income', sortable: false,
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono font-bold text-white">{usd(r.totalIncome)}</span>
          <span className="text-[10px] text-white/40 font-mono leading-tight">
            D: {usd(r.directIncome)} · G: {usd(r.generationIncome)} · L: {usd(r.lapsIncome)} · R: {usd(r.royaltyIncome)}
          </span>
        </div>
      ) },
  ]

  const levelOptions = Array.from({ length: 12 }, (_, i) => i + 1).map((lvl) => ({
    label: `LVL ${String(lvl).padStart(2, '0')}`, value: String(lvl), shortLabel: `L${lvl}`,
  }))
  const packageOptions = Array.from({ length: 12 }, (_, i) => i + 1).map((p) => ({
    label: `PKG ${String(p).padStart(2, '0')}`, value: String(p), shortLabel: `P${p}`,
  }))

  const serverFilters: ServerFilterConfig[] = [
    { key: 'level',   label: 'LVL', allLabel: 'All Levels',   accent: '#38BDF8',
      value: levelFilter,   onChange: setLevelFilter,   options: levelOptions },
    { key: 'package', label: 'PKG', allLabel: 'All Packages', accent: '#F5A623',
      value: packageFilter, onChange: setPackageFilter, options: packageOptions },
  ]

  return (
    <div className="space-y-5" data-testid="generation-team-page">
      <header>
        <p className="text-base font-bold text-white">Generation Team Table</p>
        <span className="text-sm text-white/50">
          All downline members across every generation level in your matrix.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-base font-bold text-white">Generation Team Members</p>
          {/* Total count — surfaced up top so the user sees the size even before scrolling to the pager. */}
          <span className="text-sm font-mono text-white/60">
            {teamQ.isFetching && !teamQ.data ? 'Loading…' : (
              <>Total: <span className="text-white font-semibold">{total.toLocaleString()}</span> members</>
            )}
          </span>
        </div>

        <DataTable<GenerationTeamMember>
          data-testid="generation-team-table"
          data={members}
          columns={cols}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          searchable
          searchPlaceholder="Search wallet…"
          serverFilters={serverFilters}
          serverSearch={{ value: search, onChange: setSearch, debounceMs: 400 }}
          serverPagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </motion.div>
    </div>
  )
}
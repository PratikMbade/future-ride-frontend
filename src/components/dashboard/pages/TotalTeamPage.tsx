import { useEffect, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import type { TotalTeamMember, TotalTeamResponse } from '../../../types/dashboard'

const API = import.meta.env.VITE_API_URL

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── level filter — a free-form 1..1000 input, not a dropdown, since the
// referral chain can run far deeper than the 12-level generation matrix ──
function LevelInputFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isActive = value !== ''

  const handleChange = (raw: string) => {
    if (raw === '') { onChange(''); return }
    const n = Math.max(1, Math.min(1000, parseInt(raw, 10) || 1))
    onChange(String(n))
  }

  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-mono font-semibold transition-all"
      style={
        isActive
          ? { background: '#38BDF81F', borderColor: '#38BDF866', color: '#38BDF8' }
          : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }
      }
    >
      <span className="text-[12px] font-bold shrink-0" style={{ color: isActive ? '#38BDF8' : '#fff' }}>LVL</span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={1000}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="All (1-1000)"
        data-testid="total-team-filter-level"
        className="w-24 bg-transparent outline-none placeholder-white/40"
        style={{ color: isActive ? '#38BDF8' : '#fff' }}
      />
      {isActive && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear level filter"
          className="text-white/40 hover:text-white/70 leading-none"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default function TotalTeamPage() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => { refetchSession() /* eslint-disable-next-line */ }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  // All filter/pagination/sort state — every one of these is a query param.
  const [page, setPage]                   = useState(1)
  const [pageSize, setPageSize]           = useState(10)
  const [search, setSearch]               = useState('')
  const [levelFilter, setLevelFilter]     = useState('')
  const [sortKey, setSortKey]             = useState<string>('level')
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('asc')

  // Reset to page 1 whenever filter/search/pageSize/sort changes — otherwise
  // you can land on page 7 of a filtered set that only has 2 pages.
  useEffect(() => { setPage(1) }, [search, levelFilter, pageSize, sortKey, sortDir])

  const teamQ = useQuery<TotalTeamResponse>({
    queryKey: ['dashboard', 'total-team', address, page, pageSize, search, levelFilter, sortKey, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({
        page:    String(page),
        limit:   String(pageSize),
        sortKey,
        sortDir,
      })
      if (search.trim())           params.set('search', search.trim())
      if (levelFilter.trim())      params.set('level', levelFilter.trim())

      const res = await fetch(`${API}/api/user/total-team?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load total team')
      const json: TotalTeamResponse = await res.json()
      if (!json.success) throw new Error('Failed to load total team')
      return json
    },
    enabled: sessionReady,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads — no table flash
  })

  const members = teamQ.data?.members ?? []
  const total   = teamQ.data?.total   ?? 0
  const isLoading = sessionPending || (teamQ.isLoading && !teamQ.data)

  const cols: Column<TotalTeamMember>[] = [
    { key: 'contractRegId', header: 'User ID', sortable: true,
      render: (r) => <span className="font-mono font-semibold text-[#38BDF8]">{r.contractRegId ?? '—'}</span> },
    { key: 'userAddress', header: 'Wallet Address', sortable: false,
      render: (r) => <WalletAddress address={r.userAddress} data-testid="total-team-member-wallet" /> },
    { key: 'level', header: 'Generation Level', sortable: true,
      render: (r) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#A855F7]/10 text-[#A855F7] font-mono">
          Level {r.level}
        </span>
      ) },
    { key: 'referralAddress', header: 'Referral Address', sortable: false,
      render: (r) => r.referralAddress
        ? <WalletAddress address={r.referralAddress} data-testid="total-team-referral-address" />
        : <span className="font-mono text-sm text-white/35">—</span> },
    { key: 'highestPackage', header: 'Current Package', sortable: true,
      render: (r) => (
        <span className="text-[#F5A623] font-mono font-medium">
          PKG {String(r.highestPackage).padStart(2, '0')}
        </span>
      ) },
    { key: 'joinedAt', header: 'Joining Date', sortable: true,
      render: (r) => <span className="text-white/70 text-sm">{new Date(r.joinedAt).toLocaleDateString()}</span> },
    { key: 'totalIncome', header: 'Total Income', sortable: true,
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono font-bold text-white">{usd(r.totalIncome)}</span>
          <span className="text-[10px] text-white/40 font-mono leading-tight">
            D: {usd(r.directIncome)} · G: {usd(r.generationIncome)} · L: {usd(r.lapsIncome)} · R: {usd(r.royaltyIncome)}
          </span>
        </div>
      ) },
  ]

  return (
    <div className="space-y-5" data-testid="total-team-page">
      <header>
        <p className="text-base font-bold text-white">Generation Team Table</p>
        <span className="text-sm text-white/50">
          Every member in your referral chain, at every depth, however far it runs.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-base font-bold text-white">Total Generation Team Members</p>
          {/* Total count — surfaced up top so the user sees the size even before scrolling to the pager. */}
          <span className="text-sm font-mono text-white/60">
            {teamQ.isFetching && !teamQ.data ? 'Loading…' : (
              <>Total: <span className="text-white font-semibold">{total.toLocaleString()}</span> members</>
            )}
          </span>
        </div>

        <DataTable<TotalTeamMember>
          data-testid="total-team-table"
          data={members}
          columns={cols}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          searchable
          searchPlaceholder="Search wallet address…"
          filtersExtra={<LevelInputFilter value={levelFilter} onChange={setLevelFilter} />}
          serverSearch={{ value: search, onChange: setSearch, debounceMs: 400 }}
          serverPagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
          serverSort={{
            sortKey,
            sortDir,
            onChange: (k, d) => { setSortKey(k); setSortDir(d) },
          }}
        />
      </motion.div>
    </div>
  )
}

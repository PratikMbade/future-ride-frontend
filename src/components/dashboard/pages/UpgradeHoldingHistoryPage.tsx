import { useEffect, useRef, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import { DataTable } from '../DataTable'
import type { Column, ServerSortConfig } from '../DataTable'
import type { UpgradeHoldingRecord, UpgradeHoldingResponse } from '../../../types/dashboard'

const API = import.meta.env.VITE_API_URL

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Local (viewer's timezone) ISO-formatted timestamp, e.g. 2026-08-29T14:32:10.
function toLocalISOString(iso: string) {
  const d = new Date(iso)
  const offsetMs = d.getTimezoneOffset() * 60 * 1000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 19)
}

// Manual "Level" filter input (1–100) — debounced before bubbling up.
function LevelFilterInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value === 'all' ? '' : value)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => { setLocal(value === 'all' ? '' : value) }, [value])

  const handleChange = (raw: string) => {
    setLocal(raw)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const trimmed = raw.trim()
      if (!trimmed) { onChange('all'); return }
      const n = Math.min(100, Math.max(1, Number.parseInt(trimmed, 10) || 1))
      onChange(String(n))
    }, 400)
  }

  return (
    <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 focus-within:border-[#38BDF8]/50 transition-colors">
      <span className="text-[12px] font-bold text-white shrink-0">LVL</span>
      <input
        type="number"
        min={1}
        max={100}
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="1–100"
        data-testid="upgrade-holding-history-level-input"
        className="w-16 bg-transparent text-sm font-mono text-white placeholder-white/40 focus:outline-none"
      />
    </div>
  )
}

export default function UpgradeHoldingHistoryPage() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => { refetchSession() /* eslint-disable-next-line */ }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(10)
  const [search, setSearch]           = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [sortKey, setSortKey]         = useState<string | null>(null)
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc')

  // Reset to page 1 whenever filter/search/pageSize/sort changes.
  useEffect(() => { setPage(1) }, [search, levelFilter, pageSize, sortKey, sortDir])

  const holdingQ = useQuery<UpgradeHoldingResponse>({
    queryKey: ['dashboard', 'upgrade-holding-history', address, page, pageSize, search, levelFilter, sortKey, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(pageSize),
      })
      if (search.trim())         params.set('search', search.trim())
      if (levelFilter !== 'all') params.set('level', levelFilter)
      if (sortKey) {
        params.set('sortBy', sortKey)
        params.set('sortDir', sortDir)
      }

      const res = await fetch(`${API}/api/packages/upgrade-holding-history?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load upgrade holding history')
      const json: UpgradeHoldingResponse = await res.json()
      if (!json.success) throw new Error('Failed to load upgrade holding history')
      return json
    },
    enabled: sessionReady,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })

  const records = holdingQ.data?.records ?? []
  const total   = holdingQ.data?.total   ?? 0
  const isLoading = sessionPending || (holdingQ.isLoading && !holdingQ.data)

  const cols: Column<UpgradeHoldingRecord>[] = [
    { key: 'contractRegId', header: 'User ID',
      render: (r) => <span className="font-mono font-semibold text-[#38BDF8]">{r.contractRegId ?? '—'}</span> },
    { key: 'userAddress', header: 'User Address',
      render: (r) => <WalletAddress address={r.userAddress} data-testid="upgrade-holding-user-address" /> },
    { key: 'fromUserAddress', header: 'From Address',
      render: (r) => <WalletAddress address={r.fromUserAddress} data-testid="upgrade-holding-from-address" /> },
    { key: 'level', header: 'Level', sortable: true,
      render: (r) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#A855F7]/10 text-[#A855F7] font-mono">
          Level {r.level}
        </span>
      ) },
    { key: 'amount', header: 'Amount',
      render: (r) => <span className="font-mono font-medium text-[#22C55E]">{usd(r.amount)}</span> },
    { key: 'transactionHash', header: 'Transaction Hash',
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <WalletAddress address={r.transactionHash} data-testid="upgrade-holding-tx-hash" />
          <a
            href={`https://bscscan.com/tx/${r.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#38BDF8]/60 hover:text-[#38BDF8] transition-colors"
            title="View on BscScan"
          >
            <ExternalLink size={15} />
          </a>
        </span>
      ) },
    { key: 'time', header: 'Time', sortable: true,
      render: (r) => <span className="text-white/70 text-sm font-mono">{toLocalISOString(r.time)}</span> },
  ]

  const serverSort: ServerSortConfig = {
    sortKey,
    sortDir,
    onChange: (key, dir) => { setSortKey(key); setSortDir(dir) },
  }

  return (
    <div className="space-y-5" data-testid="upgrade-holding-history-page">
      <header>
        <p className="text-base font-bold text-white">Upgrade Holding History</p>
        <span className="text-sm text-white/50">
          Every auto-upgrade holding credit you've received, in the order it landed.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-base font-bold text-white">Holding Records</p>
          <span className="text-sm font-mono text-white/60">
            {holdingQ.isFetching && !holdingQ.data ? 'Loading…' : (
              <>Total: <span className="text-white font-semibold">{total.toLocaleString()}</span> records</>
            )}
          </span>
        </div>

        <DataTable<UpgradeHoldingRecord>
          data-testid="upgrade-holding-history-table"
          data={records}
          columns={cols}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          searchable
          searchPlaceholder="Search wallet…"
          filtersExtra={<LevelFilterInput value={levelFilter} onChange={setLevelFilter} />}
          serverSort={serverSort}
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

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import type { LapsIncomeResponse } from '../../../types/dashboard'
import { PageSizeDropdown } from '../PageSizeDropdown'

const API = import.meta.env.VITE_API_URL

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── package filter options ───────────────────────────────
const PKG_OPTIONS = [
  { value: 0, label: 'All Packages' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `PKG ${String(i + 1).padStart(2, '0')}`,
  })),
]

// ─── level filter options ─────────────────────────────────
const LEVEL_OPTIONS = [
  { value: 0, label: 'All Levels' },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `LVL ${String(i + 1).padStart(2, '0')}`,
  })),
]

// ─── package filter dropdown (matches RecentIncomePageTable) ──
function PackageFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const selected = PKG_OPTIONS.find((o) => o.value === value) ?? PKG_OPTIONS[0]

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={[
          'flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-mono font-semibold transition-all whitespace-nowrap',
          value > 0
            ? 'bg-[rgba(245,166,35,0.12)] border-[rgba(245,166,35,0.4)] text-[#F5A623]'
            : 'bg-white/5 border-white/10 text-white hover:border-white/35',
        ].join(' ')}
      >
        <Filter size={13} className={value > 0 ? 'text-[#F5A623]' : 'text-white'} />
        <span className="hidden sm:inline">{selected.label}</span>
        <span className="sm:hidden">{value > 0 ? `P${value}` : 'Filter'}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 w-44 bg-[#080F26] border border-white/10 rounded-[10px] overflow-y-auto shadow-xl shadow-black/60 py-1 max-h-64"
            style={{ top: dropPos.top, right: dropPos.right }}
          >
            {PKG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={[
                  'w-full text-left px-3.5 py-2.5 font-mono text-[13px] transition-colors',
                  opt.value === value
                    ? 'text-[#F5A623] bg-[rgba(245,166,35,0.1)] font-semibold'
                    : 'text-white hover:bg-white/[0.06]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── level filter dropdown (matches RecentIncomePageTable) ────
function LevelFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const isActive = value > 0
  const selected = LEVEL_OPTIONS.find((o) => o.value === value) ?? LEVEL_OPTIONS[0]

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={[
          'flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-mono font-semibold transition-all whitespace-nowrap',
          isActive
            ? 'bg-[rgba(56,189,248,0.12)] border-[rgba(56,189,248,0.4)] text-[#38BDF8]'
            : 'bg-white/5 border-white/10 text-white hover:border-white/35',
        ].join(' ')}
      >
        <span className={`text-[12px] font-bold shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-white'}`}>LVL</span>
        <span className="hidden sm:inline">{selected.label}</span>
        <span className="sm:hidden">{isActive ? `L${value}` : 'All'}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 w-36 bg-[#080F26] border border-white/10 rounded-[10px] overflow-y-auto shadow-xl shadow-black/60 py-1 max-h-64"
            style={{ top: dropPos.top, right: dropPos.right }}
          >
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={[
                  'w-full text-left px-3.5 py-2.5 font-mono text-[13px] transition-colors',
                  opt.value === value
                    ? 'text-[#38BDF8] bg-[rgba(56,189,248,0.1)] font-semibold'
                    : 'text-white hover:bg-white/[0.06]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function LapsIncomeTable() {
  // Same session-scoping pattern used across the dashboard.
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => {
    refetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const address = session?.user?.name
  const sessionReady = !sessionPending && !!address

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  // Numeric to match the filter components (0 = all).
  const [packageFilter, setPackageFilter] = useState<number>(0)
  const [levelFilter, setLevelFilter] = useState<number>(0)

  // Debounce search so we're not refetching on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const incomeQ = useQuery<LapsIncomeResponse>({
    queryKey: ['income', 'laps', address, page, pageSize, debouncedSearch, packageFilter, levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (packageFilter > 0) params.set('package', String(packageFilter))
      if (levelFilter > 0) params.set('level', String(levelFilter))

      const res = await fetch(`${API}/api/income/laps?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load laps income')
      const json: LapsIncomeResponse = await res.json()
      if (!json.success) throw new Error('Failed to load laps income')
      return json
    },
    enabled: sessionReady,
    staleTime: 60 * 1000,
  })

  const records = incomeQ.data?.records ?? []
  const total = incomeQ.data?.total ?? 0
  const totalPages = incomeQ.data?.totalPages ?? 1
  const isLoading = sessionPending || incomeQ.isLoading

  const onPageSizeChange = (n: number) => {
    setPageSize(n)
    setPage(1)
  }

  const onPackageFilterChange = (v: number) => {
    setPackageFilter(v)
    setPage(1)
  }

  const onLevelFilterChange = (v: number) => {
    setLevelFilter(v)
    setPage(1)
  }

  const columns = [
    { key: 'contractRegId', header: 'User Id' },
    { key: 'fromUserAddress', header: 'Wallet Address' },
    { key: 'packageNumber', header: 'Package' },
    { key: 'level', header: 'Level' },
    { key: 'amount', header: 'Amount' },
    { key: 'creditedAt', header: 'Credited Date' },
  ]

  // matches DataTable's numbered-page-button window logic
  const pageWindow = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    return Math.max(1, Math.min(totalPages - 4, page - 2)) + i
  })

  return (
    <div className="space-y-5" data-testid="laps-income-page">
      <header>
        <p className="text-base font-bold text-white">Laps Credit Income</p>
        <span className="text-sm text-white/50">
          Overflow earnings credited when a downline's payout lapses to you.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-base font-bold text-white">
            Income Records{' '}
            {!isLoading && <span className="text-white/40 font-normal text-sm">({total})</span>}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Toolbar — same look as DataTable's search/filter row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                data-testid="laps-income-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wallet address…"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 flex-wrap">
              <PackageFilter value={packageFilter} onChange={onPackageFilterChange} />
              <LevelFilter value={levelFilter} onChange={onLevelFilterChange} />
            </div>
          </div>

          {/* Table — same chrome as DataTable */}
          <div className="rounded-xl border border-white/10 overflow-x-auto">
            <table className="text-base" style={{ minWidth: 820, width: '100%' }}>
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-5 py-4 text-left text-xs font-bold tracking-wider uppercase text-white whitespace-nowrap"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={columns.length} className="px-5 py-10 text-center text-white/60 text-base">
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading && records.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-5 py-10 text-center text-white/60 text-base">
                      No laps income records found.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  records.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-[#38BDF8]">
                        {r.contractRegId ?? '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <WalletAddress address={r.fromUserAddress} data-testid="laps-income-wallet" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-medium text-[#F5A623]">
                        PKG {String(r.packageNumber).padStart(2, '0')}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-white/70">
                        {r.level > 0 ? `L${r.level}` : '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-medium text-[#22C55E]">
                        {usd(r.amount)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-white/70">
                        {new Date(r.creditedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Footer — same as DataTable's pagination footer */}
          {!isLoading && total > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <PageSizeDropdown
  value={pageSize}
  options={[10, 15, 25, 50]}
  onChange={onPageSizeChange}
  testId="laps-income-page-size" // ← change per table
/>
                <span className="text-white/50">
                  · {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {pageWindow.map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${pg === page ? 'bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8]' : 'border border-white/10 text-white hover:bg-white/10'}`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
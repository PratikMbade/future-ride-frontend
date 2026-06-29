import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { authClient } from '@/lib/authClient'
import { WalletAddress } from '../WalletAddress'
import type { GenerationIncomeResponse } from '../../../types/dashboard'

const API = import.meta.env.VITE_API_URL

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function GenerationIncomeTable() {
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
  const [packageFilter, setPackageFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  // Debounce search so we're not refetching on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const incomeQ = useQuery<GenerationIncomeResponse>({
    queryKey: ['income', 'generation', address, page, pageSize, debouncedSearch, packageFilter, levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (packageFilter !== 'all') params.set('package', packageFilter)
      if (levelFilter !== 'all') params.set('level', levelFilter)

      const res = await fetch(`${API}/api/income/generation?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load generation income')
      const json: GenerationIncomeResponse = await res.json()
      if (!json.success) throw new Error('Failed to load generation income')
      return json
    },
    enabled: sessionReady,
    staleTime: 60 * 1000,
  })

  const records    = incomeQ.data?.records ?? []
  const total       = incomeQ.data?.total ?? 0
  const totalPages  = incomeQ.data?.totalPages ?? 1
  const isLoading   = sessionPending || incomeQ.isLoading

  const onPageSizeChange = (n: number) => {
    setPageSize(n)
    setPage(1)
  }

  const onPackageFilterChange = (v: string) => {
    setPackageFilter(v)
    setPage(1)
  }

  const onLevelFilterChange = (v: string) => {
    setLevelFilter(v)
    setPage(1)
  }

  const columns = [
    { key: 'contractRegId', header: 'User Id' },
    { key: 'fromUserAddress', header: 'Wallet Address' },
    { key: 'packageNumber', header: 'Package' },
    { key: 'level', header: 'Generation Level' },
    { key: 'amount', header: 'Amount' },
    { key: 'creditedAt', header: 'Credited Date' },
  ]

  // matches DataTable's numbered-page-button window logic
  const pageWindow = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    return Math.max(1, Math.min(totalPages - 4, page - 2)) + i
  })

  const packageOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const levelOptions    = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="space-y-5" data-testid="generation-income-page">

      <header>
        <p className="text-base font-bold text-white">Generation Income</p>
        <span className="text-sm text-white/50">
          Payouts credited from your downline's tree level activity.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-base font-bold text-white">
            Income Records {!isLoading && <span className="text-white/40 font-normal text-sm">({total})</span>}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Toolbar — same look as DataTable's search/filter row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative w-full sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                data-testid="generation-income-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wallet address…"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              <select
                data-testid="generation-income-filter-package"
                value={packageFilter}
                onChange={(e) => onPackageFilterChange(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-8 pr-8 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#38BDF8]/50 transition-colors cursor-pointer"
              >
                <option value="all" className="bg-[#080F26] text-white">All Packages</option>
                {packageOptions.map((p) => (
                  <option key={p} value={p} className="bg-[#080F26] text-white">
                    PKG {String(p).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-auto">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              <select
                data-testid="generation-income-filter-level"
                value={levelFilter}
                onChange={(e) => onLevelFilterChange(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-8 pr-8 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#38BDF8]/50 transition-colors cursor-pointer"
              >
                <option value="all" className="bg-[#080F26] text-white">All Levels</option>
                {levelOptions.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-[#080F26] text-white">
                    Level{lvl}
                  </option>
                ))}
              </select>
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
                      No generation income records found.
                    </td>
                  </tr>
                )}
                {!isLoading && records.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-[#38BDF8]">
                      {r.contractRegId ?? '—'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <WalletAddress address={r.fromUserAddress} data-testid="generation-income-wallet" />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-medium text-[#F5A623]">
                      PKG {String(r.packageNumber).padStart(2, '0')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#A855F7]/10 text-[#A855F7] font-mono">
                        Level {r.level}
                      </span>
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
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#38BDF8]/50 cursor-pointer"
                >
                  {[10, 15, 25, 50].map((opt) => (
                    <option key={opt} value={opt} className="bg-[#080F26] text-white">{opt}</option>
                  ))}
                </select>
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
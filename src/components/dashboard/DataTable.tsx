import React, { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, Download, ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  exportable?: boolean
  exportFilename?: string
  loading?: boolean
  emptyMessage?: string
  'data-testid'?: string
}

export function DataTable<T extends object>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  exportable = false,
  exportFilename = 'export',
  loading = false,
  emptyMessage = 'No data found',
  'data-testid': testId,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [data, search])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey as keyof T] ?? '')
      const bv = String(b[sortKey as keyof T] ?? '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const handleExport = () => {
    const header = columns.map((c) => c.header).join(',')
    const rows = data.map((row) =>
      columns.map((c) => {
        const v = row[c.key as keyof T]
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '')
      }).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${exportFilename}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div data-testid={testId} className="flex flex-col gap-3">
      {/* Toolbar */}
      {(searchable || exportable) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                data-testid={testId ? `${testId}-search` : undefined}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#38BDF8]/40 transition-colors"
              />
            </div>
          )}
          {exportable && (
            <button
              data-testid={testId ? `${testId}-export` : undefined}
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] text-xs font-medium hover:bg-[#38BDF8]/15 transition-colors"
            >
              <Download size={13} /> Export CSV
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-white/6 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/6 bg-white/[0.02]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-white/30 ${col.sortable ? 'cursor-pointer hover:text-white/60 select-none' : ''} ${col.className ?? ''}`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === String(col.key) && (
                      sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
            )}
            {!loading && paged.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-white/30 text-sm">{emptyMessage}</td></tr>
            )}
            {!loading && paged.map((row, ri) => (
              <tr key={ri} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-4 py-3 text-white/70 ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden flex flex-col gap-2">
        {loading && <p className="text-center text-white/30 text-sm py-6">Loading…</p>}
        {!loading && paged.length === 0 && <p className="text-center text-white/30 text-sm py-6">{emptyMessage}</p>}
        {!loading && paged.map((row, ri) => (
          <div key={ri} className="rounded-xl border border-white/6 bg-white/[0.02] p-3 space-y-2">
            {columns.map((col) => (
              <div key={String(col.key)} className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-white/30 shrink-0">{col.header}</span>
                <span className="text-sm text-white/70 text-right">
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '-')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-white/35">
          <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="flex items-center gap-1">
            <button
              data-testid={testId ? `${testId}-prev` : undefined}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-[#38BDF8]' : 'border border-white/8 hover:bg-white/5'}`}
                >
                  {pg}
                </button>
              )
            })}
            <button
              data-testid={testId ? `${testId}-next` : undefined}
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

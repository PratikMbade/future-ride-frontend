import React, { useState, useMemo, useRef } from 'react'
import { Search, ChevronLeft, ChevronRight, Download, ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface FilterOption {
  label: string
  value: string
  /** Short label shown on mobile, e.g. "P1", "L2". Falls back to `label`. */
  shortLabel?: string
}

/**
 * Client-side filter — DataTable applies it to `data` internally.
 * State is owned by DataTable.
 */
export interface FilterConfig<T> {
  key: keyof T | string
  /** Small label prefix shown inside the button (e.g. "PKG", "LVL", "TYPE"). */
  label: string
  options: FilterOption[]
  /** Label shown for the "no filter applied" option. Defaults to `All ${label}`. */
  allLabel?: string
  /** Accent color used when a value is selected. Defaults to sky blue. */
  accent?: string
  /** Menu width in px. Defaults to 176. */
  menuWidth?: number
}

/**
 * Server-side filter — DataTable renders the dropdown UI, but state lives
 * in the parent so it can drive a refetch (e.g. levels computed by a tree
 * walk that can't be filtered client-side after the fact).
 *
 * The sentinel for "no filter applied" is `'all'`; the parent decides what
 * that means for its query params.
 */
export interface ServerFilterConfig {
  /** Unique key — used for React keys and test-ids. */
  key: string
  label: string
  value: string
  onChange: (v: string) => void
  options: FilterOption[]
  allLabel?: string
  accent?: string
  menuWidth?: number
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  /** Client-side dropdown filters. State owned by DataTable. */
  filters?: FilterConfig<T>[]
  /** Server-side dropdown filters. State controlled by parent (for refetching queries). */
  serverFilters?: ServerFilterConfig[]
  pageSize?: number
  /** Options shown in the "rows per page" selector */
  pageSizeOptions?: number[]
  exportable?: boolean
  exportFilename?: string
  loading?: boolean
  emptyMessage?: string
  'data-testid'?: string
}

// ─── styled filter dropdown (matches RecentIncomePageTable) ─────
interface FilterDropdownProps {
  label: string
  allLabel: string
  value: string
  options: FilterOption[]
  onChange: (v: string) => void
  accent: string
  menuWidth: number
  testId?: string
}

function FilterDropdown({
  label, allLabel, value, options, onChange, accent, menuWidth, testId,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const isActive = value !== 'all'
  const selected = options.find((o) => o.value === value)
  const displayLong = selected?.label ?? allLabel
  const displayShort = selected?.shortLabel ?? selected?.label ?? 'All'

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  // Build rgba tints from the accent hex for background/border when active.
  const accentBg = `${accent}1F`   // ~12% alpha
  const accentBorder = `${accent}66` // ~40% alpha
  const accentMenuTint = `${accent}1A` // ~10% alpha

  return (
    <div className="relative">
      <button
        ref={btnRef}
        data-testid={testId}
        onClick={handleOpen}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[13px] font-mono font-semibold transition-all whitespace-nowrap"
        style={
          isActive
            ? { background: accentBg, borderColor: accentBorder, color: accent }
            : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }
        }
      >
        <span
          className="text-[12px] font-bold shrink-0"
          style={{ color: isActive ? accent : '#fff' }}
        >
          {label}
        </span>
        <span className="hidden sm:inline">{displayLong}</span>
        <span className="sm:hidden">{isActive ? displayShort : 'All'}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="fixed z-20 bg-[#080F26] border border-white/10 rounded-[10px] overflow-y-auto shadow-xl shadow-black/60 py-1 max-h-64"
            style={{ top: dropPos.top, right: dropPos.right, width: menuWidth }}
          >
            <button
              onClick={() => { onChange('all'); setOpen(false) }}
              className="w-full text-left px-3.5 py-2.5 font-mono text-[13px] transition-colors"
              style={
                value === 'all'
                  ? { color: accent, background: accentMenuTint, fontWeight: 600 }
                  : { color: '#fff' }
              }
              onMouseEnter={(e) => { if (value !== 'all') e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={(e) => { if (value !== 'all') e.currentTarget.style.background = 'transparent' }}
            >
              {allLabel}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="w-full text-left px-3.5 py-2.5 font-mono text-[13px] transition-colors"
                style={
                  opt.value === value
                    ? { color: accent, background: accentMenuTint, fontWeight: 600 }
                    : { color: '#fff' }
                }
                onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { if (opt.value !== value) e.currentTarget.style.background = 'transparent' }}
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

export function DataTable<T extends object>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  filters = [],
  serverFilters = [],
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  exportable = false,
  exportFilename = 'export',
  loading = false,
  emptyMessage = 'No data found',
  'data-testid': testId,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => Object.fromEntries(filters.map((f) => [String(f.key), 'all']))
  )

  const filteredByFilters = useMemo(() => {
    if (filters.length === 0) return data
    return data.filter((row) =>
      filters.every((f) => {
        const selected = filterValues[String(f.key)]
        if (!selected || selected === 'all') return true
        return String(row[f.key as keyof T] ?? '') === selected
      })
    )
  }, [data, filters, filterValues])

  const filtered = useMemo(() => {
    if (!search.trim()) return filteredByFilters
    const q = search.toLowerCase()
    return filteredByFilters.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [filteredByFilters, search])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey as keyof T] ?? '')
      const bv = String(b[sortKey as keyof T] ?? '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const paged = sorted.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value)
    setPage(1)
  }

  const handleExport = () => {
    const header = columns.map((c) => c.header).join(',')
    const rows = sorted.map((row) =>
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

  // Minimum table width scales with column count so mobile gets a real horizontal
  // scroll instead of squished columns.
  const minTableWidth = Math.max(columns.length * 160, 640)

  const hasAnyToolbar = searchable || exportable || filters.length > 0 || serverFilters.length > 0

  return (
    <div data-testid={testId} className="flex flex-col gap-4">
      {/* Toolbar */}
      {hasAnyToolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
            {searchable && (
              <div className="relative w-full sm:max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  data-testid={testId ? `${testId}-search` : undefined}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#38BDF8]/50 transition-colors"
                />
              </div>
            )}

            {(filters.length > 0 || serverFilters.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Client-side filters */}
                {filters.map((f) => (
                  <FilterDropdown
                    key={`c-${String(f.key)}`}
                    testId={testId ? `${testId}-filter-${String(f.key)}` : undefined}
                    label={f.label}
                    allLabel={f.allLabel ?? `All ${f.label}`}
                    value={filterValues[String(f.key)] ?? 'all'}
                    options={f.options}
                    onChange={(v) => handleFilterChange(String(f.key), v)}
                    accent={f.accent ?? '#38BDF8'}
                    menuWidth={f.menuWidth ?? 176}
                  />
                ))}
                {/* Server-side filters (controlled by parent) */}
                {serverFilters.map((f) => (
                  <FilterDropdown
                    key={`s-${f.key}`}
                    testId={testId ? `${testId}-filter-${f.key}` : undefined}
                    label={f.label}
                    allLabel={f.allLabel ?? `All ${f.label}`}
                    value={f.value}
                    options={f.options}
                    onChange={f.onChange}
                    accent={f.accent ?? '#38BDF8'}
                    menuWidth={f.menuWidth ?? 176}
                  />
                ))}
              </div>
            )}
          </div>

          {exportable && (
            <button
              data-testid={testId ? `${testId}-export` : undefined}
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-sm font-medium hover:bg-[#38BDF8]/20 transition-colors shrink-0"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      )}

      {/* Table — horizontally scrollable on every breakpoint so mobile keeps
          columns in a row instead of stacking into vertical cards. */}
      <div className="rounded-xl border border-white/10 overflow-x-auto">
        <table className="text-base" style={{ minWidth: minTableWidth, width: '100%' }}>
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-5 py-4 text-left text-xs font-bold tracking-wider uppercase text-white whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-[#38BDF8] select-none' : ''} ${col.className ?? ''}`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortKey === String(col.key) && (
                      sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-white/60 text-base">Loading…</td></tr>
            )}
            {!loading && paged.length === 0 && (
              <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-white/60 text-base">{emptyMessage}</td></tr>
            )}
            {!loading && paged.map((row, ri) => (
              <tr key={ri} className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors">
                {columns.map((col) => (
                  <td key={String(col.key)} className={`px-5 py-4 text-white whitespace-nowrap ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer: rows-per-page + pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-white/70">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              data-testid={testId ? `${testId}-page-size` : undefined}
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#38BDF8]/50 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#080F26] text-white">{opt}</option>
              ))}
            </select>
            <span className="text-white/50">
              · {(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, sorted.length)} of {sorted.length}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                data-testid={testId ? `${testId}-prev` : undefined}
                disabled={safePage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalPages - 4, safePage - 2)) + i
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${pg === safePage ? 'bg-[#38BDF8]/25 border border-[#38BDF8]/40 text-[#38BDF8]' : 'border border-white/10 text-white hover:bg-white/10'}`}
                  >
                    {pg}
                  </button>
                )
              })}
              <button
                data-testid={testId ? `${testId}-next` : undefined}
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
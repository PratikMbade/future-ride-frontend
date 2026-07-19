// src/components/dashboard/PackageHistoryPage.tsx
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { authClient } from '@/lib/authClient'

const API      = import.meta.env.VITE_API_URL
// BscScan for BSC mainnet — swap to testnet.bscscan.com if you're on testnet.
const EXPLORER = 'https://bscscan.com/tx'

function usd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function shortHash(h: string) {
  if (!h) return '—'
  return `${h.slice(0, 6)}…${h.slice(-4)}`
}

interface PackageHistoryRow {
  id:                   string
  packageContractBuyId: number | null
  packageNumber:        number
  packageName:          string
  packageAmount:        number
  buyDate:              string
  transactionHash:      string
}

interface PackageHistoryResponse {
  success:  boolean
  total:    number
  packages: PackageHistoryRow[]
}

export default function PackageHistoryPage() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession()

  useEffect(() => { refetchSession() /* eslint-disable-next-line */ }, [])

  const address      = session?.user?.name
  const sessionReady = !sessionPending && !!address

  const historyQ = useQuery<PackageHistoryResponse>({
    queryKey: ['packages', 'history', address],
    queryFn: async () => {
      const res = await fetch(`${API}/api/packages/package-history`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load package history')
      const json: PackageHistoryResponse = await res.json()
      if (!json.success) throw new Error('Failed to load package history')
      return json
    },
    enabled: sessionReady,
    staleTime: 60 * 1000,
  })

  const packages  = historyQ.data?.packages ?? []
  const total     = historyQ.data?.total    ?? 0
  const isLoading = sessionPending || historyQ.isLoading

  const columns = [
    { key: 'buyId',           header: 'Buy ID' },
    { key: 'packageNumber',   header: 'Package' },
    { key: 'packageName',     header: 'Name' },
    { key: 'packageAmount',   header: 'Amount' },
    { key: 'buyDate',         header: 'Purchase Date' },
    { key: 'transactionHash', header: 'Transaction' },
  ]

  return (
    <div className="space-y-5" data-testid="package-history-page">
      <header>
        <p className="text-base font-bold text-white">Package History</p>
        <span className="text-sm text-white/50">
          Every package you've activated, in the order you unlocked them.
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-base font-bold text-white">
            Activation Records{' '}
            {!isLoading && <span className="text-white/40 font-normal text-sm">({total})</span>}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 overflow-x-auto">
          <table className="text-base" style={{ minWidth: 780, width: '100%' }}>
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
              {!isLoading && packages.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-10 text-center text-white/60 text-base">
                    No packages activated yet.
                  </td>
                </tr>
              )}
              {!isLoading && packages.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                >
                  {/* Buy ID (from on-chain event) */}
                  <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-[#38BDF8]">
                    {p.packageContractBuyId ?? '—'}
                  </td>

                  {/* Package number as a pill — same visual language as GenerationTeam's level pill */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5A623]/10 text-[#F5A623] font-mono">
                      PKG {String(p.packageNumber).padStart(2, '0')}
                    </span>
                  </td>

                  {/* Package name */}
                  <td className="px-5 py-4 whitespace-nowrap text-white/80 font-medium">
                    {p.packageName}
                  </td>

                  {/* Amount — green like the Direct Income table */}
                  <td className="px-5 py-4 whitespace-nowrap font-mono font-medium text-[#22C55E]">
                    {usd(p.packageAmount)}
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap text-white/70">
                    {new Date(p.buyDate).toLocaleDateString(undefined, {
                      year:  'numeric',
                      month: 'short',
                      day:   'numeric',
                    })}
                  </td>

                  {/* Transaction hash → BscScan */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {p.transactionHash ? (
                      <a
                        href={`${EXPLORER}/${p.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-sm text-[#38BDF8] hover:text-[#7DD3FC] hover:underline transition-colors"
                        data-testid="package-history-tx-link"
                      >
                        {shortHash(p.transactionHash)}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="font-mono text-sm text-white/35">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
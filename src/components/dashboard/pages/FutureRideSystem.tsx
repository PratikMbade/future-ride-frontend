import React from 'react'
import { motion } from 'framer-motion'
import { Package, CheckCircle, ArrowUpCircle, Clock } from 'lucide-react'
import { useDashboardData, usePackageHistory } from '../../../hooks/useDashboard'
import { StatCard } from '../StatCard'
import { DataTable } from '../DataTable'
import type { Column } from '../DataTable'
import type { PackageRecord } from '../../../types/dashboard'

export default function FutureRideSystem() {
  const { data: dash, isLoading: dashLoading } = useDashboardData()
  const { data: pkgs, isLoading: pkgLoading } = usePackageHistory()

  const cols: Column<PackageRecord>[] = [
    { key: 'packageName', header: 'Package',       sortable: true, render: (r) => <span className="font-medium text-white">{r.packageName}</span> },
    { key: 'amount',      header: 'Amount (USD)',   sortable: true, render: (r) => <span className="text-[#F5A623] font-mono">${r.amount}</span> },
    { key: 'purchaseDate',header: 'Purchase Date',  sortable: true, render: (r) => <span className="text-white/40 text-xs">{r.purchaseDate}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === 'active' ? 'bg-green-400/10 text-green-400' : r.status === 'expired' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
          {r.status}
        </span>
      ),
    },
  ]

  const PACKAGES = ['$5','$10','$20','$40','$80','$160','$320','$640','$1280','$2560','$5120','$10240']

  return (
    <div className="space-y-5" data-testid="future-ride-system-page">
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <StatCard data-testid="pkg-current"  title="Current Package"  value={dashLoading ? '—' : (dash?.user.currentPackage ?? '—')}  accent="blue"   icon={<Package size={14} />} />
        <StatCard data-testid="pkg-highest"  title="Highest Package"  value={dashLoading ? '—' : (dash?.user.highestPackage ?? '—')}   accent="gold"   icon={<ArrowUpCircle size={14} />} />
        <StatCard data-testid="pkg-status"   title="Status"           value={dashLoading ? '—' : (dash?.user.status === 'active' ? 'Active' : 'Inactive')} accent="cyan" icon={<CheckCircle size={14} />} />
        <StatCard data-testid="pkg-eligible" title="Upgrade Eligible" value={dashLoading ? '—' : (dash?.user.currentPackage !== '$10240' ? 'Yes' : 'Max')} accent="purple" icon={<Clock size={14} />} />
      </motion.div>

      {/* Package grid */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5">
        <p className="text-sm font-bold text-white mb-4">All Packages</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {PACKAGES.map((pkg, i) => {
            const isCurrent = pkg === dash?.user.currentPackage
            const isHighest = pkg === dash?.user.highestPackage
            const pkgNum = parseInt(pkg.slice(1))
            const isOwned = pkgNum <= parseInt((dash?.user.currentPackage ?? '$0').slice(1))
            return (
              <div key={pkg} data-testid={`package-${pkg.replace('$', '')}`}
                className={`rounded-xl p-3 text-center border transition-all ${isCurrent ? 'border-[#38BDF8]/50 bg-[#38BDF8]/10' : isOwned ? 'border-green-400/20 bg-green-400/5' : 'border-white/6 bg-white/[0.02]'}`}
              >
                <p className={`font-black text-base ${isCurrent ? 'text-[#38BDF8]' : isOwned ? 'text-green-400' : 'text-white/30'}`}>{pkg}</p>
                {isCurrent && <p className="text-[9px] text-[#38BDF8] font-semibold mt-0.5">CURRENT</p>}
                {isHighest && !isCurrent && <p className="text-[9px] text-[#F5A623] font-semibold mt-0.5">HIGHEST</p>}
              </div>
            )
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }} className="rounded-2xl border border-white/[0.06] bg-[#080F26] p-5">
        <p className="text-sm font-bold text-white mb-4">Package History</p>
        <DataTable
          data-testid="package-history-table"
          data={(pkgs ?? []) as unknown as PackageRecord[]}
          columns={cols as Column<PackageRecord>[]}
          loading={pkgLoading}
          pageSize={8}
          searchable
        />
      </motion.div>
    </div>
  )
}


import PackageHistoryPage from '@/components/dashboard/pages/PackageBuyHistory'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/package-buy-history',
)({
  component: PackageHistoryPage
})

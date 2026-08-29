import UpgradeHoldingHistoryPage from '#/components/dashboard/pages/UpgradeHoldingHistoryPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/upgrade-holding-history')({
  component: UpgradeHoldingHistoryPage,
})

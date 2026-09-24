import DailyRoyaltyPoolPage from '#/components/dashboard/pages/DailyRoyaltyPoolPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/daily-royalty-pool')({ component: DailyRoyaltyPoolPage })

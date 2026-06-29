import PremiumCardTiers from '#/components/dashboard/pages/RoyaltyPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/royalty')({
  component: PremiumCardTiers,
})



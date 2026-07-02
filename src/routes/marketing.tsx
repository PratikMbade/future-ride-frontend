import MarketingPage from '#/components/MarketingPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/marketing')({
  component: MarketingPage,
})



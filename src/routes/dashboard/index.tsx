import HomeDashboard from '#/components/dashboard/pages/HomeDashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: HomeDashboard,
})



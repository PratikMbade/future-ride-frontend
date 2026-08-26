import TotalTeamPage from '#/components/dashboard/pages/TotalTeamPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/team/total-team')({
  component: TotalTeamPage,
})

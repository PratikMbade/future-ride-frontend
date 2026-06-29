import DirectTeam from '#/components/dashboard/pages/DirectTeam'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/team/direct-team')({
  component: DirectTeam,
})



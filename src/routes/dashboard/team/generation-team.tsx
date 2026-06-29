import GenerationTeamPage from '#/components/dashboard/pages/GenerationTeamPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/team/generation-team')({
  component: GenerationTeamPage,
})



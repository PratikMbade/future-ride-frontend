import { GenerationTree } from '#/components/dashboard/pages/GenerationTreePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/generation-tree')({
  component: GenerationTree,
})


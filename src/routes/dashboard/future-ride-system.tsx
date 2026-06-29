import PackageBuyPage from '#/components/dashboard/pages/PackageBuy'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/future-ride-system')({
  component: PackageBuyPage,
})

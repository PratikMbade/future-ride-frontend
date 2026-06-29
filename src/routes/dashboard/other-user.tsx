import AdminUserOperationsPage from '#/components/dashboard/pages/OtherUser'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/other-user')({
  component: AdminUserOperationsPage,
})


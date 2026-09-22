import UserIncomeLookup from '#/components/dashboard/pages/UserIncomeLookup'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/user-income-lookup')({
  component: UserIncomeLookup,
})

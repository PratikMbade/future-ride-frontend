import { createFileRoute } from '@tanstack/react-router'
import { GenerationTree } from '@/components/dashboard/pages/GenerationTreePage'
import { authClient } from '@/lib/authClient'

export const GenerationTreePage = () => {
  const { data: session, isPending: sessionPending } = authClient.useSession()

  if (sessionPending) {
    return <div>Loading...</div>
  }

  const address = session?.user?.name

  if (!address) {
    return <div>Please sign in.</div>
  }

  return <GenerationTree rootAddress={address.toLowerCase()} />
}

export const Route = createFileRoute('/dashboard/generation-tree')({
  component: GenerationTreePage,
})
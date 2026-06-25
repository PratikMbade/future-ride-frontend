import { HomePage } from '@/components/HomePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      {
        title: 'Future Ride | DApp',
      },
    ],
  }),
})
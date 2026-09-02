import DubaiTourPage from '#/components/dashboard/pages/DubaiTourPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/dubai-tour')({
  component: DubaiTourPage,
})

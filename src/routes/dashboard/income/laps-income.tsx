import LapsIncomeTable from '#/components/dashboard/pages/LapsIncomeTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/laps-income')({
  component: LapsIncomeTable,
})


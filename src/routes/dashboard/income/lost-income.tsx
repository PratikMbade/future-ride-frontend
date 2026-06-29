import LostIncomeTable from '#/components/dashboard/pages/LostIncomeTablePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/lost-income')({
  component: LostIncomeTable,
})


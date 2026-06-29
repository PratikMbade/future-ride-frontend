import DirectIncomeTable from '#/components/dashboard/pages/DirectIncomeTablePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/direct-income')({
  component:DirectIncomeTable,
})



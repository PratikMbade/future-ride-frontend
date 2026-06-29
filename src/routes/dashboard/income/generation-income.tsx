import GenerationIncomeTable from '#/components/dashboard/pages/GenerationIncomeTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/generation-income')({
  component: GenerationIncomeTable,
})



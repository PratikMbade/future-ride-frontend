import LevelIncomeTable from '#/components/dashboard/pages/LevelIncomeTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/level-income')({
  component: LevelIncomeTable,
})

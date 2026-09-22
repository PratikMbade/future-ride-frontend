import LevelLostIncomeTable from '#/components/dashboard/pages/LevelLostIncomeTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/level-lost-income')({
  component: LevelLostIncomeTable,
})

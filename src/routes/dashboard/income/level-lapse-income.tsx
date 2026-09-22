import LevelLapseIncomeTable from '#/components/dashboard/pages/LevelLapseIncomeTable'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/income/level-lapse-income')({
  component: LevelLapseIncomeTable,
})

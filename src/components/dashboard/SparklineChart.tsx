import React from 'react'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import type { SparklineData } from '@/types/dashboard'

interface Props {
  data: SparklineData[]
  color?: string
  height?: number
}

export function SparklineChart({ data, color = '#38BDF8', height = 36 }: Props) {
  return (
    <ResponsiveContainer width={90} height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

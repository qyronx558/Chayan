"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

export function Sparkline({ data, id }: { data: number[]; id: string }) {
  const points = data.map((v, i) => ({ i, v }))
  return (
    <div className="h-9 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
          <Area
            type="monotone"
            dataKey="v"
            stroke="var(--color-brick)"
            strokeWidth={1.5}
            fill="var(--color-brick)" fillOpacity={0.12}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

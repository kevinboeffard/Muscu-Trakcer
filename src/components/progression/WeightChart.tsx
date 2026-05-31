import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { Mesure } from '../../types'
import { formatShort } from '../../utils/dateUtils'

interface Props {
  mesures: Mesure[]
  metric: keyof Omit<Mesure, 'date'>
  color?: string
  label?: string
}

export default function WeightChart({ mesures, metric, color = '#818cf8', label }: Props) {
  const data = mesures
    .filter(m => m[metric] != null)
    .map(m => ({
      date: formatShort(m.date),
      value: m[metric],
    }))

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Pas encore de données à afficher.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#e5e7eb' }}
          itemStyle={{ color }}
        />
        {label && <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 3 }}
          activeDot={{ r: 5 }}
          name={label ?? metric}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

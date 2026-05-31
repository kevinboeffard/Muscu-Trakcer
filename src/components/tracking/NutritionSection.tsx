import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { Macro } from '../../types'
import MacroBadge from '../ui/MacroBadge'
import Card from '../ui/Card'

// ── Day view ──────────────────────────────────────────────────────────────────
interface DayProps { macros: Macro; repasCount: number }
export function NutritionDay({ macros, repasCount }: DayProps) {
  const bars = [
    { label: 'Protéines', value: macros.proteines, color: '#60a5fa', unit: 'g' },
    { label: 'Glucides',  value: macros.glucides,  color: '#34d399', unit: 'g' },
    { label: 'Lipides',   value: macros.lipides,   color: '#fb923c', unit: 'g' },
  ]
  return (
    <Card glass className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-300">🥗 Nutrition</p>
        <span className="text-xs text-gray-500">{repasCount} repas</span>
      </div>
      <MacroBadge macro={macros} />
      <div className="grid grid-cols-3 gap-2 mt-1">
        {bars.map(b => (
          <div key={b.label} className="flex flex-col items-center gap-1">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${Math.min(100, (b.value / 200) * 100)}%`, background: b.color }}
              />
            </div>
            <span className="text-xs text-gray-400">{b.label}</span>
            <span className="text-sm font-bold" style={{ color: b.color }}>{b.value}{b.unit}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Multi-day chart (month / year) ────────────────────────────────────────────
interface ChartPoint { label: string; calories: number; proteines: number }
interface ChartProps {
  data: ChartPoint[]
  title: string
  calorieGoal?: number
}
export function NutritionChart({ data, title, calorieGoal }: ChartProps) {
  return (
    <Card glass className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-300">🥗 {title}</p>
      {data.every(d => d.calories === 0) ? (
        <p className="text-gray-500 text-sm text-center py-6">Aucune donnée sur cette période.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            {calorieGoal && (
              <ReferenceLine y={calorieGoal} stroke="#818cf8" strokeDasharray="4 2" label={{ value: `${calorieGoal} kcal`, fill: '#818cf8', fontSize: 10 }} />
            )}
            <Bar dataKey="calories" name="Calories" fill="#facc15" radius={[3,3,0,0]} />
            <Bar dataKey="proteines" name="Protéines (g)" fill="#60a5fa" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

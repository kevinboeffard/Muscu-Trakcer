import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import Card from '../ui/Card'
import Button from '../ui/Button'

const GOAL = 10_000

// ── Day view ──────────────────────────────────────────────────────────────────
interface DayProps { steps: number; onSave: (n: number) => void }
export function StepsDay({ steps, onSave }: DayProps) {
  const [val, setVal] = useState(String(steps || ''))
  const [editing, setEditing] = useState(steps === 0)
  const pct = Math.min(100, ((steps || 0) / GOAL) * 100)

  if (editing) return (
    <Card glass className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-300">👟 Pas du jour</p>
      <div className="flex gap-2">
        <input
          autoFocus
          type="number"
          min="0"
          value={val}
          onChange={e => setVal(e.target.value)}
          placeholder="Ex : 8500"
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-lg font-bold focus:outline-none focus:border-indigo-500"
        />
        <Button onClick={() => { onSave(Number(val)); setEditing(false) }}>Sauver</Button>
      </div>
    </Card>
  )

  return (
    <Card glass className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-300">👟 Pas du jour</p>
        <button onClick={() => { setVal(String(steps)); setEditing(true) }}
          className="text-xs text-indigo-400 hover:underline">Modifier</button>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${steps >= GOAL ? 'text-green-400' : 'text-white'}`}>
          {steps.toLocaleString('fr-FR')}
        </span>
        <span className="text-gray-500 text-sm mb-1">/ {GOAL.toLocaleString('fr-FR')} pas</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${steps >= GOAL ? 'bg-green-400' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {steps >= GOAL && <p className="text-green-400 text-xs">🎉 Objectif atteint !</p>}
    </Card>
  )
}

// ── Chart (month / year) ──────────────────────────────────────────────────────
interface ChartPoint { label: string; steps: number }
interface ChartProps { data: ChartPoint[]; title: string }
export function StepsChart({ data, title }: ChartProps) {
  return (
    <Card glass className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-300">👟 {title}</p>
      {data.every(d => d.steps === 0) ? (
        <p className="text-gray-500 text-sm text-center py-6">Aucune donnée sur cette période.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [v.toLocaleString('fr-FR'), 'Pas']}
            />
            <ReferenceLine y={GOAL} stroke="#818cf8" strokeDasharray="4 2" />
            <Bar dataKey="steps" name="Pas" fill="#818cf8" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

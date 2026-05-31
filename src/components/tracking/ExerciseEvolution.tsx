import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { WorkoutSession } from '../../types'
import Card from '../ui/Card'
import { formatShort } from '../../utils/dateUtils'

interface Props {
  sessions: WorkoutSession[]
  exerciseNames: string[]
}

export default function ExerciseEvolution({ sessions, exerciseNames }: Props) {
  const [selected, setSelected] = useState<string>(exerciseNames[0] ?? '')

  const data = sessions
    .filter(s => s.exercises.some(e => e.nom === selected))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const ex = s.exercises.find(e => e.nom === selected)!
      const maxWeight = Math.max(...ex.series.map(sr => sr.poids ?? 0))
      const totalVol  = ex.series.reduce((acc, sr) => acc + (sr.poids ?? 0) * sr.reps, 0)
      return {
        date:     formatShort(s.date),
        maxPoids: maxWeight,
        volume:   totalVol,
      }
    })

  return (
    <Card glass className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-300">Évolution exercice</p>
        {exerciseNames.length > 0 ? (
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-indigo-500 max-w-[180px]"
          >
            {exerciseNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <span className="text-xs text-gray-500">Aucun exercice loggé</span>
        )}
      </div>

      {data.length < 2 ? (
        <p className="text-gray-500 text-sm text-center py-6">
          {exerciseNames.length === 0
            ? "Loggez des séances pour voir l'évolution."
            : `Pas assez de sessions avec "${selected}".`}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Max actuel',  value: `${data.at(-1)!.maxPoids} kg`, color: '#818cf8' },
              { label: 'Progression', value: `${data.at(-1)!.maxPoids - data[0].maxPoids >= 0 ? '+' : ''}${(data.at(-1)!.maxPoids - data[0].maxPoids).toFixed(1)} kg`, color: data.at(-1)!.maxPoids >= data[0].maxPoids ? '#34d399' : '#f87171' },
              { label: 'Sessions',    value: String(data.length), color: '#fb923c' },
            ].map(s => (
              <div key={s.label} className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 8, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" kg" />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [
                  name === 'maxPoids' ? `${v} kg` : v,
                  name === 'maxPoids' ? 'Max charge' : 'Volume total',
                ]}
              />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }}
                formatter={v => v === 'maxPoids' ? 'Max charge (kg)' : 'Volume (kg)'} />
              <Line type="monotone" dataKey="maxPoids" stroke="#818cf8" strokeWidth={2.5}
                dot={{ r: 4, fill: '#818cf8' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="volume" stroke="#34d399" strokeWidth={1.5}
                strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  )
}

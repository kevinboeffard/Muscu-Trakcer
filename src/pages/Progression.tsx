import { useState } from 'react'
import { useProgression } from '../hooks/useProgression'
import type { Mesure, UserId } from '../types'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import WeightChart from '../components/progression/WeightChart'
import MesureForm from '../components/progression/MesureForm'
import { formatDate } from '../utils/dateUtils'

type Metric = keyof Omit<Mesure, 'date'>

const METRICS: { key: Metric; label: string; color: string; unit: string }[] = [
  { key: 'poids',    label: 'Poids',    color: '#818cf8', unit: 'kg' },
  { key: 'poitrine', label: 'Poitrine', color: '#34d399', unit: 'cm' },
  { key: 'taille',   label: 'Taille',   color: '#f472b6', unit: 'cm' },
  { key: 'hanches',  label: 'Hanches',  color: '#fb923c', unit: 'cm' },
  { key: 'brasG',    label: 'Bras G',   color: '#60a5fa', unit: 'cm' },
  { key: 'cuisseG',  label: 'Cuisse G', color: '#a78bfa', unit: 'cm' },
]

interface Props {
  loggedUserId: UserId
}

export default function Progression({ loggedUserId }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<Metric>('poids')
  const [showForm, setShowForm] = useState(false)
  const [editingMesure, setEditingMesure] = useState<Mesure | null>(null)

  const { mesures, addOrUpdateMesure, deleteMesure } = useProgression(loggedUserId)

  const latest = mesures.at(-1)
  const previous = mesures.at(-2)

  const delta = (key: Metric): string => {
    if (!latest || !previous || latest[key] == null || previous[key] == null) return ''
    const diff = (latest[key] as number) - (previous[key] as number)
    return diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Progression</h1>
        <Button onClick={() => setShowForm(true)}>+ Saisir mesures</Button>
      </div>

      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-3 gap-2">
          {METRICS.map(m => (
            latest[m.key] != null && (
              <Card
                key={m.key}
                className="flex flex-col gap-0.5 cursor-pointer hover:border-indigo-500 transition-colors"
                onClick={() => setSelectedMetric(m.key)}
                style={{ borderColor: selectedMetric === m.key ? '#6366f1' : undefined }}
              >
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className="text-lg font-bold" style={{ color: m.color }}>
                  {latest[m.key]} {m.unit}
                </p>
                {delta(m.key) && (
                  <p className={`text-xs ${delta(m.key)?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {delta(m.key)} {m.unit}
                  </p>
                )}
              </Card>
            )
          ))}
        </div>
      )}

      {/* Chart */}
      <Card glass>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-300">
            {METRICS.find(m => m.key === selectedMetric)?.label}
          </p>
          <div className="flex gap-1">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`w-3 h-3 rounded-full border-2 transition-all ${selectedMetric === m.key ? 'scale-125' : 'opacity-50'}`}
                style={{ background: m.color, borderColor: m.color }}
                title={m.label}
              />
            ))}
          </div>
        </div>
        <WeightChart
          mesures={mesures}
          metric={selectedMetric}
          color={METRICS.find(m => m.key === selectedMetric)?.color}
          label={METRICS.find(m => m.key === selectedMetric)?.label}
        />
      </Card>

      {/* History */}
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-300">Historique</h2>
        {[...mesures].reverse().map(m => (
          <Card key={m.date} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">{formatDate(m.date)}</p>
              <p className="text-xs text-gray-400">
                {METRICS.filter(met => m[met.key] != null)
                  .map(met => `${met.label}: ${m[met.key]}${met.unit}`)
                  .join(' · ')}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => setEditingMesure(m)}>✏️</Button>
              <Button size="sm" variant="danger" onClick={() => deleteMesure(m.date)}>🗑️</Button>
            </div>
          </Card>
        ))}
        {mesures.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Aucune mesure enregistrée.</p>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouvelles mesures">
        <MesureForm
          onSave={data => { addOrUpdateMesure(data); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!editingMesure} onClose={() => setEditingMesure(null)} title="Modifier les mesures">
        {editingMesure && (
          <MesureForm
            initial={editingMesure}
            onSave={data => { addOrUpdateMesure(data); setEditingMesure(null) }}
            onCancel={() => setEditingMesure(null)}
          />
        )}
      </Modal>
    </div>
  )
}

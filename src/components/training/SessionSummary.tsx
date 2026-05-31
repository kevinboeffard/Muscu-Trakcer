import type { Exercise } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface DoneSet { reps: number; poids: number }
export type CompletedExercise = { exercise: Exercise; sets: DoneSet[] }

interface Props {
  completed: CompletedExercise[]
  duration: number   // seconds
  onSave: () => void
  onDiscard: () => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}min${sec > 0 ? ` ${sec}s` : ''}`
}

export default function SessionSummary({ completed, duration, onSave, onDiscard }: Props) {
  const totalSets   = completed.reduce((a, c) => a + c.sets.length, 0)
  const totalVolume = completed.reduce((a, c) =>
    a + c.sets.reduce((b, s) => b + s.reps * s.poids, 0), 0
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="text-center">
        <p className="text-5xl mb-2">🏆</p>
        <h2 className="text-2xl font-bold text-white">Séance terminée !</h2>
        <p className="text-gray-400 text-sm mt-1">Belle session — voici le résumé</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Durée',   value: fmt(duration),           color: '#818cf8' },
          { label: 'Séries',  value: String(totalSets),       color: '#34d399' },
          { label: 'Volume',  value: `${totalVolume} kg`,     color: '#fb923c' },
        ].map(s => (
          <Card key={s.label} className="text-center flex flex-col gap-0.5">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Exercise breakdown */}
      <div className="flex flex-col gap-3">
        {completed.map(({ exercise, sets }, ei) => {
          const poids = sets[0]?.poids ?? 0
          const vol   = sets.reduce((a, s) => a + s.reps * poids, 0)
          return (
            <Card key={ei} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{exercise.nom}</p>
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>🏋️ {poids} kg</span>
                  <span>📦 {vol} kg vol.</span>
                </div>
              </div>
              {/* Single weight badge + set breakdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded-full font-semibold">
                  {poids} kg
                </span>
                {sets.map((s, si) => (
                  <span key={si} className="text-xs bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                    {si + 1}. {s.reps} reps
                  </span>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1 justify-center" onClick={onDiscard}>
          Supprimer
        </Button>
        <Button className="flex-1 justify-center" onClick={onSave}>
          💾 Sauvegarder
        </Button>
      </div>
    </div>
  )
}

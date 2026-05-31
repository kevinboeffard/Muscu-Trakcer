import { useState } from 'react'
import type { Workout } from '../../types'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface Props {
  initial?: Partial<Workout>
  onSave: (data: Omit<Workout, 'id'>) => void
  onCancel: () => void
}

interface DraftExercise {
  id: string
  nom: string
  nbSeries: number
  reps: number
  notes: string
}

function newDraft(): DraftExercise {
  return { id: crypto.randomUUID(), nom: '', nbSeries: 4, reps: 10, notes: '' }
}

/** Convert an existing Exercise (from library) to draft form. */
function toDraft(ex: Workout['exercises'][number]): DraftExercise {
  return {
    id:       ex.id,
    nom:      ex.nom,
    nbSeries: ex.series.length,
    reps:     ex.series[0]?.reps ?? 10,
    notes:    ex.notes ?? '',
  }
}

export default function WorkoutForm({ initial, onSave, onCancel }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [exercises, setExercises] = useState<DraftExercise[]>(
    initial?.exercises?.map(toDraft) ?? []
  )

  const add    = ()           => setExercises(prev => [...prev, newDraft()])
  const remove = (id: string) => setExercises(prev => prev.filter(e => e.id !== id))
  const update = (id: string, patch: Partial<DraftExercise>) =>
    setExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    onSave({
      nom,
      exercises: exercises.map(ex => ({
        id:     ex.id,
        nom:    ex.nom,
        notes:  ex.notes || undefined,
        series: Array.from({ length: ex.nbSeries }, () => ({ reps: ex.reps })),
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Nom de la séance"
        value={nom}
        onChange={e => setNom(e.target.value)}
        required
        placeholder="Ex : Push Day A"
      />

      <div className="flex flex-col gap-3">
        {exercises.map((ex, ei) => (
          <div key={ex.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
            {/* Name */}
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder={`Exercice ${ei + 1}`}
                value={ex.nom}
                onChange={e => update(ex.id, { nom: e.target.value })}
                required
              />
              <Button type="button" size="sm" variant="danger" onClick={() => remove(ex.id)}>×</Button>
            </div>

            {/* Sets × Reps */}
            <div className="flex items-center gap-3">
              {/* nb séries */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">Séries</span>
                <div className="flex items-center gap-1">
                  <button type="button"
                    onClick={() => update(ex.id, { nbSeries: Math.max(1, ex.nbSeries - 1) })}
                    className="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600">−</button>
                  <span className="w-8 text-center text-lg font-bold text-white">{ex.nbSeries}</span>
                  <button type="button"
                    onClick={() => update(ex.id, { nbSeries: ex.nbSeries + 1 })}
                    className="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600">+</button>
                </div>
              </div>

              <span className="text-gray-500 text-xl font-light mt-4">×</span>

              {/* reps */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">Reps</span>
                <div className="flex items-center gap-1">
                  <button type="button"
                    onClick={() => update(ex.id, { reps: Math.max(1, ex.reps - 1) })}
                    className="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600">−</button>
                  <span className="w-8 text-center text-lg font-bold text-white">{ex.reps}</span>
                  <button type="button"
                    onClick={() => update(ex.id, { reps: ex.reps + 1 })}
                    className="w-8 h-8 rounded-lg bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600">+</button>
                </div>
              </div>

              {/* Preview badge */}
              <div className="mt-4 ml-2 bg-indigo-900/40 border border-indigo-700/40 rounded-lg px-3 py-1.5">
                <span className="text-indigo-300 font-semibold text-sm">
                  {ex.nbSeries} × {ex.reps} reps
                </span>
              </div>
            </div>

            {/* Notes */}
            <Input
              placeholder="Notes (optionnel)"
              value={ex.notes}
              onChange={e => update(ex.id, { notes: e.target.value })}
            />
          </div>
        ))}

        <Button type="button" variant="secondary" onClick={add}>
          + Ajouter un exercice
        </Button>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  )
}

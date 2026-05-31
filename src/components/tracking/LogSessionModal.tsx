/**
 * Modal to log a workout session.
 * User picks a workout from library (pre-fills exercises) or creates a blank session,
 * then edits actual weights/reps performed.
 */
import { useState } from 'react'
import type { WorkoutSession, Workout, Serie } from '../../types'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { today } from '../../utils/dateUtils'

interface Props {
  open: boolean
  onClose: () => void
  workouts: Workout[]
  defaultDate?: string
  onSave: (data: Omit<WorkoutSession, 'id' | 'userId'>) => void
}

type DraftExercise = { nom: string; series: Serie[] }

export default function LogSessionModal({ open, onClose, workouts, defaultDate, onSave }: Props) {
  const [date, setDate]       = useState(defaultDate ?? today())
  const [nom, setNom]         = useState('')
  const [notes, setNotes]     = useState('')
  const [exercises, setExs]   = useState<DraftExercise[]>([])
  const [source, setSource]   = useState<'library' | 'blank'>('library')
  const [workoutId, setWId]   = useState('')

  const loadWorkout = (id: string) => {
    const w = workouts.find(w => w.id === id)
    if (!w) return
    setWId(id)
    setNom(w.nom)
    setExs(w.exercises.map(e => ({ nom: e.nom, series: e.series.map(s => ({ ...s })) })))
  }

  const addBlankEx = () => setExs(prev => [...prev, { nom: '', series: [{ reps: 8, poids: 0 }] }])

  const updateExNom = (i: number, v: string) =>
    setExs(prev => prev.map((e, n) => n === i ? { ...e, nom: v } : e))

  const updateSerie = (ei: number, si: number, patch: Partial<Serie>) =>
    setExs(prev => prev.map((e, n) => n === ei
      ? { ...e, series: e.series.map((s, m) => m === si ? { ...s, ...patch } : s) }
      : e
    ))

  const addSerie = (ei: number) =>
    setExs(prev => prev.map((e, n) => n === ei
      ? { ...e, series: [...e.series, { reps: e.series.at(-1)?.reps ?? 8, poids: e.series.at(-1)?.poids }] }
      : e
    ))

  const removeSerie = (ei: number, si: number) =>
    setExs(prev => prev.map((e, n) => n === ei
      ? { ...e, series: e.series.filter((_, m) => m !== si) }
      : e
    ))

  const removeEx = (i: number) => setExs(prev => prev.filter((_, n) => n !== i))

  const reset = () => { setDate(defaultDate ?? today()); setNom(''); setNotes(''); setExs([]); setWId(''); setSource('library') }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      date,
      nom: nom || 'Séance',
      workoutId: workoutId || undefined,
      exercises: exercises.map(ex => ({
        id: crypto.randomUUID(),
        nom: ex.nom,
        series: ex.series,
      })),
      notes: notes || undefined,
    })
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Logger une séance" maxWidth="max-w-2xl">
      <form onSubmit={handleSave} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <Input label="Nom de la séance" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Push A" />
        </div>

        {/* Source picker */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['library', 'blank'] as const).map(s => (
            <button type="button" key={s} onClick={() => setSource(s)}
              className={`flex-1 py-1.5 rounded-md text-sm transition-colors ${source === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {s === 'library' ? '📚 Depuis bibliothèque' : '✏️ Séance libre'}
            </button>
          ))}
        </div>

        {source === 'library' && (
          <select
            value={workoutId}
            onChange={e => loadWorkout(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">— Choisir un workout —</option>
            {workouts.map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
          </select>
        )}

        {/* Exercises */}
        {exercises.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-400 font-medium">Exercices & charges réelles</p>
            {exercises.map((ex, ei) => (
              <div key={ei} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={ex.nom}
                    onChange={e => updateExNom(ei, e.target.value)}
                    placeholder="Nom exercice"
                    required
                  />
                  <Button type="button" size="sm" variant="danger" onClick={() => removeEx(ei)}>×</Button>
                </div>
                {ex.series.map((s, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm w-5">{si + 1}.</span>
                    <Input type="number" min="1" value={s.reps}  onChange={e => updateSerie(ei, si, { reps: Number(e.target.value) })} className="w-16" placeholder="Reps" />
                    <span className="text-gray-500 text-sm">×</span>
                    <Input type="number" min="0" step="0.5" value={s.poids} onChange={e => updateSerie(ei, si, { poids: Number(e.target.value) })} className="w-20" placeholder="kg" />
                    <span className="text-gray-500 text-xs">kg</span>
                    {ex.series.length > 1 && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeSerie(ei, si)}>×</Button>
                    )}
                  </div>
                ))}
                <Button type="button" size="sm" variant="ghost" onClick={() => addSerie(ei)}>+ Série</Button>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="secondary" onClick={addBlankEx}>+ Ajouter exercice</Button>

        <Input label="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ressenti, fatigue…" />

        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={() => { reset(); onClose() }}>Annuler</Button>
          <Button type="submit">Enregistrer la séance</Button>
        </div>
      </form>
    </Modal>
  )
}

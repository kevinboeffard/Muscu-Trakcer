import { useState } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import type { Workout } from '../types'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import WorkoutForm from '../components/workouts/WorkoutForm'
import WorkoutCard from '../components/workouts/WorkoutCard'

export default function Workouts() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts()
  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [search, setSearch] = useState('')

  const filtered = workouts.filter(w =>
    w.nom.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Workouts</h1>
        <Button onClick={() => setShowForm(true)}>+ Nouvelle séance</Button>
      </div>

      <p className="text-gray-400 text-sm">
        Bibliothèque de séances réutilisables · {workouts.length} séance(s)
      </p>

      <input
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        placeholder="Rechercher une séance…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="flex flex-col gap-3">
        {filtered.map(w => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onEdit={() => setEditingWorkout(w)}
            onDelete={() => deleteWorkout(w.id)}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-12">
            Aucune séance. Créez-en une !
          </p>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nouvelle séance"
        maxWidth="max-w-2xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <WorkoutForm
            onSave={data => { addWorkout(data); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </Modal>

      <Modal
        open={!!editingWorkout}
        onClose={() => setEditingWorkout(null)}
        title="Modifier la séance"
        maxWidth="max-w-2xl"
      >
        {editingWorkout && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <WorkoutForm
              initial={editingWorkout}
              onSave={data => { updateWorkout(editingWorkout.id, data); setEditingWorkout(null) }}
              onCancel={() => setEditingWorkout(null)}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

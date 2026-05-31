import { useState } from 'react'
import { useProgrammes } from '../hooks/useWorkouts'
import { useWorkouts } from '../hooks/useWorkouts'
import type { Programme, Workout } from '../types'
import { JOURS } from '../types'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

export default function ProgrammePage() {
  const { workouts } = useWorkouts()
  const { programmes, activeProgramme, addProgramme, updateProgramme, deleteProgramme, setActive } = useProgrammes()

  const [showForm, setShowForm] = useState(false)
  const [editingProg, setEditingProg] = useState<Programme | null>(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Programme</h1>
        <Button onClick={() => setShowForm(true)}>+ Nouveau</Button>
      </div>

      {/* Active programme weekly view */}
      {activeProgramme && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-indigo-400">
              🗓️ {activeProgramme.nom}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setActive(null)}>Désactiver</Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {JOURS.map(jour => {
              const wId = activeProgramme.semaine[jour]
              const workout = workouts.find(w => w.id === wId)
              return (
                <Card key={jour} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-24 shrink-0">{jour}</span>
                  {workout
                    ? <span className="text-white font-medium">{workout.nom}</span>
                    : <span className="text-gray-600 text-sm italic">Repos</span>
                  }
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* All programmes */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-300">Tous les programmes</h2>
        {programmes.map(p => (
          <Card key={p.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">{p.nom}</p>
              <p className="text-sm text-gray-400">
                {Object.values(p.semaine).filter(Boolean).length} séance(s)/semaine
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {activeProgramme?.id !== p.id && (
                <Button size="sm" onClick={() => setActive(p.id)}>Activer</Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setEditingProg(p)}>✏️</Button>
              <Button size="sm" variant="danger" onClick={() => deleteProgramme(p.id)}>🗑️</Button>
            </div>
          </Card>
        ))}
        {programmes.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">Aucun programme créé.</p>
        )}
      </div>

      {/* New programme modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouveau programme" maxWidth="max-w-xl">
        <ProgrammeForm
          workouts={workouts}
          onSave={data => { addProgramme(data); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Edit programme modal */}
      <Modal open={!!editingProg} onClose={() => setEditingProg(null)} title="Modifier le programme" maxWidth="max-w-xl">
        {editingProg && (
          <ProgrammeForm
            initial={editingProg}
            workouts={workouts}
            onSave={data => { updateProgramme(editingProg.id, data); setEditingProg(null) }}
            onCancel={() => setEditingProg(null)}
          />
        )}
      </Modal>
    </div>
  )
}

// ── Inline ProgrammeForm ──────────────────────────────────────────────────────
interface FormProps {
  initial?: Partial<Programme>
  workouts: Workout[]
  onSave: (data: Omit<Programme, 'id'>) => void
  onCancel: () => void
}

function ProgrammeForm({ initial, workouts, onSave, onCancel }: FormProps) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [semaine, setSemaine] = useState<Record<string, string>>(
    initial?.semaine ?? {}
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ nom, semaine })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nom du programme" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Ex: PPL 6 jours" />

      <div className="flex flex-col gap-2">
        {JOURS.map(jour => (
          <div key={jour} className="flex items-center gap-3">
            <span className="text-gray-400 text-sm w-24 shrink-0">{jour}</span>
            <select
              value={semaine[jour] ?? ''}
              onChange={e => setSemaine(prev => ({ ...prev, [jour]: e.target.value }))}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Repos —</option>
              {workouts.map(w => (
                <option key={w.id} value={w.id}>{w.nom}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import type { Exercise } from '../../types'

interface Props {
  exercise: Exercise
  exerciseIndex: number
  exerciseTotal: number
  doneReps: number[]
  onConfirm: (poids: number) => void
}

export default function WeightEntry({ exercise, exerciseIndex, exerciseTotal, doneReps, onConfirm }: Props) {
  const [poids, setPoids] = useState('0')
  const [error, setError] = useState(false)

  const handleConfirm = () => {
    const v = Number(poids)
    if (!poids || v <= 0) { setError(true); return }
    onConfirm(v)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs text-green-400 font-medium uppercase tracking-widest mb-1">
          Exercice {exerciseIndex + 1} / {exerciseTotal} terminé ✓
        </p>
        <h2 className="text-2xl font-bold text-white">{exercise.nom}</h2>
      </div>

      {/* Reps recap */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
        <p className="text-xs text-gray-500 text-center mb-1">Séries effectuées</p>
        <div className="flex gap-2 flex-wrap justify-center">
          {doneReps.map((r, i) => (
            <span key={i} className="text-sm bg-gray-700 text-green-400 px-3 py-1 rounded-full font-medium">
              {i + 1}. {r} reps
            </span>
          ))}
        </div>
      </div>

      {/* Weight input — mandatory */}
      <div className="bg-gray-900 border border-yellow-500/40 rounded-2xl p-5 flex flex-col gap-4">
        <div className="text-center">
          <p className="text-yellow-400 font-semibold">⚠️ Poids utilisé (obligatoire)</p>
          <p className="text-gray-500 text-xs mt-1">Charge globale de l'exercice en kg</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPoids(p => String(Math.max(0, Number(p) - 2.5)))}
            className="w-12 h-12 rounded-xl bg-gray-800 text-white text-2xl flex items-center justify-center hover:bg-gray-700 active:scale-95"
          >−</button>
          <div className="flex flex-col items-center">
            <input
              type="number" min="0" step="0.5"
              value={poids}
              onChange={e => { setPoids(e.target.value); setError(false) }}
              className={`w-24 text-center text-4xl font-bold text-white bg-transparent focus:outline-none ${
                error ? 'text-red-400' : ''
              }`}
            />
            <span className="text-gray-500 text-sm">kg</span>
          </div>
          <button
            onClick={() => setPoids(p => String(Number(p) + 2.5))}
            className="w-12 h-12 rounded-xl bg-gray-800 text-white text-2xl flex items-center justify-center hover:bg-gray-700 active:scale-95"
          >+</button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">Tu dois entrer un poids avant de continuer.</p>
        )}

        <button
          onClick={handleConfirm}
          className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 active:scale-[.98] text-gray-900 font-bold text-base rounded-xl transition-all"
        >
          Valider le poids →
        </button>
      </div>
    </div>
  )
}

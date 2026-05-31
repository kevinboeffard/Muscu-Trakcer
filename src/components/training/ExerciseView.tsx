import { useState, useEffect } from 'react'
import type { Exercise } from '../../types'

interface Props {
  exercise: Exercise
  exerciseIndex: number
  exerciseTotal: number
  setIndex: number
  doneReps: number[]   // reps completed for each previous set
  onSetDone: (reps: number) => void
}

export default function ExerciseView({
  exercise, exerciseIndex, exerciseTotal, setIndex, doneReps, onSetDone
}: Props) {
  const [reps, setReps] = useState(String(exercise.series[setIndex]?.reps ?? 10))

  // Reset input when setIndex changes
  useEffect(() => {
    setReps(String(exercise.series[setIndex]?.reps ?? 10))
  }, [setIndex, exercise])

  const totalSets  = exercise.series.length
  const targetReps = exercise.series[setIndex]?.reps ?? 10

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs text-indigo-400 font-medium uppercase tracking-widest mb-1">
          Exercice {exerciseIndex + 1} / {exerciseTotal}
        </p>
        <h2 className="text-2xl font-bold text-white">{exercise.nom}</h2>
        {exercise.notes && (
          <p className="text-gray-500 text-sm mt-1 italic">{exercise.notes}</p>
        )}
      </div>

      {/* Programme goal */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-center">
        <p className="text-xs text-gray-500 mb-1">Objectif programme</p>
        <p className="text-xl font-bold text-indigo-300">
          {totalSets} × {targetReps} reps
        </p>
      </div>

      {/* Set progress */}
      <div className="flex justify-center gap-2">
        {exercise.series.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all ${
            i < setIndex    ? 'w-6 bg-green-500' :
            i === setIndex  ? 'w-6 bg-indigo-500 ring-2 ring-indigo-300/50' :
                              'w-2 bg-gray-700'
          }`} />
        ))}
      </div>

      {/* Reps input */}
      <div className="bg-gray-900 border border-indigo-500/30 rounded-2xl p-5 flex flex-col gap-4">
        <p className="text-center text-sm text-gray-400 font-medium">
          Série {setIndex + 1} / {totalSets} — combien de reps ?
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setReps(r => String(Math.max(1, Number(r) - 1)))}
            className="w-12 h-12 rounded-xl bg-gray-800 text-white text-2xl flex items-center justify-center hover:bg-gray-700 active:scale-95"
          >−</button>
          <input
            type="number" min="1"
            value={reps}
            onChange={e => setReps(e.target.value)}
            className="w-20 text-center text-4xl font-bold text-white bg-transparent focus:outline-none"
          />
          <button
            onClick={() => setReps(r => String(Number(r) + 1))}
            className="w-12 h-12 rounded-xl bg-gray-800 text-white text-2xl flex items-center justify-center hover:bg-gray-700 active:scale-95"
          >+</button>
        </div>
        <p className="text-center text-gray-600 text-xs">reps</p>

        <button
          onClick={() => onSetDone(Number(reps))}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[.98] text-white font-semibold text-base rounded-xl transition-all"
        >
          ✓ Série terminée
        </button>
      </div>

      {/* Previous sets recap */}
      {doneReps.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-600 text-center">Séries faites</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {doneReps.map((r, i) => (
              <span key={i} className="text-xs bg-gray-800 text-green-400 px-3 py-1 rounded-full">
                {i + 1}. {r} reps
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


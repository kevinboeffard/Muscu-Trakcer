import { useState, useEffect, useRef } from 'react'
import { useWorkouts } from '../hooks/useWorkouts'
import { useWorkoutSessions } from '../hooks/useWorkoutSessions'
import { useRestTimer } from '../hooks/useRestTimer'
import type { Workout, UserId } from '../types'
import { today } from '../utils/dateUtils'
import Card from '../components/ui/Card'
import ExerciseView from '../components/training/ExerciseView'
import WeightEntry from '../components/training/WeightEntry'
import RestTimer from '../components/training/RestTimer'
import SessionSummary, { type CompletedExercise } from '../components/training/SessionSummary'

// ── State machine ─────────────────────────────────────────────────────────────
// doneReps[exIdx] = array of reps per set done
// weights[exIdx]  = single poids for the whole exercise (entered after last set)

interface TrainingData {
  workout:  Workout
  exIdx:    number
  setIdx:   number
  doneReps: number[][]     // [exIdx][setIdx] = reps
  weights:  (number | null)[]  // [exIdx] = poids
}

type Phase =
  | { name: 'select' }
  | { name: 'training'      } & TrainingData
  | { name: 'rest_set'      } & TrainingData   // timer between sets
  | { name: 'enter_weight'  } & TrainingData   // mandatory weight after last set
  | { name: 'rest_exercise' } & TrainingData   // timer between exercises
  | { name: 'summary'; workout: Workout; doneReps: number[][]; weights: number[] }

interface Props { loggedUserId: UserId }

// ── Component ─────────────────────────────────────────────────────────────────
export default function Training({ loggedUserId }: Props) {
  const { workouts }  = useWorkouts()
  const { addSession } = useWorkoutSessions(loggedUserId)
  const setTimer      = useRestTimer()
  const exTimer       = useRestTimer()

  const [phase, setPhase]               = useState<Phase>({ name: 'select' })
  const [restSet,  setRestSet]           = useState(60)    // seconds between sets
  const [restEx,   setRestEx]            = useState(120)   // seconds between exercises
  const [startTime, setStartTime]       = useState(0)
  const [elapsed, setElapsed]           = useState(0)

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  const elRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    const active = phase.name !== 'select' && phase.name !== 'summary'
    if (active && !elRef.current) {
      elRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    }
    if (!active && elRef.current) { clearInterval(elRef.current); elRef.current = null }
    return () => { if (elRef.current) { clearInterval(elRef.current); elRef.current = null } }
  }, [phase.name, startTime])

  // ── Start workout ──────────────────────────────────────────────────────────
  const startWorkout = (workout: Workout) => {
    const doneReps = workout.exercises.map(() => [] as number[])
    const weights  = workout.exercises.map(() => null as number | null)
    setStartTime(Date.now())
    setElapsed(0)
    setPhase({ name: 'training', workout, exIdx: 0, setIdx: 0, doneReps, weights })
  }

  // ── Set done ───────────────────────────────────────────────────────────────
  const handleSetDone = (reps: number) => {
    if (phase.name !== 'training') return
    const { workout, exIdx, setIdx, doneReps, weights } = phase

    const newReps = doneReps.map((arr, i) =>
      i === exIdx ? [...arr, reps] : arr
    )

    const totalSets = workout.exercises[exIdx].series.length
    const isLastSet = setIdx + 1 >= totalSets

    if (isLastSet) {
      // All sets done for this exercise → ask for weight
      setPhase({ name: 'enter_weight', workout, exIdx, setIdx, doneReps: newReps, weights })
    } else {
      // Start inter-set timer
      const next: TrainingData = { workout, exIdx, setIdx: setIdx + 1, doneReps: newReps, weights }
      setPhase({ name: 'rest_set', ...next })
      setTimer.start(restSet, () => setPhase({ name: 'training', ...next }))
    }
  }

  // ── Weight confirmed ───────────────────────────────────────────────────────
  const handleWeightConfirmed = (poids: number) => {
    if (phase.name !== 'enter_weight') return
    const { workout, exIdx, doneReps, weights } = phase

    const newWeights = weights.map((w, i) => i === exIdx ? poids : w)
    const isLastEx   = exIdx + 1 >= workout.exercises.length

    if (isLastEx) {
      // Training complete!
      setPhase({
        name: 'summary',
        workout,
        doneReps,
        weights: newWeights as number[],
      })
      return
    }

    // Start inter-exercise timer
    const next: TrainingData = { workout, exIdx: exIdx + 1, setIdx: 0, doneReps, weights: newWeights }
    setPhase({ name: 'rest_exercise', ...next })
    exTimer.start(restEx, () => setPhase({ name: 'training', ...next }))
  }

  // ── Skip timers ────────────────────────────────────────────────────────────
  const skipSetRest = () => setTimer.skip()
  const skipExRest  = () => exTimer.skip()

  // ── Save session ───────────────────────────────────────────────────────────
  const handleSave = () => {
    if (phase.name !== 'summary') return
    const { workout, doneReps, weights } = phase
    addSession({
      date:      today(),
      nom:       workout.nom,
      workoutId: workout.id,
      exercises: workout.exercises.map((ex, i) => ({
        ...ex,
        series: doneReps[i].map(reps => ({ reps, poids: weights[i] })),
      })),
    })
    setPhase({ name: 'select' })
  }

  // ── Abandon ────────────────────────────────────────────────────────────────
  const abandon = () => {
    setTimer.stop()
    exTimer.stop()
    setPhase({ name: 'select' })
  }

  // ── Elapsed format ─────────────────────────────────────────────────────────
  const fmtElapsed = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  // ── Top bar (shared by training phases) ───────────────────────────────────
  const TopBar = ({ workout }: { workout: Workout }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{workout.nom}</p>
        <p className="text-white font-semibold tabular-nums">⏱ {fmtElapsed}</p>
      </div>
      <button onClick={abandon} className="text-gray-500 hover:text-red-400 text-sm transition-colors">
        Abandonner ✕
      </button>
    </div>
  )

  // ── Exercise progress bar ─────────────────────────────────────────────────
  const ExBar = ({ workout, exIdx }: { workout: Workout; exIdx: number }) => (
    <div className="flex gap-1.5">
      {workout.exercises.map((_, i) => (
        <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
          i < exIdx  ? 'bg-green-500' :
          i === exIdx ? 'bg-indigo-500' : 'bg-gray-700'
        }`} />
      ))}
    </div>
  )

  // ── Summary completed exercises ────────────────────────────────────────────
  const toCompleted = (workout: Workout, doneReps: number[][], weights: number[]): CompletedExercise[] =>
    workout.exercises.map((ex, i) => ({
      exercise: ex,
      sets: doneReps[i].map(r => ({ reps: r, poids: weights[i] })),
    }))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-5 min-h-[80vh]">

      {/* ── SELECT ────────────────────────────────────────────────────── */}
      {phase.name === 'select' && (
        <>
          <div>
            <h1 className="text-2xl font-bold text-white">Mode Training</h1>
            <p className="text-gray-400 text-sm mt-1">Choisis ta séance 💪</p>
          </div>

          {/* Rest durations config */}
          <Card className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-300">⚙️ Durées de récupération</p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-400">Entre les séries</span>
              <RestPresets value={restSet} onChange={setRestSet} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-400">Entre les exercices</span>
              <RestPresets value={restEx} onChange={setRestEx} />
            </div>
          </Card>

          {workouts.length === 0 ? (
            <Card className="text-center py-10 text-gray-400">
              Aucun workout. Crée-en un dans l'onglet Workouts.
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {workouts.map(w => (
                <button
                  key={w.id}
                  onClick={() => startWorkout(w)}
                  className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500 rounded-2xl p-5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">{w.nom}</p>
                      <p className="text-gray-400 text-sm mt-0.5">
                        {w.exercises.length} exercice(s) · {w.exercises.reduce((a, e) => a + e.series.length, 0)} séries
                      </p>
                    </div>
                    <span className="text-2xl group-hover:scale-110 transition-transform">▶️</span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {w.exercises.slice(0, 5).map((ex, i) => (
                      <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                        {ex.nom} {ex.series.length}×{ex.series[0]?.reps}
                      </span>
                    ))}
                    {w.exercises.length > 5 && <span className="text-xs text-gray-500">+{w.exercises.length - 5}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TRAINING ──────────────────────────────────────────────────── */}
      {phase.name === 'training' && (
        <>
          <TopBar workout={phase.workout} />
          <ExBar workout={phase.workout} exIdx={phase.exIdx} />
          <ExerciseView
            exercise={phase.workout.exercises[phase.exIdx]}
            exerciseIndex={phase.exIdx}
            exerciseTotal={phase.workout.exercises.length}
            setIndex={phase.setIdx}
            doneReps={phase.doneReps[phase.exIdx]}
            onSetDone={handleSetDone}
          />
        </>
      )}

      {/* ── REST SET ──────────────────────────────────────────────────── */}
      {phase.name === 'rest_set' && (
        <>
          <TopBar workout={phase.workout} />
          <ExBar workout={phase.workout} exIdx={phase.exIdx} />
          <RestTimer
            remaining={setTimer.remaining}
            total={restSet}
            progress={setTimer.progress}
            onSkip={skipSetRest}
            nextInfo={`${phase.workout.exercises[phase.exIdx].nom} — série ${phase.setIdx + 1}/${phase.workout.exercises[phase.exIdx].series.length}`}
            restDuration={restSet}
            onChangeDuration={s => { setRestSet(s); setTimer.start(s) }}
            mode="set"
          />
        </>
      )}

      {/* ── ENTER WEIGHT ──────────────────────────────────────────────── */}
      {phase.name === 'enter_weight' && (
        <>
          <TopBar workout={phase.workout} />
          <ExBar workout={phase.workout} exIdx={phase.exIdx} />
          <WeightEntry
            exercise={phase.workout.exercises[phase.exIdx]}
            exerciseIndex={phase.exIdx}
            exerciseTotal={phase.workout.exercises.length}
            doneReps={phase.doneReps[phase.exIdx]}
            onConfirm={handleWeightConfirmed}
          />
        </>
      )}

      {/* ── REST EXERCISE ─────────────────────────────────────────────── */}
      {phase.name === 'rest_exercise' && (
        <>
          <TopBar workout={phase.workout} />
          <ExBar workout={phase.workout} exIdx={phase.exIdx} />
          <RestTimer
            remaining={exTimer.remaining}
            total={restEx}
            progress={exTimer.progress}
            onSkip={skipExRest}
            nextInfo={`Prochain : ${phase.workout.exercises[phase.exIdx].nom} — ${phase.workout.exercises[phase.exIdx].series.length}×${phase.workout.exercises[phase.exIdx].series[0]?.reps} reps`}
            restDuration={restEx}
            onChangeDuration={s => { setRestEx(s); exTimer.start(s) }}
            mode="exercise"
          />
        </>
      )}

      {/* ── SUMMARY ───────────────────────────────────────────────────── */}
      {phase.name === 'summary' && (
        <SessionSummary
          completed={toCompleted(phase.workout, phase.doneReps, phase.weights)}
          duration={elapsed}
          onSave={handleSave}
          onDiscard={() => setPhase({ name: 'select' })}
        />
      )}
    </div>
  )
}

// ── Rest preset pills ─────────────────────────────────────────────────────────
function RestPresets({ value, onChange }: { value: number; onChange: (s: number) => void }) {
  const PRESETS = [30, 60, 90, 120, 180]
  const fmt = (s: number) => s < 60 ? `${s}s` : `${s / 60}min`
  return (
    <div className="flex gap-1.5">
      {PRESETS.map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            value === s
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          {fmt(s)}
        </button>
      ))}
    </div>
  )
}

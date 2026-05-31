import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { workoutStorage, programmeStorage } from '../data/storage'
import type { Workout, Exercise, Programme } from '../types'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>(() => workoutStorage.getAll())

  const addWorkout = useCallback((workout: Omit<Workout, 'id'>) => {
    const w: Workout = { ...workout, id: uuid() }
    const updated = [...workouts, w]
    workoutStorage.save(updated)
    setWorkouts(updated)
    return w
  }, [workouts])

  const updateWorkout = useCallback((id: string, data: Partial<Omit<Workout, 'id'>>) => {
    const updated = workouts.map(w => w.id === id ? { ...w, ...data } : w)
    workoutStorage.save(updated)
    setWorkouts(updated)
  }, [workouts])

  const deleteWorkout = useCallback((id: string) => {
    const updated = workouts.filter(w => w.id !== id)
    workoutStorage.save(updated)
    setWorkouts(updated)
  }, [workouts])

  const addExercise = useCallback((workoutId: string, exercise: Omit<Exercise, 'id'>) => {
    const ex: Exercise = { ...exercise, id: uuid() }
    const updated = workouts.map(w =>
      w.id === workoutId
        ? { ...w, exercises: [...w.exercises, ex] }
        : w
    )
    workoutStorage.save(updated)
    setWorkouts(updated)
  }, [workouts])

  const updateExercise = useCallback((workoutId: string, exId: string, data: Partial<Exercise>) => {
    const updated = workouts.map(w =>
      w.id === workoutId
        ? { ...w, exercises: w.exercises.map(e => e.id === exId ? { ...e, ...data } : e) }
        : w
    )
    workoutStorage.save(updated)
    setWorkouts(updated)
  }, [workouts])

  const removeExercise = useCallback((workoutId: string, exId: string) => {
    const updated = workouts.map(w =>
      w.id === workoutId
        ? { ...w, exercises: w.exercises.filter(e => e.id !== exId) }
        : w
    )
    workoutStorage.save(updated)
    setWorkouts(updated)
  }, [workouts])

  return { workouts, addWorkout, updateWorkout, deleteWorkout, addExercise, updateExercise, removeExercise }
}

export function useProgrammes() {
  const [programmes, setProgrammes] = useState<Programme[]>(() => programmeStorage.getAll())
  const [activeId, setActiveId] = useState<string | null>(() => programmeStorage.getActive())

  const addProgramme = useCallback((prog: Omit<Programme, 'id'>) => {
    const p: Programme = { ...prog, id: uuid() }
    const updated = [...programmes, p]
    programmeStorage.save(updated)
    setProgrammes(updated)
    return p
  }, [programmes])

  const updateProgramme = useCallback((id: string, data: Partial<Omit<Programme, 'id'>>) => {
    const updated = programmes.map(p => p.id === id ? { ...p, ...data } : p)
    programmeStorage.save(updated)
    setProgrammes(updated)
  }, [programmes])

  const deleteProgramme = useCallback((id: string) => {
    const updated = programmes.filter(p => p.id !== id)
    programmeStorage.save(updated)
    setProgrammes(updated)
    if (activeId === id) {
      programmeStorage.setActive(null)
      setActiveId(null)
    }
  }, [programmes, activeId])

  const setActive = useCallback((id: string | null) => {
    programmeStorage.setActive(id)
    setActiveId(id)
  }, [])

  const activeProgramme = programmes.find(p => p.id === activeId) ?? null

  return { programmes, activeProgramme, addProgramme, updateProgramme, deleteProgramme, setActive }
}

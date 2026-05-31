import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { sessionStorage } from '../data/storage'
import type { WorkoutSession, UserId } from '../types'

export function useWorkoutSessions(userId: UserId) {
  const [sessions, setSessions] = useState<WorkoutSession[]>(
    () => sessionStorage.getAll().filter(s => s.userId === userId)
  )

  const addSession = useCallback((data: Omit<WorkoutSession, 'id' | 'userId'>): WorkoutSession => {
    const s: WorkoutSession = { ...data, id: uuid(), userId }
    const all = [...sessionStorage.getAll(), s]
    sessionStorage.save(all)
    setSessions(all.filter(x => x.userId === userId))
    return s
  }, [userId])

  const updateSession = useCallback((id: string, data: Partial<Omit<WorkoutSession, 'id' | 'userId'>>) => {
    const all = sessionStorage.getAll().map(s => s.id === id ? { ...s, ...data } : s)
    sessionStorage.save(all)
    setSessions(all.filter(s => s.userId === userId))
  }, [userId])

  const deleteSession = useCallback((id: string) => {
    const all = sessionStorage.getAll().filter(s => s.id !== id)
    sessionStorage.save(all)
    setSessions(all.filter(s => s.userId === userId))
  }, [userId])

  /** All unique exercise names across sessions (for the exercise evolution chart). */
  const exerciseNames = Array.from(
    new Set(sessions.flatMap(s => s.exercises.map(e => e.nom)))
  ).sort()

  return { sessions, addSession, updateSession, deleteSession, exerciseNames }
}

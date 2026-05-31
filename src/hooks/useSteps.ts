import { useState, useCallback } from 'react'
import { stepsStorage } from '../data/storage'
import type { StepsLog, UserId } from '../types'

export function useSteps(userId: UserId) {
  const [steps, setSteps] = useState<StepsLog[]>(
    () => stepsStorage.getAll().filter(s => s.userId === userId)
  )

  const setDay = useCallback((date: string, count: number) => {
    const entry: StepsLog = { date, userId, steps: count }
    stepsStorage.upsertDay(entry)
    setSteps(stepsStorage.getAll().filter(s => s.userId === userId))
  }, [userId])

  const getDay = useCallback((date: string): number => {
    return steps.find(s => s.date === date)?.steps ?? 0
  }, [steps])

  return { steps, setDay, getDay }
}

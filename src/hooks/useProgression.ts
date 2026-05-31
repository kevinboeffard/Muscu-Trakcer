import { useState, useCallback } from 'react'
import { mesureStorage } from '../data/storage'
import type { Mesure, UserId } from '../types'
import { today } from '../utils/dateUtils'

export function useProgression(userId: UserId) {
  const [mesures, setMesures] = useState<Mesure[]>(
    () => mesureStorage.getAll(userId)
  )

  const addOrUpdateMesure = useCallback((data: Omit<Mesure, 'date'> & { date?: string }) => {
    const date = data.date ?? today()
    const existing = mesures.find(m => m.date === date)
    let updated: Mesure[]
    if (existing) {
      updated = mesures.map(m => m.date === date ? { ...m, ...data, date } : m)
    } else {
      updated = [...mesures, { ...data, date }]
    }
    mesureStorage.save(userId, updated)
    setMesures(updated)
  }, [mesures, userId])

  const deleteMesure = useCallback((date: string) => {
    const updated = mesures.filter(m => m.date !== date)
    mesureStorage.save(userId, updated)
    setMesures(updated)
  }, [mesures, userId])

  const sorted = [...mesures].sort((a, b) => a.date.localeCompare(b.date))

  return { mesures: sorted, addOrUpdateMesure, deleteMesure }
}

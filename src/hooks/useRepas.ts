import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { repasStorage, logStorage } from '../data/storage'
import type { Repas, DailyLog, UserId } from '../types'
import { today } from '../utils/dateUtils'

export function useRepas() {
  const [repasList, setRepasList] = useState<Repas[]>(() => repasStorage.getAll())

  const addRepas = useCallback((data: Omit<Repas, 'id'>): Repas => {
    const r: Repas = { ...data, id: uuid() }
    const updated = [...repasList, r]
    repasStorage.save(updated)
    setRepasList(updated)
    return r
  }, [repasList])

  const updateRepas = useCallback((id: string, data: Partial<Omit<Repas, 'id'>>) => {
    const updated = repasList.map(r => r.id === id ? { ...r, ...data } : r)
    repasStorage.save(updated)
    setRepasList(updated)
  }, [repasList])

  const deleteRepas = useCallback((id: string) => {
    const updated = repasList.filter(r => r.id !== id)
    repasStorage.save(updated)
    setRepasList(updated)
  }, [repasList])

  return { repasList, addRepas, updateRepas, deleteRepas }
}

export function useDailyLog(userId: UserId, date = today()) {
  const [log, setLog] = useState<DailyLog>(
    () => logStorage.getForDay(date, userId)
  )

  const addEntry = useCallback((repasId: string, facteur = 1) => {
    const updated: DailyLog = { ...log, repas: [...log.repas, { repasId, facteur }] }
    logStorage.upsertDay(updated)
    setLog(updated)
  }, [log])

  const removeEntry = useCallback((index: number) => {
    const updated: DailyLog = { ...log, repas: log.repas.filter((_, i) => i !== index) }
    logStorage.upsertDay(updated)
    setLog(updated)
  }, [log])

  const updateFacteur = useCallback((index: number, facteur: number) => {
    const updated: DailyLog = {
      ...log,
      repas: log.repas.map((e, i) => i === index ? { ...e, facteur } : e),
    }
    logStorage.upsertDay(updated)
    setLog(updated)
  }, [log])

  return { log, addEntry, removeEntry, updateFacteur }
}

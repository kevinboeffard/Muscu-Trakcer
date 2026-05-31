import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { alimentStorage } from '../data/storage'
import type { Aliment } from '../types'

export function useAliments() {
  const [aliments, setAliments] = useState<Aliment[]>(() => alimentStorage.getAll())

  const addAliment = useCallback((data: Omit<Aliment, 'id'>): Aliment => {
    const a: Aliment = { ...data, id: uuid() }
    const updated = [...aliments, a]
    alimentStorage.save(updated)
    setAliments(updated)
    return a
  }, [aliments])

  const updateAliment = useCallback((id: string, data: Partial<Omit<Aliment, 'id'>>) => {
    const updated = aliments.map(a => a.id === id ? { ...a, ...data } : a)
    alimentStorage.save(updated)
    setAliments(updated)
  }, [aliments])

  const deleteAliment = useCallback((id: string) => {
    const updated = aliments.filter(a => a.id !== id)
    alimentStorage.save(updated)
    setAliments(updated)
  }, [aliments])

  return { aliments, addAliment, updateAliment, deleteAliment }
}

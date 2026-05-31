import { useState, useEffect, useRef, useCallback } from 'react'

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0)
  const [total, setTotal]         = useState(0)
  const [running, setRunning]     = useState(false)
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)
  const onDoneRef                 = useRef<(() => void) | null>(null)

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  const start = useCallback((seconds: number, onDone?: () => void) => {
    clear()
    setTotal(seconds)
    setRemaining(seconds)
    setRunning(true)
    onDoneRef.current = onDone ?? null

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clear()
          setRunning(false)
          onDoneRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const skip = useCallback(() => {
    clear()
    setRunning(false)
    setRemaining(0)
    onDoneRef.current?.()
  }, [])

  const stop = useCallback(() => {
    clear()
    setRunning(false)
    setRemaining(0)
  }, [])

  useEffect(() => () => clear(), [])

  const progress = total > 0 ? (total - remaining) / total : 0

  return { remaining, running, progress, start, skip, stop }
}

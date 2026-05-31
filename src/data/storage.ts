import type { Aliment, Repas, DailyLog, Workout, Programme, Mesure, StepsLog, WorkoutSession, UserId } from '../types'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

const K = {
  aliments:   'mt_aliments',
  repas:      'mt_repas',
  dailyLogs:  'mt_daily_logs',
  workouts:   'mt_workouts',
  programmes: 'mt_programmes',
  activeProg: 'mt_active_programme',
  mesures:    (u: UserId) => `mt_mesures_${u}`,
} as const

// ── Aliments ──────────────────────────────────────────────────────────────────
export const alimentStorage = {
  getAll: (): Aliment[]           => load(K.aliments, []),
  save:   (v: Aliment[])    => save(K.aliments, v),
}

// ── Repas ─────────────────────────────────────────────────────────────────────
export const repasStorage = {
  getAll: (): Repas[]             => load(K.repas, []),
  save:   (v: Repas[])      => save(K.repas, v),
}

// ── Daily logs ────────────────────────────────────────────────────────────────
export const logStorage = {
  getAll: (): DailyLog[]         => load(K.dailyLogs, []),
  save:   (v: DailyLog[])   => save(K.dailyLogs, v),
  getForDay: (date: string, userId: UserId): DailyLog =>
    logStorage.getAll().find(l => l.date === date && l.userId === userId)
    ?? { date, userId, repas: [] },
  upsertDay: (log: DailyLog) => {
    const all = logStorage.getAll().filter(
      l => !(l.date === log.date && l.userId === log.userId)
    )
    save(K.dailyLogs, [...all, log])
  },
}

// ── Workouts ──────────────────────────────────────────────────────────────────
export const workoutStorage = {
  getAll: (): Workout[]           => load(K.workouts, []),
  save:   (v: Workout[])    => save(K.workouts, v),
}

// ── Programmes ────────────────────────────────────────────────────────────────
export const programmeStorage = {
  getAll:    (): Programme[]       => load(K.programmes, []),
  save:      (v: Programme[]) => save(K.programmes, v),
  getActive: (): string | null     => load(K.activeProg, null),
  setActive: (id: string | null)   => save(K.activeProg, id),
}

// ── Steps ─────────────────────────────────────────────────────────────────────
export const stepsStorage = {
  getAll:     (): StepsLog[]          => load('mt_steps', []),
  save:       (v: StepsLog[])    => save('mt_steps', v),
  upsertDay:  (entry: StepsLog)  => {
    const all = stepsStorage.getAll().filter(
      s => !(s.date === entry.date && s.userId === entry.userId)
    )
    save('mt_steps', [...all, entry])
  },
  getForDay: (date: string, userId: UserId): number => {
    return stepsStorage.getAll().find(s => s.date === date && s.userId === userId)?.steps ?? 0
  },
}

// ── Workout sessions ──────────────────────────────────────────────────────────
export const sessionStorage = {
  getAll: (): WorkoutSession[]           => load('mt_sessions', []),
  save:   (v: WorkoutSession[])     => save('mt_sessions', v),
}

// ── Progression ───────────────────────────────────────────────────────────────
export const mesureStorage = {
  getAll: (u: UserId): Mesure[]           => load(K.mesures(u), []),
  save:   (u: UserId, v: Mesure[])   => save(K.mesures(u), v),
}

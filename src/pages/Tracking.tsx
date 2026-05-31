import { useState, useMemo } from 'react'
import type { TrackingPeriod, UserId } from '../types'
import { useAliments } from '../hooks/useAliments'
import { useRepas } from '../hooks/useRepas'
import { useSteps } from '../hooks/useSteps'
import { useWorkoutSessions } from '../hooks/useWorkoutSessions'
import { useWorkouts } from '../hooks/useWorkouts'
import { logStorage } from '../data/storage'
import { computeDayMacros } from '../utils/macroCalc'
import { today } from '../utils/dateUtils'
import PeriodNav from '../components/tracking/PeriodNav'
import { NutritionDay, NutritionChart } from '../components/tracking/NutritionSection'
import { StepsDay, StepsChart } from '../components/tracking/StepsSection'
import { SessionsDay, SessionsList } from '../components/tracking/SessionsSection'
import ExerciseEvolution from '../components/tracking/ExerciseEvolution'
import LogSessionModal from '../components/tracking/LogSessionModal'

interface Props { loggedUserId: UserId }

// ── Date helpers ──────────────────────────────────────────────────────────────
function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d); x.setMonth(x.getMonth() + n); return x
}
function addYears(d: Date, n: number): Date {
  const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x
}

function periodLabel(period: TrackingPeriod, ref: Date): string {
  if (period === 'day')   return ref.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  if (period === 'month') return ref.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return String(ref.getFullYear())
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export default function Tracking({ loggedUserId }: Props) {
  const [period, setPeriod]     = useState<TrackingPeriod>('day')
  const [refDate, setRefDate]   = useState<Date>(new Date())
  const [showLog, setShowLog]   = useState(false)
  const [category, setCategory] = useState<'nutrition' | 'steps' | 'seances' | 'exercice'>('nutrition')

  const todayStr = today()
  const refStr   = toYMD(refDate)

  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { aliments }                                          = useAliments()
  const { repasList }                                         = useRepas()
  const { steps, setDay: setSteps }                          = useSteps(loggedUserId)
  const { sessions, addSession, deleteSession, exerciseNames } = useWorkoutSessions(loggedUserId)
  const { workouts }                                         = useWorkouts()

  // Navigation
  const nav = (dir: 1 | -1) => {
    if (period === 'day')   setRefDate(d => addDays(d, dir))
    if (period === 'month') setRefDate(d => addMonths(d, dir))
    if (period === 'year')  setRefDate(d => addYears(d, dir))
  }

  // ── DAY data ────────────────────────────────────────────────────────────────
  const dayLog      = logStorage.getForDay(refStr, loggedUserId)
  const dayMacros   = computeDayMacros(dayLog.repas, repasList, aliments)
  const daySteps    = steps.find(s => s.date === refStr)?.steps ?? 0
  const daySessions = sessions.filter(s => s.date === refStr)

  // ── MONTH data ──────────────────────────────────────────────────────────────
  const monthData = useMemo(() => {
    const y = refDate.getFullYear(), m = refDate.getMonth()
    const days = daysInMonth(y, m)
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(y, m, i + 1)
      const dStr = toYMD(d)
      const log  = logStorage.getForDay(dStr, loggedUserId)
      const mac  = computeDayMacros(log.repas, repasList, aliments)
      const stp  = steps.find(s => s.date === dStr)?.steps ?? 0
      return { label: String(i + 1), date: dStr, calories: mac.calories, proteines: mac.proteines, steps: stp }
    })
  }, [refDate, repasList, aliments, steps, loggedUserId])

  const monthSessions = sessions.filter(s => {
    const d = new Date(s.date)
    return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth()
  })

  // ── YEAR data ───────────────────────────────────────────────────────────────
  const FR_MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const yearData = useMemo(() => {
    const y = refDate.getFullYear()
    return FR_MONTHS.map((label, mi) => {
      const days = daysInMonth(y, mi)
      let totCal = 0, totProt = 0, totSteps = 0, activeDays = 0
      for (let d = 1; d <= days; d++) {
        const dStr = toYMD(new Date(y, mi, d))
        const log  = logStorage.getForDay(dStr, loggedUserId)
        const mac  = computeDayMacros(log.repas, repasList, aliments)
        const stp  = steps.find(s => s.date === dStr)?.steps ?? 0
        if (mac.calories > 0) { totCal += mac.calories; totProt += mac.proteines; activeDays++ }
        totSteps += stp
      }
      return {
        label,
        calories:  activeDays > 0 ? Math.round(totCal / activeDays) : 0,
        proteines: activeDays > 0 ? Math.round(totProt / activeDays * 10) / 10 : 0,
        steps:     totSteps,
      }
    })
  }, [refDate, repasList, aliments, steps, loggedUserId])

  const yearSessions = sessions.filter(s => new Date(s.date).getFullYear() === refDate.getFullYear())

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-white">Tracking</h1>

      <PeriodNav
        period={period}
        onPeriodChange={p => { setPeriod(p); setRefDate(new Date()) }}
        label={periodLabel(period, refDate)}
        onPrev={() => nav(-1)}
        onNext={() => nav(1)}
        canNext={refStr < todayStr || period !== 'day'}
      />

      {/* ── DAY : all cards stacked ──────────────────────────────────── */}
      {period === 'day' && (
        <>
          <NutritionDay macros={dayMacros} repasCount={dayLog.repas.length} />
          <StepsDay steps={daySteps} onSave={n => setSteps(refStr, n)} />
          <SessionsDay sessions={daySessions} onAdd={() => setShowLog(true)} onDelete={deleteSession} />
          <ExerciseEvolution sessions={sessions} exerciseNames={exerciseNames} />
        </>
      )}

      {/* ── MONTH / YEAR : category selector then single chart ───────── */}
      {(period === 'month' || period === 'year') && (
        <>
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'nutrition', label: '🥗 Nutrition' },
              { key: 'steps',     label: '👟 Pas' },
              { key: 'seances',   label: '🏋️ Séances' },
              { key: 'exercice',  label: '📊 Exercice' },
            ] as const).map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
                  ${category === c.key
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Chart panel — animated swap */}
          <div key={`${period}-${category}`} className="animate-fadein">
            {period === 'month' && category === 'nutrition' && (
              <NutritionChart
                data={monthData}
                title={`Calories & protéines — ${refDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`}
              />
            )}
            {period === 'month' && category === 'steps' && (
              <StepsChart
                data={monthData}
                title={`Pas — ${refDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`}
              />
            )}
            {period === 'month' && category === 'seances' && (
              <SessionsList
                sessions={monthSessions}
                title="Séances du mois"
                onAdd={() => setShowLog(true)}
                onDelete={deleteSession}
              />
            )}
            {period === 'month' && category === 'exercice' && (
              <ExerciseEvolution sessions={monthSessions} exerciseNames={exerciseNames} />
            )}

            {period === 'year' && category === 'nutrition' && (
              <NutritionChart
                data={yearData}
                title={`Moy. calories/protéines — ${refDate.getFullYear()}`}
              />
            )}
            {period === 'year' && category === 'steps' && (
              <StepsChart
                data={yearData}
                title={`Pas totaux — ${refDate.getFullYear()}`}
              />
            )}
            {period === 'year' && category === 'seances' && (
              <SessionsList
                sessions={yearSessions}
                title={`Séances ${refDate.getFullYear()}`}
                onAdd={() => setShowLog(true)}
                onDelete={deleteSession}
              />
            )}
            {period === 'year' && category === 'exercice' && (
              <ExerciseEvolution sessions={yearSessions} exerciseNames={exerciseNames} />
            )}
          </div>
        </>
      )}

      {/* ── Log session modal ────────────────────────────────────────── */}
      <LogSessionModal
        open={showLog}
        onClose={() => setShowLog(false)}
        workouts={workouts}
        defaultDate={period === 'day' ? refStr : todayStr}
        onSave={addSession}
      />
    </div>
  )
}

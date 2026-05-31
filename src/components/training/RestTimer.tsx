import Button from '../ui/Button'

interface Props {
  remaining: number
  total: number
  progress: number
  onSkip: () => void
  nextInfo?: string
  restDuration: number
  onChangeDuration: (s: number) => void
  mode?: 'set' | 'exercise'   // 'set' = between sets, 'exercise' = between exercises
}

const PRESETS = [30, 60, 90, 120, 180]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${s}s`
}

export default function RestTimer({ remaining, total, progress, onSkip, nextInfo, restDuration, onChangeDuration, mode = 'set' }: Props) {
  const RADIUS  = 72
  const CIRC    = 2 * Math.PI * RADIUS
  const offset  = CIRC * (1 - progress)
  const urgent  = remaining <= 10 && remaining > 0

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-gray-400 text-sm font-medium">
        {mode === 'exercise' ? '🏁 Récup inter-exercice' : '⏸ Récup inter-série'}
      </p>

      {/* Circular progress */}
      <div className="relative flex items-center justify-center">
        <svg width="176" height="176" className="-rotate-90">
          <circle cx="88" cy="88" r={RADIUS} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle
            cx="88" cy="88" r={RADIUS}
            fill="none"
            stroke={urgent ? '#f87171' : '#818cf8'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-5xl font-bold tabular-nums ${urgent ? 'text-red-400' : 'text-white'}`}>
            {fmt(remaining)}
          </span>
          <span className="text-gray-500 text-xs mt-1">/ {fmt(total)}</span>
        </div>
      </div>

      {/* Skip button */}
      <Button variant="secondary" onClick={onSkip}>
        Passer →
      </Button>

      {/* Next info */}
      {nextInfo && (
        <p className="text-gray-500 text-sm text-center px-4">{nextInfo}</p>
      )}

      {/* Duration presets */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-gray-600">Durée de récup</p>
        <div className="flex gap-2">
          {PRESETS.map(s => (
            <button
              key={s}
              onClick={() => onChangeDuration(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${restDuration === s
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                }`}
            >
              {fmt(s)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

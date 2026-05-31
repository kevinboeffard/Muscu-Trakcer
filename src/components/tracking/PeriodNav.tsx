import type { TrackingPeriod } from '../../types'

interface Props {
  period: TrackingPeriod
  onPeriodChange: (p: TrackingPeriod) => void
  label: string
  onPrev: () => void
  onNext: () => void
  canNext: boolean
}

const LABELS: Record<TrackingPeriod, string> = {
  day:   'Jour',
  month: 'Mois',
  year:  'Année',
}

export default function PeriodNav({ period, onPeriodChange, label, onPrev, onNext, canNext }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Period tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        {(['day', 'month', 'year'] as TrackingPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
              ${period === p ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {LABELS[p]}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2">
        <button
          onClick={onPrev}
          className="text-gray-400 hover:text-white text-xl px-2 transition-colors"
        >
          ‹
        </button>
        <span className="text-white font-medium text-sm capitalize">{label}</span>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="text-gray-400 hover:text-white text-xl px-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  )
}

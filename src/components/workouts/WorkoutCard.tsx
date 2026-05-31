import type { Workout } from '../../types'
import Card from '../ui/Card'
import Button from '../ui/Button'

interface Props {
  workout: Workout
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
}

export default function WorkoutCard({ workout, onEdit, onDelete, compact }: Props) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">{workout.nom}</p>
          <p className="text-sm text-gray-400">{workout.exercises.length} exercice(s)</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {onEdit   && <Button size="sm" variant="secondary" onClick={onEdit}>✏️</Button>}
          {onDelete && <Button size="sm" variant="danger"    onClick={onDelete}>🗑️</Button>}
        </div>
      </div>

      {!compact && (
        <ul className="flex flex-col gap-1 mt-1">
          {workout.exercises.map(ex => (
            <li key={ex.id} className="text-sm text-gray-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <span className="font-medium">{ex.nom}</span>
              <span className="text-gray-500">
                {ex.series.length} × {ex.series[0]?.reps ?? '?'} reps
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

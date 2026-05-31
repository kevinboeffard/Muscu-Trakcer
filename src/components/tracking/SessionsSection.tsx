import type { WorkoutSession } from '../../types'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { formatDate } from '../../utils/dateUtils'

interface DayProps {
  sessions: WorkoutSession[]
  onAdd: () => void
  onDelete: (id: string) => void
}
export function SessionsDay({ sessions, onAdd, onDelete }: DayProps) {
  return (
    <Card glass className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-300">🏋️ Séances du jour</p>
        <Button size="sm" onClick={onAdd}>+ Logger</Button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune séance ce jour.</p>
      ) : (
        sessions.map(s => <SessionRow key={s.id} session={s} onDelete={() => onDelete(s.id)} />)
      )}
    </Card>
  )
}

interface ListProps {
  sessions: WorkoutSession[]
  title: string
  onAdd: () => void
  onDelete: (id: string) => void
}
export function SessionsList({ sessions, title, onAdd, onDelete }: ListProps) {
  return (
    <Card glass className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-300">🏋️ {title}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{sessions.length} séance(s)</span>
          <Button size="sm" onClick={onAdd}>+ Logger</Button>
        </div>
      </div>
      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Aucune séance sur cette période.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {[...sessions].reverse().map(s => (
            <SessionRow key={s.id} session={s} onDelete={() => onDelete(s.id)} showDate />
          ))}
        </div>
      )}
    </Card>
  )
}

function SessionRow({ session, onDelete, showDate }: { session: WorkoutSession; onDelete: () => void; showDate?: boolean }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium text-sm truncate">{session.nom}</p>
          {showDate && <span className="text-xs text-gray-500 shrink-0">{formatDate(session.date)}</span>}
        </div>
        <p className="text-xs text-gray-400">{session.exercises.length} exercice(s)</p>
        {session.notes && <p className="text-xs text-gray-500 italic truncate">{session.notes}</p>}
      </div>
      <Button size="sm" variant="danger" onClick={onDelete}>×</Button>
    </div>
  )
}

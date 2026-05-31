import type { Repas, Aliment } from '../../types'
import { computeRepasMacros } from '../../utils/macroCalc'
import MacroBadge from '../ui/MacroBadge'
import Button from '../ui/Button'

interface Props {
  repas: Repas
  aliments: Aliment[]
  onEdit?: () => void
  onDelete?: () => void
  onAdd?: () => void
  compact?: boolean
}

export default function RepasCard({ repas, aliments, onEdit, onDelete, onAdd, compact }: Props) {
  const macros = computeRepasMacros(repas, aliments)
  const alimentMap = new Map(aliments.map(a => [a.id, a]))

  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-xl px-4 py-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">{repas.nom}</p>
          <MacroBadge macro={macros} size="sm" />
        </div>
        <div className="flex gap-1 shrink-0">
          {onAdd    && <Button size="sm" onClick={onAdd}>+ Journal</Button>}
          {onEdit   && <Button size="sm" variant="secondary" onClick={onEdit}>✏️</Button>}
          {onDelete && <Button size="sm" variant="danger"    onClick={onDelete}>🗑️</Button>}
        </div>
      </div>

      {!compact && repas.ingredients.length > 0 && (
        <ul className="flex flex-col gap-0.5 border-t border-gray-700 pt-2">
          {repas.ingredients.map((ing, i) => {
            const a = alimentMap.get(ing.alimentId)
            return a ? (
              <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>{a.nom}</span>
                <span className="text-gray-600">{ing.quantiteG} g</span>
              </li>
            ) : null
          })}
        </ul>
      )}

      {repas.notes && !compact && (
        <p className="text-xs text-gray-500 italic">{repas.notes}</p>
      )}
    </div>
  )
}

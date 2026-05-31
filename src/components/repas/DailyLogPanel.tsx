import type { DailyLog, Repas, Aliment } from '../../types'
import { computeDayMacros, computeRepasMacros } from '../../utils/macroCalc'
import MacroBadge from '../ui/MacroBadge'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface Props {
  log: DailyLog
  repasList: Repas[]
  aliments: Aliment[]
  onRemove: (index: number) => void
  onUpdateFacteur: (index: number, facteur: number) => void
}

export default function DailyLogPanel({ log, repasList, aliments, onRemove, onUpdateFacteur }: Props) {
  const repasMap = new Map(repasList.map(r => [r.id, r]))
  const total = computeDayMacros(log.repas, repasList, aliments)

  return (
    <div className="flex flex-col gap-3">
      {/* Total */}
      <Card glass className="flex flex-col gap-1">
        <p className="text-sm text-gray-400 font-medium">Total du jour</p>
        <MacroBadge macro={total} />
      </Card>

      {log.repas.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-6">
          Aucun repas enregistré aujourd'hui.
        </p>
      )}

      {log.repas.map((entry, i) => {
        const repas = repasMap.get(entry.repasId)
        if (!repas) return null
        const baseMacros = computeRepasMacros(repas, aliments)
        const scaled = {
          calories:  Math.round(baseMacros.calories  * entry.facteur),
          proteines: Math.round(baseMacros.proteines * entry.facteur * 10) / 10,
          glucides:  Math.round(baseMacros.glucides  * entry.facteur * 10) / 10,
          lipides:   Math.round(baseMacros.lipides   * entry.facteur * 10) / 10,
        }

        return (
          <Card key={i} className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{repas.nom}</p>
                <MacroBadge macro={scaled} size="sm" />
              </div>
              <Button size="sm" variant="danger" onClick={() => onRemove(i)}>×</Button>
            </div>

            {/* Facteur slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">Portion ×{entry.facteur.toFixed(1)}</span>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={entry.facteur}
                onChange={e => onUpdateFacteur(i, Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}

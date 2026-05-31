import { useState } from 'react'
import type { Aliment } from '../../types'
import MacroBadge from '../ui/MacroBadge'
import Button from '../ui/Button'
import AlimentImage from './AlimentImage'

interface Props {
  aliment: Aliment
  onEdit?: () => void
  onDelete?: () => void
  onAdd?: (grams: number) => void
  compact?: boolean
}

export default function AlimentCard({ aliment, onEdit, onDelete, onAdd, compact }: Props) {
  return (
    <div className="bg-gray-800 border border-gray-700/50 rounded-xl px-3 py-3 flex items-center gap-3">
      <AlimentImage imageUrl={aliment.imageUrl} categorie={aliment.categorie} nom={aliment.nom} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 flex-wrap">
          <p className="font-medium text-white text-sm leading-tight truncate">{aliment.nom}</p>
          {aliment.marque && <span className="text-xs text-gray-500 shrink-0">{aliment.marque}</span>}
        </div>
        <MacroBadge macro={aliment.macro} size="sm" />
        {!compact && aliment.categorie && (
          <span className="mt-1 inline-block text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
            {aliment.categorie}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 shrink-0 items-end">
        {onAdd && <AddButton onAdd={onAdd} />}
        <div className="flex gap-1">
          {onEdit   && <Button size="sm" variant="secondary" onClick={onEdit}>✏️</Button>}
          {onDelete && <Button size="sm" variant="danger"    onClick={onDelete}>🗑️</Button>}
        </div>
      </div>
    </div>
  )
}

function AddButton({ onAdd }: { onAdd: (g: number) => void }) {
  const [open, setOpen] = useState(false)
  const [g, setG] = useState('100')

  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>+ Ajouter</Button>

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus type="number" min="1" value={g}
        onChange={e => setG(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { onAdd(Number(g)); setOpen(false) } if (e.key === 'Escape') setOpen(false) }}
        className="w-14 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center"
      />
      <span className="text-xs text-gray-500">g</span>
      <Button size="sm" onClick={() => { onAdd(Number(g)); setOpen(false) }}>✓</Button>
    </div>
  )
}

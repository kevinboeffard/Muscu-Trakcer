import { useState } from 'react'
import type { Mesure } from '../../types'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { today } from '../../utils/dateUtils'

interface Props {
  initial?: Partial<Mesure>
  onSave: (data: Mesure) => void
  onCancel: () => void
}

type NumField = keyof Omit<Mesure, 'date'>

const FIELDS: { key: NumField; label: string; unit: string }[] = [
  { key: 'poids',    label: 'Poids',     unit: 'kg' },
  { key: 'poitrine', label: 'Poitrine',  unit: 'cm' },
  { key: 'taille',   label: 'Taille',    unit: 'cm' },
  { key: 'hanches',  label: 'Hanches',   unit: 'cm' },
  { key: 'brasG',    label: 'Bras G',    unit: 'cm' },
  { key: 'brasD',    label: 'Bras D',    unit: 'cm' },
  { key: 'cuisseG',  label: 'Cuisse G',  unit: 'cm' },
  { key: 'cuisseD',  label: 'Cuisse D',  unit: 'cm' },
]

export default function MesureForm({ initial, onSave, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? today())
  const [vals, setVals] = useState<Partial<Record<NumField, string>>>(
    Object.fromEntries(
      FIELDS.map(f => [f.key, initial?.[f.key] != null ? String(initial[f.key]) : ''])
    ) as Record<NumField, string>
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const mesure: Mesure = { date }
    FIELDS.forEach(f => {
      const v = vals[f.key]
      if (v !== '') mesure[f.key] = Number(v)
    })
    onSave(mesure)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(f => (
          <div key={f.key} className="relative">
            <Input
              label={`${f.label} (${f.unit})`}
              type="number"
              min="0"
              step="0.1"
              value={vals[f.key] ?? ''}
              onChange={e => setVals(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder="–"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  )
}

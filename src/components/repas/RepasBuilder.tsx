import { useState } from 'react'
import type { Repas, Aliment, RepasIngredient } from '../../types'
import { computeRepasMacros, scaleMacro } from '../../utils/macroCalc'
import Input from '../ui/Input'
import Button from '../ui/Button'
import MacroBadge from '../ui/MacroBadge'
import AlimentImage from '../aliments/AlimentImage'

interface Props {
  initial?: Partial<Repas>
  aliments: Aliment[]
  onSave: (data: Omit<Repas, 'id'>) => void
  onCancel: () => void
  onCreateAliment?: () => void
}

export default function RepasBuilder({ initial, aliments, onSave, onCancel, onCreateAliment }: Props) {
  const [nom, setNom]               = useState(initial?.nom ?? '')
  const [notes, setNotes]           = useState(initial?.notes ?? '')
  const [ingredients, setIngredients] = useState<RepasIngredient[]>(initial?.ingredients ?? [])
  const [search, setSearch]         = useState('')

  const alimentMap = new Map(aliments.map(a => [a.id, a]))
  const totalMacros = computeRepasMacros({ id: '', nom: '', ingredients }, aliments)

  const addIngredient = (alimentId: string, quantiteG: number) => {
    const idx = ingredients.findIndex(i => i.alimentId === alimentId)
    if (idx >= 0) {
      setIngredients(prev => prev.map((i, n) => n === idx ? { ...i, quantiteG: i.quantiteG + quantiteG } : i))
    } else {
      setIngredients(prev => [...prev, { alimentId, quantiteG }])
    }
    setSearch('')
  }

  const updateQuantite = (idx: number, quantiteG: number) =>
    setIngredients(prev => prev.map((i, n) => n === idx ? { ...i, quantiteG } : i))

  const removeIngredient = (idx: number) =>
    setIngredients(prev => prev.filter((_, n) => n !== idx))

  const filtered = aliments.filter(a =>
    search.length > 0 &&
    (a.nom.toLowerCase().includes(search.toLowerCase()) ||
     a.marque?.toLowerCase().includes(search.toLowerCase()) ||
     a.categorie?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ingredients.length === 0) return
    onSave({ nom, ingredients, notes: notes || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nom du repas" value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Ex : Déjeuner, Post-training…" />

      {/* Live total */}
      {ingredients.length > 0 && (
        <div className="bg-gray-900 rounded-xl px-4 py-3 flex flex-col gap-1">
          <p className="text-xs text-gray-500">Total estimé</p>
          <MacroBadge macro={totalMacros} />
        </div>
      )}

      {/* Ingredients list */}
      {ingredients.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-400 font-medium">Ingrédients</p>
          {ingredients.map((ing, idx) => {
            const aliment = alimentMap.get(ing.alimentId)
            if (!aliment) return null
            const scaled = scaleMacro(aliment.macro, ing.quantiteG)
            return (
              <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlimentImage imageUrl={aliment.imageUrl} categorie={aliment.categorie} nom={aliment.nom} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{aliment.nom}</p>
                  <p className="text-xs text-gray-500">{scaled.calories} kcal · P {scaled.proteines}g</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number" min="1" value={ing.quantiteG}
                    onChange={(e) => updateQuantite(idx, Number(e.target.value))}
                    className="w-14 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-center text-sm text-white"
                  />
                  <span className="text-xs text-gray-500">g</span>
                  <Button type="button" size="sm" variant="danger" onClick={() => removeIngredient(idx)}>×</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-400 font-medium">Ajouter un aliment</p>
        <div className="flex gap-2">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un aliment…"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
          {onCreateAliment && (
            <Button type="button" variant="secondary" size="sm" onClick={onCreateAliment}>+ Créer</Button>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
            {filtered.map(a => <AlimentRow key={a.id} aliment={a} onAdd={g => addIngredient(a.id, g)} />)}
          </div>
        )}
        {search.length > 1 && filtered.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-2">
            Aucun résultat.{' '}
            {onCreateAliment && (
              <button type="button" onClick={onCreateAliment} className="text-indigo-400 underline">
                Créer "{search}"
              </button>
            )}
          </p>
        )}
      </div>

      <Input label="Notes (optionnel)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex : repas pré-entraînement…" />

      {ingredients.length === 0 && (
        <p className="text-yellow-500 text-xs">Ajoutez au moins un aliment.</p>
      )}

      <div className="flex gap-3 justify-end pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={ingredients.length === 0}>Enregistrer</Button>
      </div>
    </form>
  )
}

function AlimentRow({ aliment, onAdd }: { aliment: Aliment; onAdd: (g: number) => void }) {
  const [g, setG] = useState('100')
  return (
    <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
      <AlimentImage imageUrl={aliment.imageUrl} categorie={aliment.categorie} nom={aliment.nom} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{aliment.nom}</p>
        <p className="text-xs text-gray-500">{aliment.macro.calories} kcal / 100g</p>
      </div>
      <input
        type="number" min="1" value={g} onChange={(e) => setG(e.target.value)}
        className="w-12 bg-gray-700 border border-gray-600 rounded px-1 py-1 text-sm text-center text-white"
      />
      <span className="text-xs text-gray-500">g</span>
      <Button type="button" size="sm" onClick={() => onAdd(Number(g))}>+</Button>
    </div>
  )
}

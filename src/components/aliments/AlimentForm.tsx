import { useState } from 'react'
import type { Aliment } from '../../types'
import { CATEGORIES_ALIMENT } from '../../types'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import BarcodeScanner from './BarcodeScanner'
import AlimentImage from './AlimentImage'
import type { OFFResult } from '../../hooks/useOpenFoodFacts'

interface Props {
  initial?: Partial<Aliment>
  onSave: (data: Omit<Aliment, 'id'>) => void
  onCancel: () => void
}

export default function AlimentForm({ initial, onSave, onCancel }: Props) {
  const [nom,       setNom]  = useState(initial?.nom       ?? '')
  const [marque,    setMar]  = useState(initial?.marque    ?? '')
  const [categorie, setCat]  = useState(initial?.categorie ?? '')
  const [imageUrl,  setImg]  = useState(initial?.imageUrl  ?? '')
  const [cal,       setCal]  = useState(String(initial?.macro?.calories  ?? ''))
  const [prot,      setProt] = useState(String(initial?.macro?.proteines ?? ''))
  const [gluc,      setGluc] = useState(String(initial?.macro?.glucides  ?? ''))
  const [lip,       setLip]  = useState(String(initial?.macro?.lipides   ?? ''))
  const [showScanner, setShowScanner] = useState(false)

  const fill = (r: OFFResult) => {
    setNom(r.nom)
    setMar(r.marque ?? '')
    setCat(r.categorie ?? '')
    setImg(r.imageUrl ?? '')
    setCal(String(r.macro.calories))
    setProt(String(r.macro.proteines))
    setGluc(String(r.macro.glucides))
    setLip(String(r.macro.lipides))
    setShowScanner(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      nom,
      marque:    marque    || undefined,
      categorie: categorie || undefined,
      imageUrl:  imageUrl  || undefined,
      macro: {
        calories:  Number(cal),
        proteines: Number(prot),
        glucides:  Number(gluc),
        lipides:   Number(lip),
      },
    })
  }

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-4">

        {/* Scanner CTA */}
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl
            border-2 border-dashed border-indigo-500/50 bg-indigo-900/20
            hover:bg-indigo-900/40 hover:border-indigo-400 transition-all group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">📷</span>
          <div className="text-left">
            <p className="text-indigo-300 font-semibold text-sm">Scanner le code-barres</p>
            <p className="text-indigo-400/60 text-xs">Remplissage auto via Open Food Facts</p>
          </div>
          {imageUrl && (
            <div className="ml-auto">
              <AlimentImage imageUrl={imageUrl} categorie={categorie} nom={nom} size="sm" />
            </div>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-600">ou manuellement</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Image preview + name row */}
        <div className="flex gap-3 items-start">
          <AlimentImage imageUrl={imageUrl || undefined} categorie={categorie || undefined} nom={nom} size="md" />
          <Input
            label="Nom de l'aliment"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            placeholder="Ex : Blanc de poulet"
            className="flex-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Marque (optionnel)" value={marque} onChange={(e) => setMar(e.target.value)} placeholder="Ex : Picard" />
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Catégorie</label>
            <select
              value={categorie}
              onChange={(e) => setCat(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
            >
              <option value="">— Aucune —</option>
              {CATEGORIES_ALIMENT.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-500 -mb-2">
          Valeurs nutritionnelles pour <strong className="text-gray-300">100 g</strong>
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Calories (kcal)" type="number" min="0"        value={cal}  onChange={(e) => setCal(e.target.value)}  required />
          <Input label="Protéines (g)"   type="number" min="0" step="0.1" value={prot} onChange={(e) => setProt(e.target.value)} required />
          <Input label="Glucides (g)"    type="number" min="0" step="0.1" value={gluc} onChange={(e) => setGluc(e.target.value)} required />
          <Input label="Lipides (g)"     type="number" min="0" step="0.1" value={lip}  onChange={(e) => setLip(e.target.value)}  required />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>

      <Modal open={showScanner} onClose={() => setShowScanner(false)} title="📷 Scanner un produit" maxWidth="max-w-md">
        <BarcodeScanner onResult={fill} onClose={() => setShowScanner(false)} />
      </Modal>
    </>
  )
}

import { useState } from 'react'
import { useAliments } from '../hooks/useAliments'
import { useRepas, useDailyLog } from '../hooks/useRepas'
import type { Aliment, Repas, UserId } from '../types'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import AlimentForm from '../components/aliments/AlimentForm'
import AlimentCard from '../components/aliments/AlimentCard'
import RepasBuilder from '../components/repas/RepasBuilder'
import RepasCard from '../components/repas/RepasCard'
import DailyLogPanel from '../components/repas/DailyLogPanel'
import { today, formatDate } from '../utils/dateUtils'

type Tab = 'journal' | 'repas' | 'aliments'

interface Props { loggedUserId: UserId }

export default function Nutrition({ loggedUserId }: Props) {
  const [tab, setTab] = useState<Tab>('journal')
  const date = today()

  const { aliments, addAliment, updateAliment, deleteAliment } = useAliments()
  const { repasList, addRepas, updateRepas, deleteRepas } = useRepas()
  const { log, addEntry, removeEntry, updateFacteur } = useDailyLog(loggedUserId, date)

  // ── Modal states ──────────────────────────────────────────────────────────
  const [showAlimentForm, setShowAlimentForm] = useState(false)
  const [editingAliment, setEditingAliment] = useState<Aliment | null>(null)
  const [showRepasBuilder, setShowRepasBuilder] = useState(false)
  const [editingRepas, setEditingRepas] = useState<Repas | null>(null)
  /** Pre-filled name when creating aliment from inside RepasBuilder */
  const [newAlimentPrefill, setNewAlimentPrefill] = useState('')

  const [searchAliment, setSearchAliment] = useState('')
  const [searchRepas, setSearchRepas]     = useState('')

  // ── When RepasBuilder asks to create a new aliment ────────────────────────
  const handleCreateAlimentFromBuilder = () => {
    setNewAlimentPrefill(searchAliment)
    setShowAlimentForm(true)
  }

  const filteredAliments = aliments.filter(a =>
    a.nom.toLowerCase().includes(searchAliment.toLowerCase()) ||
    a.marque?.toLowerCase().includes(searchAliment.toLowerCase()) ||
    a.categorie?.toLowerCase().includes(searchAliment.toLowerCase())
  )

  const filteredRepas = repasList.filter(r =>
    r.nom.toLowerCase().includes(searchRepas.toLowerCase())
  )

  const tabs: { key: Tab; label: string }[] = [
    { key: 'journal',   label: '📓 Journal' },
    { key: 'repas',     label: '🍽️ Repas' },
    { key: 'aliments',  label: '🥩 Aliments' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Nutrition</h1>
        <p className="text-gray-400 text-sm">{formatDate(date)}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
              ${tab === t.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── JOURNAL ─────────────────────────────────────────────────────── */}
      {tab === 'journal' && (
        <div className="flex flex-col gap-4">
          <DailyLogPanel
            log={log}
            repasList={repasList}
            aliments={aliments}
            onRemove={removeEntry}
            onUpdateFacteur={updateFacteur}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Ajouter un repas au journal</p>
              <Button size="sm" onClick={() => setTab('repas')}>Voir tous les repas</Button>
            </div>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-3 text-sm"
              placeholder="Rechercher un repas…"
              value={searchRepas}
              onChange={e => setSearchRepas(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              {filteredRepas.slice(0, 5).map(r => (
                <RepasCard
                  key={r.id}
                  repas={r}
                  aliments={aliments}
                  compact
                  onAdd={() => addEntry(r.id)}
                />
              ))}
              {repasList.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Créez d'abord des repas dans l'onglet <strong>Repas</strong>.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REPAS ───────────────────────────────────────────────────────── */}
      {tab === 'repas' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{repasList.length} repas enregistrés</p>
            <Button onClick={() => setShowRepasBuilder(true)}>+ Nouveau repas</Button>
          </div>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
            placeholder="Rechercher…"
            value={searchRepas}
            onChange={e => setSearchRepas(e.target.value)}
          />
          <div className="flex flex-col gap-3">
            {filteredRepas.map(r => (
              <RepasCard
                key={r.id}
                repas={r}
                aliments={aliments}
                onAdd={() => { addEntry(r.id); setTab('journal') }}
                onEdit={() => setEditingRepas(r)}
                onDelete={() => deleteRepas(r.id)}
              />
            ))}
            {filteredRepas.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-10">
                {repasList.length === 0
                  ? 'Aucun repas. Cliquez sur "+ Nouveau repas" pour commencer.'
                  : 'Aucun résultat.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ALIMENTS ────────────────────────────────────────────────────── */}
      {tab === 'aliments' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{aliments.length} aliments enregistrés</p>
            <Button onClick={() => setShowAlimentForm(true)}>+ Nouvel aliment</Button>
          </div>
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
            placeholder="Rechercher…"
            value={searchAliment}
            onChange={e => setSearchAliment(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            {filteredAliments.map(a => (
              <AlimentCard
                key={a.id}
                aliment={a}
                onEdit={() => setEditingAliment(a)}
                onDelete={() => deleteAliment(a.id)}
              />
            ))}
            {filteredAliments.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-10">
                {aliments.length === 0
                  ? 'Aucun aliment. Ajoutez-en un !'
                  : 'Aucun résultat.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* New / edit aliment */}
      <Modal
        open={showAlimentForm || !!editingAliment}
        onClose={() => { setShowAlimentForm(false); setEditingAliment(null); setNewAlimentPrefill('') }}
        title={editingAliment ? 'Modifier l\'aliment' : 'Nouvel aliment'}
      >
        <AlimentForm
          initial={editingAliment ?? (newAlimentPrefill ? { nom: newAlimentPrefill } : undefined)}
          onSave={data => {
            if (editingAliment) updateAliment(editingAliment.id, data)
            else addAliment(data)
            setShowAlimentForm(false)
            setEditingAliment(null)
            setNewAlimentPrefill('')
          }}
          onCancel={() => { setShowAlimentForm(false); setEditingAliment(null); setNewAlimentPrefill('') }}
        />
      </Modal>

      {/* New repas */}
      <Modal
        open={showRepasBuilder}
        onClose={() => setShowRepasBuilder(false)}
        title="Nouveau repas"
        maxWidth="max-w-2xl"
      >
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <RepasBuilder
            aliments={aliments}
            onSave={data => { addRepas(data); setShowRepasBuilder(false) }}
            onCancel={() => setShowRepasBuilder(false)}
            onCreateAliment={handleCreateAlimentFromBuilder}
          />
        </div>
      </Modal>

      {/* Edit repas */}
      <Modal
        open={!!editingRepas}
        onClose={() => setEditingRepas(null)}
        title="Modifier le repas"
        maxWidth="max-w-2xl"
      >
        {editingRepas && (
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <RepasBuilder
              initial={editingRepas}
              aliments={aliments}
              onSave={data => { updateRepas(editingRepas.id, data); setEditingRepas(null) }}
              onCancel={() => setEditingRepas(null)}
              onCreateAliment={handleCreateAlimentFromBuilder}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

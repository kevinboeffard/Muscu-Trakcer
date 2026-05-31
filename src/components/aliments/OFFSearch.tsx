import { useState, useRef } from 'react'
import { searchByName, type OFFResult } from '../../hooks/useOpenFoodFacts'
import Button from '../ui/Button'

interface Props {
  onResult: (r: OFFResult) => void
  onClose: () => void
}

export default function OFFSearch({ onResult, onClose }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<OFFResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setSearched(false)
    try {
      const res = await searchByName(q)
      setResults(res)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Nutella, poulet, lait… ou code-barres"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
            placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
        />
        <Button onClick={search} disabled={loading || !query.trim()}>
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : '🔍'}
        </Button>
      </div>

      <p className="text-xs text-gray-600 text-center -mt-2">
        Fonctionne avec le nom du produit ou le code-barres
      </p>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="w-6 h-6 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Recherche sur Open Food Facts…</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-gray-400 text-sm">Aucun résultat pour "{query}"</p>
          <p className="text-gray-600 text-xs mt-1">Essayez un autre nom ou créez l'aliment manuellement</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onResult(r)}
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700
                border border-gray-700 hover:border-indigo-500
                rounded-xl px-3 py-3 text-left transition-all group"
            >
              {/* Image or emoji */}
              <div className="w-12 h-12 rounded-lg bg-gray-700 shrink-0 overflow-hidden flex items-center justify-center">
                {r.imageUrl
                  ? <img src={r.imageUrl} alt={r.nom} className="w-full h-full object-contain" />
                  : <span className="text-2xl">🍽️</span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm leading-tight truncate
                  group-hover:text-indigo-300 transition-colors">
                  {r.nom}
                </p>
                {r.marque && <p className="text-gray-500 text-xs truncate">{r.marque}</p>}
                <div className="flex gap-2 mt-0.5 flex-wrap">
                  <span className="text-yellow-400 text-xs font-semibold">{r.macro.calories} kcal</span>
                  <span className="text-blue-400 text-xs">P {r.macro.proteines}g</span>
                  <span className="text-green-400 text-xs">G {r.macro.glucides}g</span>
                  <span className="text-orange-400 text-xs">L {r.macro.lipides}g</span>
                </div>
              </div>

              <span className="text-indigo-400 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">›</span>
            </button>
          ))}
        </div>
      )}

      <Button variant="ghost" className="justify-center" onClick={onClose}>Annuler</Button>
    </div>
  )
}

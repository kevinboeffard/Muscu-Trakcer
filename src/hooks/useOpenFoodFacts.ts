import type { Macro } from '../types'

export interface OFFResult {
  barcode: string
  nom: string
  marque?: string
  macro: Macro
  categorie?: string
  imageUrl?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseProduct(p: Record<string, unknown>): OFFResult | null {
  const n = (p.nutriments ?? {}) as Record<string, number>

  const kcal = n['energy-kcal_100g'] != null
    ? n['energy-kcal_100g']
    : n['energy_100g'] != null ? n['energy_100g'] / 4.184 : 0

  const macro: Macro = {
    calories:  Math.round(kcal),
    proteines: Math.round(((n['proteins_100g']     ?? 0)) * 10) / 10,
    glucides:  Math.round(((n['carbohydrates_100g'] ?? 0)) * 10) / 10,
    lipides:   Math.round(((n['fat_100g']           ?? 0)) * 10) / 10,
  }

  if (macro.calories === 0 && macro.proteines === 0) return null   // no nutrition data

  const offCat = String(p.pnns_groups_1 ?? '').toLowerCase()
  let categorie: string | undefined
  if      (offCat.includes('meat') || offCat.includes('fish'))      categorie = 'Viande & poisson'
  else if (offCat.includes('cereal') || offCat.includes('starch'))  categorie = 'Féculents'
  else if (offCat.includes('vegetable'))                             categorie = 'Légumes'
  else if (offCat.includes('fruit'))                                 categorie = 'Fruits'
  else if (offCat.includes('dairy') || offCat.includes('egg'))      categorie = 'Laitier & oeufs'
  else if (offCat.includes('fat'))                                   categorie = 'Matières grasses'
  else if (offCat.includes('beverage') || offCat.includes('drink')) categorie = 'Boissons'

  const nom = String(p.product_name_fr ?? p.product_name ?? p.generic_name ?? '').trim()
  if (!nom) return null

  return {
    barcode:  String(p.code ?? p._id ?? ''),
    nom,
    marque:   (String(p.brands ?? '')).split(',')[0]?.trim() || undefined,
    macro,
    categorie,
    imageUrl: String(p.image_front_small_url ?? p.image_small_url ?? p.image_url ?? '') || undefined,
  }
}

// ── By barcode ────────────────────────────────────────────────────────────────
export async function fetchByBarcode(barcode: string): Promise<OFFResult | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null
  return parseProduct({ ...data.product, code: barcode })
}

// ── By name search ────────────────────────────────────────────────────────────
export async function searchByName(query: string, pageSize = 8): Promise<OFFResult[]> {
  const isBarcode = /^\d{8,14}$/.test(query.trim())
  if (isBarcode) {
    const r = await fetchByBarcode(query.trim())
    return r ? [r] : []
  }

  const params = new URLSearchParams({
    search_terms:  query,
    action:        'process',
    json:          '1',
    page_size:     String(pageSize),
    fields:        'code,product_name_fr,product_name,generic_name,brands,nutriments,image_front_small_url,pnns_groups_1',
    sort_by:       'unique_scans_n',
  })
  const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.products ?? [])
    .map(parseProduct)
    .filter((r: OFFResult | null): r is OFFResult => r !== null)
}

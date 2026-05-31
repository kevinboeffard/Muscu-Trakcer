import type { Macro } from '../types'

export interface OFFResult {
  nom: string
  marque?: string
  macro: Macro
  categorie?: string
  imageUrl?: string
}

export async function fetchByBarcode(barcode: string): Promise<OFFResult | null> {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  const res  = await fetch(url, { headers: { 'User-Agent': 'MusCuTracker/1.0' } })
  if (!res.ok) return null

  const data = await res.json()
  if (data.status !== 1 || !data.product) return null

  const p = data.product
  const n = p.nutriments ?? {}

  const kcal = n['energy-kcal_100g'] != null
    ? n['energy-kcal_100g']
    : n['energy_100g'] != null ? n['energy_100g'] / 4.184 : 0

  const macro: Macro = {
    calories:  Math.round(kcal),
    proteines: Math.round((n['proteins_100g']     ?? 0) * 10) / 10,
    glucides:  Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    lipides:   Math.round((n['fat_100g']           ?? 0) * 10) / 10,
  }

  const offCat = (p.pnns_groups_1 ?? '').toLowerCase()
  let categorie: string | undefined
  if      (offCat.includes('meat') || offCat.includes('fish'))       categorie = 'Viande & poisson'
  else if (offCat.includes('cereal') || offCat.includes('starch'))   categorie = 'Féculents'
  else if (offCat.includes('vegetable'))                              categorie = 'Légumes'
  else if (offCat.includes('fruit'))                                  categorie = 'Fruits'
  else if (offCat.includes('dairy') || offCat.includes('egg'))       categorie = 'Laitier & oeufs'
  else if (offCat.includes('fat'))                                    categorie = 'Matières grasses'
  else if (offCat.includes('beverage') || offCat.includes('drink'))  categorie = 'Boissons'

  return {
    nom:      p.product_name_fr ?? p.product_name ?? p.generic_name ?? 'Produit inconnu',
    marque:   p.brands?.split(',')[0]?.trim() || undefined,
    macro,
    categorie,
    imageUrl: p.image_front_small_url ?? p.image_small_url ?? p.image_url ?? undefined,
  }
}

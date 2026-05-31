import type { Macro, Aliment, Repas, DailyLogEntry } from '../types'

export function emptyMacro(): Macro {
  return { calories: 0, proteines: 0, glucides: 0, lipides: 0 }
}

/** Scale macros proportionally (base is per 100 g). */
export function scaleMacro(macro: Macro, grams: number): Macro {
  const r = grams / 100
  return {
    calories:  Math.round(macro.calories  * r),
    proteines: Math.round(macro.proteines * r * 10) / 10,
    glucides:  Math.round(macro.glucides  * r * 10) / 10,
    lipides:   Math.round(macro.lipides   * r * 10) / 10,
  }
}

export function sumMacros(macros: Macro[]): Macro {
  return macros.reduce(
    (acc, m) => ({
      calories:  acc.calories  + m.calories,
      proteines: Math.round((acc.proteines + m.proteines) * 10) / 10,
      glucides:  Math.round((acc.glucides  + m.glucides)  * 10) / 10,
      lipides:   Math.round((acc.lipides   + m.lipides)   * 10) / 10,
    }),
    emptyMacro()
  )
}

/** Compute total macros for one Repas. */
export function computeRepasMacros(repas: Repas, aliments: Aliment[]): Macro {
  const map = new Map(aliments.map(a => [a.id, a]))
  return sumMacros(
    repas.ingredients.map(ing => {
      const a = map.get(ing.alimentId)
      return a ? scaleMacro(a.macro, ing.quantiteG) : emptyMacro()
    })
  )
}

/** Compute total macros for a daily log. */
export function computeDayMacros(
  entries: DailyLogEntry[],
  repasList: Repas[],
  aliments: Aliment[]
): Macro {
  const repasMap = new Map(repasList.map(r => [r.id, r]))
  return sumMacros(
    entries.map(e => {
      const r = repasMap.get(e.repasId)
      if (!r) return emptyMacro()
      const base = computeRepasMacros(r, aliments)
      return {
        calories:  Math.round(base.calories  * e.facteur),
        proteines: Math.round(base.proteines * e.facteur * 10) / 10,
        glucides:  Math.round(base.glucides  * e.facteur * 10) / 10,
        lipides:   Math.round(base.lipides   * e.facteur * 10) / 10,
      }
    })
  )
}

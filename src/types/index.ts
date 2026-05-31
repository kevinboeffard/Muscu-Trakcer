// ── Macros ───────────────────────────────────────────────────────────────────
export interface Macro {
  calories: number
  proteines: number
  glucides: number
  lipides: number
}

// ── Aliments (food items) ─────────────────────────────────────────────────────
/** Macros are per 100 g */
export interface Aliment {
  id: string
  nom: string
  marque?: string
  macro: Macro          // pour 100 g
  categorie?: string
  imageUrl?: string     // product photo (from Open Food Facts or custom)
}

/** Emoji placeholder by category */
export const CATEGORIE_EMOJI: Record<string, string> = {
  'Viande & poisson': '🍗',
  'Féculents':        '🍚',
  'Légumes':          '🥦',
  'Fruits':           '🍎',
  'Laitier & oeufs':  '🥛',
  'Légumineuses':     '🫘',
  'Matières grasses': '🫒',
  'Boissons':         '🥤',
  'Autre':            '🍽️',
}

// ── Repas (meals = composition of aliments) ───────────────────────────────────
export interface RepasIngredient {
  alimentId: string
  quantiteG: number     // grams
}

export interface Repas {
  id: string
  nom: string
  ingredients: RepasIngredient[]
  notes?: string
}

// ── Daily journal ─────────────────────────────────────────────────────────────
export interface DailyLogEntry {
  repasId: string
  facteur: number       // 1 = full meal, 0.5 = half…
}

export interface DailyLog {
  date: string          // 'YYYY-MM-DD'
  userId: UserId
  repas: DailyLogEntry[]
}

// ── Workouts ──────────────────────────────────────────────────────────────────
export interface Serie {
  reps: number
  poids?: number   // not set in the library, logged during training
}

export interface Exercise {
  id: string
  nom: string
  series: Serie[]
  notes?: string
}

export interface Workout {
  id: string
  nom: string
  exercises: Exercise[]
  date?: string
}

// ── Programme ─────────────────────────────────────────────────────────────────
export interface Programme {
  id: string
  nom: string
  semaine: Record<string, string>
}

// ── Tracking ──────────────────────────────────────────────────────────────────
export interface StepsLog {
  date: string    // 'YYYY-MM-DD'
  userId: UserId
  steps: number
}

/** A logged workout session (actual weights/reps performed, not a template). */
export interface WorkoutSession {
  id: string
  date: string
  userId: UserId
  nom: string
  workoutId?: string   // reference to library workout (optional)
  exercises: Exercise[]
  notes?: string
}

export type TrackingPeriod = 'day' | 'month' | 'year'

// ── Progression ───────────────────────────────────────────────────────────────
export interface Mesure {
  date: string
  poids?: number
  poitrine?: number
  taille?: number
  hanches?: number
  brasG?: number
  brasD?: number
  cuisseG?: number
  cuisseD?: number
}

// ── App ───────────────────────────────────────────────────────────────────────
export type UserId = 'kevin' | 'gabin'

export interface AppUser {
  id: UserId
  nom: string
  avatar: string
  defaultPin: string
}

export const USERS: AppUser[] = [
  { id: 'kevin', nom: 'Kevin', avatar: '💪', defaultPin: '1111' },
  { id: 'gabin', nom: 'Gabin', avatar: '🏋️', defaultPin: '2222' },
]

export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export const CATEGORIES_ALIMENT = [
  'Viande & poisson',
  'Féculents',
  'Légumes',
  'Fruits',
  'Laitier & oeufs',
  'Légumineuses',
  'Matières grasses',
  'Boissons',
  'Autre',
] as const

import type { UserId } from '../types'
import { USERS } from '../types'

const K = {
  pins:    'mt_pins',      // Record<UserId, string> — hashed PINs
  session: 'mt_session',  // UserId | null — current session (sessionStorage)
}

// ── Simple hash (djb2) — good enough for a local-only app ───────────────────
function hashPin(pin: string): string {
  let h = 5381
  for (let i = 0; i < pin.length; i++) {
    h = (h * 33) ^ pin.charCodeAt(i)
  }
  return (h >>> 0).toString(16)
}

// ── PIN storage ──────────────────────────────────────────────────────────────
function loadPins(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(K.pins) ?? '{}')
  } catch {
    return {}
  }
}

function savePins(pins: Record<string, string>) {
  localStorage.setItem(K.pins, JSON.stringify(pins))
}

/** Returns the stored hash for a user, initialising from defaultPin if absent. */
function getPinHash(userId: UserId): string {
  const pins = loadPins()
  if (pins[userId]) return pins[userId]
  // First time: hash the default PIN and persist it
  const user = USERS.find(u => u.id === userId)!
  const h = hashPin(user.defaultPin)
  savePins({ ...pins, [userId]: h })
  return h
}

// ── Public API ───────────────────────────────────────────────────────────────
export const auth = {
  /** Check if the entered PIN is correct for the given user. */
  checkPin(userId: UserId, pin: string): boolean {
    return getPinHash(userId) === hashPin(pin)
  },

  /** Change PIN for a user (requires old PIN to be correct). */
  changePin(userId: UserId, oldPin: string, newPin: string): boolean {
    if (!auth.checkPin(userId, oldPin)) return false
    const pins = loadPins()
    savePins({ ...pins, [userId]: hashPin(newPin) })
    return true
  },

  /** Open a session for a user. */
  login(userId: UserId) {
    sessionStorage.setItem(K.session, userId)
  },

  /** Close the current session. */
  logout() {
    sessionStorage.removeItem(K.session)
  },

  /** Returns the currently logged-in userId, or null. */
  current(): UserId | null {
    return (sessionStorage.getItem(K.session) as UserId | null) ?? null
  },
}

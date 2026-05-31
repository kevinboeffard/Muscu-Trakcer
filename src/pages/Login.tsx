import { useState, useRef, useEffect } from 'react'
import { USERS, type UserId } from '../types'
import { auth } from '../data/auth'

interface Props {
  onLogin: (userId: UserId) => void
}

export default function Login({ onLogin }: Props) {
  const [selected, setSelected] = useState<UserId | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selected) inputRef.current?.focus()
  }, [selected])

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError('')

    if (next.length === 4) {
      // auto-submit
      setTimeout(() => {
        if (auth.checkPin(selected!, next)) {
          auth.login(selected!)
          onLogin(selected!)
        } else {
          setShake(true)
          setError('PIN incorrect')
          setPin('')
          setTimeout(() => setShake(false), 500)
        }
      }, 120)
    }
  }

  const handleBack = () => {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  const user = USERS.find(u => u.id === selected)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 gap-10">
      {/* Logo / title */}
      <div className="text-center">
        <p className="text-5xl mb-3">🏋️</p>
        <h1 className="text-3xl font-bold text-white">Muscu Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Choisissez votre profil</p>
      </div>

      {!selected ? (
        /* ── User selection ─────────────────────────────────────────── */
        <div className="flex gap-6">
          {USERS.map(u => (
            <button
              key={u.id}
              onClick={() => setSelected(u.id)}
              className="flex flex-col items-center gap-3 bg-gray-800 hover:bg-gray-700
                border-2 border-gray-700 hover:border-indigo-500
                rounded-2xl p-8 w-36 transition-all duration-200 group"
            >
              <span className="text-5xl group-hover:scale-110 transition-transform">{u.avatar}</span>
              <span className="text-white font-semibold text-lg">{u.nom}</span>
            </button>
          ))}
        </div>
      ) : (
        /* ── PIN entry ──────────────────────────────────────────────── */
        <div className={`flex flex-col items-center gap-6 ${shake ? 'animate-shake' : ''}`}>
          {/* User indicator */}
          <button
            onClick={() => { setSelected(null); setPin(''); setError('') }}
            className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-3xl">{user?.avatar}</span>
            <span className="text-lg font-medium">{user?.nom}</span>
            <span className="text-xs ml-1 opacity-60">← changer</span>
          </button>

          {/* PIN dots */}
          <div className="flex gap-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150
                  ${i < pin.length
                    ? 'bg-indigo-500 border-indigo-500 scale-110'
                    : 'border-gray-600'
                  }`}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
              d === '' ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  onClick={() => d === '⌫' ? handleBack() : handleDigit(d)}
                  className={`w-20 h-14 rounded-xl font-semibold text-xl transition-all duration-100
                    ${d === '⌫'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'bg-gray-800 text-white hover:bg-gray-700 active:scale-95 active:bg-indigo-600'
                    }`}
                >
                  {d}
                </button>
              )
            ))}
          </div>

          {/* Hidden input for keyboard support */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '')
              if (v.length <= 4) {
                for (const ch of v.slice(pin.length)) handleDigit(ch)
              }
            }}
            className="opacity-0 absolute w-0 h-0"
            aria-label="PIN"
          />
        </div>
      )}

      <p className="text-gray-600 text-xs text-center">
        PIN par défaut : Kevin → <code>1111</code> · Gabin → <code>2222</code>
      </p>
    </div>
  )
}

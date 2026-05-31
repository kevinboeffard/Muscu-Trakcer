import { useState } from 'react'
import type { UserId } from '../../types'
import { auth } from '../../data/auth'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

interface Props {
  open: boolean
  userId: UserId
  onClose: () => void
}

export default function ChangePinModal({ open, userId, onClose }: Props) {
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const reset = () => { setOldPin(''); setNewPin(''); setConfirm(''); setError(''); setSuccess(false) }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('Le nouveau PIN doit être 4 chiffres.')
      return
    }
    if (newPin !== confirm) {
      setError('Les PINs ne correspondent pas.')
      return
    }
    const ok = auth.changePin(userId, oldPin, newPin)
    if (!ok) {
      setError('Ancien PIN incorrect.')
      return
    }
    setSuccess(true)
    setTimeout(() => { reset(); onClose() }, 1200)
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Changer mon PIN">
      {success ? (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-green-400 font-medium">PIN modifié !</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Ancien PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={oldPin}
            onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            required
          />
          <Input
            label="Nouveau PIN (4 chiffres)"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            required
          />
          <Input
            label="Confirmer le nouveau PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirm}
            onChange={e => setConfirm(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose() }}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

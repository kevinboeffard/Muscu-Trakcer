import { USERS, type UserId } from '../../types'

interface Props {
  activeUser: UserId
  onChange: (id: UserId) => void
}

export default function UserSwitch({ activeUser, onChange }: Props) {
  return (
    <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
      {USERS.map(u => (
        <button
          key={u.id}
          onClick={() => onChange(u.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${activeUser === u.id
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white'
            }`}
        >
          <span>{u.avatar}</span>
          <span>{u.nom}</span>
        </button>
      ))}
    </div>
  )
}

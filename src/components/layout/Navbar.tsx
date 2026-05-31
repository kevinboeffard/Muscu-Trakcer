import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',            label: 'Accueil',   icon: '🏠' },
  { to: '/nutrition',   label: 'Nutrition', icon: '🥗' },
  { to: '/training',    label: 'Training',  icon: '▶️' },
  { to: '/workouts',    label: 'Workouts',  icon: '🏋️' },
  { to: '/programme',   label: 'Programme', icon: '📅' },
  { to: '/tracking',    label: 'Stats',     icon: '📊' },
  { to: '/progression', label: 'Mesures',   icon: '📈' },
]

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur border-t border-gray-800
      md:static md:border-t-0 md:border-b md:border-gray-800">
      {/* Mobile: horizontal scroll */}
      <div className="flex overflow-x-auto scrollbar-none md:max-w-4xl md:mx-auto md:px-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2.5 min-w-[4rem] flex-1
               text-[10px] md:text-xs font-medium transition-colors shrink-0
               ${isActive
                 ? 'text-indigo-400 border-b-2 border-indigo-400 md:border-b-2'
                 : 'text-gray-500 hover:text-gray-300'}`
            }
          >
            <span className="text-lg leading-none">{link.icon}</span>
            <span className="leading-tight">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

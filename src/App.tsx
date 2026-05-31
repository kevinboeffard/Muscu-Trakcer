import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { auth } from './data/auth'
import type { UserId } from './types'
import { USERS } from './types'
import Navbar from './components/layout/Navbar'
import ChangePinModal from './components/layout/ChangePinModal'
import Login from './pages/Login'
import Home from './pages/Home'
import Nutrition from './pages/Nutrition'
import Workouts from './pages/Workouts'
import Programme from './pages/Programme'
import Progression from './pages/Progression'
import Tracking from './pages/Tracking'
import Training from './pages/Training'

export default function App() {
  const [userId, setUserId] = useState<UserId | null>(() => auth.current())
  const [showChangePin, setShowChangePin] = useState(false)

  if (!userId) {
    return <Login onLogin={id => setUserId(id)} />
  }

  const user = USERS.find(u => u.id === userId)!

  const handleLogout = () => {
    auth.logout()
    setUserId(null)
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <span className="text-sm font-medium text-gray-300">
            {user.avatar} <span className="text-white">{user.nom}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChangePin(true)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              🔑 PIN
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors ml-2"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/"            element={<Home     loggedUserId={userId} />} />
            <Route path="/nutrition"   element={<Nutrition loggedUserId={userId} />} />
            <Route path="/workouts"    element={<Workouts />} />
            <Route path="/programme"   element={<Programme />} />
            <Route path="/progression" element={<Progression loggedUserId={userId} />} />
            <Route path="/tracking"    element={<Tracking    loggedUserId={userId} />} />
            <Route path="/training"    element={<Training    loggedUserId={userId} />} />
          </Routes>
        </main>

        <ChangePinModal
          open={showChangePin}
          userId={userId}
          onClose={() => setShowChangePin(false)}
        />
      </div>
    </BrowserRouter>
  )
}

import { Link } from 'react-router-dom'
import { useAliments } from '../hooks/useAliments'
import { useRepas, useDailyLog } from '../hooks/useRepas'
import { useWorkouts, useProgrammes } from '../hooks/useWorkouts'
import { useProgression } from '../hooks/useProgression'
import { computeDayMacros } from '../utils/macroCalc'
import { today, formatDate } from '../utils/dateUtils'
import { USERS, JOURS, type UserId } from '../types'
import Card from '../components/ui/Card'
import MacroBadge from '../components/ui/MacroBadge'

interface Props { loggedUserId: UserId }

export default function Home({ loggedUserId }: Props) {
  const date = today()

  const { aliments }                    = useAliments()
  const { repasList }                   = useRepas()
  const { log }                         = useDailyLog(loggedUserId, date)
  const { workouts }                    = useWorkouts()
  const { activeProgramme }             = useProgrammes()
  const { mesures }                     = useProgression(loggedUserId)

  const dayMacros    = computeDayMacros(log.repas, repasList, aliments)
  const todayName    = JOURS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const todayWId     = activeProgramme?.semaine[todayName]
  const todayWorkout = workouts.find(w => w.id === todayWId)
  const latestMesure = mesures.at(-1)
  const user         = USERS.find(u => u.id === loggedUserId)!

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Salut {user.avatar} {user.nom} !</h1>
        <p className="text-gray-400 text-sm">{formatDate(date)}</p>
      </div>

      <Card glass className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 font-medium">🏋️ Séance du jour</p>
          <Link to="/programme" className="text-xs text-indigo-400 hover:underline">Voir programme →</Link>
        </div>
        {todayWorkout ? (
          <div>
            <p className="text-white font-semibold">{todayWorkout.nom}</p>
            <p className="text-sm text-gray-400">{todayWorkout.exercises.length} exercice(s) · {todayName}</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            {activeProgramme ? `Repos aujourd'hui (${todayName})` : 'Aucun programme actif'}
          </p>
        )}
      </Card>

      <Card glass className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 font-medium">🥗 Nutrition du jour</p>
          <Link to="/nutrition" className="text-xs text-indigo-400 hover:underline">Voir détail →</Link>
        </div>
        <MacroBadge macro={dayMacros} />
        <p className="text-xs text-gray-500">{log.repas.length} repas enregistrés</p>
      </Card>

      <Card glass className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400 font-medium">📈 Dernier pesée</p>
          <Link to="/progression" className="text-xs text-indigo-400 hover:underline">Voir progression →</Link>
        </div>
        {latestMesure?.poids ? (
          <p className="text-2xl font-bold text-indigo-400">
            {latestMesure.poids} <span className="text-base font-normal text-gray-400">kg</span>
          </p>
        ) : (
          <p className="text-gray-500 text-sm">Aucune mesure de poids.</p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[
          { to: '/nutrition',   icon: '🥗', label: 'Nutrition' },
          { to: '/workouts',    icon: '🏋️', label: 'Workouts' },
          { to: '/programme',   icon: '📅', label: 'Programme' },
          { to: '/progression', icon: '📈', label: 'Progression' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-medium text-white">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

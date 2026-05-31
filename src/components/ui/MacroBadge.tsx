import type { Macro } from '../../types'

interface Props { macro: Macro; size?: 'sm' | 'md' }

export default function MacroBadge({ macro, size = 'md' }: Props) {
  const base = size === 'sm' ? 'text-xs' : 'text-sm'
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-0.5 ${base}`}>
      <span className="text-yellow-400 font-semibold">{macro.calories} kcal</span>
      <span className="text-blue-400">P {macro.proteines}g</span>
      <span className="text-green-400">G {macro.glucides}g</span>
      <span className="text-orange-400">L {macro.lipides}g</span>
    </div>
  )
}

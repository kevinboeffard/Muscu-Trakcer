import { useState } from 'react'
import { CATEGORIE_EMOJI } from '../../types'

interface Props {
  imageUrl?: string
  categorie?: string
  nom?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-10 h-10 text-xl rounded-lg',
  md: 'w-14 h-14 text-2xl rounded-xl',
  lg: 'w-24 h-24 text-4xl rounded-2xl',
}

export default function AlimentImage({ imageUrl, categorie, nom, size = 'md' }: Props) {
  const [imgError, setImgError] = useState(false)
  const emoji = (categorie && CATEGORIE_EMOJI[categorie]) ?? '🍽️'
  const cls = sizeMap[size]

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={nom ?? 'aliment'}
        onError={() => setImgError(true)}
        className={`${cls} object-cover shrink-0 bg-gray-800`}
      />
    )
  }

  return (
    <div className={`${cls} bg-gray-800 flex items-center justify-center shrink-0`}>
      {emoji}
    </div>
  )
}

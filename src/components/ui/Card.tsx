import { type HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export default function Card({ glass, className = '', children, ...props }: Props) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-gray-700/50 p-4
        ${glass ? 'bg-gray-800/40 backdrop-blur-sm' : 'bg-gray-800'}
        ${className}`}
    >
      {children}
    </div>
  )
}

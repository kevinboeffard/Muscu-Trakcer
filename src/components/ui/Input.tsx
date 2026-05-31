import { type InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-gray-400">{label}</label>
      )}
      <input
        ref={ref}
        {...props}
        className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white
          placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors
          ${error ? 'border-red-500' : ''} ${className}`}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
)
Input.displayName = 'Input'
export default Input

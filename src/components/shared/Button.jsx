import React from 'react'

const variantClasses = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}

export default function Button({ variant = 'primary', children, className = '', disabled, ...props }) {
  const base = 'py-4 px-8 rounded-xl text-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variantClass = variantClasses[variant] || variantClasses.primary
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'

  return (
    <button
      {...props}
      disabled={disabled}
      className={`${base} ${variantClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  )
}

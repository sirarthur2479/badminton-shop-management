import React from 'react'

export default function SelectField({ label, value, onChange, options = [], disabled = false, placeholder = 'Select...' }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-base font-medium text-gray-700">{label}</label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full min-h-[56px] px-4 rounded-xl border text-xl
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-colors duration-150
          ${disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-white border-gray-300 text-gray-900 cursor-pointer hover:border-gray-400'
          }
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  )
}

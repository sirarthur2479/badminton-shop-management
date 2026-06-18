import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../shared/Button'

export default function KioskHome({ onStartOrder }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-8 relative">
      {/* Main content */}
      <div className="flex flex-col items-center gap-8 max-w-lg w-full text-center">
        {/* Logo / Icon */}
        <div className="text-8xl select-none">🏸</div>

        {/* Heading */}
        <h1 className="text-5xl font-bold text-gray-900 leading-tight">
          Badminton Pro Shop
        </h1>

        {/* Subtitle */}
        <p className="text-2xl text-gray-600">
          Welcome! Ready to have your racket strung?
        </p>

        {/* Main CTA */}
        <Button
          variant="primary"
          onClick={onStartOrder}
          className="w-full text-2xl py-6 mt-4 shadow-lg"
        >
          Drop Off Racket for Stringing
        </Button>

        <p className="text-lg text-gray-500">
          Our staff will have your racket ready quickly.
        </p>
      </div>

      {/* Staff link in bottom-right corner */}
      <button
        onClick={() => navigate('/staff')}
        className="absolute bottom-6 right-6 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-white/50"
      >
        Staff
      </button>
    </div>
  )
}

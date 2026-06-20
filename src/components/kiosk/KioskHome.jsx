import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function KioskHome({ onStartOrder }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 pointer-events-none" />
      {/* Decorative blurred circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8 max-w-lg w-full text-center fade-in-up">
        {/* Icon */}
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/60">
          <span className="text-5xl select-none">🏸</span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest">
            Racket Stringing
          </p>
          <h1 className="text-5xl font-bold text-white leading-tight">
            Badminton Pro Shop
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xl text-slate-400 leading-relaxed max-w-sm">
          Register your stringing order in under 2 minutes — no waiting for staff.
        </p>

        {/* CTA */}
        <button
          onClick={onStartOrder}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 active:scale-[0.98] text-white text-2xl font-bold py-6 px-8 rounded-2xl shadow-xl shadow-blue-900/50 transition-all duration-150 mt-2"
        >
          Drop Off Racket →
        </button>

        <p className="text-slate-500 text-base">
          We'll email you when your racket is ready
        </p>
      </div>

      {/* Staff link */}
      <button
        onClick={() => navigate('/staff')}
        className="absolute bottom-6 right-6 text-xs text-slate-700 hover:text-slate-500 transition-colors duration-150 px-3 py-2 rounded-lg"
      >
        Staff
      </button>
    </div>
  )
}

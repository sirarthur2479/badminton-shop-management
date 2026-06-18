import React, { useState, useEffect } from 'react'
import Button from '../shared/Button'

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDateTime(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  return {
    day: days[date.getDay()],
    date: `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  }
}

export default function StaffDashboard({ onLogout, onNavigate }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { day, date, time } = formatDateTime(now)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-500 text-sm">{day}, {date}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-mono font-semibold text-gray-800">{time}</p>
          </div>
          <Button variant="secondary" onClick={onLogout} className="py-2 px-5 text-base">
            Lock
          </Button>
        </div>
      </header>

      {/* Nav tiles */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <p className="text-gray-500 text-xl mb-4">What would you like to do?</p>
        <div className="grid grid-cols-1 gap-6 w-full max-w-md">
          <button
            onClick={() => onNavigate('orders')}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-3 transition-colors duration-150"
          >
            <span className="text-5xl">📋</span>
            <span className="text-2xl font-bold">Order Queue</span>
            <span className="text-blue-200 text-base">View and manage stringing orders</span>
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-3 transition-colors duration-150"
          >
            <span className="text-5xl">🏸</span>
            <span className="text-2xl font-bold">Inventory</span>
            <span className="text-green-200 text-base">Manage brands, models &amp; strings</span>
          </button>
        </div>
      </main>
    </div>
  )
}

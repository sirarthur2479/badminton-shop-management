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

export default function StaffDashboard({ onLogout, onNavigate, newInquiryCount = 0 }) {
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
        <p className="text-gray-400 text-base uppercase tracking-widest font-medium mb-2">Staff Dashboard</p>
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
          <button
            onClick={() => onNavigate('orders')}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 active:scale-[0.98] text-white rounded-2xl shadow-lg shadow-blue-200 p-8 flex items-center gap-6 transition-all duration-150 text-left"
          >
            <span className="text-4xl shrink-0">📋</span>
            <div>
              <p className="text-2xl font-bold">Order Queue</p>
              <p className="text-blue-200 text-sm mt-0.5">View and manage stringing orders</p>
            </div>
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] text-gray-900 rounded-2xl border border-gray-200 shadow-sm p-8 flex items-center gap-6 transition-all duration-150 text-left"
          >
            <span className="text-4xl shrink-0">🏸</span>
            <div>
              <p className="text-2xl font-bold">Inventory</p>
              <p className="text-gray-400 text-sm mt-0.5">Manage brands, models &amp; strings</p>
            </div>
          </button>
          <button
            onClick={() => onNavigate('inquiries')}
            aria-label="Inquiries"
            className="bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] text-gray-900 rounded-2xl border border-gray-200 shadow-sm p-8 flex items-center gap-6 transition-all duration-150 text-left"
          >
            <span className="text-4xl shrink-0">📨</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">Inquiries</p>
                {newInquiryCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{newInquiryCount}</span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-0.5">Shop product inquiries from customers</p>
            </div>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            aria-label="Settings"
            className="bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] text-gray-900 rounded-2xl border border-gray-200 shadow-sm p-8 flex items-center gap-6 transition-all duration-150 text-left"
          >
            <span className="text-4xl shrink-0">⚙️</span>
            <div>
              <p className="text-2xl font-bold">Settings</p>
              <p className="text-gray-400 text-sm mt-0.5">Shop name, colours &amp; contact info</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}

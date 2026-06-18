import React, { useState } from 'react'

const CORRECT_PIN = import.meta.env.VITE_STAFF_PIN || '1234'

export default function PINGate({ children }) {
  const [entered, setEntered] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  function handleDigit(d) {
    if (entered.length >= 4) return
    const next = entered + d
    setEntered(next)
    setError(false)
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        setUnlocked(true)
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => {
          setEntered('')
          setShake(false)
        }, 600)
      }
    }
  }

  function handleClear() {
    setEntered(prev => prev.slice(0, -1))
    setError(false)
  }

  function handleLock() {
    setUnlocked(false)
    setEntered('')
    setError(false)
  }

  if (unlocked) {
    return (
      <div>
        {React.cloneElement(React.Children.only(children), { onLogout: handleLock })}
      </div>
    )
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-8">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full flex flex-col items-center gap-8">
        <h2 className="text-2xl font-bold text-gray-900">Staff Access</h2>
        <p className="text-gray-500 text-lg">Enter your 4-digit PIN</p>

        {/* PIN dots */}
        <div
          className={`flex gap-4 ${shake ? 'animate-bounce' : ''}`}
          style={shake ? { animation: 'shake 0.5s ease' } : {}}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 transition-colors duration-150 ${
                i < entered.length
                  ? error
                    ? 'bg-red-500 border-red-500'
                    : 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 font-medium text-lg -mt-4">Incorrect PIN. Try again.</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {digits.map((d, i) => {
            if (d === '') return <div key={i} />
            const isBackspace = d === '⌫'
            return (
              <button
                key={i}
                onClick={isBackspace ? handleClear : () => handleDigit(d)}
                className={`
                  min-h-[64px] rounded-2xl text-2xl font-bold transition-colors duration-150
                  ${isBackspace
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    : 'bg-gray-100 hover:bg-blue-50 active:bg-blue-100 text-gray-900'
                  }
                `}
              >
                {d}
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}

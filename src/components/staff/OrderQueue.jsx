import React, { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../../supabaseClient'
import Button from '../shared/Button'

const STATUS_CYCLE = ['pending', 'in_progress', 'done', 'picked_up']

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  done: { label: 'Done', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  picked_up: { label: 'Picked Up', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OrderQueue({ onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchOrders = useCallback(async () => {
    if (!isConfigured()) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('stringing_orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function cycleStatus(order) {
    const currentIndex = STATUS_CYCLE.indexOf(order.status)
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
    setUpdatingId(order.id)
    const { error } = await supabase
      .from('stringing_orders')
      .update({ status: nextStatus })
      .eq('id', order.id)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStatus } : o))
    }
    setUpdatingId(null)
  }

  if (!isConfigured()) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow p-10 max-w-md w-full text-center">
          <p className="text-xl font-semibold text-red-600 mb-2">Supabase Not Configured</p>
          <p className="text-gray-500">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800 text-xl font-medium">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Order Queue</h1>
        </div>
        <Button variant="secondary" onClick={fetchOrders} className="py-2 px-5 text-base">
          Refresh
        </Button>
      </header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {loading && (
          <div className="text-center py-16 text-gray-400 text-xl">Loading orders...</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-lg">
            Error: {error}
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-xl">No orders yet.</div>
        )}
        <div className="flex flex-col gap-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const isUpdating = updatingId === order.id
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{order.customer_name}</h3>
                    {order.customer_phone && (
                      <p className="text-gray-500 text-sm">{order.customer_phone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => cycleStatus(order)}
                    disabled={isUpdating}
                    className={`
                      shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150
                      ${cfg.bg} ${cfg.text} ${cfg.border}
                      ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:opacity-80 cursor-pointer active:scale-95'}
                    `}
                  >
                    {isUpdating ? '...' : cfg.label}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-base text-gray-700">
                  <div>
                    <span className="text-gray-400 text-sm">Racket: </span>
                    {order.racket_brand_name} {order.racket_model_name}
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">String: </span>
                    {order.string_brand_name} {order.string_model_name}
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Tension: </span>
                    {order.tension_lbs} lbs
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Date: </span>
                    {formatDate(order.created_at)}
                  </div>
                </div>
                {order.notes && (
                  <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                    Note: {order.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

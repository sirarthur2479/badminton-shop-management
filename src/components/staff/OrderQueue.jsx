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
  const [togglingPaidId, setTogglingPaidId] = useState(null)

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
      if (nextStatus === 'done' && order.customer_email) {
        supabase.functions.invoke('send-order-notification', {
          body: { order, type: 'order_done' },
        })
      }
    }
    setUpdatingId(null)
  }

  async function togglePaid(order) {
    const nextPaid = !order.paid
    setTogglingPaidId(order.id)
    const { error } = await supabase
      .from('stringing_orders')
      .update({ paid: nextPaid })
      .eq('id', order.id)
    if (!error) {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, paid: nextPaid } : o))
    }
    setTogglingPaidId(null)
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
            const isTogglingPaid = togglingPaidId === order.id
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 transition-shadow hover:shadow-md">
                {/* Top row: customer + badges */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      {order.customer_email && (
                        <span className="text-xs text-blue-400" title={`Email: ${order.customer_email}`}>✉</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 truncate">{order.customer_name}</h3>
                    {order.customer_phone && (
                      <p className="text-gray-400 text-sm">{order.customer_phone}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => cycleStatus(order)}
                      disabled={isUpdating}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-150 min-w-[100px] text-center
                        ${cfg.bg} ${cfg.text} ${cfg.border}
                        ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:opacity-80 cursor-pointer active:scale-95'}
                      `}
                    >
                      {isUpdating ? '···' : cfg.label}
                    </button>
                    <button
                      onClick={() => togglePaid(order)}
                      disabled={isTogglingPaid}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all duration-150 min-w-[100px] text-center
                        ${order.paid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-gray-50 text-gray-400 border-gray-200'}
                        ${isTogglingPaid ? 'opacity-50 cursor-wait' : 'hover:opacity-80 cursor-pointer active:scale-95'}
                      `}
                    >
                      {isTogglingPaid ? '···' : order.paid ? '✓ Paid' : 'Unpaid'}
                    </button>
                  </div>
                </div>

                {/* Order details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Racket</span>
                    <span className="text-gray-800 font-medium">{order.racket_brand_name} {order.racket_model_name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">String</span>
                    <span className="text-gray-800 font-medium">{order.string_brand_name} {order.string_model_name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Tension</span>
                    <span className="text-gray-800 font-medium">{order.tension_lbs} lbs</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Received</span>
                    <span className="text-gray-800 font-medium">{formatDate(order.created_at)}</span>
                  </div>
                </div>

                {order.notes && (
                  <p className="mt-3 text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    📝 {order.notes}
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

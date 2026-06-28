import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, isConfigured } from '../../supabaseClient'
import Button from '../shared/Button'

const STATUS_CYCLE = ['pending', 'in_progress', 'done', 'picked_up']

const STATUS_CONFIG = {
  pending:    { label: 'Pending',     bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  in_progress:{ label: 'In Progress', bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300'   },
  done:       { label: 'Done',        bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300'  },
  picked_up:  { label: 'Picked Up',   bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300'   },
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function shortId(id) { return id.slice(-8).toUpperCase() }

function fieldClass(base = '') {
  return `w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${base}`
}

function matchesSearch(order, q) {
  if (!q) return true
  const s = q.toUpperCase().replace(/\s/g, '')
  return (
    shortId(order.id).includes(s) ||
    (order.customer_name  || '').toUpperCase().includes(q.toUpperCase()) ||
    (order.customer_phone || '').replace(/\s/g, '').includes(s)
  )
}

// ── Shared edit panel ────────────────────────────────────────────────────────

function EditPanel({ order, editDraft, setEditDraft, savingEdit, editError, onSave, onCancel }) {
  function draft(field) {
    return e => setEditDraft(d => ({ ...d, [field]: e.target.value }))
  }
  return (
    <div
      data-testid={`edit-panel-${order.id}`}
      className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex flex-col gap-4"
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edit Order</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Customer Name *</label>
          <input value={editDraft.customer_name} onChange={draft('customer_name')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Phone</label>
          <input type="tel" value={editDraft.customer_phone} onChange={draft('customer_phone')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-gray-500">Email</label>
          <input type="email" value={editDraft.customer_email} onChange={draft('customer_email')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Racket Brand</label>
          <input value={editDraft.racket_brand_name} onChange={draft('racket_brand_name')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Racket Model</label>
          <input value={editDraft.racket_model_name} onChange={draft('racket_model_name')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">String Brand</label>
          <input value={editDraft.string_brand_name} onChange={draft('string_brand_name')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">String Model</label>
          <input value={editDraft.string_model_name} onChange={draft('string_model_name')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Tension (lbs)</label>
          <input type="number" min={15} max={35} value={editDraft.tension_lbs} onChange={draft('tension_lbs')} className={fieldClass()} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-gray-500">Notes</label>
          <textarea rows={2} value={editDraft.notes} onChange={draft('notes')} className={fieldClass('resize-none')} />
        </div>
      </div>
      {editError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={savingEdit} className="py-2 px-4 text-sm">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={savingEdit || !editDraft.customer_name?.trim()}
          className="py-2 px-4 text-sm"
        >
          {savingEdit ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

// ── Desktop table row ────────────────────────────────────────────────────────

function DesktopRow({ order, expanded, onToggle, onCycleStatus, onTogglePaid, isUpdating, isTogglingPaid, editDraft, setEditDraft, savingEdit, editError, onSave, onCancel }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const sid = shortId(order.id)

  return (
    <>
      <div
        data-testid="order-row"
        onClick={() => onToggle(order.id)}
        className="grid cursor-pointer hover:bg-blue-50 transition-colors"
        style={{ gridTemplateColumns: '80px 1fr 2fr 130px 80px 80px', alignItems: 'center' }}
      >
        <div className="px-3 py-3">
          <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">#{sid}</span>
        </div>

        <div className="px-2 py-3 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{order.customer_name}</p>
          {order.customer_phone && (
            <p className="text-xs text-gray-400 truncate">{order.customer_phone}</p>
          )}
        </div>

        <div className="px-2 py-3 min-w-0">
          <p className="text-xs text-gray-700 truncate">
            {order.racket_brand_name} {order.racket_model_name} · {order.string_brand_name} {order.string_model_name} · {order.tension_lbs} lbs
          </p>
        </div>

        <div className="px-2 py-3">
          <button
            data-testid="status-badge"
            onClick={e => { e.stopPropagation(); onCycleStatus(order) }}
            disabled={isUpdating}
            className={`
              px-3 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 w-full text-center
              ${cfg.bg} ${cfg.text} ${cfg.border}
              ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:opacity-80 cursor-pointer active:scale-95'}
            `}
          >
            {isUpdating ? '···' : cfg.label}
          </button>
        </div>

        <div className="px-2 py-3">
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>

        <div className="px-2 py-3">
          <button
            data-testid="paid-badge"
            onClick={e => { e.stopPropagation(); onTogglePaid(order) }}
            disabled={isTogglingPaid}
            className={`
              px-2 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 w-full text-center
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

      {expanded && (
        <EditPanel
          order={order}
          editDraft={editDraft}
          setEditDraft={setEditDraft}
          savingEdit={savingEdit}
          editError={editError}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </>
  )
}

// ── Mobile card ──────────────────────────────────────────────────────────────

function MobileCard({ order, expanded, onToggle, onCycleStatus, onTogglePaid, isUpdating, isTogglingPaid, editDraft, setEditDraft, savingEdit, editError, onSave, onCancel }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const sid = shortId(order.id)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-mono font-bold tracking-wider text-gray-400">#{sid}</span>
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
              onClick={e => { e.stopPropagation(); onCycleStatus(order) }}
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
              onClick={e => { e.stopPropagation(); onTogglePaid(order) }}
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

        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onToggle(order.id)}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium px-2 py-1 rounded"
          >
            {expanded ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {expanded && (
        <EditPanel
          order={order}
          editDraft={editDraft}
          setEditDraft={setEditDraft}
          savingEdit={savingEdit}
          editError={editError}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderQueue({ onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [togglingPaidId, setTogglingPaidId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [statusFilter, setStatusFilter] = useState('all')

  const [expandedId, setExpandedId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState(null)

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

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const statusCounts = useMemo(() => {
    const counts = {}
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })
    return counts
  }, [orders])

  const filteredOrders = useMemo(
    () => orders.filter(o =>
      matchesSearch(o, searchQuery) &&
      (statusFilter === 'all' || o.status === statusFilter)
    ),
    [orders, searchQuery, statusFilter]
  )

  function toggleExpanded(id) {
    if (expandedId === id) {
      setExpandedId(null)
      setEditDraft({})
      setEditError(null)
    } else {
      const order = orders.find(o => o.id === id)
      setExpandedId(id)
      setEditError(null)
      setEditDraft({
        customer_name:     order.customer_name || '',
        customer_phone:    order.customer_phone || '',
        customer_email:    order.customer_email || '',
        racket_brand_name: order.racket_brand_name || '',
        racket_model_name: order.racket_model_name || '',
        string_brand_name: order.string_brand_name || '',
        string_model_name: order.string_model_name || '',
        tension_lbs:       order.tension_lbs ?? 27,
        notes:             order.notes || '',
      })
    }
  }

  function cancelEdit() { setExpandedId(null); setEditDraft({}); setEditError(null) }

  async function cycleStatus(order) {
    const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(order.status) + 1) % STATUS_CYCLE.length]
    setUpdatingId(order.id)
    const { error } = await supabase.from('stringing_orders').update({ status: nextStatus }).eq('id', order.id)
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
    const { error } = await supabase.from('stringing_orders').update({ paid: nextPaid }).eq('id', order.id)
    if (!error) setOrders(prev => prev.map(o => o.id === order.id ? { ...o, paid: nextPaid } : o))
    setTogglingPaidId(null)
  }

  async function saveEdit() {
    if (!editDraft.customer_name?.trim()) return
    setSavingEdit(true)
    setEditError(null)
    const { error } = await supabase
      .from('stringing_orders')
      .update({
        customer_name:     editDraft.customer_name.trim(),
        customer_phone:    editDraft.customer_phone.trim() || null,
        customer_email:    editDraft.customer_email.trim() || null,
        racket_brand_name: editDraft.racket_brand_name.trim(),
        racket_model_name: editDraft.racket_model_name.trim(),
        string_brand_name: editDraft.string_brand_name.trim(),
        string_model_name: editDraft.string_model_name.trim(),
        tension_lbs:       Number(editDraft.tension_lbs),
        notes:             editDraft.notes.trim() || null,
      })
      .eq('id', expandedId)
    if (error) {
      setEditError(error.message)
      setSavingEdit(false)
    } else {
      const normalized = {
        customer_name:     editDraft.customer_name.trim(),
        customer_phone:    editDraft.customer_phone.trim() || null,
        customer_email:    editDraft.customer_email.trim() || null,
        racket_brand_name: editDraft.racket_brand_name.trim(),
        racket_model_name: editDraft.racket_model_name.trim(),
        string_brand_name: editDraft.string_brand_name.trim(),
        string_model_name: editDraft.string_model_name.trim(),
        tension_lbs:       Number(editDraft.tension_lbs),
        notes:             editDraft.notes.trim() || null,
      }
      setOrders(prev => prev.map(o => o.id === expandedId ? { ...o, ...normalized } : o))
      setSavingEdit(false)
      cancelEdit()
    }
  }

  function rowProps(order) {
    return {
      order,
      expanded: expandedId === order.id,
      onToggle: toggleExpanded,
      onCycleStatus: cycleStatus,
      onTogglePaid: togglePaid,
      isUpdating: updatingId === order.id,
      isTogglingPaid: togglingPaidId === order.id,
      editDraft: expandedId === order.id ? editDraft : {},
      setEditDraft,
      savingEdit,
      editError,
      onSave: saveEdit,
      onCancel: cancelEdit,
    }
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

      {/* Search bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg select-none">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, name, or phone…"
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="max-w-5xl mx-auto mt-1.5 text-xs text-gray-400 pl-1">
            {filteredOrders.length === 0
              ? 'No orders match'
              : `${filteredOrders.length} order${filteredOrders.length === 1 ? '' : 's'} found`}
          </p>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto pb-0.5">
          {[
            { key: 'all',         label: 'All' },
            { key: 'pending',     label: 'Pending' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'done',        label: 'Done' },
            { key: 'picked_up',   label: 'Picked Up' },
          ].map(f => {
            const count = f.key === 'all' ? orders.length : (statusCounts[f.key] || 0)
            const active = statusFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <main className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full">
        {loading && <div className="text-center py-16 text-gray-400 text-xl">Loading orders...</div>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-lg">
            Error: {error}
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-xl">No orders yet.</div>
        )}
        {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-xl">No orders match "{searchQuery}".</div>
        )}

        {/* Desktop table — hidden on mobile via CSS */}
        <div
          data-testid="desktop-table"
          className="hidden sm:block border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white"
        >
          <div
            className="grid bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide"
            style={{ gridTemplateColumns: '80px 1fr 2fr 130px 80px 80px' }}
          >
            <div className="px-3 py-2">ID</div>
            <div className="px-2 py-2">Customer</div>
            <div className="px-2 py-2">Job</div>
            <div className="px-2 py-2">Status</div>
            <div className="px-2 py-2">Date</div>
            <div className="px-2 py-2">Paid</div>
          </div>

          {filteredOrders.map(order => (
            <DesktopRow key={order.id} {...rowProps(order)} />
          ))}
        </div>

        {/* Mobile cards — hidden on desktop via CSS */}
        <div className="sm:hidden flex flex-col gap-4">
          {filteredOrders.map(order => (
            <MobileCard key={order.id} {...rowProps(order)} />
          ))}
        </div>
      </main>
    </div>
  )
}

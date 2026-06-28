import React, { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../../supabaseClient'
import Button from '../shared/Button'
import ShopProductsTab from './ShopProductsTab'

const TABS = [
  { key: 'racket_brands', label: 'Racket Brands', parentKey: null },
  { key: 'racket_models', label: 'Racket Models', parentKey: 'racket_brands', parentLabel: 'Brand', fkField: 'brand_id' },
  { key: 'string_brands', label: 'String Brands', parentKey: null },
  { key: 'string_models', label: 'String Models', parentKey: 'string_brands', parentLabel: 'Brand', fkField: 'brand_id' },
  { key: 'shop', label: 'Shop Products', parentKey: null },
]

export default function InventoryManager({ onBack }) {
  const [activeTab, setActiveTab] = useState('racket_brands')
  const tab = TABS.find(t => t.key === activeTab)

  if (!isConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-xl text-red-600">Supabase not configured. Add env vars.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-blue-600 text-lg font-medium">← Back</button>
        <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-4 py-2 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {activeTab === 'shop' ? <ShopProductsTab /> : <TableEditor tab={tab} />}
      </div>
    </div>
  )
}

function TableEditor({ tab }) {
  const [rows, setRows] = useState([])
  const [parents, setParents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [addingNew, setAddingNew] = useState(false)
  const [newValues, setNewValues] = useState({})
  const [saving, setSaving] = useState(false)

  const extraFields = tab.key === 'racket_models' || tab.key === 'string_models'
  const isStringModel = tab.key === 'string_models'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let select = 'id, name'
    if (tab.fkField) select += `, ${tab.fkField}`
    if (extraFields) select += ', stock_qty, price'
    if (isStringModel) select += ', tension_min_lbs, tension_max_lbs'

    const { data, error: err } = await supabase.from(tab.key).select(select).order('name')
    if (err) setError(err.message)
    else setRows(data || [])
    setLoading(false)
  }, [tab.key])

  useEffect(() => {
    load()
    setAddingNew(false)
    setEditingId(null)
  }, [load])

  useEffect(() => {
    if (!tab.parentKey) { setParents([]); return }
    supabase.from(tab.parentKey).select('id, name').order('name').then(({ data }) => setParents(data || []))
  }, [tab.parentKey])

  async function handleSave(id) {
    setSaving(true)
    const { error: err } = await supabase.from(tab.key).update(editValues).eq('id', id)
    if (!err) { setEditingId(null); load() }
    else setError(err.message)
    setSaving(false)
  }

  async function handleAdd() {
    setSaving(true)
    const { error: err } = await supabase.from(tab.key).insert(newValues)
    if (!err) { setAddingNew(false); setNewValues({}); load() }
    else setError(err.message)
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return
    const { error: err } = await supabase.from(tab.key).delete().eq('id', id)
    if (!err) load()
    else setError(err.message)
  }

  function startEdit(row) {
    setEditingId(row.id)
    setEditValues({ ...row })
  }

  const emptyNew = { name: '', ...(tab.fkField ? { [tab.fkField]: '' } : {}), ...(extraFields ? { stock_qty: 0, price: '' } : {}), ...(isStringModel ? { tension_min_lbs: '', tension_max_lbs: '' } : {}) }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      {/* Add button */}
      {!addingNew && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => { setAddingNew(true); setNewValues(emptyNew) }} className="py-3 px-6 text-base">
            + Add {tab.label.replace(/s$/, '')}
          </Button>
        </div>
      )}

      {/* Add form */}
      {addingNew && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-blue-900">New {tab.label.replace(/s$/, '')}</h3>
          <RowFields
            values={newValues}
            onChange={setNewValues}
            tab={tab}
            parents={parents}
            extraFields={extraFields}
            isStringModel={isStringModel}
          />
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleAdd} disabled={saving || !newValues.name} className="py-2 px-5 text-base">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setAddingNew(false)} className="py-2 px-5 text-base">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-400 text-center py-8">Loading...</p>}

      {/* Rows */}
      {!loading && rows.map(row => (
        <div key={row.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {editingId === row.id ? (
            <div className="flex flex-col gap-3">
              <RowFields
                values={editValues}
                onChange={setEditValues}
                tab={tab}
                parents={parents}
                extraFields={extraFields}
                isStringModel={isStringModel}
              />
              <div className="flex gap-3">
                <Button variant="primary" onClick={() => handleSave(row.id)} disabled={saving} className="py-2 px-5 text-base">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="secondary" onClick={() => setEditingId(null)} className="py-2 px-5 text-base">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900 text-lg">{row.name}</p>
                {tab.fkField && <p className="text-sm text-gray-500">{parents.find(p => p.id === row[tab.fkField])?.name || '—'}</p>}
                <div className="flex gap-4 text-sm text-gray-500">
                  {extraFields && <span>Stock: {row.stock_qty ?? 0}</span>}
                  {extraFields && row.price && <span>NZD ${Number(row.price).toFixed(2)}</span>}
                  {isStringModel && row.tension_min_lbs && (
                    <span>Tension: {row.tension_min_lbs}–{row.tension_max_lbs} lbs</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startEdit(row)}
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {!loading && rows.length === 0 && !addingNew && (
        <p className="text-center text-gray-400 py-8">No items yet. Add one above.</p>
      )}
    </div>
  )
}

function RowFields({ values, onChange, tab, parents, extraFields, isStringModel }) {
  const set = (field) => (e) => onChange(prev => ({ ...prev, [field]: e.target.value }))
  const inputClass = 'w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tab.fkField && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">{tab.parentLabel}</label>
          <select value={values[tab.fkField] || ''} onChange={set(tab.fkField)} className={inputClass}>
            <option value="">Select...</option>
            {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">Name</label>
        <input type="text" value={values.name || ''} onChange={set('name')} className={inputClass} placeholder="Name" />
      </div>
      {extraFields && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Stock Qty</label>
            <input type="number" min={0} value={values.stock_qty ?? ''} onChange={set('stock_qty')} className={inputClass} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Price ($)</label>
            <input type="number" min={0} step="0.01" value={values.price ?? ''} onChange={set('price')} className={inputClass} placeholder="0.00" />
          </div>
        </>
      )}
      {isStringModel && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Min Tension (lbs)</label>
            <input type="number" min={10} max={35} value={values.tension_min_lbs ?? ''} onChange={set('tension_min_lbs')} className={inputClass} placeholder="20" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Max Tension (lbs)</label>
            <input type="number" min={10} max={35} value={values.tension_max_lbs ?? ''} onChange={set('tension_max_lbs')} className={inputClass} placeholder="30" />
          </div>
        </>
      )}
    </div>
  )
}

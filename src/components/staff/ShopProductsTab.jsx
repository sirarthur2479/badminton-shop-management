import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import Button from '../shared/Button'
import BarcodeScanner from './BarcodeScanner'
import { parseCSV, mapRow } from './csvImport'

const CATEGORIES = ['racket', 'string', 'shoe', 'bag', 'grip', 'shuttle', 'other']

function emptyProduct() {
  return { name: '', category: 'racket', price: '', description: '', image_url: '', visible: true }
}

const inputClass = 'w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function ShopProductsTab() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [draft, setDraft] = useState({})
  const [adding, setAdding] = useState(false)
  const [addDraft, setAddDraft] = useState(emptyProduct())
  const [saving, setSaving] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [importSummary, setImportSummary] = useState(null)
  const csvInputRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('shop_products')
      .select('*')
      .order('category')
      .order('name')
    if (err) setError(err.message)
    else setProducts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(product) {
    setExpandedId(product.id)
    setDraft({ ...product })
  }

  function cancelEdit() {
    setExpandedId(null)
    setDraft({})
  }

  async function handleSave() {
    setSaving(true)
    const { id, created_at, ...fields } = draft
    const { error: err } = await supabase
      .from('shop_products')
      .update({ ...fields, price: Number(fields.price) || null })
      .eq('id', expandedId)
    if (!err) { setExpandedId(null); load() }
    else setError(err.message)
    setSaving(false)
  }

  async function handleAdd() {
    setSaving(true)
    const { error: err } = await supabase
      .from('shop_products')
      .insert([{ ...addDraft, price: Number(addDraft.price) || null }])
    if (!err) { setAdding(false); setAddDraft(emptyProduct()); setScannerOpen(false); load() }
    else setError(err.message)
    setSaving(false)
  }

  async function handleToggleVisible(product) {
    const nextVisible = !product.visible
    const { error: err } = await supabase
      .from('shop_products')
      .update({ visible: nextVisible })
      .eq('id', product.id)
    if (err) { setError(err.message); return }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, visible: nextVisible } : p))
    if (expandedId === product.id) setDraft(prev => ({ ...prev, visible: nextVisible }))
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    const { error: err } = await supabase.from('shop_products').delete().eq('id', id)
    if (!err) { setExpandedId(null); load() }
    else setError(err.message)
  }

  async function handleCSVUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const text = await file.text()
    const rawRows = parseCSV(text)
    const valid = rawRows.map(mapRow).filter(Boolean)
    const skipped = rawRows.length - valid.length
    if (valid.length > 0) {
      const { error: err } = await supabase.from('shop_products').insert(valid)
      if (err) { setError(err.message); return }
      await load()
    }
    setImportSummary({ imported: valid.length, skipped })
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      {!adding && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Import CSV
          </button>
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          <Button variant="primary" onClick={() => { setAdding(true); setAddDraft(emptyProduct()) }} className="py-3 px-6 text-base">
            + Add Product
          </Button>
        </div>
      )}

      {adding && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-blue-900">New Product</h3>
          <div className="flex flex-col gap-2">
            {!scannerOpen && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setScannerOpen(true)}
                className="py-2 px-4 text-sm self-start"
              >
                Scan Barcode
              </Button>
            )}
            {scannerOpen && (
              <BarcodeScanner
                onResult={info => {
                  setAddDraft(d => ({ ...d, ...info }))
                  setScannerOpen(false)
                }}
                onCancel={() => setScannerOpen(false)}
              />
            )}
          </div>
          <ProductFields values={addDraft} onChange={setAddDraft} />
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleAdd} disabled={saving || !addDraft.name} className="py-2 px-5 text-base">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => { setAdding(false); setScannerOpen(false) }} className="py-2 px-5 text-base">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-400 text-center py-8">Loading...</p>}

      {!loading && products.length === 0 && !adding && (
        <p className="text-center text-gray-400 py-8">No products yet. Add one above.</p>
      )}

      {!loading && products.map(product => (
        <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Row */}
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => expandedId === product.id ? cancelEdit() : startEdit(product)}
          >
            <Thumbnail url={product.image_url} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{product.name}</p>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{product.category}</span>
            </div>
            <p className="text-sm text-gray-700 shrink-0">
              {product.price != null ? `NZD $${Number(product.price).toFixed(2)}` : '—'}
            </p>
            <input
              type="checkbox"
              checked={product.visible}
              onChange={() => handleToggleVisible(product)}
              onClick={e => e.stopPropagation()}
              aria-label="Visible"
              className="w-5 h-5 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Expanded edit */}
          {expandedId === product.id && (
            <div className="border-t px-4 pb-4 pt-3 flex flex-col gap-3 bg-gray-50">
              <ProductFields values={draft} onChange={setDraft} />
              <div className="flex gap-3">
                <Button variant="primary" onClick={handleSave} disabled={saving || !draft.name} className="py-2 px-5 text-base">
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="secondary" onClick={cancelEdit} className="py-2 px-5 text-base">
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => handleDelete(product.id)} className="py-2 px-5 text-base ml-auto">
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Thumbnail({ url }) {
  if (url) {
    return <img src={url} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
  }
  return (
    <div
      data-testid="img-placeholder"
      className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-lg shrink-0"
    >
      🏸
    </div>
  )
}

function ProductFields({ values, onChange }) {
  const set = field => e => onChange(prev => ({ ...prev, [field]: e.target.value }))
  const setCheck = field => e => onChange(prev => ({ ...prev, [field]: e.target.checked }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-name">Name *</label>
        <input id="field-name" type="text" value={values.name || ''} onChange={set('name')} className={inputClass} placeholder="Product name" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-category">Category</label>
        <select id="field-category" value={values.category || 'racket'} onChange={set('category')} className={inputClass}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-price">Price (NZD)</label>
        <input id="field-price" type="number" min={0} step="0.01" value={values.price ?? ''} onChange={set('price')} className={inputClass} placeholder="0.00" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-image_url">Image URL</label>
        <input id="field-image_url" type="text" value={values.image_url || ''} onChange={set('image_url')} className={inputClass} placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-description">Description</label>
        <textarea id="field-description" value={values.description || ''} onChange={set('description')} className={`${inputClass} h-20 resize-none`} placeholder="Optional description" />
      </div>
      <div className="flex items-center gap-2">
        <input id="field-visible" type="checkbox" checked={values.visible ?? true} onChange={setCheck('visible')} className="w-5 h-5 accent-blue-600" />
        <label className="text-sm font-medium text-gray-600" htmlFor="field-visible">Visible on shop page</label>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import Button from '../shared/Button'
import BarcodeScanner from './BarcodeScanner'
import { parseCSV, mapRow } from './csvImport'
import { isSaleActive } from '../../lib/saleUtils'
import ImageUpload from './ImageUpload'

const CATEGORIES = ['racket', 'string', 'shoe', 'bag', 'grip', 'shuttle', 'other']

const CSV_TEMPLATE = 'name,price,category,description,image_url\nYonex Astrox 99,299,racket,,\n'
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`

function emptyProduct() {
  return { name: '', category: 'racket', price: '', description: '', image_url: '', visible: true }
}

const inputClass = 'w-full min-h-[48px] px-4 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

// Coerce empty-string numeric/date fields to null so Postgres doesn't reject them.
// sale_ends_at is stored as end-of-day local time so a NZ shop's "today" expiry
// doesn't cut off mid-afternoon due to UTC midnight.
function coerceSaleFields(fields) {
  const salePrice = fields.sale_price !== '' && fields.sale_price != null
    ? Number(fields.sale_price) : null
  let saleEndsAt = fields.sale_ends_at || null
  if (saleEndsAt && !saleEndsAt.includes('T')) {
    saleEndsAt = `${saleEndsAt}T23:59:59`
  }
  return { ...fields, sale_price: salePrice, sale_ends_at: saleEndsAt }
}

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
  const [saleFilter, setSaleFilter] = useState(false)
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
      .update(coerceSaleFields({ ...fields, price: Number(fields.price) || null }))
      .eq('id', expandedId)
    if (!err) { setExpandedId(null); load() }
    else setError(err.message)
    setSaving(false)
  }

  async function handleAdd() {
    setSaving(true)
    const { error: err } = await supabase
      .from('shop_products')
      .insert([coerceSaleFields({ ...addDraft, price: Number(addDraft.price) || null })])
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

      {importSummary && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
          <span>
            {importSummary.imported === 1 ? '1 product imported' : `${importSummary.imported} products imported`}
            {importSummary.skipped > 0 && `. ${importSummary.skipped} ${importSummary.skipped === 1 ? 'row' : 'rows'} skipped (empty name).`}
          </span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setImportSummary(null)}
            className="text-green-600 hover:text-green-800 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {!adding && (
        <div className="flex justify-end gap-3">
          <a
            href={TEMPLATE_HREF}
            download="shop-products-template.csv"
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-base font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Download template
          </a>
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

      {!loading && products.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSaleFilter(false)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!saleFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSaleFilter(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${saleFilter ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            On Sale
          </button>
        </div>
      )}

      {loading && <p className="text-gray-400 text-center py-8">Loading...</p>}

      {!loading && products.length === 0 && !adding && (
        <p className="text-center text-gray-400 py-8">No products yet. Add one above.</p>
      )}

      {!loading && (saleFilter ? products.filter(isSaleActive) : products).map(product => (
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
        <label className="text-sm font-medium text-gray-600">Product Image</label>
        <ImageUpload value={values.image_url || ''} onChange={url => onChange(prev => ({ ...prev, image_url: url }))} />
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-description">Description</label>
        <textarea id="field-description" value={values.description || ''} onChange={set('description')} className={`${inputClass} h-20 resize-none`} placeholder="Optional description" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-sale_price">Sale Price (NZD) — leave blank for no sale</label>
        <input id="field-sale_price" type="number" min={0} step="0.01" value={values.sale_price ?? ''} onChange={set('sale_price')} className={inputClass} placeholder="e.g. 249.00" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600" htmlFor="field-sale_ends_at">Sale Ends (optional)</label>
        <input id="field-sale_ends_at" type="date" value={values.sale_ends_at ? values.sale_ends_at.slice(0, 10) : ''} onChange={set('sale_ends_at')} className={inputClass} />
      </div>
      <div className="flex items-center gap-2">
        <input id="field-visible" type="checkbox" checked={values.visible ?? true} onChange={setCheck('visible')} className="w-5 h-5 accent-blue-600" />
        <label className="text-sm font-medium text-gray-600" htmlFor="field-visible">Visible on shop page</label>
      </div>
    </div>
  )
}

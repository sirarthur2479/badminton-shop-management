import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import Button from '../shared/Button'

const ACCENT_COLOURS = [
  { value: 'green',  label: 'Green',  cls: 'bg-green-600' },
  { value: 'navy',   label: 'Navy',   cls: 'bg-blue-900' },
  { value: 'orange', label: 'Orange', cls: 'bg-orange-500' },
  { value: 'purple', label: 'Purple', cls: 'bg-purple-600' },
  { value: 'red',    label: 'Red',    cls: 'bg-red-600' },
]

const EMPTY = {
  shop_name: '',
  tagline: '',
  phone: '',
  email: '',
  accent_colour: 'green',
  about: '',
}

export default function ShopSettingsTab() {
  const [form, setForm] = useState(EMPTY)
  const [rowId, setRowId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('shop_settings').select('*').single()
      .then(({ data }) => {
        if (data) {
          setRowId(data.id)
          setForm({
            shop_name:     data.shop_name     ?? '',
            tagline:       data.tagline       ?? '',
            phone:         data.phone         ?? '',
            email:         data.email         ?? '',
            accent_colour: data.accent_colour ?? 'green',
            about:         data.about         ?? '',
          })
        }
      })
  }, [])

  function field(name) {
    return { value: form[name], onChange: e => setForm(f => ({ ...f, [name]: e.target.value })) }
  }

  async function save() {
    if (!form.shop_name.trim()) { setError('Shop name is required.'); return }
    setError(null)
    setSaving(true)
    const payload = rowId ? { id: rowId, ...form } : form
    const { error: dbErr } = await supabase.from('shop_settings').upsert(payload, { onConflict: 'id' })
    setSaving(false)
    if (dbErr) { setError(dbErr.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Shop Settings</h2>

      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Shop Name</span>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" {...field('shop_name')} aria-label="Shop Name" />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Tagline</span>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" {...field('tagline')} aria-label="Tagline" />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Phone / WhatsApp</span>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="tel" {...field('phone')} aria-label="Phone" />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Contact Email</span>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="email" {...field('email')} aria-label="Email" />
        </label>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Accent Colour</span>
          <div className="flex gap-3">
            {ACCENT_COLOURS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                aria-label={c.label}
                onClick={() => setForm(f => ({ ...f, accent_colour: c.value }))}
                className={`w-8 h-8 rounded-full ${c.cls} ${form.accent_colour === c.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
              />
            ))}
          </div>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">About</span>
          <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" {...field('about')} aria-label="About" />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700 font-medium">Settings saved!</p>}

      <Button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </Button>
    </div>
  )
}

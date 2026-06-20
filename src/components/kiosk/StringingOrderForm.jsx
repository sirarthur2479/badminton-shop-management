import React, { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../../supabaseClient'
import Button from '../shared/Button'
import SelectField from '../shared/SelectField'

function StepIndicator({ current }) {
  const labels = ['Racket', 'String', 'Your Info', 'Confirm']
  return (
    <div className="flex items-center justify-center mb-8 px-2">
      {labels.map((label, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200
                ${isDone
                  ? 'bg-green-500 text-white'
                  : isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                  : 'bg-gray-100 text-gray-400'}
              `}>
                {isDone ? '✓' : step}
              </div>
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-blue-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 rounded mx-2 mb-5 transition-colors duration-300 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function StringingOrderForm({ onComplete }) {
  const [step, setStep] = useState(1)
  const [slideDir, setSlideDir] = useState('right')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [confirmedOrderId, setConfirmedOrderId] = useState(null)

  // Step 1: Racket
  const [racketBrands, setRacketBrands] = useState([])
  const [racketModels, setRacketModels] = useState([])
  const [racketBrandId, setRacketBrandId] = useState('')
  const [racketModelId, setRacketModelId] = useState('')
  const [loadingRacketBrands, setLoadingRacketBrands] = useState(false)
  const [loadingRacketModels, setLoadingRacketModels] = useState(false)

  // Step 2: String
  const [stringBrands, setStringBrands] = useState([])
  const [stringModels, setStringModels] = useState([])
  const [stringBrandId, setStringBrandId] = useState('')
  const [stringModelId, setStringModelId] = useState('')
  const [tension, setTension] = useState(27)
  const [loadingStringBrands, setLoadingStringBrands] = useState(false)
  const [loadingStringModels, setLoadingStringModels] = useState(false)
  const [selectedStringModel, setSelectedStringModel] = useState(null)

  // Step 3: Customer
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')

  const [fetchError, setFetchError] = useState(null)

  function forward(n) { setSlideDir('right'); setStep(n) }
  function back(n)    { setSlideDir('left');  setStep(n) }

  if (!isConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-8">
        <div className="bg-white rounded-2xl shadow p-10 max-w-md w-full text-center">
          <p className="text-2xl font-semibold text-red-600 mb-3">Supabase Not Configured</p>
          <p className="text-gray-600 text-lg">
            Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables to use this app.
          </p>
        </div>
      </div>
    )
  }

  // Load racket brands on mount
  useEffect(() => {
    async function load() {
      setLoadingRacketBrands(true)
      setFetchError(null)
      const { data, error } = await supabase.from('racket_brands').select('id, name').order('name')
      if (error) setFetchError(error.message)
      else setRacketBrands(data || [])
      setLoadingRacketBrands(false)
    }
    load()
  }, [])

  // Load racket models when brand changes
  useEffect(() => {
    if (!racketBrandId) { setRacketModels([]); setRacketModelId(''); return }
    async function load() {
      setLoadingRacketModels(true)
      const { data, error } = await supabase
        .from('racket_models')
        .select('id, name')
        .eq('brand_id', racketBrandId)
        .order('name')
      if (!error) setRacketModels(data || [])
      setRacketModelId('')
      setLoadingRacketModels(false)
    }
    load()
  }, [racketBrandId])

  // Load string brands when step 2 reached
  useEffect(() => {
    if (step < 2 || stringBrands.length > 0) return
    async function load() {
      setLoadingStringBrands(true)
      const { data, error } = await supabase.from('string_brands').select('id, name').order('name')
      if (!error) setStringBrands(data || [])
      setLoadingStringBrands(false)
    }
    load()
  }, [step])

  // Load string models when brand changes
  useEffect(() => {
    if (!stringBrandId) { setStringModels([]); setStringModelId(''); setSelectedStringModel(null); return }
    async function load() {
      setLoadingStringModels(true)
      const { data, error } = await supabase
        .from('string_models')
        .select('id, name, tension_min_lbs, tension_max_lbs')
        .eq('brand_id', stringBrandId)
        .order('name')
      if (!error) setStringModels(data || [])
      setStringModelId('')
      setSelectedStringModel(null)
      setLoadingStringModels(false)
    }
    load()
  }, [stringBrandId])

  // Set default tension when string model changes
  useEffect(() => {
    if (!stringModelId) { setSelectedStringModel(null); return }
    const model = stringModels.find(m => m.id === stringModelId)
    setSelectedStringModel(model || null)
    if (model) {
      setTension(Math.round(((model.tension_min_lbs || 20) + (model.tension_max_lbs || 30)) / 2))
    }
  }, [stringModelId])

  function getRacketBrandName() { return racketBrands.find(b => b.id === racketBrandId)?.name || '' }
  function getRacketModelName() { return racketModels.find(m => m.id === racketModelId)?.name || '' }
  function getStringBrandName() { return stringBrands.find(b => b.id === stringBrandId)?.name || '' }
  function getStringModelName() { return stringModels.find(m => m.id === stringModelId)?.name || '' }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    const payload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || null,
      customer_email: customerEmail.trim() || null,
      racket_brand_id: racketBrandId || null,
      racket_model_id: racketModelId || null,
      racket_brand_name: getRacketBrandName(),
      racket_model_name: getRacketModelName(),
      string_brand_id: stringBrandId || null,
      string_model_id: stringModelId || null,
      string_brand_name: getStringBrandName(),
      string_model_name: getStringModelName(),
      tension_lbs: tension,
      notes: notes.trim() || null,
      status: 'pending',
    }
    const { data, error } = await supabase.from('stringing_orders').insert([payload]).select('id').single()
    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
    } else {
      if (payload.customer_email) {
        supabase.functions.invoke('send-order-notification', {
          body: { order: { ...payload, id: data.id }, type: 'order_created' },
        })
      }
      setConfirmedOrderId(data.id)
      setSubmitting(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (confirmedOrderId) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-8">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center scale-in">
          {/* Animated checkmark */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-gray-400 text-base mb-7">Your racket is in good hands.</p>

          {/* Order ID */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-5">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-widest mb-2">Your Order ID</p>
            <p className="text-4xl font-mono font-bold text-blue-700">
              #{confirmedOrderId.slice(-8).toUpperCase()}
            </p>
          </div>

          {customerEmail ? (
            <p className="text-sm text-green-600 font-medium mb-6">
              ✓ Confirmation sent to {customerEmail}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-6">
              Quote this ID when picking up your racket.
            </p>
          )}

          <Button variant="primary" onClick={onComplete} className="w-full">
            Start New Order
          </Button>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const inputClass = 'w-full min-h-[56px] px-4 rounded-xl border border-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-8">
      <div className="max-w-xl w-full mx-auto flex flex-col flex-1">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Stringing Order</h2>
        <StepIndicator current={step} />

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-base">
            Error loading data: {fetchError}
          </div>
        )}

        <div key={step} className={`flex flex-col flex-1 ${slideDir === 'right' ? 'slide-in-right' : 'slide-in-left'}`}>

          {/* ── Step 1: Racket ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6 flex-1">
              <h3 className="text-2xl font-semibold text-gray-800">Select Your Racket</h3>
              <SelectField
                label="Racket Brand"
                value={racketBrandId}
                onChange={e => setRacketBrandId(e.target.value)}
                options={racketBrands}
                placeholder={loadingRacketBrands ? 'Loading...' : 'Select brand...'}
                disabled={loadingRacketBrands}
              />
              <SelectField
                label="Racket Model"
                value={racketModelId}
                onChange={e => setRacketModelId(e.target.value)}
                options={racketModels}
                placeholder={loadingRacketModels ? 'Loading...' : !racketBrandId ? 'Select brand first' : 'Select model...'}
                disabled={!racketBrandId || loadingRacketModels}
              />
              <div className="mt-auto pt-6">
                <Button
                  variant="primary"
                  onClick={() => forward(2)}
                  disabled={!racketBrandId || !racketModelId}
                  className="w-full"
                >
                  Next: Choose String →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: String ── */}
          {step === 2 && (
            <div className="flex flex-col gap-6 flex-1">
              <h3 className="text-2xl font-semibold text-gray-800">Select String &amp; Tension</h3>
              <SelectField
                label="String Brand"
                value={stringBrandId}
                onChange={e => setStringBrandId(e.target.value)}
                options={stringBrands}
                placeholder={loadingStringBrands ? 'Loading...' : 'Select brand...'}
                disabled={loadingStringBrands}
              />
              <SelectField
                label="String Model"
                value={stringModelId}
                onChange={e => setStringModelId(e.target.value)}
                options={stringModels}
                placeholder={loadingStringModels ? 'Loading...' : !stringBrandId ? 'Select brand first' : 'Select model...'}
                disabled={!stringBrandId || loadingStringModels}
              />
              <div className="flex flex-col gap-1">
                <label className="text-base font-medium text-gray-700">
                  Tension (lbs)
                  {selectedStringModel?.tension_min_lbs && (
                    <span className="ml-2 text-sm text-blue-500 font-normal">
                      Recommended: {selectedStringModel.tension_min_lbs}–{selectedStringModel.tension_max_lbs} lbs
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min={15}
                  max={35}
                  value={tension}
                  onChange={e => setTension(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div className="mt-auto pt-6 flex gap-3">
                <Button variant="secondary" onClick={() => back(1)} className="flex-1">← Back</Button>
                <Button
                  variant="primary"
                  onClick={() => forward(3)}
                  disabled={!stringBrandId || !stringModelId}
                  className="flex-1"
                >
                  Next: Your Info →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Customer Info ── */}
          {step === 3 && (
            <div className="flex flex-col gap-5 flex-1">
              <h3 className="text-2xl font-semibold text-gray-800">Your Information</h3>
              <div className="flex flex-col gap-1">
                <label className="text-base font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-base font-medium text-gray-700">Phone (optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="021 000 0000"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-base font-medium text-gray-700">
                  Email (optional)
                  <span className="ml-2 text-sm text-blue-500 font-normal">— we'll notify you when ready</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-base font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                />
              </div>
              <div className="mt-auto pt-6 flex gap-3">
                <Button variant="secondary" onClick={() => back(2)} className="flex-1">← Back</Button>
                <Button
                  variant="primary"
                  onClick={() => forward(4)}
                  disabled={!customerName.trim()}
                  className="flex-1"
                >
                  Review Order →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirm ── */}
          {step === 4 && (
            <div className="flex flex-col gap-4 flex-1">
              <h3 className="text-2xl font-semibold text-gray-800">Confirm Your Order</h3>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                <SummaryRow label="Racket" value={`${getRacketBrandName()} ${getRacketModelName()}`} />
                <SummaryRow label="String" value={`${getStringBrandName()} ${getStringModelName()}`} />
                <SummaryRow label="Tension" value={`${tension} lbs`} />
                <SummaryRow label="Name" value={customerName} />
                {customerPhone && <SummaryRow label="Phone" value={customerPhone} />}
                {customerEmail && <SummaryRow label="Email" value={customerEmail} />}
                {notes && <SummaryRow label="Notes" value={notes} />}
              </div>
              {customerEmail && (
                <p className="text-sm text-blue-600 flex items-center gap-1.5">
                  <span>✉</span> Confirmation email will be sent to {customerEmail}
                </p>
              )}
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-base">
                  Error submitting order: {submitError}
                </div>
              )}
              <div className="mt-auto pt-6 flex gap-3">
                <Button variant="secondary" onClick={() => back(3)} className="flex-1" disabled={submitting}>
                  ← Back
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit Order'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-start px-5 py-4 gap-4">
      <span className="text-gray-400 text-base font-medium shrink-0">{label}</span>
      <span className="text-gray-900 text-base text-right font-medium">{value}</span>
    </div>
  )
}

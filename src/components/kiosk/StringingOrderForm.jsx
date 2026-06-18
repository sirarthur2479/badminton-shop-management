import React, { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../../supabaseClient'
import Button from '../shared/Button'
import SelectField from '../shared/SelectField'

const TOTAL_STEPS = 4

function StepIndicator({ current }) {
  const labels = ['Racket', 'String', 'Your Info', 'Confirm']
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {labels.map((label, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                  ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {isDone ? '✓' : step}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-1 rounded mb-5 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function StringingOrderForm({ onComplete }) {
  const [step, setStep] = useState(1)
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

  // Error state
  const [fetchError, setFetchError] = useState(null)

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
    if (!racketBrandId) {
      setRacketModels([])
      setRacketModelId('')
      return
    }
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
    if (step < 2) return
    async function load() {
      setLoadingStringBrands(true)
      const { data, error } = await supabase.from('string_brands').select('id, name').order('name')
      if (!error) setStringBrands(data || [])
      setLoadingStringBrands(false)
    }
    if (stringBrands.length === 0) load()
  }, [step])

  // Load string models when brand changes
  useEffect(() => {
    if (!stringBrandId) {
      setStringModels([])
      setStringModelId('')
      setSelectedStringModel(null)
      return
    }
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

  // Update selectedStringModel when model changes
  useEffect(() => {
    if (!stringModelId) {
      setSelectedStringModel(null)
      return
    }
    const model = stringModels.find(m => m.id === stringModelId)
    setSelectedStringModel(model || null)
    if (model) {
      const mid = Math.round(((model.tension_min_lbs || 20) + (model.tension_max_lbs || 30)) / 2)
      setTension(mid)
    }
  }, [stringModelId])

  function getRacketBrandName() {
    return racketBrands.find(b => b.id === racketBrandId)?.name || ''
  }
  function getRacketModelName() {
    return racketModels.find(m => m.id === racketModelId)?.name || ''
  }
  function getStringBrandName() {
    return stringBrands.find(b => b.id === stringBrandId)?.name || ''
  }
  function getStringModelName() {
    return stringModels.find(m => m.id === stringModelId)?.name || ''
  }

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
      setConfirmedOrderId(data.id)
      setSubmitting(false)
    }
  }

  // Success screen
  if (confirmedOrderId) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-8">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-7xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Submitted!</h2>
          <p className="text-gray-600 text-xl mb-2">Your order ID is:</p>
          <p className="text-3xl font-mono font-bold text-blue-600 mb-6">
            #{confirmedOrderId.slice(-8).toUpperCase()}
          </p>
          <p className="text-gray-500 text-lg mb-8">
            Please hand your racket to a staff member and mention this order ID.
          </p>
          <Button variant="primary" onClick={onComplete} className="w-full">
            Start New Order
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-8">
      <div className="max-w-xl w-full mx-auto flex flex-col flex-1">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Stringing Order</h2>
        <StepIndicator current={step} />

        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-lg">
            Error loading data: {fetchError}
          </div>
        )}

        {/* Step 1: Racket */}
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
                onClick={() => setStep(2)}
                disabled={!racketBrandId || !racketModelId}
                className="w-full"
              >
                Next: Choose String
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: String */}
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
                {selectedStringModel && selectedStringModel.tension_min_lbs && (
                  <span className="ml-2 text-sm text-blue-600 font-normal">
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
                className="w-full min-h-[56px] px-4 rounded-xl border border-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-auto pt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                disabled={!stringBrandId || !stringModelId}
                className="flex-1"
              >
                Next: Your Info
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Customer Info */}
        {step === 3 && (
          <div className="flex flex-col gap-6 flex-1">
            <h3 className="text-2xl font-semibold text-gray-800">Your Information</h3>
            <div className="flex flex-col gap-1">
              <label className="text-base font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Your full name"
                className="w-full min-h-[56px] px-4 rounded-xl border border-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-base font-medium text-gray-700">Phone (optional)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Your phone number"
                className="w-full min-h-[56px] px-4 rounded-xl border border-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-base font-medium text-gray-700">Email (optional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full min-h-[56px] px-4 rounded-xl border border-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-base font-medium text-gray-700">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special requests..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="mt-auto pt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(4)}
                disabled={!customerName.trim()}
                className="flex-1"
              >
                Review Order
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="flex flex-col gap-4 flex-1">
            <h3 className="text-2xl font-semibold text-gray-800">Confirm Your Order</h3>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              <SummaryRow label="Racket" value={`${getRacketBrandName()} ${getRacketModelName()}`} />
              <SummaryRow label="String" value={`${getStringBrandName()} ${getStringModelName()}`} />
              <SummaryRow label="Tension" value={`${tension} lbs`} />
              <SummaryRow label="Name" value={customerName} />
              {customerPhone && <SummaryRow label="Phone" value={customerPhone} />}
              {customerEmail && <SummaryRow label="Email" value={customerEmail} />}
              {notes && <SummaryRow label="Notes" value={notes} />}
            </div>
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-lg">
                Error submitting order: {submitError}
              </div>
            )}
            <div className="mt-auto pt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(3)} className="flex-1" disabled={submitting}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Submitting...' : 'Submit Order'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-start px-5 py-4 gap-4">
      <span className="text-gray-500 text-lg font-medium shrink-0">{label}</span>
      <span className="text-gray-900 text-lg text-right">{value}</span>
    </div>
  )
}

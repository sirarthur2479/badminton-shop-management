import React, { useState, useRef, useEffect } from 'react'
import Button from '../shared/Button'

async function lookupBarcode(upc) {
  const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`)
  if (!res.ok) throw new Error('Lookup failed')
  const json = await res.json()
  const item = json.items?.[0]
  if (!item) return null
  return {
    name: item.title || '',
    description: item.description || '',
    image_url: item.images?.[0] || '',
  }
}

const inputClass = 'w-full min-h-[44px] px-4 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function BarcodeScanner({ onResult }) {
  const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window
  const [showScanner, setShowScanner] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  async function startCamera() {
    setShowScanner(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'upc_a', 'upc_e'] })
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue
          stopCamera()
          setShowScanner(false)
          await handleLookup(raw)
        } else {
          rafRef.current = requestAnimationFrame(scan)
        }
      }
      rafRef.current = requestAnimationFrame(scan)
    } catch (err) {
      setError('Camera error: ' + err.message)
      setShowScanner(false)
    }
  }

  async function handleLookup(upc) {
    setLoading(true)
    setNotFound(false)
    setError(null)
    try {
      const info = await lookupBarcode(upc)
      if (info) {
        onResult(info)
      } else {
        setNotFound(true)
      }
    } catch {
      setError('Lookup failed — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!barcode.trim()) return
    await handleLookup(barcode.trim())
  }

  return (
    <div className="flex flex-col gap-2">
      {hasNativeDetector ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={showScanner ? () => { stopCamera(); setShowScanner(false) } : startCamera}
            className="py-2 px-4 text-sm"
          >
            {showScanner ? 'Cancel scan' : 'Scan Barcode'}
          </Button>
          {showScanner && (
            <video ref={videoRef} className="w-full rounded-xl" playsInline muted />
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="Enter barcode number…"
            className={inputClass}
            disabled={loading}
          />
          <Button type="submit" variant="secondary" disabled={loading || !barcode.trim()} className="py-2 px-4 text-sm shrink-0">
            {loading ? 'Looking up…' : 'Look up'}
          </Button>
        </form>
      )}

      <p className="text-xs text-gray-400">UPC Item DB free tier: 100 lookups/day</p>

      {notFound && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Barcode not found — fill in manually
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}

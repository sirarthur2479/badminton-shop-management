import React, { useState } from 'react'
import StringingOrderForm from '../components/kiosk/StringingOrderForm'

export default function KioskPage() {
  const [formKey, setFormKey] = useState(0)
  return <StringingOrderForm key={formKey} onComplete={() => setFormKey(k => k + 1)} />
}

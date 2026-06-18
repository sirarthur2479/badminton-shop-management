import React, { useState } from 'react'
import KioskHome from '../components/kiosk/KioskHome'
import StringingOrderForm from '../components/kiosk/StringingOrderForm'

export default function KioskPage() {
  const [showForm, setShowForm] = useState(false)

  return showForm
    ? <StringingOrderForm onComplete={() => setShowForm(false)} />
    : <KioskHome onStartOrder={() => setShowForm(true)} />
}

import React, { useState } from 'react'
import PINGate from '../components/staff/PINGate'
import StaffDashboard from '../components/staff/StaffDashboard'
import OrderQueue from '../components/staff/OrderQueue'
import InventoryManager from '../components/staff/InventoryManager'

function StaffContent({ onLogout }) {
  const [view, setView] = useState('dashboard') // 'dashboard' | 'orders' | 'inventory'

  function handleNavigate(dest) {
    setView(dest === 'orders' ? 'orders' : 'inventory')
  }

  function handleBack() {
    setView('dashboard')
  }

  if (view === 'orders') {
    return <OrderQueue onBack={handleBack} />
  }
  if (view === 'inventory') {
    return <InventoryManager onBack={handleBack} />
  }
  return <StaffDashboard onLogout={onLogout} onNavigate={handleNavigate} />
}

export default function StaffPage() {
  return (
    <PINGate>
      <StaffContent />
    </PINGate>
  )
}

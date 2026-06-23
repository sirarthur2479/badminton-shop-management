import React, { useState, useEffect } from 'react'
import PINGate from '../components/staff/PINGate'
import StaffDashboard from '../components/staff/StaffDashboard'
import OrderQueue from '../components/staff/OrderQueue'
import InventoryManager from '../components/staff/InventoryManager'
import ShopSettingsTab from '../components/staff/ShopSettingsTab'
import InquiriesTab from '../components/staff/InquiriesTab'
import { supabase } from '../supabaseClient'

function StaffContent({ onLogout }) {
  const [view, setView] = useState('dashboard')
  const [newInquiryCount, setNewInquiryCount] = useState(0)

  useEffect(() => {
    async function loadCount() {
      const { count } = await supabase
        .from('shop_inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new')
      setNewInquiryCount(count || 0)
    }
    loadCount()
  }, [])

  function handleNavigate(dest) {
    if (dest === 'orders') setView('orders')
    else if (dest === 'settings') setView('settings')
    else if (dest === 'inquiries') setView('inquiries')
    else setView('inventory')
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
  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
          <button onClick={handleBack} className="text-blue-600 text-lg font-medium">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Shop Settings</h1>
        </div>
        <ShopSettingsTab />
      </div>
    )
  }
  if (view === 'inquiries') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
          <button onClick={handleBack} className="text-blue-600 text-lg font-medium">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Inquiries</h1>
        </div>
        <InquiriesTab onNewCountChange={setNewInquiryCount} />
      </div>
    )
  }
  return <StaffDashboard onLogout={onLogout} onNavigate={handleNavigate} newInquiryCount={newInquiryCount} />
}

export default function StaffPage() {
  return (
    <PINGate>
      <StaffContent />
    </PINGate>
  )
}

import React from 'react'
import { Routes, Route } from 'react-router-dom'
import KioskPage from './pages/KioskPage'
import StaffPage from './pages/StaffPage'
import ShopPage from './pages/ShopPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<KioskPage />} />
      <Route path="/staff" element={<StaffPage />} />
      <Route path="/shop" element={<ShopPage />} />
    </Routes>
  )
}

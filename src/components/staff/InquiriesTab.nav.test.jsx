import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import StaffDashboard from './StaffDashboard'

describe('StaffDashboard — Inquiries tile', () => {
  it('renders an Inquiries tile', () => {
    render(<StaffDashboard onLogout={vi.fn()} onNavigate={vi.fn()} newInquiryCount={0} />)
    expect(screen.getByRole('button', { name: /inquiries/i })).toBeInTheDocument()
  })

  it('clicking Inquiries tile calls onNavigate with "inquiries"', () => {
    const onNavigate = vi.fn()
    render(<StaffDashboard onLogout={vi.fn()} onNavigate={onNavigate} newInquiryCount={0} />)
    fireEvent.click(screen.getByRole('button', { name: /inquiries/i }))
    expect(onNavigate).toHaveBeenCalledWith('inquiries')
  })

  it('shows badge with new inquiry count when newInquiryCount > 0', () => {
    render(<StaffDashboard onLogout={vi.fn()} onNavigate={vi.fn()} newInquiryCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('no badge when newInquiryCount is 0', () => {
    render(<StaffDashboard onLogout={vi.fn()} onNavigate={vi.fn()} newInquiryCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StaffDashboard from './StaffDashboard'

describe('StaffDashboard — settings navigation tile', () => {
  it('renders a Settings tile in the nav', () => {
    render(<StaffDashboard onLogout={vi.fn()} onNavigate={vi.fn()} />)
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('clicking Settings tile calls onNavigate with "settings"', () => {
    const onNavigate = vi.fn()
    render(<StaffDashboard onLogout={vi.fn()} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(onNavigate).toHaveBeenCalledWith('settings')
  })
})

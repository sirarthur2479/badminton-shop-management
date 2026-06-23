import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ShopSettingsTab from './ShopSettingsTab'

// Mock supabase
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ single: mockSingle }))
const mockFrom = vi.fn(() => ({ select: mockSelect, upsert: vi.fn().mockResolvedValue({ error: null }) }))

vi.mock('../../supabaseClient', () => ({
  supabase: { from: (...a) => mockFrom(...a) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({ select: mockSelect, upsert: vi.fn().mockResolvedValue({ error: null }) })
})

describe('ShopSettingsTab — form renders + loads settings', () => {
  it('renders all form fields', () => {
    mockSingle.mockResolvedValue({ data: null, error: null })
    render(<ShopSettingsTab />)
    expect(screen.getByLabelText(/shop name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tagline/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/about/i)).toBeInTheDocument()
  })

  it('loads existing shop_settings values into form fields', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_name: 'My Shop',
        tagline: 'Best in town',
        phone: '6421000000',
        email: 'shop@test.com',
        accent_colour: 'green',
        about: 'We love badminton',
      },
      error: null,
    })
    render(<ShopSettingsTab />)
    await waitFor(() => {
      expect(screen.getByDisplayValue('My Shop')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Best in town')).toBeInTheDocument()
      expect(screen.getByDisplayValue('6421000000')).toBeInTheDocument()
      expect(screen.getByDisplayValue('shop@test.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('We love badminton')).toBeInTheDocument()
    })
  })
})

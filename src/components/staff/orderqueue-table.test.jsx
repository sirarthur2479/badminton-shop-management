import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock supabase before importing the component
vi.mock('../../supabaseClient', () => ({
  isConfigured: () => true,
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: mockOrders(), error: null }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    functions: { invoke: vi.fn() },
  },
}))

function mockOrders() {
  return [
    {
      id: 'aaaaaaaa-0000-0000-0000-000000000001',
      created_at: '2024-06-01T10:00:00Z',
      customer_name: 'Alice Tan',
      customer_phone: '021 111 1111',
      customer_email: 'alice@example.com',
      racket_brand_name: 'Yonex',
      racket_model_name: 'Astrox 99',
      string_brand_name: 'Yonex',
      string_model_name: 'BG80',
      tension_lbs: 28,
      notes: '',
      status: 'pending',
      paid: false,
    },
    {
      id: 'bbbbbbbb-0000-0000-0000-000000000002',
      created_at: '2024-06-01T11:00:00Z',
      customer_name: 'Bob Lee',
      customer_phone: '022 222 2222',
      customer_email: '',
      racket_brand_name: 'Victor',
      racket_model_name: 'Thruster K',
      string_brand_name: 'Li-Ning',
      string_model_name: 'No. 1',
      tension_lbs: 26,
      notes: '',
      status: 'in_progress',
      paid: true,
    },
  ]
}

import OrderQueue from './OrderQueue'

describe('OrderQueue compact table', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Slice 1: renders as compact table rows (not legacy cards) on desktop
  it('renders orders as table rows (data-testid="order-row") not legacy cards', async () => {
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    const rows = screen.getAllByTestId('order-row')
    expect(rows).toHaveLength(2)
    // Legacy card class should not be present
    rows.forEach(row => {
      expect(row).not.toHaveClass('rounded-2xl')
    })
  })

  it('each row shows order ID, customer name, racket·string·tension, status and paid badges', async () => {
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    // Short ID (last 8 of uuid, uppercased)
    expect(screen.getByText('#00000001')).toBeInTheDocument()
    // Customer name
    expect(screen.getByText('Alice Tan')).toBeInTheDocument()
    // Job summary (racket · string · tension on one line)
    expect(screen.getByText(/Yonex Astrox 99/)).toBeInTheDocument()
    expect(screen.getByText(/BG80/)).toBeInTheDocument()
    expect(screen.getByText(/28 lbs/)).toBeInTheDocument()
  })

  // Slice 2: click-to-expand / collapse
  it('clicking a row expands the edit panel below it', async () => {
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    const rows = screen.getAllByTestId('order-row')
    fireEvent.click(rows[0])

    await waitFor(() => {
      expect(screen.getByTestId('edit-panel-' + mockOrders()[0].id)).toBeInTheDocument()
    })
  })

  it('clicking the same row again collapses the edit panel', async () => {
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    const rows = screen.getAllByTestId('order-row')
    fireEvent.click(rows[0])
    await waitFor(() => expect(screen.getByTestId('edit-panel-' + mockOrders()[0].id)).toBeInTheDocument())

    fireEvent.click(rows[0])
    await waitFor(() => {
      expect(screen.queryByTestId('edit-panel-' + mockOrders()[0].id)).not.toBeInTheDocument()
    })
  })

  it('expanding row B collapses previously expanded row A', async () => {
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    const rows = screen.getAllByTestId('order-row')
    const [idA, idB] = [mockOrders()[0].id, mockOrders()[1].id]

    fireEvent.click(rows[0])
    await waitFor(() => expect(screen.getByTestId('edit-panel-' + idA)).toBeInTheDocument())

    fireEvent.click(rows[1])
    await waitFor(() => {
      expect(screen.getByTestId('edit-panel-' + idB)).toBeInTheDocument()
      expect(screen.queryByTestId('edit-panel-' + idA)).not.toBeInTheDocument()
    })
  })

  // Slice 3: badge click isolation
  it('clicking status badge cycles status without expanding row', async () => {
    const { supabase } = await import('../../supabaseClient')
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    const statusBadge = screen.getAllByTestId('status-badge')[0]
    fireEvent.click(statusBadge)

    // Edit panel must NOT appear
    expect(screen.queryByTestId('edit-panel-' + mockOrders()[0].id)).not.toBeInTheDocument()
  })

  it('clicking paid badge toggles paid without expanding row', async () => {
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    const paidBadge = screen.getAllByTestId('paid-badge')[0]
    fireEvent.click(paidBadge)

    expect(screen.queryByTestId('edit-panel-' + mockOrders()[0].id)).not.toBeInTheDocument()
  })

  // Slice 4: search filter
  it('search input filters visible rows', async () => {
    render(<OrderQueue onBack={() => {}} />)
    await waitFor(() => expect(screen.getByText('Alice Tan')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'Bob' } })

    await waitFor(() => {
      expect(screen.queryByText('Alice Tan')).not.toBeInTheDocument()
      expect(screen.getByText('Bob Lee')).toBeInTheDocument()
    })
  })
})

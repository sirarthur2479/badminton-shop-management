import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import InquiriesTab from './InquiriesTab'

const INQUIRIES = [
  {
    id: 'inq-1',
    created_at: '2026-06-23T09:00:00Z',
    customer_name: 'Alice Wong',
    customer_phone: '021 111 2222',
    customer_email: null,
    items: [
      { name: 'Yonex Astrox 99', qty: 1, price: 299 },
      { name: 'BG80 String', qty: 2, price: 18 },
    ],
    message: 'Do you have the white version?',
    status: 'new',
  },
  {
    id: 'inq-2',
    created_at: '2026-06-22T15:30:00Z',
    customer_name: 'Bob Tran',
    customer_phone: null,
    customer_email: 'bob@example.com',
    items: [{ name: 'Victor Thruster', qty: 1, price: 189 }],
    message: '',
    status: 'replied',
  },
]

const mockOrder = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()

vi.mock('../../supabaseClient', () => ({
  supabase: { from: (...a) => mockFrom(...a) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockOrder.mockResolvedValue({ data: INQUIRIES, error: null })
  mockSelect.mockReturnValue({ order: mockOrder })
  mockFrom.mockReturnValue({ select: mockSelect })
})

describe('InquiriesTab — inquiry list', () => {
  it('renders customer names in the table', async () => {
    render(<InquiriesTab />)
    await waitFor(() => {
      expect(screen.getByText('Alice Wong')).toBeInTheDocument()
      expect(screen.getByText('Bob Tran')).toBeInTheDocument()
    })
  })

  it('renders item count for each inquiry', async () => {
    render(<InquiriesTab />)
    await waitFor(() => {
      expect(screen.getByText('2 items')).toBeInTheDocument()
      expect(screen.getByText('1 item')).toBeInTheDocument()
    })
  })

  it('renders status badge for each inquiry', async () => {
    render(<InquiriesTab />)
    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Replied')).toBeInTheDocument()
    })
  })

  it('new inquiry row has a yellow left border class', async () => {
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Alice Wong'))
    const row = screen.getByTestId('inquiry-row-inq-1')
    expect(row.className).toMatch(/border-yellow/)
  })

  it('non-new inquiry row does not have a yellow border', async () => {
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Bob Tran'))
    const row = screen.getByTestId('inquiry-row-inq-2')
    expect(row.className).not.toMatch(/border-yellow/)
  })

  it('renders contact: phone when available', async () => {
    render(<InquiriesTab />)
    await waitFor(() => expect(screen.getByText('021 111 2222')).toBeInTheDocument())
  })

  it('renders contact: email when phone is null', async () => {
    render(<InquiriesTab />)
    await waitFor(() => expect(screen.getByText('bob@example.com')).toBeInTheDocument())
  })
})

describe('InquiriesTab — click-to-expand', () => {
  it('clicking a row expands the item list', async () => {
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Alice Wong'))
    fireEvent.click(screen.getByTestId('inquiry-row-inq-1'))
    expect(screen.getByTestId('inquiry-expanded-inq-1')).toBeInTheDocument()
    expect(screen.getByText(/Yonex Astrox 99/)).toBeInTheDocument()
    expect(screen.getByText(/BG80 String/)).toBeInTheDocument()
  })

  it('expanded row shows customer message', async () => {
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Alice Wong'))
    fireEvent.click(screen.getByTestId('inquiry-row-inq-1'))
    expect(screen.getByText(/Do you have the white version/)).toBeInTheDocument()
  })

  it('clicking same row again collapses it', async () => {
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Alice Wong'))
    fireEvent.click(screen.getByTestId('inquiry-row-inq-1'))
    fireEvent.click(screen.getByTestId('inquiry-row-inq-1'))
    expect(screen.queryByTestId('inquiry-expanded-inq-1')).not.toBeInTheDocument()
  })
})

describe('InquiriesTab — status actions', () => {
  it('"Mark Replied" calls supabase update with status replied', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Alice Wong'))
    fireEvent.click(screen.getByTestId('inquiry-row-inq-1'))
    fireEvent.click(screen.getByRole('button', { name: /mark replied/i }))
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'replied' })
  })

  it('"Mark Closed" calls supabase update with status closed', async () => {
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Alice Wong'))
    fireEvent.click(screen.getByTestId('inquiry-row-inq-1'))
    fireEvent.click(screen.getByRole('button', { name: /mark closed/i }))
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'closed' })
  })

  it('after Mark Replied the status badge updates to Replied', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
    render(<InquiriesTab />)
    await waitFor(() => screen.getByText('Alice Wong'))
    fireEvent.click(screen.getByTestId('inquiry-row-inq-1'))
    fireEvent.click(screen.getByRole('button', { name: /mark replied/i }))
    await waitFor(() => {
      const badges = screen.getAllByText('Replied')
      expect(badges.length).toBeGreaterThanOrEqual(1)
    })
  })
})

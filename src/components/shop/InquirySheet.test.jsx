import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InquiryProvider } from '../../contexts/InquiryContext'
import InquirySheet from './InquirySheet'

vi.mock('../../supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({}) },
  },
  isConfigured: () => true,
}))

import { supabase } from '../../supabaseClient'

const PRODUCT_A = { id: '1', name: 'Yonex Astrox 99', price: 349.00 }
const PRODUCT_B = { id: '2', name: 'Victor Magan Bag', price: 149.00 }

function makeInsertChain(data) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: (res) => Promise.resolve({ data, error: null }).then(res),
  }
  return chain
}

function wrap(ui, initialItems = []) {
  function ProviderWithItems({ children }) {
    const [React] = [require('react')]
    return React.createElement(InquiryProvider, null, children)
  }
  return <InquiryProvider>{ui}</InquiryProvider>
}

// helper: render sheet open with pre-loaded items via Add to Inquiry button
import { InquiryProvider as IP, useInquiry } from '../../contexts/InquiryContext'
import { act } from '@testing-library/react'

function SheetWithProducts({ products = [] }) {
  const { addItem } = useInquiry()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      {products.map(p => (
        <button key={p.id} data-testid={`add-${p.id}`} onClick={() => addItem(p)}>add {p.name}</button>
      ))}
      <button data-testid="open-sheet" onClick={() => setOpen(true)}>Open sheet</button>
      <InquirySheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function wrapWithItems(products = []) {
  return <IP><SheetWithProducts products={products} /></IP>
}

describe('InquirySheet — item list', () => {
  beforeEach(() => {
    localStorage.clear()
    supabase.from.mockReturnValue(makeInsertChain({ id: 'inq-001' }))
  })


  it('shows each added product with its name and price', async () => {
    const user = userEvent.setup()
    render(wrapWithItems([PRODUCT_A, PRODUCT_B]))
    await user.click(screen.getByTestId('add-1'))
    await user.click(screen.getByTestId('add-2'))
    await user.click(screen.getByTestId('open-sheet'))
    expect(screen.getByText('Yonex Astrox 99')).toBeInTheDocument()
    expect(screen.getByText('Victor Magan Bag')).toBeInTheDocument()
  })

  it('remove button eliminates the item', async () => {
    const user = userEvent.setup()
    render(wrapWithItems([PRODUCT_A, PRODUCT_B]))
    await user.click(screen.getByTestId('add-1'))
    await user.click(screen.getByTestId('add-2'))
    await user.click(screen.getByTestId('open-sheet'))
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    expect(screen.queryByText('Yonex Astrox 99')).not.toBeInTheDocument()
    expect(screen.getByText('Victor Magan Bag')).toBeInTheDocument()
  })

  it('shows empty state when no items', async () => {
    const user = userEvent.setup()
    render(wrapWithItems([]))
    await user.click(screen.getByTestId('open-sheet'))
    expect(screen.getByText(/your inquiry list is empty/i)).toBeInTheDocument()
  })
})

describe('InquirySheet — contact form + submit', () => {
  beforeEach(() => {
    localStorage.clear()
    supabase.from.mockReturnValue(makeInsertChain({ id: 'inq-001' }))
  })

  async function openSheetWithItem() {
    const user = userEvent.setup()
    render(wrapWithItems([PRODUCT_A]))
    await user.click(screen.getByTestId('add-1'))
    await user.click(screen.getByTestId('open-sheet'))
    return user
  }

  it('submit without name shows validation error', async () => {
    const user = await openSheetWithItem()
    await user.click(screen.getByRole('button', { name: /send inquiry/i }))
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })

  it('submit without phone AND email shows validation error', async () => {
    const user = await openSheetWithItem()
    await user.type(screen.getByPlaceholderText(/your name/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /send inquiry/i }))
    expect(screen.getByText(/phone or email is required/i)).toBeInTheDocument()
  })

  it('valid submit with name + email calls supabase insert', async () => {
    const user = await openSheetWithItem()
    await user.type(screen.getByPlaceholderText(/your name/i), 'Alice')
    await user.type(screen.getByPlaceholderText(/email/i), 'alice@example.com')
    await user.click(screen.getByRole('button', { name: /send inquiry/i }))
    expect(supabase.from).toHaveBeenCalledWith('shop_inquiries')
  })

  it('success state shows confirmation message with inquiry id', async () => {
    const user = await openSheetWithItem()
    await user.type(screen.getByPlaceholderText(/your name/i), 'Alice')
    await user.type(screen.getByPlaceholderText(/phone/i), '0211234567')
    await user.click(screen.getByRole('button', { name: /send inquiry/i }))
    expect(await screen.findByText(/inquiry sent/i)).toBeInTheDocument()
    expect(screen.getByText(/inq-001/)).toBeInTheDocument()
  })
})

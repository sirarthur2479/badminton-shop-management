import { renderHook, act } from '@testing-library/react'
import { InquiryProvider, useInquiry } from './InquiryContext'

function wrapper({ children }) {
  return <InquiryProvider>{children}</InquiryProvider>
}

const PRODUCT_A = { id: '1', name: 'Yonex Astrox 99', price: 349.00 }
const PRODUCT_B = { id: '2', name: 'Victor Magan Bag', price: 149.00 }

describe('InquiryContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty items', () => {
    const { result } = renderHook(() => useInquiry(), { wrapper })
    expect(result.current.items).toEqual([])
  })

  it('addItem adds a product with qty 1', () => {
    const { result } = renderHook(() => useInquiry(), { wrapper })
    act(() => result.current.addItem(PRODUCT_A))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ id: '1', qty: 1 })
  })

  it('addItem increments qty when same product added twice', () => {
    const { result } = renderHook(() => useInquiry(), { wrapper })
    act(() => result.current.addItem(PRODUCT_A))
    act(() => result.current.addItem(PRODUCT_A))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].qty).toBe(2)
  })

  it('removeItem removes the item by id', () => {
    const { result } = renderHook(() => useInquiry(), { wrapper })
    act(() => result.current.addItem(PRODUCT_A))
    act(() => result.current.addItem(PRODUCT_B))
    act(() => result.current.removeItem('1'))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe('2')
  })

  it('clear empties all items', () => {
    const { result } = renderHook(() => useInquiry(), { wrapper })
    act(() => result.current.addItem(PRODUCT_A))
    act(() => result.current.clear())
    expect(result.current.items).toEqual([])
  })

  it('persists items to localStorage on change', () => {
    const { result } = renderHook(() => useInquiry(), { wrapper })
    act(() => result.current.addItem(PRODUCT_A))
    const stored = JSON.parse(localStorage.getItem('inquiry_list'))
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('1')
  })

  it('loads items from localStorage on mount', () => {
    localStorage.setItem('inquiry_list', JSON.stringify([{ id: '1', name: 'Yonex Astrox 99', price: 349, qty: 3 }]))
    const { result } = renderHook(() => useInquiry(), { wrapper })
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].qty).toBe(3)
  })
})

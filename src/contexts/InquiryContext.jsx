import { createContext, useContext, useState, useEffect } from 'react'

const noop = () => {}
const InquiryContext = createContext({ items: [], addItem: noop, removeItem: noop, clear: noop })

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('inquiry_list')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function InquiryProvider({ children }) {
  const [items, setItems] = useState(loadFromStorage)

  useEffect(() => {
    localStorage.setItem('inquiry_list', JSON.stringify(items))
  }, [items])

  function addItem(product) {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function clear() {
    setItems([])
  }

  return (
    <InquiryContext.Provider value={{ items, addItem, removeItem, clear }}>
      {children}
    </InquiryContext.Provider>
  )
}

export function useInquiry() {
  return useContext(InquiryContext)
}

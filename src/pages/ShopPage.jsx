import { useState, useMemo } from 'react'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '../supabaseClient'
import ShopHeader from '../components/shop/ShopHeader'
import ProductGrid from '../components/shop/ProductGrid'
import CategoryTabs from '../components/shop/CategoryTabs'
import InquirySheet from '../components/shop/InquirySheet'
import { InquiryProvider } from '../contexts/InquiryContext'

async function fetchProducts() {
  const { data } = await supabase.from('shop_products').select('*').eq('visible', true).order('category').order('name')
  return data || []
}

async function fetchSettings() {
  const { data } = await supabase.from('shop_settings').select('*').single()
  return data
}

function filterProducts(products, category, search) {
  if (!products) return []
  return products.filter(p => {
    const matchesCat = category === 'all' || p.category === category
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })
}

function getEnquireHref(settings) {
  if (settings?.phone) return `https://wa.me/${settings.phone}`
  if (settings?.email) return `mailto:${settings.email}`
  return '#'
}

function ShopPageInner() {
  const { data: settings } = useQuery({ queryKey: ['shop_settings'], queryFn: fetchSettings, staleTime: 10 * 60 * 1000 })
  const { data: products, isLoading } = useQuery({ queryKey: ['shop_products'], queryFn: fetchProducts, staleTime: 5 * 60 * 1000 })
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const categories = useMemo(() => {
    if (!products) return []
    return [...new Set(products.map(p => p.category))].sort()
  }, [products])

  const visible = useMemo(() => filterProducts(products, category, search), [products, category, search])

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader settings={settings} onOpenInquiry={() => setSheetOpen(true)} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <CategoryTabs categories={categories} selected={category} onChange={setCategory} />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 sm:ml-auto"
          />
        </div>
        <ProductGrid products={visible} isLoading={isLoading} enquireHref={getEnquireHref(settings)} />
      </main>
      <InquirySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}

export default function ShopPage() {
  return (
    <InquiryProvider>
      <ShopPageInner />
    </InquiryProvider>
  )
}

import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { isSaleActive } from '../../lib/saleUtils'
import { useInquiry } from '../../contexts/InquiryContext'

function buildEnquireHref(contact, product) {
  if (!contact) return null
  const price = isSaleActive(product) ? product.sale_price : product.price
  const priceStr = price ? ` — NZD $${Number(price).toFixed(2)}` : ''
  const msg = `Hi, I'm interested in the ${product.name}${priceStr}. Could you let me know if it's available?`
  if (contact.type === 'whatsapp') return `https://wa.me/${contact.value}?text=${encodeURIComponent(msg)}`
  if (contact.type === 'email') return `mailto:${contact.value}?subject=${encodeURIComponent(`Enquiry: ${product.name}`)}&body=${encodeURIComponent(msg)}`
  return null
}

export default function ProductCard({ product, contact }) {
  const { addItem } = useInquiry()
  const onSale = isSaleActive(product)
  const enquireHref = buildEnquireHref(contact, product)

  return (
    <Card className="overflow-hidden flex flex-col">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="aspect-square object-cover w-full" />
      ) : (
        <div data-testid="image-placeholder" className="aspect-square bg-gray-100 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0M4.5 12H3m16.5 0H21M12 4.5V3m0 18v-1.5" />
          </svg>
        </div>
      )}
      <CardContent className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</p>
          {onSale && <Badge variant="destructive" className="shrink-0 text-xs">Sale</Badge>}
        </div>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto pt-2">
          {onSale ? (
            <div className="flex items-baseline gap-2 mb-2">
              <s className="text-gray-400 text-sm">${product.price.toFixed(2)}</s>
              <span className="text-red-600 font-bold">${product.sale_price.toFixed(2)}</span>
            </div>
          ) : (
            <p className="text-gray-900 font-bold mb-2">${product.price?.toFixed(2) ?? '—'}</p>
          )}
          <button
            onClick={() => addItem(product)}
            className="block w-full text-center text-sm py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors mb-2">
            Add to List
          </button>
          {enquireHref && (
            <a href={enquireHref} target="_blank" rel="noreferrer"
              className="block w-full text-center text-sm py-2 px-3 rounded-lg border border-green-600 text-green-700 hover:bg-green-50 font-medium transition-colors">
              {enquireHref.startsWith('https://wa.me') ? 'WhatsApp Us' : 'Email Us'}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

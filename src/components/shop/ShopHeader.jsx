import { useInquiry } from '../../contexts/InquiryContext'

const ACCENT_MAP = {
  green:  { overlay: 'bg-green-900/60', cta: 'text-green-700 hover:bg-green-50', sub: 'text-green-100' },
  navy:   { overlay: 'bg-blue-900/70',  cta: 'text-blue-900 hover:bg-blue-50',   sub: 'text-blue-200' },
  orange: { overlay: 'bg-orange-900/60', cta: 'text-orange-700 hover:bg-orange-50', sub: 'text-orange-100' },
  purple: { overlay: 'bg-purple-900/65', cta: 'text-purple-700 hover:bg-purple-50', sub: 'text-purple-100' },
  red:    { overlay: 'bg-red-900/65',   cta: 'text-red-700 hover:bg-red-50',     sub: 'text-red-100' },
}

const BANNER_URL = 'https://images.unsplash.com/photo-1599391398131-cd12dfc6c24e?fm=jpg&q=80&w=2000&auto=format&fit=crop'

export default function ShopHeader({ settings, onOpenInquiry }) {
  const { items } = useInquiry()
  const count = items.reduce((n, i) => n + i.qty, 0)
  const name = settings?.shop_name ?? 'Badminton Pro Shop'
  const tagline = settings?.tagline ?? 'Your local badminton specialist'
  const ctaHref = settings?.phone
    ? `https://wa.me/${settings.phone}`
    : settings?.email ? `mailto:${settings.email}` : null
  const accent = ACCENT_MAP[settings?.accent_colour] ?? ACCENT_MAP.green

  return (
    <header className="relative text-white overflow-hidden">
      <img
        src={BANNER_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className={`absolute inset-0 ${accent.overlay}`} />
      <div className="relative max-w-7xl mx-auto px-4 py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold drop-shadow">{name}</h1>
          <p className={`${accent.sub} text-sm mt-1 drop-shadow`}>{tagline}</p>
        </div>
        <div className="flex items-center gap-3">
          {ctaHref && (
            <a href={ctaHref} target="_blank" rel="noreferrer"
              className={`inline-block bg-white ${accent.cta} font-semibold px-5 py-2 rounded-lg transition-colors text-sm`}>
              {settings?.phone ? 'WhatsApp Us' : 'Email Us'}
            </a>
          )}
          <button
            onClick={onOpenInquiry}
            className="relative bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            My List
            {count > 0 && (
              <span data-testid="inquiry-count"
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

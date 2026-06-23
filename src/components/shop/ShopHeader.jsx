const ACCENT_MAP = {
  green:  { header: 'bg-green-600', cta: 'text-green-700 hover:bg-green-50', sub: 'text-green-100' },
  navy:   { header: 'bg-blue-900',  cta: 'text-blue-900 hover:bg-blue-50',   sub: 'text-blue-200' },
  orange: { header: 'bg-orange-500', cta: 'text-orange-700 hover:bg-orange-50', sub: 'text-orange-100' },
  purple: { header: 'bg-purple-600', cta: 'text-purple-700 hover:bg-purple-50', sub: 'text-purple-100' },
  red:    { header: 'bg-red-600',   cta: 'text-red-700 hover:bg-red-50',     sub: 'text-red-100' },
}

export default function ShopHeader({ settings }) {
  const name = settings?.shop_name ?? 'Badminton Pro Shop'
  const tagline = settings?.tagline ?? 'Your local badminton specialist'
  const ctaHref = settings?.phone
    ? `https://wa.me/${settings.phone}`
    : settings?.email ? `mailto:${settings.email}` : null
  const accent = ACCENT_MAP[settings?.accent_colour] ?? ACCENT_MAP.green

  return (
    <header className={`${accent.header} text-white`}>
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className={`${accent.sub} text-sm mt-1`}>{tagline}</p>
        </div>
        {ctaHref && (
          <a href={ctaHref} target="_blank" rel="noreferrer"
            className={`inline-block bg-white ${accent.cta} font-semibold px-5 py-2 rounded-lg transition-colors text-sm`}>
            {settings?.phone ? 'WhatsApp Us' : 'Email Us'}
          </a>
        )}
      </div>
    </header>
  )
}

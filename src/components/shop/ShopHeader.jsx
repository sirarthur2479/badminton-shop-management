export default function ShopHeader({ settings }) {
  const name = settings?.shop_name ?? 'Badminton Pro Shop'
  const tagline = settings?.tagline ?? 'Your local badminton specialist'
  const ctaHref = settings?.phone
    ? `https://wa.me/${settings.phone}`
    : settings?.email ? `mailto:${settings.email}` : null

  return (
    <header className="bg-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-green-100 text-sm mt-1">{tagline}</p>
        </div>
        {ctaHref && (
          <a href={ctaHref} target="_blank" rel="noreferrer"
            className="inline-block bg-white text-green-700 font-semibold px-5 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm">
            {settings?.phone ? 'WhatsApp Us' : 'Email Us'}
          </a>
        )}
      </div>
    </header>
  )
}

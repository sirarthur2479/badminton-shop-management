const VALID_CATEGORIES = ['racket', 'string', 'shoe', 'bag', 'grip', 'shuttle', 'other']

export function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

export function mapRow(raw) {
  if (!raw.name?.trim()) return null
  return {
    name:        raw.name.trim(),
    price:       raw.price ? Number(raw.price) || null : null,
    category:    VALID_CATEGORIES.includes(raw.category) ? raw.category : 'other',
    description: raw.description || null,
    image_url:   raw.image_url || null,
    visible:     true,
  }
}

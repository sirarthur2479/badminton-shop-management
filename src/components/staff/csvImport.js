const VALID_CATEGORIES = ['racket', 'string', 'shoe', 'bag', 'grip', 'shuttle', 'other']

function splitLine(line) {
  const cols = []
  let inQuotes = false
  let current = ''
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = '' }
    else { current += ch }
  }
  cols.push(current.trim())
  return cols
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = splitLine(lines[0]).map(h => h.toLowerCase())
  return lines.slice(1).map(line => {
    const vals = splitLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

export function mapRow(raw) {
  if (!raw.name?.trim()) return null
  const priceNum = raw.price !== '' && raw.price != null ? Number(raw.price) : NaN
  return {
    name:        raw.name.trim(),
    price:       isNaN(priceNum) ? null : priceNum,
    category:    VALID_CATEGORIES.includes(raw.category) ? raw.category : 'other',
    description: raw.description || null,
    image_url:   raw.image_url || null,
    visible:     true,
  }
}

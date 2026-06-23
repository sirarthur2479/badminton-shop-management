import { parseCSV, mapRow } from './csvImport'

// ── parseCSV ─────────────────────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses header + rows into objects', () => {
    const csv = 'name,price,category\nAstrox 99,299,racket\nBG80,22,string'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ name: 'Astrox 99', price: '299', category: 'racket' })
    expect(rows[1]).toEqual({ name: 'BG80', price: '22', category: 'string' })
  })

  it('trims whitespace from headers and values', () => {
    const csv = ' name , price \nAstrox 99 , 299 '
    const rows = parseCSV(csv)
    expect(rows[0]).toEqual({ name: 'Astrox 99', price: '299' })
  })

  it('normalises header casing to lowercase', () => {
    const csv = 'Name,Price,Category\nGrip,5,grip'
    const rows = parseCSV(csv)
    expect(rows[0]).toHaveProperty('name', 'Grip')
    expect(rows[0]).toHaveProperty('price', '5')
  })

  it('strips surrounding quotes from values', () => {
    const csv = 'name,price\n"Astrox 99","299"'
    const rows = parseCSV(csv)
    expect(rows[0]).toEqual({ name: 'Astrox 99', price: '299' })
  })

  it('returns empty array for header-only CSV', () => {
    expect(parseCSV('name,price')).toEqual([])
  })

  it('fills missing columns with empty string', () => {
    const csv = 'name,price,category\nOnlyName'
    const rows = parseCSV(csv)
    expect(rows[0].price).toBe('')
    expect(rows[0].category).toBe('')
  })

  it('handles Windows \\r\\n line endings without corrupting last column', () => {
    const csv = 'name,price,category\r\nAstrox 99,299,racket\r\nBG80,22,string'
    const rows = parseCSV(csv)
    expect(rows[0].category).toBe('racket')
    expect(rows[1].category).toBe('string')
    expect(rows[0].name).toBe('Astrox 99')
  })

  it('handles quoted fields containing commas', () => {
    const csv = 'name,price\n"Shuttle, Indoor",15\n"Grip, 3-pack",12'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].name).toBe('Shuttle, Indoor')
    expect(rows[0].price).toBe('15')
    expect(rows[1].name).toBe('Grip, 3-pack')
  })
})

// ── mapRow edge cases ─────────────────────────────────────────────────────────

describe('mapRow — edge cases', () => {
  it('preserves price of 0 as 0 (not null)', () => {
    expect(mapRow({ name: 'Free Sample', price: '0' }).price).toBe(0)
  })
})

// ── mapRow ────────────────────────────────────────────────────────────────────

describe('mapRow', () => {
  it('maps valid row with all fields', () => {
    const raw = { name: 'Astrox 99', price: '299', category: 'racket', description: 'Great', image_url: 'https://x.com/img.jpg' }
    const result = mapRow(raw)
    expect(result).toEqual({
      name: 'Astrox 99',
      price: 299,
      category: 'racket',
      description: 'Great',
      image_url: 'https://x.com/img.jpg',
      visible: true,
    })
  })

  it('returns null for row with empty name', () => {
    expect(mapRow({ name: '', price: '10', category: 'grip' })).toBeNull()
    expect(mapRow({ name: '  ', price: '10', category: 'grip' })).toBeNull()
  })

  it('defaults price to null when missing or non-numeric', () => {
    expect(mapRow({ name: 'Grip' }).price).toBeNull()
    expect(mapRow({ name: 'Grip', price: '' }).price).toBeNull()
    expect(mapRow({ name: 'Grip', price: 'free' }).price).toBeNull()
  })

  it('defaults category to "other" when missing', () => {
    expect(mapRow({ name: 'Grip' }).category).toBe('other')
  })

  it('coerces invalid category to "other"', () => {
    expect(mapRow({ name: 'Grip', category: 'UNKNOWN' }).category).toBe('other')
    expect(mapRow({ name: 'Grip', category: 'widget' }).category).toBe('other')
  })

  it('accepts all valid category values', () => {
    const cats = ['racket', 'string', 'shoe', 'bag', 'grip', 'shuttle', 'other']
    cats.forEach(cat => {
      expect(mapRow({ name: 'X', category: cat }).category).toBe(cat)
    })
  })

  it('sets description and image_url to null when empty', () => {
    const result = mapRow({ name: 'X', description: '', image_url: '' })
    expect(result.description).toBeNull()
    expect(result.image_url).toBeNull()
  })

  it('always sets visible: true', () => {
    expect(mapRow({ name: 'X' }).visible).toBe(true)
  })
})

import { readFileSync } from 'fs'
import { resolve } from 'path'

const sql = readFileSync(resolve(__dirname, '../supabase/schema.sql'), 'utf8')

describe('supabase/schema.sql — shop tables', () => {
  it('contains shop_products CREATE TABLE with all required columns', () => {
    expect(sql).toMatch(/create table.*shop_products/i)
    const required = ['name', 'category', 'price', 'sale_price', 'sale_ends_at', 'description', 'image_url', 'visible']
    for (const col of required) {
      expect(sql, `missing column: ${col}`).toMatch(new RegExp(`\\b${col}\\b`))
    }
  })

  it('contains shop_settings CREATE TABLE', () => {
    expect(sql).toMatch(/create table.*shop_settings/i)
    expect(sql).toMatch(/shop_name/i)
    expect(sql).toMatch(/accent_colour/i)
  })

  it('seeds at least 10 shop_products rows', () => {
    const matches = sql.match(/insert into shop_products/gi) || []
    // count individual value tuples after the insert
    const block = sql.slice(sql.search(/insert into shop_products/i))
    const tuples = block.match(/\([^)]+\)/g) || []
    expect(tuples.length).toBeGreaterThanOrEqual(10)
  })

  it('seed products cover at least 4 distinct categories', () => {
    const categories = new Set()
    const cats = ['racket', 'string', 'bag', 'grip', 'shoe', 'shuttle', 'other']
    for (const c of cats) {
      if (sql.includes(`'${c}'`)) categories.add(c)
    }
    expect(categories.size).toBeGreaterThanOrEqual(4)
  })

  it('at least one seed product has a sale_price', () => {
    // The INSERT header lists sale_price as a column; at least one values row
    // must have a non-null numeric in that position.
    // Detect: a row tuple where the 4th comma-separated value is a decimal.
    const insertSection = sql.slice(sql.search(/insert into shop_products/i))
    // Each row tuple: (str, str, num, <sale_price>, ...)
    // Rows with a numeric sale_price have: price_num, sale_num, where sale_num != null
    const rowWithSale = insertSection.match(/\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*\d+\.\d+\s*,\s*\d+\.\d+/)
    expect(rowWithSale).not.toBeNull()
  })

  it('existing stringing_orders table is still defined', () => {
    expect(sql).toMatch(/create table.*stringing_orders/i)
  })
})

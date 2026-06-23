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
    // sale_price appears as a non-null value in an insert row
    const insertSection = sql.slice(sql.search(/insert into shop_products/i))
    expect(insertSection).toMatch(/sale_price\s*=|\d+\.\d+.*sale_price|sale_price.*\d+\.\d+/)
  })

  it('existing stringing_orders table is still defined', () => {
    expect(sql).toMatch(/create table.*stringing_orders/i)
  })
})

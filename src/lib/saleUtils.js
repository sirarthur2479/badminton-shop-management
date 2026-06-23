export function isSaleActive(product) {
  if (!product.sale_price) return false
  if (!product.sale_ends_at) return true
  return new Date(product.sale_ends_at) > new Date()
}

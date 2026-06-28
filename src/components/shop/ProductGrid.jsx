import ProductCard from './ProductCard'
import ProductCardSkeleton from './ProductCardSkeleton'

const SKELETON_COUNT = 12

export default function ProductGrid({ products, isLoading, contact }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(SKELETON_COUNT).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    )
  }

  if (!products?.length) {
    return <p className="text-center text-gray-400 py-16">No products found.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(p => <ProductCard key={p.id} product={p} contact={contact} />)}
    </div>
  )
}

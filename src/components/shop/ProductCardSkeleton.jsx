export default function ProductCardSkeleton() {
  return (
    <div data-testid="product-skeleton" className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      <div className="bg-gray-200 aspect-square" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-8 bg-gray-200 rounded mt-3" />
      </div>
    </div>
  )
}

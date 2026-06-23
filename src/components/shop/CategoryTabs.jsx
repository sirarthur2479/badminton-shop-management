export default function CategoryTabs({ categories, selected, onChange }) {
  const tabs = ['all', ...categories]
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(cat => (
        <button key={cat} onClick={() => onChange(cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
            ${selected === cat
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {cat === 'all' ? 'All' : cat}
        </button>
      ))}
    </div>
  )
}

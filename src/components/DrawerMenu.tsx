export type ViewId = 'recipes' | 'ingredients'

interface DrawerMenuProps {
  open: boolean
  onClose: () => void
  currentView: ViewId
  onNavigate: (id: ViewId) => void
}

export default function DrawerMenu({ open, onClose, currentView, onNavigate }: DrawerMenuProps) {
  if (!open) return null

  const items: { id: ViewId; label: string }[] = [
    { id: 'recipes', label: 'Recipes' },
    { id: 'ingredients', label: 'Ingredients' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Panel */}
      <div className="w-60 bg-gray-800 h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-700">
          <span className="font-bold text-gray-100 text-base">Menu</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose() }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                currentView === item.id
                  ? 'bg-green-900/40 text-green-400'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Overlay */}
      <div className="flex-1 bg-black/40 cursor-pointer" onClick={onClose} />
    </div>
  )
}

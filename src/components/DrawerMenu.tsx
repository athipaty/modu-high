export type ViewId = 'recipes' | 'ingredients'

interface DrawerMenuProps {
  open: boolean
  onClose: () => void
  currentView: ViewId
  onNavigate: (id: ViewId) => void
}

export default function DrawerMenu({ open, onClose, currentView, onNavigate }: DrawerMenuProps) {
  if (!open) return null

  const items: { id: ViewId; icon: string; label: string }[] = [
    { id: 'recipes', icon: '🍳', label: 'Recipes' },
    { id: 'ingredients', icon: '🧂', label: 'Ingredients' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Panel */}
      <div className="w-60 bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
          <span className="font-bold text-gray-800 text-base">Menu</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
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
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
    </div>
  )
}

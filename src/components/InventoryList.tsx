import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { fetchInventoryFilter, saveInventoryFilter } from '../services/api'
import type { Recipe, RecipeIngredient, Ingredient } from '../types/recipe'

const UNITS = ['g', 'kg', 'ml', 'L', 'pack', 'piece', 'bottle', 'tube', 'tin']

interface StockEditorProps {
  override: Ingredient | undefined
  ingName: string
  onSave: (draft: Partial<Ingredient> | null) => void
}

function StockEditor({ override, ingName, onSave }: StockEditorProps) {
  const [value, setValue] = useState(String(override?.stock?.value ?? ''))
  const [unit, setUnit] = useState(override?.stock?.unit || override?.weight?.unit || 'g')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const commit = () => {
    onSave({
      ...(override || { name: ingName, price: 0, weight: { value: 0, unit: 'g' }, image: '' }),
      name: override?.name || ingName,
      stock: { value: Number(value) || 0, unit },
    })
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onSave(null) }}
        className="w-16 text-xs border border-green-400 rounded px-1.5 py-0.5 text-center focus:outline-none"
      />
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none"
      >
        {UNITS.map((u) => <option key={u}>{u}</option>)}
      </select>
      <button onClick={commit} className="text-xs text-green-600 font-semibold px-1">✓</button>
    </div>
  )
}

interface InventoryListProps {
  activeRecipes?: Recipe[]
  ingredients?: Ingredient[]
  onImage?: (url: string) => void
  onSaveIngredient?: (draft: Partial<Ingredient>) => Promise<void>
}

export default function InventoryList({ activeRecipes = [], ingredients = [], onImage, onSaveIngredient }: InventoryListProps) {
  const [excluded, setExcluded] = useState<string[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [editingStock, setEditingStock] = useState<string | null>(null)

  useEffect(() => {
    fetchInventoryFilter().then(setExcluded).catch(() => {})
  }, [])

  const imageMap: Record<string, string> = {}
  activeRecipes.forEach((r) => {
    r.ingredients?.forEach((ing) => {
      const key = ing.item?.toLowerCase().trim()
      if (ing.image && key && !imageMap[key]) imageMap[key] = ing.image
    })
  })

  const overrideMap = new Map(ingredients.map((i) => [i.name.toLowerCase().trim(), i]))

  const usedByMap: Record<string, string[]> = {}
  activeRecipes.forEach((r) => {
    r.ingredients?.forEach((ing) => {
      const key = ing.item?.toLowerCase().trim()
      if (!key) return
      if (!usedByMap[key]) usedByMap[key] = []
      usedByMap[key].push(r.name)
    })
  })

  const toggleExclude = (name: string) => {
    const key = name.toLowerCase().trim()
    const next = excluded.includes(key)
      ? excluded.filter((k) => k !== key)
      : [...excluded, key]
    setExcluded(next)
    saveInventoryFilter(next).catch(() => {})
  }

  const handleStockSave = async (draft: Partial<Ingredient> | null) => {
    setEditingStock(null)
    if (!draft || !onSaveIngredient) return
    await onSaveIngredient(draft)
  }

  const allIngredients: RecipeIngredient[] = Array.from(
    new Map(
      activeRecipes.flatMap((r) => r.ingredients || []).map((ing) => [ing.item?.toLowerCase().trim(), ing])
    ).values()
  ).sort((a, b) => (a.item || '').localeCompare(b.item || ''))

  const visibleIngredients = allIngredients.filter(
    (ing) => !excluded.includes(ing.item?.toLowerCase().trim())
  )

  return (
    <div className="animate-fade-slide-in">
      {activeRecipes.length > 0 && (
        <div className="mb-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Inventory</span>
            <span className="text-xs bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">{visibleIngredients.length}</span>
            <button
              onClick={() => setShowPanel(true)}
              className="ml-auto flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M9 16h6" />
              </svg>
              Filter
              {excluded.length > 0 && (
                <span className="bg-red-100 text-red-600 font-bold px-1 rounded-full">{excluded.length}</span>
              )}
            </button>
          </div>

          {/* Ingredient list */}
          <div className="bg-white border border-green-200 rounded-xl overflow-hidden">
            {visibleIngredients.map((ing, j) => {
              const key = ing.item?.toLowerCase().trim()
              const override = overrideMap.get(key)
              const ingImage = ing.image || override?.image || imageMap[key] || ''
              const usedBy = usedByMap[key] || []
              const stock = override?.stock
              const isEditing = editingStock === key
              return (
                <div key={j} className={`flex items-center gap-3 px-3 py-2 ${j !== 0 ? 'border-t border-gray-50' : ''}`}>
                  {ingImage ? (
                    <img src={ingImage} alt={ing.item} className="w-9 h-9 rounded-lg object-cover shrink-0 cursor-pointer" onClick={() => onImage?.(ingImage)} />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-lg">🧂</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700">{ing.item}</span>
                    {usedBy.length > 0 && (
                      <p className="text-xs text-gray-400 truncate">{usedBy.join(', ')}</p>
                    )}
                  </div>

                  {/* Stock — tap to edit */}
                  {isEditing ? (
                    <StockEditor
                      override={override}
                      ingName={ing.item}
                      onSave={handleStockSave}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingStock(key)}
                      className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors min-w-[52px] text-center"
                    >
                      {stock && stock.value > 0 ? `${stock.value} ${stock.unit}` : '— stock'}
                    </button>
                  )}
                </div>
              )
            })}
            {visibleIngredients.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">All ingredients are hidden — open Filter to restore</p>
            )}
          </div>
        </div>
      )}

      {activeRecipes.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-16">
          Tick a recipe to see its ingredients here
        </div>
      )}

      {/* Filter panel */}
      {showPanel && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-md pb-10 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b shrink-0">
              <span className="font-semibold text-gray-800 text-sm">Filter Ingredients</span>
              <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <p className="text-xs text-gray-400 px-5 pt-2 pb-1 shrink-0">Tap an item to hide or show it in the inventory list.</p>
            <div className="overflow-y-auto flex-1 px-5 pt-2">
              {allIngredients.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">No ingredients</p>
              )}
              <div className="flex flex-col gap-1">
                {allIngredients.map((ing) => {
                  const key = ing.item?.toLowerCase().trim()
                  const isExcluded = excluded.includes(key)
                  return (
                    <button
                      key={key}
                      onClick={() => toggleExclude(ing.item)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isExcluded ? 'bg-red-50 text-gray-400 line-through' : 'bg-gray-50 text-gray-700 hover:bg-green-50'
                      }`}
                    >
                      <span className="text-sm">{ing.item}</span>
                      {isExcluded ? (
                        <span className="text-xs text-red-400 font-medium shrink-0 ml-2">Hidden</span>
                      ) : (
                        <span className="text-xs text-gray-300 shrink-0 ml-2">Visible</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  )
}

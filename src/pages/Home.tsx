import { useEffect, useRef, useState } from 'react'

import SearchBar from '../components/SearchBar'
import RecipeDetail from '../components/RecipeDetail'
import EditRecipeForm from '../components/EditRecipeForm'
import FullImageModal from '../components/FullImageModal'
import ImageWithLoader from '../components/ImageWithLoader'
import DrawerMenu, { type ViewId } from '../components/DrawerMenu'
import InventoryList from '../components/InventoryList'
import IngredientEditModal from '../components/IngredientEditModal'

import { fmt, valid, strip0 } from '../utils/format'
import { calculateIngredientPrice } from '../utils/priceResolver'
import { fetchRecipes, updateRecipe, createRecipe, fetchIngredients, saveIngredient } from '../services/api'
import type { Recipe, RecipeDraft, Ingredient } from '../types/recipe'

interface HistoryEntry {
  recipe: Recipe | null
  query: string
  scrollY: number
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLeaving, setIsLeaving] = useState(false)
  const [isGridLeaving, setIsGridLeaving] = useState(false)
  const [multiplier, setMultiplier] = useState(1)
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})
  const baseQty = useRef<Record<string, number>>({})
  const [fullImage, setFullImage] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [currentView, setCurrentView] = useState<ViewId>('recipes')
  const [recipeTab, setRecipeTab] = useState<'sale' | 'staff'>('sale')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)

  /* ---------------------- load recipes ---------------------- */
  useEffect(() => {
    fetchRecipes()
      .then(setRecipes)
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [])

  /* ---------------------- load ingredient overrides ---------------------- */
  useEffect(() => {
    fetchIngredients().then(setIngredients).catch(() => {})
  }, [])

  /* ---------------------- navigation ---------------------- */
  const openRecipe = (recipe: Recipe | null) => {
    if (!recipe) return
    setEditMode(false)

    if (selectedRecipe) {
      setIsLeaving(true)
      setTimeout(() => {
        setIsLeaving(false)
        setHistory((h) => [
          ...h,
          { recipe: selectedRecipe, query, scrollY: window.scrollY },
        ])
        setSelectedRecipe(recipe)
        setMultiplier(1)
        setQuery('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 250)
    } else {
      setIsGridLeaving(true)
      setTimeout(() => {
        setIsGridLeaving(false)
        setHistory((h) => [
          ...h,
          { recipe: null, query, scrollY: window.scrollY },
        ])
        setSelectedRecipe(recipe)
        setMultiplier(1)
        setQuery('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 250)
    }
  }

  const goBack = () => {
    setEditMode(false)
    setIsLeaving(true)
    setTimeout(() => {
      setIsLeaving(false)
      if (history.length > 0) {
        const prev = history[history.length - 1]
        setHistory((h) => h.slice(0, -1))
        setSelectedRecipe(prev.recipe)
        setQuery(prev.query || '')
        setMultiplier(1)
        setTimeout(() => {
          window.scrollTo({ top: prev.scrollY || 0, behavior: 'smooth' })
        }, 50)
      } else {
        setSelectedRecipe(null)
        setMultiplier(1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 250)
  }

  /* ---------------------- quantity logic ---------------------- */
  useEffect(() => {
    if (!selectedRecipe) return
    const base: Record<string, number> = {}
    const seeded: Record<string, string> = {}
    selectedRecipe.ingredients.forEach((ing) => {
      const q = Number(ing.quantity) || 0
      base[ing.item] = q
      seeded[ing.item] = fmt(q)
    })
    baseQty.current = base
    setQtyInputs(seeded)
  }, [selectedRecipe])

  useEffect(() => {
    if (!selectedRecipe) return
    setQtyInputs((prev) => {
      const next = { ...prev }
      selectedRecipe.ingredients.forEach((ing) => {
        const base = baseQty.current[ing.item] || 0
        next[ing.item] = fmt(base * multiplier)
      })
      return next
    })
  }, [multiplier, selectedRecipe])

  const onQtyChange = (item: string, raw: string) => {
    const v = strip0(raw)
    setQtyInputs((p) => ({ ...p, [item]: v }))
    if (v === '' || v.endsWith('.')) return
    if (!valid(v)) return
    const num = parseFloat(v)
    const base = baseQty.current[item] || 0
    setMultiplier(base === 0 ? 0 : num / base)
  }

  const onQtyBlur = (item: string) => {
    const v = qtyInputs[item]
    if (v === '' || v?.endsWith('.')) {
      const base = baseQty.current[item] || 0
      setQtyInputs((p) => ({ ...p, [item]: fmt(base * multiplier) }))
    }
  }

  const onSaveIngredient = async (draft: Partial<Ingredient>) => {
    const saved = await saveIngredient(draft)
    setIngredients((prev) => {
      const idx = prev.findIndex((i) => i._id === saved._id)
      return idx >= 0 ? prev.map((i) => (i._id === saved._id ? saved : i)) : [...prev, saved]
    })
    setEditingIngredient(null)
  }

  /* ---------------------- drawer navigation ---------------------- */
  const navigateTo = (view: ViewId) => {
    setCurrentView(view)
    setQuery('')
    setEditMode(false)
    setAddMode(false)
  }

  /* ---------------------- toggle active ---------------------- */
  const toggleActive = async (recipe: Recipe) => {
    const newActive = !recipe.active
    const optimistic = { ...recipe, active: newActive }
    setRecipes((prev) => prev.map((r) => (r._id === recipe._id ? optimistic : r)))
    if (selectedRecipe?._id === recipe._id) setSelectedRecipe(optimistic)
    try {
      const updated = await updateRecipe(recipe._id, optimistic)
      const final = { ...updated, active: updated.active ?? newActive }
      setRecipes((prev) => prev.map((r) => (r._id === final._id ? final : r)))
      if (selectedRecipe?._id === final._id) setSelectedRecipe(final)
    } catch {
      setRecipes((prev) => prev.map((r) => (r._id === recipe._id ? recipe : r)))
      if (selectedRecipe?._id === recipe._id) setSelectedRecipe(recipe)
    }
  }

  /* ---------------------- edit / add ---------------------- */
  const saveRecipe = async (draft: RecipeDraft) => {
    if (draft._id) {
      const saved = await updateRecipe(draft._id, draft)
      setRecipes((prev) => prev.map((r) => (r._id === saved._id ? saved : r)))
      setSelectedRecipe(saved)
      setEditMode(false)
    } else {
      const saved = await createRecipe(draft)
      setRecipes((prev) => [...prev, saved])
      setSelectedRecipe(saved)
      setAddMode(false)
    }
  }

  /* ---------------------- filtering ---------------------- */
  const lcQuery = query.toLowerCase().trim()

  const visibleRecipes = [...recipes]
    .filter((r) => (r.type || 'sale') === recipeTab)
    .filter((r) => (lcQuery ? r.name.toLowerCase().includes(lcQuery) : true))
    .sort((a, b) => a.name.localeCompare(b.name))

  /* ---------------------- known ingredient images ---------------------- */
  const knownImages: Record<string, string> = {}
  ingredients.forEach((ov) => {
    const key = ov.name?.toLowerCase().trim()
    if (ov.image && key) knownImages[key] = ov.image
  })
  recipes.forEach((r) => {
    r.ingredients?.forEach((ing) => {
      const key = ing.item?.toLowerCase().trim()
      if (ing.image && key && !knownImages[key]) knownImages[key] = ing.image
    })
  })

  /* ---------------------- known ingredient names ---------------------- */
  const knownNamesSeen = new Set<string>()
  const knownNames: string[] = []
  ingredients.forEach((ov) => {
    const key = ov.name?.toLowerCase().trim()
    if (key && !knownNamesSeen.has(key)) { knownNamesSeen.add(key); knownNames.push(ov.name) }
  })
  recipes.forEach((r) => {
    r.ingredients?.forEach((ing) => {
      const key = ing.item?.toLowerCase().trim()
      if (key && !knownNamesSeen.has(key)) { knownNamesSeen.add(key); knownNames.push(ing.item) }
    })
  })
  knownNames.sort((a, b) => a.localeCompare(b))

  const getPrice = (item: string, qty: number, unit: string) =>
    calculateIngredientPrice({
      ingredientName: item,
      usedQty: Number(qty),
      usedUnit: unit,
      ingredients,
      allRecipes: recipes,
    })

  /* ---------------------- render ---------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-2 pb-14 flex flex-col items-center overflow-x-hidden">
      <div className="max-w-md w-full">
        <SearchBar
          query={query}
          placeholder={currentView === 'prices' ? 'Search ingredients...' : 'Search recipes...'}
          showBack={currentView === 'recipes' && !!selectedRecipe && !editMode && !addMode}
          onBack={goBack}
          onChange={(v) => {
            setQuery(v)
            if (currentView === 'recipes') {
              setSelectedRecipe(null)
              setEditMode(false)
            }
          }}
          onMenu={() => setShowDrawer(true)}
          onEdit={currentView === 'recipes' && selectedRecipe && !editMode && !addMode ? () => setEditMode(true) : undefined}
          onAdd={currentView === 'recipes' && !selectedRecipe && !addMode ? () => setAddMode(true) : undefined}
        />

        {/* Ingredient prices view */}
        {currentView === 'prices' && (
          <InventoryList
            activeRecipes={recipes.filter((r) => r.active)}
            ingredients={ingredients}
            onImage={setFullImage}
            onSaveIngredient={onSaveIngredient}
          />
        )}

        {/* Add new recipe form */}
        {currentView === 'recipes' && addMode && (
          <EditRecipeForm
            recipe={{ name: '', image: '', ingredients: [], method: '', active: false, type: recipeTab }}
            onSave={saveRecipe}
            onCancel={() => setAddMode(false)}
            knownImages={knownImages}
            knownNames={knownNames}
          />
        )}

        {/* Menu / Staff meal tabs */}
        {currentView === 'recipes' && !selectedRecipe && !addMode && (
          <div className="flex gap-2 mt-2 mb-1">
            {[
              { key: 'sale' as const, label: 'Menu' },
              { key: 'staff' as const, label: 'Staff Meal' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRecipeTab(tab.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  recipeTab === tab.key
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-white text-gray-400 border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Recipe grid */}
        {currentView === 'recipes' && !selectedRecipe && !addMode && (
          <div
            className={
              isGridLeaving
                ? 'animate-slide-out-left'
                : 'animate-slide-in-right'
            }
          >
            {loading ? (
              <p className="text-center text-gray-400 text-sm mt-10">
                Loading recipes...
              </p>
            ) : visibleRecipes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {visibleRecipes.map((recipe, i) => (
                  <div
                    key={recipe._id || recipe.name}
                    className="grid-card-pop will-change-transform relative flex flex-col items-center bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md animate-fade-slide-in cursor-pointer"
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => openRecipe(recipe)}
                  >
                    {recipe.image ? (
                      <ImageWithLoader
                        src={recipe.image}
                        alt={recipe.name}
                        wrapperClass="w-full aspect-square"
                        imgClass="w-full h-full object-cover"
                        loading="lazy"
                        rounded="rounded-none"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">
                          Image not available
                        </span>
                      </div>
                    )}
                    <span className="text-[11px] text-gray-700 font-medium text-center px-1 py-1 leading-tight line-clamp-2">
                      {recipe.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm mt-10">
                {query
                  ? `No recipes found for "${query}"`
                  : `No ${recipeTab === 'sale' ? 'menu' : 'staff meal'} recipes yet`}
              </p>
            )}
          </div>
        )}

        {/* Recipe detail / edit */}
        {currentView === 'recipes' && selectedRecipe && !addMode && (
          <div
            className={
              isLeaving ? 'animate-slide-out-right' : 'animate-slide-in-right'
            }
          >
            {editMode ? (
              <EditRecipeForm
                recipe={selectedRecipe}
                onSave={saveRecipe}
                onCancel={() => setEditMode(false)}
                knownImages={knownImages}
                knownNames={knownNames}
              />
            ) : (
              <RecipeDetail
                recipe={selectedRecipe}
                qtyInputs={qtyInputs}
                onQtyChange={onQtyChange}
                onQtyBlur={onQtyBlur}
                onOpenRecipe={openRecipe}
                onImage={setFullImage}
                isActive={!!selectedRecipe.active}
                onToggleActive={() => toggleActive(selectedRecipe)}
                allRecipes={recipes}
                getPrice={getPrice}
              />
            )}
          </div>
        )}

        {fullImage && (
          <FullImageModal src={fullImage} onClose={() => setFullImage(null)} />
        )}
      </div>

      {editingIngredient && (
        <IngredientEditModal
          ingredient={editingIngredient}
          onSave={onSaveIngredient}
          onCancel={() => setEditingIngredient(null)}
        />
      )}

      <DrawerMenu
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        currentView={currentView}
        onNavigate={navigateTo}
      />

      <footer className="fixed bottom-0 inset-x-0 border-t bg-white/90 py-3 text-center text-sm text-gray-600">
        Powered by <strong>TingTong</strong>
      </footer>
    </div>
  )
}

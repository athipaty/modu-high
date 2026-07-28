import { useEffect, useRef, useState } from 'react'

import SearchBar from '../components/SearchBar'
import RecipeDetail from '../components/RecipeDetail'
import EditRecipeForm from '../components/EditRecipeForm'
import FullImageModal from '../components/FullImageModal'
import ImageWithLoader from '../components/ImageWithLoader'
import DrawerMenu, { type ViewId } from '../components/DrawerMenu'
import IngredientsPage from './IngredientsPage'

import { fmt, valid, strip0 } from '../utils/format'
import { calculateIngredientPrice } from '../utils/priceResolver'
import {
  fetchRecipes, updateRecipe, createRecipe,
  fetchIngredients, createIngredient, updateIngredient, deleteIngredient,
} from '../services/api'
import type { Recipe, RecipeDraft, Ingredient, IngredientDraft } from '../types/recipe'

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
  const [ingredients, setIngredients] = useState<Ingredient[]>([])

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

  /* ---------------------- ingredient master list CRUD ----------------------
     Owned here (not inside IngredientsPage) so edits — a new photo, a price change —
     immediately reach the recipe form's knownImages/knownUnits/knownNames lookups below,
     instead of living in a second, disconnected copy of the ingredient list. */
  const saveIngredientRecord = async (draft: IngredientDraft) => {
    if (draft._id) {
      const saved = await updateIngredient(draft._id, draft)
      setIngredients((prev) => prev.map((i) => (i._id === saved._id ? saved : i)))
      return saved
    } else {
      const saved = await createIngredient(draft)
      setIngredients((prev) => [...prev, saved])
      return saved
    }
  }

  const deleteIngredientRecord = async (id: string) => {
    await deleteIngredient(id)
    setIngredients((prev) => prev.filter((i) => i._id !== id))
  }

  /* ---------------------- filtering ---------------------- */
  const lcQuery = query.toLowerCase().trim()

  const visibleRecipes = [...recipes]
    .filter((r) => (lcQuery ? r.name.toLowerCase().includes(lcQuery) : true))
    .sort((a, b) => a.name.localeCompare(b.name))

  /* ---------------------- known ingredient names (name/image/unit lookup) ----------------------
     Recipes can only use ingredients that already exist either on the master Ingredients list,
     OR another existing recipe used as a sub-ingredient/prep item (e.g. "Dipping sauce" as an
     ingredient of another dish) — no free-typing a brand new name into a recipe. Master
     ingredients take priority on name collisions. A referenced recipe has no unit of its own,
     so it defaults to "g" (matches how sub-recipe costing already works: it treats the used
     quantity as grams and scales against the recipe's own total ingredient weight). */
  const ingredientKeys = new Set(ingredients.map((ov) => ov.name?.toLowerCase().trim()).filter(Boolean))

  const knownImages: Record<string, string> = {}
  const knownUnits: Record<string, string> = {}
  ingredients.forEach((ov) => {
    const key = ov.name?.toLowerCase().trim()
    if (!key) return
    if (ov.image) knownImages[key] = ov.image
    if (ov.unit) knownUnits[key] = ov.unit
  })
  recipes.forEach((r) => {
    const key = r.name?.toLowerCase().trim()
    if (!key || ingredientKeys.has(key)) return
    if (r.image) knownImages[key] = r.image
    knownUnits[key] = 'g'
  })

  const knownNamesSeen = new Set<string>()
  const knownNames: string[] = []
  ingredients.forEach((ov) => {
    const key = ov.name?.toLowerCase().trim()
    if (key && !knownNamesSeen.has(key)) { knownNamesSeen.add(key); knownNames.push(ov.name) }
  })
  recipes.forEach((r) => {
    const key = r.name?.toLowerCase().trim()
    if (key && !knownNamesSeen.has(key)) { knownNamesSeen.add(key); knownNames.push(r.name) }
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
    <div className="min-h-screen bg-gray-900 p-2 pb-14 flex flex-col items-center overflow-x-hidden">
      <div className="max-w-md w-full">
        <SearchBar
          query={query}
          placeholder={currentView === 'ingredients' ? 'Search ingredients...' : 'Search recipes...'}
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

        {/* Ingredients view */}
        {currentView === 'ingredients' && (
          <IngredientsPage
            query={query}
            onImage={setFullImage}
            ingredients={ingredients}
            onSave={saveIngredientRecord}
            onDelete={deleteIngredientRecord}
          />
        )}

        {/* Add new recipe form */}
        {currentView === 'recipes' && addMode && (
          <EditRecipeForm
            recipe={{ name: '', image: '', ingredients: [], method: '', active: false }}
            onSave={saveRecipe}
            onCancel={() => setAddMode(false)}
            knownImages={knownImages}
            knownUnits={knownUnits}
            knownNames={knownNames}
          />
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
                    className="grid-card-pop will-change-transform relative flex flex-col items-center bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden hover:shadow-lg hover:shadow-black/30 animate-fade-slide-in cursor-pointer"
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
                      <div className="w-full aspect-square bg-gray-700 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">
                          Image not available
                        </span>
                      </div>
                    )}
                    <span className="text-[11px] text-gray-200 font-medium text-center px-1 py-1 leading-tight line-clamp-2">
                      {recipe.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm mt-10">
                {query
                  ? `No recipes found for "${query}"`
                  : 'No recipes yet'}
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
                knownUnits={knownUnits}
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

      <DrawerMenu
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        currentView={currentView}
        onNavigate={navigateTo}
      />

      <footer className="fixed bottom-0 inset-x-0 border-t border-gray-700 bg-gray-800/90 py-3 text-center text-sm text-gray-400">
        Powered by <strong>TingTong</strong>
      </footer>
    </div>
  )
}

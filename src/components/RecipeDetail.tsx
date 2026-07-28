import IngredientRow from './IngredientRow'
import type { Recipe } from '../types/recipe'

interface RecipeDetailProps {
  recipe: Recipe
  qtyInputs: Record<string, string>
  onQtyChange: (item: string, value: string) => void
  onQtyBlur: (item: string) => void
  onOpenRecipe: (recipe: Recipe) => void
  onImage: (url: string) => void
  isActive: boolean
  onToggleActive?: () => void
  getPrice: (itemName: string, qty: number, unit: string) => number
  allRecipes?: Recipe[]
}

export default function RecipeDetail({
  recipe,
  qtyInputs,
  onQtyChange,
  onQtyBlur,
  onOpenRecipe,
  onImage,
  isActive,
  onToggleActive,
  getPrice,
  allRecipes = [],
}: RecipeDetailProps) {
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0

  const totalQty = hasIngredients
    ? recipe.ingredients.reduce((sum, ing) => {
        const v = Number(qtyInputs[ing.item]) || 0
        return sum + v
      }, 0)
    : 0

  const totalPrice = hasIngredients
    ? recipe.ingredients.reduce((sum, ing) => {
        return sum + getPrice(ing.item, Number(qtyInputs[ing.item]), ing.unit)
      }, 0)
    : 0

  return (
    <>
      <div className="flex items-center justify-center gap-3 mb-3 animate-fade-slide-in">
        <h2 className="text-2xl font-bold text-center text-gray-100">{recipe.name}</h2>
        {onToggleActive && (
          <button
            onClick={onToggleActive}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? 'bg-green-900/40 text-green-400 border-green-700'
                : 'bg-gray-800 text-gray-500 border-gray-600'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {isActive ? 'On Menu' : 'Off Menu'}
          </button>
        )}
      </div>

      {!hasIngredients ? (
        <div className="w-full max-w-3xl mt-4 bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-8 flex flex-col items-center gap-2 animate-fade-slide-in">
          <span className="text-4xl">🥄</span>
          <p className="text-gray-400 text-sm">No ingredients listed for this recipe.</p>
        </div>
      ) : (
        <table
          className="w-full max-w-3xl border border-gray-700 rounded-lg overflow-hidden shadow-sm bg-gray-800 animate-fade-slide-in"
          style={{ animationDelay: '60ms' }}
        >
          <thead>
            <tr className="bg-gray-700 text-sm">
              <th className="px-2 py-2 border border-gray-600 text-left text-gray-200">Image</th>
              <th className="px-2 py-2 border border-gray-600 text-left text-gray-200">Ingredients</th>
              <th className="px-2 py-2 border border-gray-600 text-center text-gray-200">Qty</th>
            </tr>
          </thead>
          <tbody>
            {[...recipe.ingredients]
              .sort((a, b) => Number(b.quantity) - Number(a.quantity))
              .map((ing, i) => (
                <IngredientRow
                  key={ing.item}
                  ingredient={ing}
                  value={qtyInputs[ing.item]}
                  unit={ing.unit}
                  price={getPrice(ing.item, Number(qtyInputs[ing.item]), ing.unit)}
                  onChange={(v) => onQtyChange(ing.item, v)}
                  onBlur={() => onQtyBlur(ing.item)}
                  onOpenRecipe={onOpenRecipe}
                  onImage={onImage}
                  allRecipes={allRecipes}
                  animationDelay={i * 30}
                />
              ))}
          </tbody>
          <tr className="bg-gray-800/60 hover:bg-gray-700 transition">
            <td className="border border-gray-600 px-2 py-2" />
            <td className="border border-gray-600 px-2 py-2 text-right text-gray-200">TOTAL</td>
            <td className="border border-gray-600 px-2 py-2">
              <div className="flex flex-col items-end gap-[2px]">
                <span className="text-sm text-gray-200">{totalQty.toLocaleString()} g</span>
                <span className="text-[11px] text-green-400">${totalPrice.toFixed(2)}</span>
              </div>
            </td>
          </tr>
        </table>
      )}

      {recipe.method && (
        <div
          className="w-full max-w-3xl mt-4 bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-4 animate-fade-slide-in"
          style={{ animationDelay: '120ms' }}
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-100">Method</h3>
          <p className="text-sm text-gray-300 whitespace-pre-line">{recipe.method}</p>
        </div>
      )}
    </>
  )
}

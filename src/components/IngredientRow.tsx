import ImageWithLoader from './ImageWithLoader'
import { resolveLinkedRecipe } from '../utils/recipeResolver'
import type { Recipe, RecipeIngredient } from '../types/recipe'

interface IngredientRowProps {
  ingredient: RecipeIngredient
  value: string
  unit: string
  price: number
  onChange: (value: string) => void
  onBlur: () => void
  onOpenRecipe: (recipe: Recipe) => void
  onImage: (url: string) => void
  allRecipes?: Recipe[]
  animationDelay?: number
}

export default function IngredientRow({
  ingredient,
  value,
  unit,
  price,
  onChange,
  onBlur,
  onOpenRecipe,
  onImage,
  allRecipes = [],
  animationDelay = 0,
}: IngredientRowProps) {
  const linked = resolveLinkedRecipe(ingredient.item, allRecipes)

  return (
    <tr
      className="animate-fade-slide-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <td className="border px-2">
        <ImageWithLoader
          src={ingredient.image}
          alt={ingredient.item}
          wrapperClass="w-12 h-12 cursor-pointer"
          imgClass="w-12 h-12 object-cover"
          onClick={() => onImage(ingredient.image)}
        />
      </td>

      <td className="border px-2">
        {linked ? (
          <button
            className="text-blue-600 text-start underline transition-all duration-150 active:scale-95 active:text-blue-400"
            onClick={() => onOpenRecipe(linked)}
          >
            {ingredient.item}
          </button>
        ) : (
          ingredient.item
        )}
      </td>

      <td className="px-3 py-2 border text-right align-middle">
        <div className="flex flex-col items-end gap-[2px]">
          <div className="flex items-center gap-1">
            <input
              className="border border-gray-300 w-14 px-1 py-[2px]
                   text-sm text-center rounded focus:ring-1 focus:ring-green-400"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
            />
            <span className="text-xs text-gray-500">{unit}</span>
          </div>

          <span
            className={`text-[11px] ${
              price > 0 ? 'text-green-700' : 'text-gray-400'
            }`}
          >
            ${price.toFixed(2)}
          </span>
        </div>
      </td>
    </tr>
  )
}

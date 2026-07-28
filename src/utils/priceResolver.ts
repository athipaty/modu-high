import type { Ingredient, Recipe } from '../types/recipe'
import { convertUnit } from './unitConverter'

const MAX_DEPTH = 5

interface PriceContext {
  ingredients: Ingredient[]
  allRecipes: Recipe[]
}

interface CalculateIngredientPriceArgs extends PriceContext {
  ingredientName: string
  usedQty: number
  usedUnit: string
}

// Ported from recipe/priceResolver.js + recipeCostResolver.js, refactored to read live
// `ingredients`/`allRecipes` (fetched from the backend) instead of the original's static
// bundled productPrice.js/recipes.js snapshots — those two data sources could silently
// drift apart from what's actually in the database. Everything here now reflects
// whatever is live for this outlet.
export function calculateIngredientPrice({
  ingredientName,
  usedQty,
  usedUnit,
  ingredients,
  allRecipes,
}: CalculateIngredientPriceArgs): number {
  if (!ingredientName || usedQty <= 0) return 0

  const key = ingredientName.toLowerCase().trim()
  const product = ingredients.find((i) => i.name.toLowerCase().trim() === key)

  // 1. Raw product pricing
  if (product?.price && product?.weight?.value) {
    const baseWeight = product.weight.value
    const baseUnit = product.weight.unit

    const convertedQty = convertUnit(usedQty, usedUnit, baseUnit)
    if (convertedQty === null) return 0

    return (convertedQty / baseWeight) * product.price
  }

  // 2. Nested recipe pricing (this "ingredient" is itself a sub-recipe/prep item)
  return calculateRecipeCost(ingredientName, usedQty, { ingredients, allRecipes })
}

function calculateRecipeCost(
  recipeName: string,
  usedQty: number,
  ctx: PriceContext,
  depth = 0
): number {
  if (!recipeName || usedQty <= 0 || depth > MAX_DEPTH) return 0

  const recipe = ctx.allRecipes.find((r) => r.name.toLowerCase().trim() === recipeName.toLowerCase().trim())
  if (!recipe) return 0

  // 1. total output weight of this recipe (normalized to grams)
  const totalRecipeWeight = recipe.ingredients.reduce((sum, ing) => {
    const qty = Number(ing.quantity) || 0
    const converted = convertUnit(qty, ing.unit, 'g')
    return sum + (converted ?? 0)
  }, 0)

  if (totalRecipeWeight <= 0) return 0

  // 2. full recipe cost
  const fullRecipeCost = recipe.ingredients.reduce((sum, ing) => {
    const qty = Number(ing.quantity) || 0

    const convertedQty = convertUnit(qty, ing.unit, 'g')
    if (convertedQty === null) return sum

    const rawCost = calculateIngredientPrice({
      ingredientName: ing.item,
      usedQty: convertedQty,
      usedUnit: 'g',
      ingredients: ctx.ingredients,
      allRecipes: ctx.allRecipes,
    })
    if (rawCost > 0) return sum + rawCost

    const nestedCost = calculateRecipeCost(ing.item, convertedQty, ctx, depth + 1)
    return sum + nestedCost
  }, 0)

  // 3. scale cost by how much is used
  const usedQtyInGrams = convertUnit(usedQty, 'g', 'g') ?? 0

  return (usedQtyInGrams / totalRecipeWeight) * fullRecipeCost
}

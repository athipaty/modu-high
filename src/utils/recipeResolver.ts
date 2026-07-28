import type { Recipe } from '../types/recipe'

const aliasMap: Record<string, string> = {
  'non alcohol - sancho soy sauce': 'Sancho Soy Sauce',
}

export function resolveLinkedRecipe(itemName: unknown, allRecipes: Recipe[] = []): Recipe | null {
  if (typeof itemName !== 'string') return null
  const key = itemName.toLowerCase().trim()

  const direct = allRecipes.find((r) => r.name.toLowerCase().trim() === key)
  if (direct) return direct

  const alias = aliasMap[key]
  if (!alias) return null
  return (
    allRecipes.find((r) => r.name.toLowerCase().trim() === alias.toLowerCase()) || null
  )
}
